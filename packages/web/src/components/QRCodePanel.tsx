"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function QRCodePanel() {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "qr" | "connected" | "error">("loading");
  const [seconds, setSeconds] = useState(120);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status !== "qr") return;
    setSeconds(120);
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [status, qr]);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/bot/status");
      const data = await res.json();
      if (data.status === "connected") {
        setStatus("connected");
        setQr(null);
      } else if (data.qr) {
        setStatus("qr");
        setQr(data.qr);
      } else {
        setStatus("loading");
      }
    } catch {
      setStatus("error");
    }
  }

  async function handleLogout() {
    if (!confirm("Are you sure you want to logout? You will need to scan the QR code again.")) return;
    try {
      const res = await fetch("/api/bot/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      setStatus("loading");
    } catch {
      alert("Failed to logout bot.");
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
          </div>
          <h2 className="font-bold text-gray-900 text-lg">WhatsApp Bot</h2>
        </div>
        {status === "connected" ? (
          <span className="bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Active Connection
          </span>
        ) : status === "error" ? (
          <span className="bg-red-100 text-red-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Unreachable
          </span>
        ) : (
          <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Connecting...
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex gap-6 items-start flex-1">
        {/* Left: instructions + buttons */}
        <div className="flex-1 space-y-5">
          <p className="text-sm text-gray-500 leading-relaxed">
            Scan this QR code with the bot&apos;s WhatsApp number to connect the bot to your environment.
          </p>

          <ol className="space-y-3">
            {[
              <>Open WhatsApp on your phone</>,
              <>Tap <strong>Linked Devices</strong> in the menu</>,
              <>Point your camera at this screen to capture the code</>,
            ].map((text, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  {i + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>

          <div className="flex gap-2 flex-wrap pt-1">
            <a
              href="https://wa.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open WhatsApp
            </a>
            {status === "connected" ? (
              <button
                onClick={handleLogout}
                className="border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Disconnect
              </button>
            ) : (
              <button className="border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Linked Devices
              </button>
            )}
          </div>
        </div>

        {/* Right: QR box */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="w-44 h-44 bg-gray-800 rounded-2xl flex items-center justify-center overflow-hidden">
            {status === "qr" && qr ? (
              <div className="p-3 bg-white rounded-xl">
                <QRCodeSVG value={qr} size={152} />
              </div>
            ) : status === "connected" ? (
              <div className="text-center text-green-400">
                <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p className="text-xs mt-2 font-medium">Connected</p>
              </div>
            ) : status === "error" ? (
              <div className="text-center text-red-400">
                <svg className="w-10 h-10 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs mt-2">Unreachable</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <span className="w-8 h-8 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
                <p className="text-xs">Connecting...</p>
              </div>
            )}
          </div>
          {status === "qr" && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Valid for {mm}:{ss}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
