// context/AuthContext.tsx
//------------------------------------------------------------
// CENTRAL AUTH CONTEXT — FOR SUPABASE AUTH SESSION MANAGEMENT
//------------------------------------------------------------
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { supabase } from "../supabase/client";  // ⭐ CORRECT PATH

type AuthContextType = {
  session: any;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Load the initial session
      const { data } = await supabase.auth.getSession();

      if (mounted) {
        setSession(data.session ?? null);
        setLoading(false);
      }
    }

    init();

    // Listen for login/signup/logout/token refresh events
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) {
          setSession(newSession?.session ?? null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
