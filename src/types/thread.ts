export interface Message {
  id: string;
  sender_id?: string;
  text: string;
  timestamp?: { seconds: number; nanoseconds: number };
  created_at?: string;
}

export interface Thread {
  id: string;
  user_id?: string;
  updated_at?: { seconds: number; nanoseconds: number } | null;
  title?: string;
  messages?: Message[];
  is_archived?: boolean;
  is_deleted?: boolean;
  [key: string]: any;
}
