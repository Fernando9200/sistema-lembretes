// src/components/ConfirmationModal.tsx
import React from 'react';
import { X, AlertTriangle, LogIn } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  variant?: 'danger' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isConfirming = false,
  variant = 'danger',
}) => {
  if (!isOpen) {
    return null;
  }

  // Define os temas de estilo para cada variante do modal
  const theme = {
    danger: {
      iconContainerBg: 'bg-red-100',
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      confirmBtnBg: 'bg-red-600 hover:bg-red-700',
      confirmingText: 'Excluindo...'
    },
    info: {
      iconContainerBg: 'bg-blue-100',
      icon: <LogIn className="w-6 h-6 text-blue-600" />,
      confirmBtnBg: 'bg-primary-600 hover:bg-primary-700',
      confirmingText: 'Aguarde...'
    }
  }

  const currentTheme = theme[variant];

  return (
    <div
      className="fixed inset-0 w-screen bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={!isConfirming ? onClose : undefined}
    >
      <div
        className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${currentTheme.iconContainerBg} rounded-full flex items-center justify-center`}>
              {currentTheme.icon}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isConfirming}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-gray-600 mb-8">
          {children}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="px-6 py-2 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className={`px-6 py-2 ${currentTheme.confirmBtnBg} text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center`}
          >
            {isConfirming && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            )}
            {isConfirming ? currentTheme.confirmingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;