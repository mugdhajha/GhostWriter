// pages/Signup.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim() || !confirm.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signup(email.trim(), password);
      navigate("/profile");
    } catch (err) {
      const message =
        err.response?.data?.error ||
        (err.code === "ERR_NETWORK" || !err.response
          ? "Can’t reach the API. Make sure the backend is running on http://localhost:5001."
          : "Signup failed. Please try again.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink-800 flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-64 h-64 border border-cream-100 rounded-full" />
          <div className="absolute bottom-20 right-10 w-48 h-48 border border-cream-100 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-cream-100 rounded-full" />
        </div>

        <div>
          <span className="text-3xl">✒</span>
        </div>

        <div>
          <p className="font-display text-3xl text-cream-200 italic leading-relaxed mb-4">
            Teach the machine how you write.
          </p>
          <p className="text-ink-400 text-sm font-body leading-relaxed">
            Upload your writing samples, define your tone, and let GhostWriter++ generate replies that sound unmistakably like you.
          </p>
        </div>

        <div className="text-ink-500 text-sm font-mono">GhostWriter++ v1.0</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm card p-6">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <span className="text-accent">✒</span>
            <span className="font-display font-semibold text-ink-800 text-xl">
              GhostWriter<span className="text-accent">++</span>
            </span>
          </div>

          <h1 className="font-display text-3xl text-ink-900 font-semibold mb-1">Create account</h1>
          <p className="text-ink-400 text-sm mb-8">Start teaching the AI your voice.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-sm text-ink-400 text-center mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:text-accent-hover font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
