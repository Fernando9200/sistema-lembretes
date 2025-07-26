// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import RemindersPage from './components/RemindersPage';
import SavedItemsPage from './components/SavedItemsPage';
import Navigation from './components/Navigation';
import ConfirmationModal from './components/ConfirmationModal';

// Componente que lida com a lógica principal da aplicação
const AppContent: React.FC = () => {
  const { 
    user, 
    loading, 
    signInWithGoogle, 
    isReauthModalOpen, 
    setIsReauthModalOpen 
  } = useAuth();

  // Função para ser chamada quando o usuário confirmar a reautenticação no modal
  const handleReauth = async () => {
    try {
      await signInWithGoogle();
      setIsReauthModalOpen(false);
    } catch (error) {
      console.error("Falha na reautenticação", error);
    }
  };

  // 1. Mostra uma tela de carregamento enquanto o status de autenticação é verificado
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // 2. Se não houver usuário, mostra a página de login
  if (!user) {
    return <LoginPage />;
  }

  // 3. Se houver um usuário, mostra a aplicação principal com roteamento
  return (
    <Router>
      {/* Modal de Confirmação para quando a sessão expira */}
      <ConfirmationModal
        isOpen={isReauthModalOpen}
        onClose={() => setIsReauthModalOpen(false)}
        onConfirm={handleReauth}
        title="Sessão Expirada"
        confirmText="Fazer Login Novamente"
        variant="info"
      >
        <div className="text-center space-y-2">
          <p>Para proteger seus dados, sua sessão de login expirou.</p>
          <p className="font-semibold text-primary-700">Faça login novamente para salvar suas alterações.</p>
          <p className="text-sm text-gray-500 mt-2">Suas últimas edições foram mantidas e serão salvas após o login.</p>
        </div>
      </ConfirmationModal>

      {/* Navegação */}
      <Navigation />
      
      {/* Conteúdo da Página com padding-top para compensar a navegação fixa */}
      <div className="pt-16">
        <Routes>
          <Route path="/lembretes" element={<RemindersPage />} />
          <Route path="/itens-salvos" element={<SavedItemsPage />} />
          <Route path="/" element={<Navigate to="/lembretes" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

// O componente App principal que envolve tudo com os providers (no main.tsx)
const App: React.FC = () => {
  return <AppContent />;
};

export default App;