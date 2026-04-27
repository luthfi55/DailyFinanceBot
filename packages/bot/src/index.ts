import express from "express";
import { startBot, getBotStatus, getSock, logoutBot } from "./bot";

const app = express();
app.use(express.json());

app.get("/status", (req, res) => {
  res.json(getBotStatus());
});

app.post("/send-code", async (req, res) => {
  const { phoneNumber, code } = req.body;
  const sock = getSock();

  if (!sock) {
    res.status(503).json({ error: "Bot not connected" });
    return;
  }

  try {
    const jid = phoneNumber + "@s.whatsapp.net";
    await sock.sendMessage(jid, {
      text: `Kode verifikasi Daily Finance Bot kamu:\n\n*${code}*\n\nBerlaku 10 menit. Jangan bagikan ke siapapun.`,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.post("/logout", async (_req, res) => {
  try {
    await logoutBot();
    res.json({ ok: true });
  } catch (e: any) {
    res.status(503).json({ error: e.message ?? "Failed to logout" });
  }
});

const port = parseInt(process.env.BOT_PORT ?? "3001");
app.listen(port, () => {
  console.log(`Bot HTTP server running on port ${port}`);
  startBot();
});
