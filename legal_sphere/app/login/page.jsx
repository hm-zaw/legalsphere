"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.Message || data?.message || "Login failed");
      }
      if (!data?.Success) {
        throw new Error(data?.Message || data?.message || "Login failed");
      }
      setSuccess(data?.Message || "Login successful. Redirecting...");
      // Store user data in localStorage for dashboard
      if (data["User Data"]) {
        const rawUserData = data["User Data"];
        const normalizedUserData = Array.isArray(rawUserData) ? rawUserData[0] : rawUserData;
        localStorage.setItem('userData', JSON.stringify(normalizedUserData));
        
        // Store authentication token
        if (data.adminToken) {
          localStorage.setItem('adminToken', data.adminToken);
        } else if (data.userToken) {
          localStorage.setItem('userToken', data.userToken);
        } else if (data.token) {
          // Fallback to generic token
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('userToken', data.token);
        }
        
        // Role-based redirection
        const userRole = data["User Data"].role;
        let redirectPath = "/dashboard"; // default for client/user
        
        if (userRole === "admin") {
          redirectPath = "/admin-dashboard";
        } else if (userRole === "lawyer") {
          redirectPath = "/lawyer-dashboard";
        } else if (userRole === "client" || userRole === "user") {
          redirectPath = "/dashboard";
        }
        
        setTimeout(() => {
          router.push(redirectPath);
        }, 800);
      } else {
        setTimeout(() => {
          router.push("/dashboard");
        }, 800);
      }
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

        <div className="relative z-10 flex items-center justify-center bg-white px-8 py-10 md:-ml-10 md:rounded-tl-[36px] md:px-12 md:shadow-xl">
          <div className="w-full max-w-lg">
            <h1 className="heading-font text-3xl font-semibold tracking-tight text-zinc-900">
              Welcome Back!
            </h1>
            <p className="mt-2 text-sm text-zinc-500">Log in to continue.</p>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-3 text-sm text-emerald-600">{success}</p>}

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-600">Email</label>
                <input
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                  placeholder="Input your email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-600">Password</label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 pr-12 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                    placeholder="Input your password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:text-zinc-900"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M3 3l18 18"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M2 12s3.5-7 10-7c2.15 0 4.02.75 5.53 1.78M22 12s-3.5 7-10 7c-2.15 0-4.02-.75-5.53-1.78"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M9.88 9.88A3.5 3.5 0 0 0 12 15.5c.52 0 1.02-.12 1.46-.33"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-zinc-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-zinc-300" />
                  Remember Me
                </label>
                <Link href="#" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-zinc-200" />
                <div className="text-xs text-zinc-400">Or continue with</div>
                <div className="h-px flex-1 bg-zinc-200" />
              </div>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
                  G
                </span>
                Continue with Google
              </button>

              <p className="pt-2 text-center text-xs text-zinc-500">
                Don’t have an account?{" "}
                <Link href="/signup" className="font-semibold text-zinc-900 hover:underline">
                  Sign up here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
