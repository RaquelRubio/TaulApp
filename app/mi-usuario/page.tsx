"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseAuth } from "../lib/useSupabaseAuth";
import { getProfileImageUrl } from "../lib/recipeImages";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

type ProfileRow = {
  display_name: string | null;
};

type UserMetadata = {
  avatar_path?: string | null;
  display_name?: string | null;
};

function MiUsuarioContent() {
  const router = useRouter();
  const { user, loading } = useSupabaseAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const redirectTo = "/mi-usuario";
      router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setLoadingProfile(true);
      setProfileError(null);

      try {
        setEmail(user.email ?? "");

        const [{ data: profileData }, { data: authData }] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .maybeSingle<ProfileRow>(),
          supabase.auth.getUser(),
        ]);

        const meta = (authData.user?.user_metadata ?? {}) as UserMetadata;
        const profileName = profileData?.display_name ?? null;
        const metaName = meta.display_name ?? null;

        const finalName =
          profileName?.trim() ||
          metaName?.trim() ||
          user.email ||
          "";

        setDisplayName(finalName);
        setAvatarPath(
          typeof meta.avatar_path === "string" && meta.avatar_path.trim()
            ? meta.avatar_path.trim()
            : null
        );
      } catch (e) {
        console.error("Error cargando perfil", e);
        setProfileError(
          "No se ha podido cargar tu perfil. Inténtalo de nuevo en unos segundos."
        );
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user, loading, router]);

  if (loading || (!user && !loadingProfile)) {
    return (
      <main className="min-h-screen bg-background max-w-[520px] mx-auto flex flex-col">
        <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground no-underline"
          >
            &larr; Inicio
          </Link>
          <h1 className="text-base font-semibold text-foreground">Mi usuario</h1>
          <div className="w-10" aria-hidden />
        </header>
        <section className="flex-1 px-4 py-6 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando tu cuenta…</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const avatarUrl = getProfileImageUrl(avatarPath);
  const avatarInitial =
    displayName?.trim()?.charAt(0)?.toUpperCase() ||
    user.email?.trim()?.charAt(0)?.toUpperCase() ||
    "U";

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setProfileError(null);
    setProfileMessage(null);
    setSavingProfile(true);

    const trimmedName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();

    const isBasicEmailValid =
      cleanEmail.includes("@") && cleanEmail.includes(".");

    if (!isBasicEmailValid) {
      setSavingProfile(false);
      setProfileError("El email no es válido. Revisa que esté bien escrito.");
      return;
    }

    try {
      const { error: profileErrorDb } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: trimmedName || null,
        });

      if (profileErrorDb) {
        console.error("Error actualizando profiles", profileErrorDb);
        setProfileError(
          profileErrorDb.message ||
            "No se ha podido guardar tu nombre. Inténtalo de nuevo."
        );
        setSavingProfile(false);
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({
        email: cleanEmail,
        data: {
          display_name: trimmedName || null,
        },
      });

      if (authError) {
        console.error("Error actualizando usuario Auth", authError);
        const raw = (authError.message || "").toLowerCase();
        const message =
          raw.includes("rate limit") || raw.includes("too many requests")
            ? "Has hecho demasiados cambios seguidos. Espera unos segundos y vuelve a intentarlo."
            : authError.message ||
              "No se ha podido guardar los cambios. Inténtalo de nuevo.";
        setProfileError(message);
        setSavingProfile(false);
        return;
      }

      setProfileMessage(
        "Datos guardados. Si has cambiado el email, revisa tu bandeja de entrada para confirmar el cambio."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setPasswordError(null);
    setPasswordMessage(null);
    setSavingPassword(true);

    if (!newPassword || !confirmPassword) {
      setSavingPassword(false);
      setPasswordError("Rellena los dos campos de contraseña.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSavingPassword(false);
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 6) {
      setSavingPassword(false);
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Error actualizando contraseña", error);
        setPasswordError(
          error.message ||
            "No se ha podido actualizar la contraseña. Inténtalo de nuevo."
        );
        setSavingPassword(false);
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(
        "Contraseña actualizada. Tendrás que usar la nueva la próxima vez que inicies sesión."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleAvatarChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!user) return;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarError(null);
    setAvatarMessage(null);
    setUploadingAvatar(true);

    try {
      const ext =
        file.name.split(".").pop()?.toLowerCase() ||
        "jpg";
      const safePath = `avatars/${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(safePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Error subiendo avatar", uploadError);
        const msg = (uploadError.message ?? "").toLowerCase();
        const isBucketNotFound =
          msg.includes("bucket not found") ||
          msg.includes("not found");
        const isRls =
          msg.includes("row-level security") ||
          msg.includes("policy");
        setAvatarError(
          isBucketNotFound
            ? "Falta crear el bucket de fotos en Supabase: ve a Storage → New bucket → nombre «recipe-images», público. Ver docs/supabase.md."
            : isRls
              ? "Storage no permite subir aún. En Supabase SQL Editor ejecuta las políticas de Storage del docs/supabase.md (sección 4, paso 2)."
              : uploadError.message ||
                "No se ha podido subir la foto. Inténtalo de nuevo."
        );
        setUploadingAvatar(false);
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          avatar_path: safePath,
        },
      });

      if (authError) {
        console.error("Error guardando avatar en metadata", authError);
        setAvatarError(
          authError.message ||
            "La foto se ha subido pero no se ha podido guardar en tu perfil."
        );
        setUploadingAvatar(false);
        return;
      }

      setAvatarPath(safePath);
      setAvatarMessage("Foto de perfil actualizada.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground no-underline"
        >
          &larr; Inicio
        </Link>
        <h1 className="text-base font-semibold text-foreground">Mi usuario</h1>
        <div className="w-10" aria-hidden />
      </header>

      <section className="flex-1 px-4 py-4 pb-8 overflow-y-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xl font-semibold text-foreground">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <span aria-hidden>{avatarInitial}</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              Foto de perfil
            </p>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
            >
              {uploadingAvatar ? "Subiendo foto..." : "Cambiar foto"}
            </Button>
            {avatarError && (
              <p className="text-xs text-destructive mt-1">
                {avatarError}
              </p>
            )}
            {avatarMessage && (
              <p className="text-xs text-foreground mt-1">
                {avatarMessage}
              </p>
            )}
          </div>
        </div>

        <form
          onSubmit={handleProfileSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-4"
        >
          <h2 className="text-sm font-bold text-foreground">
            Datos de la cuenta
          </h2>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Nombre
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
          {profileError && (
            <p className="text-sm text-destructive">
              {profileError}
            </p>
          )}
          {profileMessage && (
            <p className="text-sm text-foreground">
              {profileMessage}
            </p>
          )}
          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold mt-1"
            disabled={savingProfile}
          >
            {savingProfile ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-4"
        >
          <h2 className="text-sm font-bold text-foreground">
            Cambiar contraseña
          </h2>
          <p className="text-xs text-muted-foreground">
            Solo tú puedes ver y cambiar tu contraseña. Al actualizarla, tendrás
            que usar la nueva la próxima vez que inicies sesión.
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Nueva contraseña
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Repite la nueva contraseña
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Vuelve a escribirla"
            />
          </div>
          {passwordError && (
            <p className="text-sm text-destructive">
              {passwordError}
            </p>
          )}
          {passwordMessage && (
            <p className="text-sm text-foreground">
              {passwordMessage}
            </p>
          )}
          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold mt-1"
            disabled={savingPassword}
          >
            {savingPassword ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
        </form>
      </section>
    </main>
  );
}

export default function MiUsuarioPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background max-w-[520px] mx-auto flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Cargando tu usuario...
          </p>
        </main>
      }
    >
      <MiUsuarioContent />
    </Suspense>
  );
}

