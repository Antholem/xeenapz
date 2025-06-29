export interface Message {
  id: string;
  senderId?: string;
  text: string;
  timestamp?: { seconds: number; nanoseconds: number };
  createdAt?: string;
}

export interface Thread {
  id: string;
  userId?: string;
  updatedAt?: { seconds: number; nanoseconds: number } | null;
  title?: string;
  messages?: Message[];
  isArchived?: boolean;
  isDeleted?: boolean;
  [key: string]: any;
}
