// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { RemindersProvider } from './contexts/RemindersContext.tsx';
import { SavedItemsProvider } from './contexts/SavedItemsContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RemindersProvider>
        <SavedItemsProvider>
          <App />
        </SavedItemsProvider>
      </RemindersProvider>
    </AuthProvider>
  </React.StrictMode>,
);