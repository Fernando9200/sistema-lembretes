// src/components/AppNotification.tsx
import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface AppNotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const AppNotification: React.FC<AppNotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="fixed top-5 right-5 z-50 animate-fade-in">
      <div className={`flex items-center p-4 rounded-lg shadow-lg text-white ${bgColor}`}>
        <CheckCircle className="w-6 h-6 mr-3" />
        <p className="font-medium">{message}</p>
        <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-black/20">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AppNotification;