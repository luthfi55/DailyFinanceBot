"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PhoneVerification({
  phone,
  isVerified,
}: {
  phone: string | null;
  isVerified: boolean;
}) {
  const router = useRouter();
  const [phoneInput, setPhoneInput] = useState(phone ?? "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [changing, setChanging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendCode() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/verify/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phoneInput }),
    });

    setLoading(false);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
    } else {
      setStep("verify");
      setMessage("Verification code sent to your WhatsApp.");
    }
  }

  async function verifyCode() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/verify/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    setLoading(false);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage("WhatsApp number verified successfully!");
      setChanging(false);
      router.refresh();
    }
  }

  if (isVerified && !changing) {
    return (
      <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="text-sm font-medium text-gray-800">{phone}</span>
        </div>
        <button
          onClick={() => {
            setChanging(true);
            setPhoneInput("");
            setStep("phone");
            setMessage("");
            setError("");
          }}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {step === "phone" && (
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              WA number (format: 628xxxxxxxxx)
            </label>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="628123456789"
            />
          </div>
          <button
            onClick={sendCode}
            disabled={loading || !phoneInput}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
          {changing && (
            <button
              onClick={() => { setChanging(false); setError(""); setMessage(""); }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {step === "verify" && (
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123456"
              maxLength={6}
            />
          </div>
          <button
            onClick={verifyCode}
            disabled={loading || code.length !== 6}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
          <button
            onClick={() => setStep("phone")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back
          </button>
        </div>
      )}

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
