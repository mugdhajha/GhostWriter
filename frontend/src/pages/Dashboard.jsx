// pages/Dashboard.jsx

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

const TONES = ["casual", "formal", "professional", "informal", "humorous"];
const CONTENT_TYPES = ["email", "message", "blog", "general"];

const Dashboard = () => {
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("casual");
  const [contentType, setContentType] = useState("message");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const [rewriteTone, setRewriteTone] = useState("casual");
  const [rewriteLoading, setRewriteLoading] = useState(false);

  const [improveLoading, setImproveLoading] = useState(false);

  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftsError, setDraftsError] = useState("");
  const [openDraftId, setOpenDraftId] = useState(null);

  const loadDrafts = async () => {
    setDraftsError("");
    setDraftsLoading(true);
    try {
      const res = await api.get("/history");
      setDrafts(Array.isArray(res.data.entries) ? res.data.entries : []);
    } catch (err) {
      setDraftsError(err.response?.data?.error || "Could not load saved drafts.");
    } finally {
      setDraftsLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const draftItems = useMemo(() => {
    return [...drafts].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [drafts]);

  const runAnalyze = async (text) => {
    setAnalysisError("");
    setAnalysisLoading(true);
    try {
      const res = await api.post("/analyze", { text });
      setAnalysis(res.data);
    } catch (err) {
      setAnalysis(null);
      setAnalysisError(err.response?.data?.error || "Analysis failed.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleGenerate = async () => {
    setError("");
    setReply("");
    setAnalysis(null);
    setAnalysisError("");

    if (!message.trim()) {
      setError("Please enter some text.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/ai/generate", {
        user_prompt: message.trim(),
        tone,
        content_type: contentType,
      });
      const nextReply = response.data.reply;
      setReply(nextReply);
      setRewriteTone(tone);

      await runAnalyze(nextReply);
      await loadDrafts();
    } catch (err) {
      setError(err.response?.data?.error || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reply);
  };

  const handleRewrite = async () => {
    if (!reply.trim()) return;
    setError("");
    setAnalysis(null);
    setAnalysisError("");
    setRewriteLoading(true);
    try {
      const res = await api.post("/rewrite", {
        original_text: reply.trim(),
        tone: rewriteTone,
      });
      setReply(res.data.output);
      setTone(rewriteTone);
      await runAnalyze(res.data.output);
      await loadDrafts();
    } catch (err) {
      setError(err.response?.data?.error || "Rewrite failed.");
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleImprove = async () => {
    if (!reply.trim()) return;
    const suggestions = analysis?.suggestions;
    if (!Array.isArray(suggestions) || suggestions.length === 0) return;

    setError("");
    setAnalysisError("");
    setImproveLoading(true);
    try {
      const res = await api.post("/improve", {
        original_text: reply.trim(),
        suggestions,
      });
      setReply(res.data.output);
      await runAnalyze(res.data.output);
      await loadDrafts();
    } catch (err) {
      setError(err.response?.data?.error || "Improve failed.");
    } finally {
      setImproveLoading(false);
    }
  };

  const handleDeleteDraft = async (id) => {
    setDraftsError("");
    try {
      await api.delete(`/history/${id}`);
      setDrafts((prev) => prev.filter((d) => d._id !== id));
      if (openDraftId === id) setOpenDraftId(null);
    } catch (err) {
      setDraftsError(err.response?.data?.error || "Could not delete draft.");
    }
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
                Let your thoughts find their ink…
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

              <div className="flex-1">
                <label className="label">Content type</label>
                <select
                  className="input-field"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                >
                  {CONTENT_TYPES.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct.charAt(0).toUpperCase() + ct.slice(1)}
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
                    "Inscribe"
                  )}
                </button>
              </div>
            </div>
          </div>
        {/* </div> */}

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
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="text-xs text-ink-500 hover:text-ink-800 flex items-center gap-1 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
                  </svg>
                  Copy
                </button>
              </div>
            </div>
            <div className="border-t border-cream-300 pt-4">
              <p className="font-body text-ink-700 leading-relaxed whitespace-pre-wrap">{reply}</p>
            </div>

            <div className="mt-5 flex items-end gap-4">
              <div className="flex-1">
                <label className="label">Rewrite tone</label>
                <select
                  className="input-field"
                  value={rewriteTone}
                  onChange={(e) => setRewriteTone(e.target.value)}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRewrite}
                disabled={rewriteLoading}
                className="btn-primary whitespace-nowrap"
              >
                {rewriteLoading ? "Rewriting…" : "Rewrite"}
              </button>
            </div>
          </div>
        )}

        {/* Analysis */}
        {reply && (
          <div className="card p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-ink-800 font-semibold">Evaluation</h2>
              {analysisLoading && <span className="text-xs font-mono text-ink-500">Analyzing…</span>}
            </div>

            {analysisError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
                {analysisError}
              </div>
            )}

            {analysis && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border border-cream-300 rounded-lg p-3 bg-cream-50/70">
                    <div className="text-xs font-mono text-ink-500 uppercase tracking-wider">Professionalism</div>
                    <div className="text-lg text-ink-800 font-semibold">{analysis.professionalism}/10</div>
                  </div>
                  <div className="border border-cream-300 rounded-lg p-3 bg-cream-50/70">
                    <div className="text-xs font-mono text-ink-500 uppercase tracking-wider">Clarity</div>
                    <div className="text-lg text-ink-800 font-semibold">{analysis.clarity}/10</div>
                  </div>
                  <div className="border border-cream-300 rounded-lg p-3 bg-cream-50/70">
                    <div className="text-xs font-mono text-ink-500 uppercase tracking-wider">Tone</div>
                    <div className="text-lg text-ink-800 font-semibold">{analysis.tone}</div>
                  </div>
                </div>

                <div className="border border-cream-300 rounded-lg p-4 bg-cream-50/70">
                  <div className="text-xs font-mono text-ink-500 uppercase tracking-wider mb-2">
                    Suggestions
                  </div>
                  {Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0 ? (
                    <div className="space-y-1">
                      {analysis.suggestions.map((s, idx) => (
                        <p key={idx} className="text-sm text-ink-700">{s}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-700">No suggestions.</p>
                  )}
                </div>

                <button
                  onClick={handleImprove}
                  disabled={improveLoading || !Array.isArray(analysis.suggestions) || analysis.suggestions.length === 0}
                  className="btn-primary whitespace-nowrap"
                >
                  {improveLoading ? "Improving…" : "Improve based on feedback"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Saved Drafts (MongoDB) */}
        <div className="card p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink-800 font-semibold">Saved Drafts</h2>
            <span className="text-xs font-mono text-ink-500">
              {draftItems.length} entr{draftItems.length === 1 ? "y" : "ies"}
            </span>
          </div>

          {draftsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-4">
              {draftsError}
            </div>
          )}

          {draftsLoading ? (
            <p className="text-sm text-ink-600">Loading drafts…</p>
          ) : draftItems.length === 0 ? (
            <p className="text-sm text-ink-600">No drafts yet.</p>
          ) : (
            <div className="space-y-3">
              {draftItems.map((d) => {
                const isOpen = openDraftId === d._id;
                return (
                  <div key={d._id} className="border border-cream-300 rounded-lg bg-cream-50/70">
                    <button
                      type="button"
                      onClick={() => setOpenDraftId(isOpen ? null : d._id)}
                      className="w-full text-left p-4 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-ink-500">
                            {d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}
                          </span>
                          <span className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded font-medium">
                            {d.tone}
                          </span>
                          <span className="text-xs text-ink-500 font-mono">
                            {d.contentType}
                          </span>
                        </div>
                        <p className="text-sm text-ink-700 font-body leading-relaxed line-clamp-2">
                          {d.prompt}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDraft(d._id);
                          }}
                          className="text-xs text-ink-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4">
                        <div className="border-t border-cream-300 pt-3 space-y-3">
                          <div>
                            <div className="text-xs font-mono uppercase tracking-wider text-ink-500 mb-1">Prompt</div>
                            <p className="text-sm text-ink-700 whitespace-pre-wrap">{d.prompt}</p>
                          </div>
                          <div>
                            <div className="text-xs font-mono uppercase tracking-wider text-ink-500 mb-1">Output</div>
                            <p className="text-sm text-ink-700 whitespace-pre-wrap">{d.output}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
