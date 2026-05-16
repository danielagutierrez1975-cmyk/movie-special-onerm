# Desplegar en Render con GitHub

## 1. Seguridad del token (importante)

Si compartiste el token del bot en chat o en un repo público, **regenera el token** en  
[Discord Developer Portal](https://discord.com/developers/applications) → tu app → **Bot** → **Reset Token**.

Luego pon el token nuevo solo en Render (paso 4), nunca en GitHub.

## 2. Subir el proyecto a GitHub

En la carpeta del proyecto (`proyectodetrabajoobligatorio`):

```bash
git init
git add .
git commit -m "Servidor Discord control + HTML polling"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

El archivo `.env` **no se sube** (está en `.gitignore`).

## 3. Crear el servicio en Render

1. Entra a [render.com](https://render.com) e inicia sesión.
2. **New** → **Blueprint** (o **Web Service** si prefieres manual).
3. Conecta tu cuenta de **GitHub** y elige el repositorio.
4. Render detectará `render.yaml` en la raíz del repo.

## 4. Variable secreta en Render

En el panel del servicio **solucionsneqs** → **Environment**:

| Key | Value |
|-----|--------|
| `DISCORD_BOT_TOKEN` | Tu token del bot (el nuevo si lo regeneraste) |
| `DISCORD_CLIENT_ID` | `1504930494402265238` |
| `DISCORD_CHANNEL_ID` | `1496892504476487700` |
| `CORS_ORIGINS` | `*` |

Las demás ya vienen del `render.yaml`.

## 5. Invitar el bot al servidor

Abre este enlace (ya con permisos):

https://discord.com/oauth2/authorize?client_id=1504930494402265238&permissions=280576&integration_type=0&scope=bot+applications.commands

Canal de control: `1496892504476487700`

## 6. URL del API

Tras el deploy, la URL será algo como:

**https://solucionsneqs.onrender.com**

Los HTML ya apuntan a esa URL. Comprueba:

`https://solucionsneqs.onrender.com/health`

Debe responder: `{"ok":true,"discord":true,...}`

## 7. Azure Blob

Vuelve a subir la carpeta `nq12/` (incluye `access-passed/js/discord-control.js`) para que el polling use el API en Render.
