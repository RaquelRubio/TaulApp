"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

type AuthUser = {
  id: string;
  email: string | null;
  user_metadata?: {
    avatar_emoji?: string | null;
    avatar_color?: string | null;
    display_name?: string | null;
  } | null;
};

export function useSupabaseAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    void supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setUser(null);
        } else {
          const u = data.user;
          setUser(
            u
              ? {
                  id: u.id,
                  email: u.email ?? null,
                  user_metadata: (u.user_metadata ?? null) as AuthUser["user_metadata"],
                }
              : null
          );
        }
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(
        u
          ? {
              id: u.id,
              email: u.email ?? null,
              user_metadata: (u.user_metadata ?? null) as AuthUser["user_metadata"],
            }
          : null
      );
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

