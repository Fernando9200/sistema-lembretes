// src/components/UserProfile.tsx
import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center space-x-3 mb-4">
        {user?.photoURL ? (
          <img src={user.photoURL} alt={user.displayName ?? 'User'} className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-gray-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Sair</span>
      </button>
    </div>
  );
};

export default UserProfile;