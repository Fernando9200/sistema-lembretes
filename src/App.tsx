import React from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import RemindersPage from './components/RemindersPage';
import ConfirmationModal from './components/ConfirmationModal';

// Componente que lida com a lógica principal da aplicação
const AppContent: React.FC = () => {
  // Obtém todos os dados e funções necessários do nosso contexto de autenticação
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
      await signInWithGoogle(); // Tenta fazer o login com o Google novamente
      setIsReauthModalOpen(false); // Fecha o modal em caso de sucesso
      // Nota: As alterações pendentes serão salvas automaticamente pelo RemindersContext
      // assim que o login for bem-sucedido.
    } catch (error) {
      console.error("Falha na reautenticação", error);
      // Opcional: Adicionar uma notificação de erro para o usuário aqui
    }
  };

  // 1. Mostra uma tela de carregamento enquanto o status de autenticação é verificado
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // 2. Se não houver usuário, mostra a página de login
  if (!user) {
    return <LoginPage />;
  }

  // 3. Se houver um usuário, mostra a aplicação principal
  //    e o modal de reautenticação (que só fica visível quando 'isReauthModalOpen' é true)
  return (
    <>
      {/* O Modal de Confirmação para quando a sessão expira */}
      <ConfirmationModal
          isOpen={isReauthModalOpen}
          onClose={() => setIsReauthModalOpen(false)}
          onConfirm={handleReauth}
          title="Sessão Expirada"
          confirmText="Fazer Login Novamente"
          variant="info" // Usamos a variante "info" para não parecer um erro destrutivo
      >
          <div className="text-center space-y-2">
            <p>Para proteger seus dados, sua sessão de login expirou.</p>
            <p className="font-semibold text-primary-700">Faça login novamente para salvar suas alterações.</p>
            <p className="text-sm text-gray-500 mt-2">Suas últimas edições foram mantidas e serão salvas após o login.</p>
          </div>
      </ConfirmationModal>
    
      {/* A página principal da aplicação */}
      <RemindersPage />
    </>
  );
};


// O componente App principal que envolve tudo com os providers (no main.tsx)
// e renderiza o conteúdo da aplicação.
const App: React.FC = () => {
  return <AppContent />;
};

export default App;