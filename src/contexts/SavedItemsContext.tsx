// src/contexts/SavedItemsContext.tsx
import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useEffect, 
  useRef, 
  useCallback, 
  useState,  
} from 'react';
import type { ReactNode } from 'react';
import type { SavedItem, SavedItemsData } from '../types';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';

interface SavedItemsState {
  data: SavedItemsData | null;
  loading: boolean;
  needsSave: boolean;
}

type SavedItemsAction =
  | { type: 'LOAD_DATA'; payload: SavedItemsData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_ITEM'; payload: { 
      title: string; 
      content: string; 
      type: 'text' | 'link' | 'file'; 
      url?: string;
      fileData?: {
        url: string;
        publicId: string;
        fileName: string;
        fileSize: number;
        fileType: string;
        resourceType: 'image' | 'video' | 'raw';
      };
    } }
  | { type: 'UPDATE_ITEM'; payload: SavedItem }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'TOGGLE_FAVORITE'; payload: { itemId: string } }
  | { type: 'MARK_SAVED' };

const initialState: SavedItemsState = { 
  data: null, 
  loading: true, 
  needsSave: false 
};

const savedItemsReducer = (state: SavedItemsState, action: SavedItemsAction): SavedItemsState => {
  switch (action.type) {
    case 'LOAD_DATA':
      return { data: action.payload, loading: false, needsSave: false };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'ADD_ITEM': {
      if (!state.data) return state;
      const newItem: SavedItem = {
        id: Date.now().toString(),
        title: action.payload.title,
        content: action.payload.content,
        type: action.payload.type,
        url: action.payload.url,
        fileData: action.payload.fileData,
        createdAt: new Date(),
        lastModified: new Date(),
        isFavorite: false,
      };
      return {
        ...state,
        data: { ...state.data, items: [newItem, ...state.data.items] },
        needsSave: true,
      };
    }

    case 'UPDATE_ITEM': {
      if (!state.data) return state;
      const updatedItem = { ...action.payload, lastModified: new Date() };
      return {
        ...state,
        data: {
          ...state.data,
          items: state.data.items.map(item => item.id === updatedItem.id ? updatedItem : item)
        },
        needsSave: true,
      };
    }
      
    case 'REMOVE_ITEM': {
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          items: state.data.items.filter(item => item.id !== action.payload.itemId)
        },
        needsSave: true,
      };
    }
      
    case 'TOGGLE_FAVORITE': {
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          items: state.data.items.map(item =>
            item.id === action.payload.itemId 
              ? { ...item, isFavorite: !item.isFavorite, lastModified: new Date() } 
              : item
          )
        },
        needsSave: true,
      };
    }
      
    case 'MARK_SAVED':
      return { ...state, needsSave: false };
      
    default:
      return state;
  }
};

interface SavedItemsContextType {
  state: SavedItemsState;
  dispatch: React.Dispatch<SavedItemsAction>;
  isSaving: boolean;
}

const SavedItemsContext = createContext<SavedItemsContextType | undefined>(undefined);

export const SavedItemsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(savedItemsReducer, initialState);
  const { user, isSessionActive, setIsReauthModalOpen } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const stateRef = useRef(state);
  stateRef.current = state;

  const saveData = useCallback(async () => {
    if (!user || !stateRef.current.data) return;

    const sessionOK = await isSessionActive();
    if (!sessionOK) {
        console.error('SALVAMENTO ABORTADO: Sessão expirada. Solicitando reautenticação.');
        setIsReauthModalOpen(true);
        return;
    }

    setIsSaving(true);
    console.log('💾 Salvando itens...', stateRef.current.data);
    
    try {
      // Preparar dados para o Firestore - converter Dates para objetos serializáveis
      const dataToSave = {
        userId: stateRef.current.data.userId,
        lastUpdated: new Date(),
        items: stateRef.current.data.items.map(item => ({
          ...item,
          // Garantir que as datas sejam objetos Date válidos
          createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
          lastModified: item.lastModified instanceof Date ? item.lastModified : new Date(item.lastModified),
          // Garantir que fileData seja null se vazio
          fileData: item.fileData || null,
          // Garantir que url seja null se vazio
          url: item.url || null
        }))
      };
      
      console.log('💾 Dados preparados para salvamento:', dataToSave);
      
      await setDoc(doc(db, 'savedItems', user.uid), dataToSave);
      dispatch({ type: 'MARK_SAVED' });
      console.log('✅ Itens salvos com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar itens:', error);
      console.error('❌ Dados que falharam:', stateRef.current.data);
    } finally {
      setIsSaving(false);
    }
  }, [user, isSessionActive, setIsReauthModalOpen]);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    console.log('📁 Carregando itens salvos do Firestore...');
    
    try {
      const docRef = doc(db, 'savedItems', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const rawData = docSnap.data();
        console.log('📁 Dados brutos carregados:', rawData);
        
        const parsedData: SavedItemsData = {
            userId: rawData.userId,
            lastUpdated: rawData.lastUpdated?.toDate ? rawData.lastUpdated.toDate() : new Date(rawData.lastUpdated),
            items: (rawData.items || []).map((item: any) => ({
                ...item,
                createdAt: item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt),
                lastModified: item.lastModified?.toDate ? item.lastModified.toDate() : new Date(item.lastModified),
                // Garantir que fileData seja undefined se for null
                fileData: item.fileData || undefined,
                // Garantir que url seja undefined se for null
                url: item.url || undefined
            }))
        };
        
        console.log('📁 Dados parseados:', parsedData);
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
        console.log('👍 Itens carregados com sucesso.');
      } else {
        console.log('✨ Criando nova coleção de itens para o usuário.');
        const newData: SavedItemsData = {
          userId: user.uid,
          items: [],
          lastUpdated: new Date()
        };
        dispatch({ type: 'LOAD_DATA', payload: newData });
        await setDoc(doc(db, 'savedItems', user.uid), newData);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar itens:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      // Reset para estado inicial quando não há usuário
      dispatch({ type: 'LOAD_DATA', payload: { userId: '', items: [], lastUpdated: new Date() } });
    }
  }, [user, loadData]);

  useEffect(() => {
    if (!state.needsSave || isSaving) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(saveData, 2000);

    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    }
  }, [state.needsSave, isSaving, saveData]);

  // Log para debug
  useEffect(() => {
    console.log('🔄 Estado atual dos savedItems:', state);
  }, [state]);

  return (
    <SavedItemsContext.Provider value={{ state, dispatch, isSaving }}>
      {children}
    </SavedItemsContext.Provider>
  );
};

export const useSavedItems = () => {
  const context = useContext(SavedItemsContext);
  if (context === undefined) {
    throw new Error('useSavedItems deve ser usado dentro de um SavedItemsProvider');
  }
  return context;
};