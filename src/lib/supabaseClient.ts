export interface Session {
  user: User | null;
}

export interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

export interface SupabaseClient {
  auth: {
    onAuthStateChange: (
      callback: (event: string, session: Session | null) => void
    ) => { data: { subscription: { unsubscribe: () => void } } };
    signInWithOAuth: (opts: { provider: string }) => Promise<void>;
    signOut: () => Promise<void>;
  };
  from: (table: string) => any;
}

export function createClient(_url: string, _key: string): SupabaseClient {
  return {
    auth: {
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithOAuth: async () => {},
      signOut: async () => {},
    },
    from: () => ({}),
  };
}
