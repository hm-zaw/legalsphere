"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!firstName || !email || !password) {
      setError("Please fill in required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${firstName}${lastName ? " " + lastName : ""}`,
          email,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.Message || data?.message || "Sign up failed");
      }
      if (!data?.Success) {
        throw new Error(data?.Message || data?.message || "Sign up failed");
      }
      setSuccess(data?.Message || "Account created. Redirecting to login...");
      setTimeout(() => router.push("/login"), 800);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="h-screen w-screen bg-zinc-100">
      <div className="grid h-full w-full grid-cols-1 md:grid-cols-[45%_55%]">
        <div className="relative hidden md:block">
            <Image
              src="/login-photo2.png"
              alt="Building"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute left-6 top-6">
              <div className="rounded-md border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white backdrop-blur">
                LEGALSPHERE
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-black/10 to-transparent" />
        </div>

        <div className="relative z-10 flex items-center justify-center bg-white px-8 md:-ml-10 md:rounded-tl-[36px] md:px-16 md:shadow-xl">
          <div className="w-full max-w-sm">
            <form className="mt-10" onSubmit={handleSubmit}>
              <h1 className="heading-font text-3xl font-semibold tracking-tight text-zinc-900">
                Sign Up Account
              </h1>
              <p className="mt-2 text-sm text-zinc-500">Enter your personal data to create your account.</p>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              {success && <p className="mt-3 text-sm text-emerald-600">{success}</p>}

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-zinc-600">First Name</label>
                  <input
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                    placeholder="eg. John"
                    name="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-zinc-600">Last Name</label>
                  <input
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                    placeholder="eg. Francisco"
                    name="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium text-zinc-600">Email</label>
                <input
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                  placeholder="eg. johnfrans@gmail.com"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium text-zinc-600">Password</label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 pr-12 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:text-zinc-900"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M2 12s3.5-7 10-7c2.15 0 4.02.75 5.53 1.78M22 12s-3.5 7-10 7c-2.15 0-4.02-.75-5.53-1.78" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M9.88 9.88A3.5 3.5 0 0 0 12 15.5c.52 0 1.02-.12 1.46-.33" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-500">Must be at least 8 characters.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </button>

              <p className="pt-2 text-center text-xs text-zinc-500">
                Already have an account? {""}
                <Link href="/login" className="font-semibold text-zinc-900 hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
