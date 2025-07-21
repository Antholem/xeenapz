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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createClient(_url: string, _key: string): SupabaseClient {
  return {
    auth: {
      onAuthStateChange: (callback) => {
        // Immediately invoke the callback with a signed-out session so
        // consumers relying on the auth listener can update their state.
        setTimeout(() => callback("SIGNED_OUT", null), 0);

        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        };
      },
      signInWithOAuth: async () => {},
      signOut: async () => {},
    },
    from: () => ({}),
  };
}
