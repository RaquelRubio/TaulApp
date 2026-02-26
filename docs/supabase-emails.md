# Textos para los emails de Supabase (TaulApp)

Copia y pega cada **Subject** y **Body** en **Authentication → Email Templates** en tu proyecto de Supabase. Las variables entre dobles llaves (p. ej. `{{ .ConfirmationURL }}`) las sustituye Supabase automáticamente.

---

## 1. Invite user (Invitar usuaria)

**Subject:**
```
Te han invitado a TaulApp
```

**Body:**
```
Hola,

Alguien te ha invitado a unirte a TaulApp, la app para compartir y descubrir recetas.

Pulsa el enlace siguiente para crear tu cuenta y empezar a guardar tus recetas:

{{ .ConfirmationURL }}

Si no esperabas esta invitación, puedes ignorar este correo.

— El equipo de TaulApp
```

---

## 2. Magic link (Inicio de sesión por enlace)

**Subject:**
```
Tu enlace para entrar en TaulApp
```

**Body:**
```
Hola,

Has pedido entrar en TaulApp con este correo. Pulsa el enlace para iniciar sesión (es válido una sola vez):

{{ .ConfirmationURL }}

Si no has sido tú, ignora este mensaje. Nadie podrá entrar en tu cuenta sin acceso a este correo.

— TaulApp
```

---

## 3. Change email address (Cambiar correo)

**Subject:**
```
Confirma tu nuevo correo en TaulApp
```

**Body:**
```
Hola,

Has solicitado cambiar el correo de tu cuenta de TaulApp. Para confirmar que el nuevo correo es tuyo, pulsa este enlace:

{{ .ConfirmationURL }}

Si no has pedido este cambio, puedes ignorar el correo y tu cuenta seguirá igual.

— TaulApp
```

---

## 4. Reset password (Restablecer contraseña)

**Subject:**
```
Restablece tu contraseña de TaulApp
```

**Body:**
```
Hola,

Has pedido restablecer la contraseña de tu cuenta en TaulApp. Pulsa el enlace para elegir una nueva contraseña:

{{ .ConfirmationURL }}

El enlace caduca en poco tiempo. Si no has sido tú, ignora este correo; tu contraseña no cambiará.

— TaulApp
```

---

## 5. Reauthentication (Volver a identificarte)

**Subject:**
```
Confirma que eres tú en TaulApp
```

**Body:**
```
Hola,

Para completar una acción en TaulApp necesitamos que confirmes tu identidad. Pulsa el enlace siguiente:

{{ .ConfirmationURL }}

Si no has solicitado esta verificación, ignora este correo.

— TaulApp
```
