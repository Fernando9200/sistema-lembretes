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
import type { Reminder, RemindersData } from '../types';
import { doc, setDoc, getDoc, type Timestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';

// Define a estrutura do estado do nosso contexto
interface RemindersState {
  data: RemindersData | null;
  loading: boolean;
  needsSave: boolean;
}

// Define todas as ações possíveis que podem alterar o estado
type RemindersAction =
  | { type: 'LOAD_DATA'; payload: RemindersData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_REMINDER'; payload: { title: string; description: string } }
  | { type: 'UPDATE_REMINDER'; payload: Reminder }
  | { type: 'REMOVE_REMINDER'; payload: { reminderId: string } }
  | { type: 'TOGGLE_REMINDER'; payload: { reminderId: string } }
  | { type: 'MARK_SAVED' };

// O estado inicial quando a aplicação carrega
const initialState: RemindersState = { 
  data: null, 
  loading: true, 
  needsSave: false 
};

// O "reducer" é uma função pura que calcula o próximo estado com base no estado atual e na ação despachada
const remindersReducer = (state: RemindersState, action: RemindersAction): RemindersState => {
  switch (action.type) {
    case 'LOAD_DATA':
      return { data: action.payload, loading: false, needsSave: false };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'ADD_REMINDER': {
      if (!state.data) return state;
      const newReminder: Reminder = {
        id: Date.now().toString(),
        title: action.payload.title,
        description: action.payload.description,
        createdAt: new Date(),
        isCompleted: false,
      };
      return {
        ...state,
        data: { ...state.data, reminders: [newReminder, ...state.data.reminders] },
        needsSave: true,
      };
    }

    case 'UPDATE_REMINDER': {
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          reminders: state.data.reminders.map(r => r.id === action.payload.id ? action.payload : r)
        },
        needsSave: true,
      };
    }
      
    case 'REMOVE_REMINDER': {
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          reminders: state.data.reminders.filter(r => r.id !== action.payload.reminderId)
        },
        needsSave: true,
      };
    }
      
    case 'TOGGLE_REMINDER': {
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          reminders: state.data.reminders.map(r =>
            r.id === action.payload.reminderId ? { ...r, isCompleted: !r.isCompleted } : r
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

// Define a estrutura do valor que o contexto irá fornecer
interface RemindersContextType {
  state: RemindersState;
  dispatch: React.Dispatch<RemindersAction>;
  isSaving: boolean;
}

const RemindersContext = createContext<RemindersContextType | undefined>(undefined);

export const RemindersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(remindersReducer, initialState);
  const { user, isSessionActive, setIsReauthModalOpen } = useAuth(); // Obtém a lógica de sessão do AuthContext
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // Usamos uma ref para garantir que as funções assíncronas sempre acessem o estado mais recente
  const stateRef = useRef(state);
  stateRef.current = state;

  const saveData = useCallback(async () => {
    // Aborta se não houver usuário ou dados para salvar
    if (!user || !stateRef.current.data) return;

    // >>> PONTO CRÍTICO: VERIFICA A VALIDADE DO TOKEN ANTES DE SALVAR <<<
    const sessionOK = await isSessionActive();
    if (!sessionOK) {
        console.error('SALVAMENTO ABORTADO: Sessão expirada. Solicitando reautenticação.');
        setIsReauthModalOpen(true); // Aciona o modal na UI
        return; // Interrompe a função de salvamento
    }

    setIsSaving(true);
    console.log('💾 Salvando dados...');
    try {
      const dataToSave = {
        ...stateRef.current.data,
        lastUpdated: new Date()
      };
      // Salva o documento no Firestore
      await setDoc(doc(db, 'reminders', user.uid), dataToSave);
      dispatch({ type: 'MARK_SAVED' }); // Marca que os dados estão salvos
      console.log('✅ Dados salvos com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user, isSessionActive, setIsReauthModalOpen]); // Dependências da função

  const loadData = useCallback(async () => {
    if (!user) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    console.log('📁 Carregando dados do Firestore...');
    const docRef = doc(db, 'reminders', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const rawData = docSnap.data();
      // Converte os Timestamps do Firebase para objetos Date do JavaScript
      const parsedData: RemindersData = {
          userId: rawData.userId,
          lastUpdated: (rawData.lastUpdated as Timestamp).toDate(),
          reminders: (rawData.reminders || []).map((r: any) => ({
              ...r,
              createdAt: (r.createdAt as Timestamp).toDate()
          }))
      };
      dispatch({ type: 'LOAD_DATA', payload: parsedData });
      console.log('👍 Dados carregados.');
    } else {
      // Se não houver dados, cria um novo conjunto de dados vazio para o usuário
      console.log('✨ Criando novo conjunto de dados para o usuário.');
      const newData: RemindersData = {
        userId: user.uid,
        reminders: [],
        lastUpdated: new Date()
      };
      dispatch({ type: 'LOAD_DATA', payload: newData });
      await setDoc(docRef, newData); // Salva o novo conjunto de dados no Firebase
    }
  }, [user]);

  // Efeito para carregar dados quando o usuário muda (login/logout)
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      dispatch({ type: 'LOAD_DATA', payload: initialState.data! })
    }
  }, [user, loadData]);

  // Efeito para salvar dados automaticamente com um pequeno atraso (debounce)
  useEffect(() => {
    // Só aciona se houver alterações pendentes e não estiver salvando no momento
    if (!state.needsSave || isSaving) return;

    // Cancela qualquer salvamento agendado anteriormente
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    // Agenda um novo salvamento para daqui a 2 segundos
    saveTimeoutRef.current = setTimeout(saveData, 2000);

    // Limpa o agendamento se o componente for desmontado
    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    }
  }, [state.needsSave, isSaving, saveData]);

  return (
    <RemindersContext.Provider value={{ state, dispatch, isSaving }}>
      {children}
    </RemindersContext.Provider>
  );
};

// Hook customizado para facilitar o uso do contexto em outros componentes
export const useReminders = () => {
  const context = useContext(RemindersContext);
  if (context === undefined) {
    throw new Error('useReminders deve ser usado dentro de um RemindersProvider');
  }
  return context;
};