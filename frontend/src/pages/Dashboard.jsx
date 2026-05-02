// pages/Dashboard.jsx

import React, { useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

const TONES = ["casual", "formal", "professional", "informal", "humorous"];

const Dashboard = () => {
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("casual");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setError("");
    setReply("");

    if (!message.trim()) {
      setError("Please enter a message to reply to.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/ai/generate", {
        message: message.trim(),
        tone,
      });
      setReply(response.data.reply);
    } catch (err) {
      setError(err.response?.data?.error || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reply);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Input section */}
          <div className="card p-10 mb-6">
          <div className="mb-4">
            <h1 className="font-display text-3xl text-ink-900 font-semibold mb-4">
              Message to reply to
            </h1>
            <textarea
              className="ruled-textarea"
              rows={5}
              placeholder="Start writing your message here…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="label">Tone</label>
              <select
                className="input-field"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-6">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary whitespace-nowrap"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Writing…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Generate reply <span aria-hidden="true">✒</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Output */}
        {reply && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-ink-400 uppercase tracking-wider">Generated reply</span>
                <span className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded font-medium">
                  {tone}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="text-xs text-ink-400 hover:text-ink-700 flex items-center gap-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
                </svg>
                Copy
              </button>
            </div>
            <div className="border-t border-cream-300 pt-4">
              <p className="font-body text-ink-700 leading-relaxed whitespace-pre-wrap">{reply}</p>
            </div>
          </div>
        )}

        {/* Empty state hint */}
        {!reply && !loading && !error && (
          <div className="text-center py-12 text-cream-100">
            <div className="text-5xl mb-4 opacity-40">✒</div>
            <p className="text-sm font-body">
              Your generated reply will appear here.
            </p>
            <p className="text-xs mt-1 text-cream-100">
              Make sure you've added writing samples on your{" "}
              <a href="/profile" className="underline hover:text-cream-50">Profile</a> page.
            </p>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
