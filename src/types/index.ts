// src/types/index.ts
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  isCompleted: boolean;
}

export interface RemindersData {
  userId: string;
  reminders: Reminder[];
  lastUpdated: Date;
}

// Novos tipos para textos e links
export interface SavedItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'link';
  url?: string; // Apenas para links
  createdAt: Date;
  lastModified: Date;
  isFavorite: boolean;
}

export interface SavedItemsData {
  userId: string;
  items: SavedItem[];
  lastUpdated: Date;
}