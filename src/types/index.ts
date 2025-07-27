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

// Novos tipos para textos, links e arquivos
export interface SavedItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'link' | 'file';
  url?: string; // Para links
  fileData?: {
    url: string;
    publicId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    resourceType: 'image' | 'video' | 'raw'; // raw para PDFs e outros documentos
  };
  createdAt: Date;
  lastModified: Date;
  isFavorite: boolean;
}

export interface SavedItemsData {
  userId: string;
  items: SavedItem[];
  lastUpdated: Date;
}