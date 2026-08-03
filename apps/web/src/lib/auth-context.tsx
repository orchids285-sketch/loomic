"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getSupabaseBrowserClient, isSupabaseConfigured } from "./supabase-browser";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Without a project there is no session to wait for. Returning early is not just an
    // optimisation: leaving it to fail would keep `loading` true forever, and every screen
    // that gates on it would sit on a spinner with nothing coming.
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      // Unreachable is a state, not a crash: an unhandled rejection here would also leave
      // the app loading forever.
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);


  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
