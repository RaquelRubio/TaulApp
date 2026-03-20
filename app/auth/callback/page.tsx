"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      // En algunos casos la detección del callback (PKCE) tarda un momento.
      // Reintentamos brevemente con `getSession()` antes de rendir a /login.
      try {
        const maxAttempts = 5;
        const delayMs = 300;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            router.replace("/dashboard");
            return;
          }

          if (attempt < maxAttempts) {
            await new Promise((r) => window.setTimeout(r, delayMs));
          }
        }
      } catch (e) {
        console.error("getSession error", e);
        router.replace("/login");
      }
    }

    void run();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto flex items-center justify-center px-4">
      {error ? (
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">
            No se ha podido iniciar sesión
          </p>
          <p className="text-sm text-muted-foreground mt-2 break-words">
            {error}
          </p>
          <button
            type="button"
            className="mt-4 text-sm text-primary underline underline-offset-2 hover:underline"
            onClick={() => router.replace("/login")}
          >
            Volver a iniciar sesión
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Conectando tu cuenta…</p>
      )}
    </main>
  );
}

