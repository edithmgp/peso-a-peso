import { supabase, isSupabaseConfigured } from "./supabase";
import { User, Session, AuthError } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const authService = {
  async signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    if (!isSupabaseConfigured) {
      // Mock login for offline / dev demo
      const mockUser = {
        id: "00000000-0000-0000-0000-000000000001",
        email,
        app_metadata: {},
        user_metadata: { full_name: email.split("@")[0] },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User;
      return { user: mockUser, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, error };
  },

  async signUpWithEmail(email: string, password: string, fullName?: string): Promise<{ user: User | null; error: AuthError | null }> {
    if (!isSupabaseConfigured) {
      const mockUser = {
        id: "00000000-0000-0000-0000-000000000001",
        email,
        app_metadata: {},
        user_metadata: { full_name: fullName || email.split("@")[0] },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User;
      return { user: mockUser, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { user: data.user, error };
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
};
