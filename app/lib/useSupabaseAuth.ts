"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

type AuthUser = {
  id: string;
  email: string | null;
};

export function useSupabaseAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const u = data.user;
        setUser(u ? { id: u.id, email: u.email ?? null } : null);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

