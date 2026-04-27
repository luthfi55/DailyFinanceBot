import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import pino from "pino";
import { handleMessage } from "./handler";

const logger = pino({ level: "silent" });

let currentQR: string | null = null;
let isConnected = false;
let activeSock: ReturnType<typeof makeWASocket> | null = null;

export function getSock() {
  return activeSock;
}

export function getBotStatus() {
  if (isConnected) return { status: "connected" };
  if (currentQR) return { status: "qr", qr: currentQR };
  return { status: "loading" };
}

export async function startBot() {
  const authPath = path.resolve(process.cwd(), "auth_info");
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = (activeSock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    printQRInTerminal: true,
  }));

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      currentQR = qr;
      isConnected = false;
    }

    if (connection === "open") {
      currentQR = null;
      isConnected = true;
      console.log("Bot WA terhubung!");
    }

    if (connection === "close") {
      isConnected = false;
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("Reconnecting bot...");
        startBot();
      } else {
        console.log("Bot logged out. Hapus folder auth_info untuk scan ulang.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      await handleMessage(sock, msg);
    }
  });
}
