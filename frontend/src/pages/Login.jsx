import { Brain, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/home");
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to sign in. Please check your credentials.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/30 lg:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-indigo-500/15 via-slate-900 to-violet-500/10 p-12 lg:flex lg:flex-col lg:justify-between">
            <div>
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-400/20">
                  <Brain className="h-5 w-5 text-indigo-400" />
                </div>

                <span className="font-semibold">AI Study Companion</span>
              </Link>

              <div className="mt-20 max-w-md">
                <p className="text-sm font-medium text-indigo-300">
                  Learn with context
                </p>

                <h2 className="mt-3 text-4xl font-bold leading-tight">
                  Your study space should remember where you left off.
                </h2>

                <p className="mt-5 leading-7 text-slate-400">
                  Keep your materials, conversations, assessments, and progress
                  connected inside each learning project.
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600">AI Study Companion</p>
          </div>

          <div className="p-8 sm:p-12">
            <div className="mx-auto max-w-md">
              <div className="mb-8 lg:hidden">
                <Link to="/" className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
                    <Brain className="h-5 w-5 text-indigo-400" />
                  </div>
                  <span className="font-semibold">AI Study Companion</span>
                </Link>
              </div>

              <div>
                <p className="text-sm font-medium text-indigo-400">
                  Welcome back
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Continue your learning
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Sign in to access your spaces, projects, and progress.
                </p>
              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-11 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-11 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/15 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-8 flex items-center gap-3 text-xs text-slate-600">
                <div className="h-px flex-1 bg-slate-800" />
                <span>Secure session</span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              <Link
                to="/"
                className="mt-6 block text-center text-sm text-slate-500 transition hover:text-slate-300"
              >
                ← Back to landing page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
