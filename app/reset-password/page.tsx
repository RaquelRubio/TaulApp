"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "recovering" | "submitting">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("recovering");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!password || !confirmPassword) {
      setError("Rellena los dos campos de contraseña.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setStatus("submitting");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("recovering");
      setError("No se ha podido actualizar la contraseña. Prueba de nuevo.");
      return;
    }

    setStatus("idle");
    setMessage("Tu contraseña se ha actualizado correctamente. Ya puedes cerrar esta ventana y volver a iniciar sesión.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-6 space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Restablecer contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Escribe tu nueva contraseña. Asegúrate de guardarla en un lugar seguro.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Nueva contraseña
            </label>
            <input
              type="password"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Repite la nueva contraseña
            </label>
            <input
              type="password"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-foreground">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "submitting" ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </form>
      </div>
    </main>
  );
}

