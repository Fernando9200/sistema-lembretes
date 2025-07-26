// src/components/Navigation.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckSquare, BookOpen } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navigationItems = [
    { 
      path: '/lembretes',
      label: 'Lembretes', 
      icon: CheckSquare,
      description: 'Suas tarefas e lembretes'
    },
    { 
      path: '/itens-salvos',
      label: 'Itens Salvos', 
      icon: BookOpen,
      description: 'Textos e links organizados'
    }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Título */}
          <Link to="/lembretes" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Sistema Pessoal</h1>
          </Link>

          {/* Navegação */}
          <div className="flex space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={item.description}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium hidden sm:block">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Indicador Mobile (apenas em telas pequenas) */}
          <div className="sm:hidden">
            <div className="text-sm font-medium text-gray-700">
              {navigationItems.find(item => item.path === location.pathname)?.label}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;