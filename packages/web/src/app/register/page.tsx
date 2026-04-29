"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  );
}

function VisibilityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  );
}

function VisibilityOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
    </svg>
  );
}

function ArrowForwardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Registration failed");
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col relative">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[50%] bg-surface-container-high rounded-full blur-[120px] opacity-40" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[50%] bg-on-tertiary-container/10 rounded-full blur-[120px] opacity-30" />
      </div>

      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          {/* Brand Identity */}
          <div className="text-center mb-8">
            <h1 className="font-bold text-[36px] leading-[44px] tracking-[-0.02em] text-primary">
              Daily Finance
            </h1>
            <p className="text-base leading-6 text-on-surface-variant mt-2">
              Track your daily spending effortlessly
            </p>
          </div>

          {/* Register Card */}
          <div className="bg-surface-container-lowest shadow-login-card rounded-xl p-8 border border-outline-variant/30">
            <h2 className="text-xl font-semibold leading-7 text-primary mb-2">
              Create account
            </h2>
            <p className="text-sm leading-5 text-on-surface-variant mb-8">
              Join us to start managing your expenses efficiently.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold leading-4 text-on-surface-variant uppercase tracking-wider"
                >
                  Username
                </label>
                <div className="relative">
                  <PersonIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    className="w-full pl-10 pr-6 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-on-tertiary-container focus:border-on-tertiary-container outline-none transition-all text-sm text-on-surface placeholder:text-outline"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold leading-4 text-on-surface-variant uppercase tracking-wider"
                >
                  Email
                </label>
                <div className="relative">
                  <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full pl-10 pr-6 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-on-tertiary-container focus:border-on-tertiary-container outline-none transition-all text-sm text-on-surface placeholder:text-outline"
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold leading-4 text-on-surface-variant uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full pl-10 pr-12 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-on-tertiary-container focus:border-on-tertiary-container outline-none transition-all text-sm text-on-surface placeholder:text-outline"
                    placeholder="min. 8 characters"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <VisibilityOffIcon className="w-5 h-5" />
                    ) : (
                      <VisibilityIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-error">{error}</p>}

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-base leading-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
                {!loading && <ArrowForwardIcon className="w-5 h-5" />}
              </button>
            </form>
          </div>

          {/* Footer Link */}
          <p className="text-center mt-8 text-sm leading-5 text-on-surface-variant">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-on-tertiary-container font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Legal Footer */}
      <footer className="p-6 text-center">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-center items-center gap-6 text-xs font-semibold text-outline uppercase tracking-widest">
          <Link href="#" className="hover:text-on-surface transition-colors">
            Privacy Policy
          </Link>
          <span className="hidden md:block">•</span>
          <Link href="#" className="hover:text-on-surface transition-colors">
            Terms of Service
          </Link>
          <span className="hidden md:block">•</span>
          <span>© 2024 Daily Finance Systems Inc.</span>
        </div>
      </footer>
    </div>
  );
}
