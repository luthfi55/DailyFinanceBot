"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function QRCodePanel() {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "qr" | "connected" | "error">("loading");

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

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
    if (!confirm("Are you sure you want to logout? You will need to scan the QR code again to reconnect.")) return;
    try {
      const res = await fetch("/api/bot/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      setStatus("loading");
    } catch {
      alert("Failed to logout bot.");
    }
  }

  if (status === "connected") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-sm font-medium">Bot connected</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-red-500 hover:text-red-700 underline"
        >
          Logout
        </button>
      </div>
    );
  }

  if (status === "error") {
    return <p className="text-sm text-red-500">Bot service unreachable.</p>;
  }

  if (status === "qr" && qr) {
    return (
      <div className="space-y-3">
        <div className="inline-block p-3 bg-white border border-gray-200 rounded-xl">
          <QRCodeSVG value={qr} size={200} />
        </div>
        <p className="text-xs text-gray-500">
          Open WhatsApp → Linked Devices → Link a Device → Scan this QR.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-gray-400">
      <span className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></span>
      <span className="text-sm">Connecting to bot...</span>
    </div>
  );
}
