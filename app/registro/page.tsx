"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export default function RegistroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message || "No se ha podido crear la cuenta.");
      return;
    }

    const user = data.user;
    if (user && displayName.trim()) {
      await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName.trim(),
      });
    }

    setLoading(false);

    if (data.session) {
      router.push(redirectTo);
    } else {
      setInfo(
        "Te hemos enviado un email de confirmación. Revisa tu bandeja de entrada y, cuando confirmes, vuelve a iniciar sesión."
      );
    }
  }

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground no-underline"
        >
          &larr; Volver
        </Link>
        <h1 className="text-base font-semibold text-foreground">Crear cuenta</h1>
        <div className="w-10" aria-hidden />
      </header>

      <section className="flex-1 px-4 py-6">
        <p className="text-sm text-muted-foreground mb-4">
          Regístrate para guardar tus propias versiones de recetas y acceder a ellas desde cualquier sitio.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Nombre (opcional)
            </label>
            <Input
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Cómo quieres que te veamos en TaulApp"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Contraseña
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-foreground">
              {info}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold"
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link
            href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="text-primary font-medium underline-offset-2 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  );
}

