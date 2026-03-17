"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseAuth } from "../lib/useSupabaseAuth";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

type ProfileRow = {
  display_name: string | null;
};

type UserMetadata = {
  avatar_path?: string | null;
  display_name?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatar_emoji?: string | null;
  avatar_color?: string | null;
};

function MiUsuarioContent() {
  const router = useRouter();
  const { user, loading } = useSupabaseAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [emoji, setEmoji] = useState("🥦");
  const [avatarColor, setAvatarColor] = useState<string>("#FDE68A");
  const [loadedEmoji, setLoadedEmoji] = useState("🥦");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const emojiInputRef = useRef<HTMLInputElement | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const redirectTo = "/mi-usuario";
      router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function loadProfile() {
      setLoadingProfile(true);
      setProfileError(null);

      try {
        setEmail(currentUser.email ?? "");

        const [{ data: profileData }, { data: authData }] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name")
            .eq("id", currentUser.id)
            .maybeSingle<ProfileRow>(),
          supabase.auth.getUser(),
        ]);

        const meta = (authData.user?.user_metadata ?? {}) as UserMetadata;
        const profileName = profileData?.display_name ?? null;
        const metaName = meta.display_name ?? null;

        const finalName =
          profileName?.trim() ||
          metaName?.trim() ||
          currentUser.email ||
          "";

        setDisplayName(finalName);
        setPhone((meta.phone ?? "") || "");
        setBio((meta.bio ?? "") || "");
        const loadedEmojiValue = (meta.avatar_emoji ?? "🥦") || "🥦";
        setEmoji(loadedEmojiValue);
        setLoadedEmoji(loadedEmojiValue);

        const storedColor = (meta.avatar_color ?? "").trim();
        if (storedColor) {
          setAvatarColor(storedColor);
        } else {
          const colors = ["#FEF3C7", "#E0F2FE", "#ECFDF3", "#FCE7F3", "#F5F3FF"];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          setAvatarColor(randomColor);
        }
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

  const avatarInitial =
    emoji ||
    displayName?.trim()?.charAt(0)?.toUpperCase() ||
    user.email?.trim()?.charAt(0)?.toUpperCase() ||
    "🥦";

  async function ensureCocinillasNameIfEmpty() {
    if (!user) return;
    if (displayName.trim()) return;

    try {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .ilike("display_name", "Cocinillas %");

      if (error) {
        console.error("Error contando Cocinillas", error);
        setDisplayName("Cocinillas 1");
        return;
      }

      const nextNumber = (count ?? 0) + 1;
      setDisplayName(`Cocinillas ${nextNumber}`);
    } catch (e) {
      console.error("Error generando nombre Cocinillas", e);
      setDisplayName("Cocinillas 1");
    }
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setProfileError(null);
    setProfileMessage(null);
    setSavingProfile(true);

    const trimmedName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanBio = bio.trim();
    const cleanEmoji = (emoji || "🥦").trim() || "🥦";

    let nextAvatarColor = avatarColor;
    if (cleanEmoji !== loadedEmoji) {
      const colors = ["#FEF3C7", "#E0F2FE", "#ECFDF3", "#FCE7F3", "#F5F3FF"];
      nextAvatarColor = colors[Math.floor(Math.random() * colors.length)];
      setAvatarColor(nextAvatarColor);
      setLoadedEmoji(cleanEmoji);
    }

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
          phone: cleanPhone || null,
          bio: cleanBio || null,
          avatar_emoji: cleanEmoji,
          avatar_color: nextAvatarColor,
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

  async function handleDeleteAccount() {
    if (!user) return;
    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar tu cuenta? Se borrarán también tus recetas guardadas en TaulApp."
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeleteMessage(null);
    setDeletingAccount(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (error) {
        console.error("Error eliminando perfil", error);
        setDeleteError(
          error.message ||
            "No se ha podido eliminar tu cuenta. Inténtalo de nuevo en unos segundos."
        );
        setDeletingAccount(false);
        return;
      }

      setDeleteMessage("Tu cuenta se ha eliminado correctamente.");
      await supabase.auth.signOut();
      router.push("/");
    } finally {
      setDeletingAccount(false);
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
          <div
            className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl border border-border bg-card select-none"
            style={{ backgroundColor: avatarColor }}
            aria-hidden
          >
            <span>{avatarInitial}</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              Imagen de perfil
            </p>
            <p className="text-xs text-muted-foreground">
              Tu imagen de perfil siempre será un emoji dentro de un marco redondo. Puedes cambiarlo en el campo de emoji junto al nombre.
            </p>
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
              Emoji y nombre
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                ref={emojiInputRef}
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🥦"
                maxLength={4}
                className="w-14 text-center"
              />
              <Input
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() => {
                  void ensureCocinillasNameIfEmpty();
                }}
                placeholder="Cómo quieres que te veamos en TaulApp"
              />
            </div>
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
              Teléfono móvil (opcional)
            </label>
            <Input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 000 000"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Descripción (opcional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm resize-vertical"
              placeholder="Cuéntanos algo sobre ti y tu forma de cocinar."
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

        <section className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <h2 className="text-sm font-bold text-destructive">
            Eliminar cuenta
          </h2>
          <p className="text-xs text-destructive">
            Si eliminas tu cuenta, se borrarán también tus recetas asociadas. Esta acción no se puede deshacer.
          </p>
          {deleteError && (
            <p className="text-xs text-destructive">
              {deleteError}
            </p>
          )}
          {deleteMessage && (
            <p className="text-xs text-foreground">
              {deleteMessage}
            </p>
          )}
          <Button
            type="button"
            variant="destructive"
            className="w-full h-11 rounded-xl font-semibold mt-1 text-white"
            disabled={deletingAccount}
            onClick={() => {
              void handleDeleteAccount();
            }}
          >
            {deletingAccount ? "Eliminando cuenta..." : "Eliminar cuenta"}
          </Button>
        </section>
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

