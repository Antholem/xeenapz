export interface Message {
  id: string;
  sender_id?: string;
  text: string;
  image_url?: string | null;
  timestamp?: { seconds: number; nanoseconds: number };
  created_at?: string;
}

export interface Thread {
  id: string;
  user_id?: string;
  updated_at?: string | null;
  title?: string;
  messages?: Message[];
  is_archived?: boolean;
  is_deleted?: boolean;
  [key: string]: any;
}
