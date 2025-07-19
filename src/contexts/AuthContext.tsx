// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isReauthModalOpen: boolean; // ADICIONADO
  setIsReauthModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // ADICIONADO
  isSessionActive: () => Promise<boolean>; // ADICIONADO
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false); // ADICIONADO

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };
  
  // ADICIONADO: Função para verificar se o token é válido
  const isSessionActive = async (): Promise<boolean> => {
    if (!auth.currentUser) {
      return false;
    }
    try {
      // Força a atualização do token. Falhará se estiver expirado ou offline.
      await auth.currentUser.getIdToken(true);
      return true;
    } catch (error) {
      console.error('Falha ao atualizar token (sessão expirada ou offline).', error);
      // Força o logout apenas se o token for inválido, evitando logout por estar offline.
      if ((error as any).code === 'auth/user-token-expired' || (error as any).code === 'auth/invalid-user-token') {
          await logout();
      }
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || undefined
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = { user, loading, signInWithGoogle, logout, isSessionActive, isReauthModalOpen, setIsReauthModalOpen };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};