"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      const rawMessage = (error.message || "").toLowerCase();
      if (rawMessage.includes("invalid login credentials")) {
        setError("El email o la contraseña no son correctos.");
      } else if (rawMessage.includes("email not confirmed")) {
        setError(
          "Tu email todavía no está confirmado. Revisa tu bandeja de entrada y confirma tu cuenta para poder entrar."
        );
      } else if (rawMessage.includes("user not found")) {
        setError("No hemos encontrado ninguna cuenta con ese email.");
      } else {
        setError("No se ha podido iniciar sesión. Inténtalo de nuevo en unos segundos.");
      }
      return;
    }
    router.push(redirectTo);
  }

  async function handleResetPassword() {
    if (!email) {
      setError("Escribe tu email para poder enviarte el enlace de recuperación.");
      return;
    }

    setError(null);
    setInfo(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://taulapp-v1.vercel.app/reset-password",
    });

    if (error) {
      console.error("resetPasswordForEmail error", error);
      const rawMessage = (error.message || "").toLowerCase();
      if (rawMessage.includes("load failed")) {
        setError(
          "No hemos podido enviar el email de recuperación. Revisa tu conexión o inténtalo de nuevo en unos segundos."
        );
      } else {
        setError(
          error.message ||
            "No hemos podido enviar el email de recuperación. Revisa que el correo sea correcto o inténtalo más tarde."
        );
      }
      return;
    }

    setInfo(
      "Te hemos enviado un email para restablecer tu contraseña. Revisa tu bandeja de entrada (y la carpeta de spam)."
    );
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
        <h1 className="text-base font-semibold text-foreground">Iniciar sesión</h1>
        <div className="w-10" aria-hidden />
      </header>

      <section className="flex-1 px-4 py-6">
        <p className="text-sm text-muted-foreground mb-4">
          Entra para guardar tus propias recetas y acceder a ellas desde cualquier dispositivo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-1.5 max-w-xs">
            <label className="text-sm font-medium text-foreground">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetPassword}
            className="text-sm text-primary underline underline-offset-2 hover:underline"
          >
            Olvidé mi contraseña
          </button>

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
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          ¿Aún no tienes cuenta?{" "}
          <Link
            href={`/registro?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="text-primary font-medium underline-offset-2 hover:underline"
          >
            Crear una cuenta
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background max-w-[520px] mx-auto flex items-center justify-center"><p className="text-sm text-muted-foreground">Cargando...</p></main>}>
      <LoginContent />
    </Suspense>
  );
}
