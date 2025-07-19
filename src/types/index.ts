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