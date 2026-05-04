// pages/Dashboard.jsx

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

const TONES = ["casual", "formal", "professional", "informal", "humorous"];
const CONTENT_TYPES = ["email", "message", "blog", "general"];

const Dashboard = () => {
  const location = useLocation();

  const [threadId, setThreadId] = useState("");
  const [threadEntries, setThreadEntries] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState("");
  const [continueFromEntryId, setContinueFromEntryId] = useState("");

  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("casual");
  const [contentType, setContentType] = useState("message");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [analysisLoadingById, setAnalysisLoadingById] = useState({});
  const [analysisErrorById, setAnalysisErrorById] = useState({});
  const [improveTextById, setImproveTextById] = useState({});
  const [improveLoadingById, setImproveLoadingById] = useState({});

  const loadThread = async (nextThreadId) => {
    if (!nextThreadId) return [];
    setThreadError("");
    setThreadLoading(true);
    try {
      const res = await api.get(`/history/thread/${nextThreadId}`);
      const entries = Array.isArray(res.data.entries) ? res.data.entries : [];
      setThreadEntries(entries);
      return entries;
    } catch (err) {
      setThreadEntries([]);
      setThreadError(err.response?.data?.error || "Could not load thread.");
      return [];
    } finally {
      setThreadLoading(false);
    }
  };

  useEffect(() => {
    const nextThreadId = (location.state?.threadId || "").toString();
    const nextParentEntryId = (location.state?.parentEntryId || "").toString();
    const seedText = (location.state?.seedText || "").toString();
    const seedTone = (location.state?.tone || "").toString();
    const seedContentType = (location.state?.contentType || "").toString();

    setError("");
    setThreadError("");

    if (!nextThreadId) {
      // New thread (or legacy History "continue" state)
      const legacyDraftToContinue = location.state?.draftToContinue;
      if (legacyDraftToContinue) {
        setMessage(legacyDraftToContinue.output || "");
        setTone(legacyDraftToContinue.tone || "casual");
        setContentType(legacyDraftToContinue.contentType || "message");
      } else {
        setMessage(seedText || "");
        if (TONES.includes(seedTone)) setTone(seedTone);
        if (CONTENT_TYPES.includes(seedContentType)) setContentType(seedContentType);
      }

      setThreadId("");
      setThreadEntries([]);
      setContinueFromEntryId("");
      return;
    }

    setThreadId(nextThreadId);
    setContinueFromEntryId(nextParentEntryId);

    (async () => {
      const entries = await loadThread(nextThreadId);

      // Pick the entry we are continuing from:
      // 1) parentEntryId (if provided)
      // 2) most recent entry in the thread
      const baseEntry =
        (nextParentEntryId && entries.find((e) => e._id === nextParentEntryId)) ||
        (entries.length > 0 ? entries[entries.length - 1] : null);

      if (baseEntry) {
        setMessage(baseEntry.output || "");
        setTone(baseEntry.tone || "casual");
        setContentType(baseEntry.contentType || "message");
        setContinueFromEntryId(baseEntry._id);
      } else {
        setMessage(seedText || "");
        if (TONES.includes(seedTone)) setTone(seedTone);
        if (CONTENT_TYPES.includes(seedContentType)) setContentType(seedContentType);
      }
    })();
  }, [location.state]);

  const runAnalyzeForEntry = async (entryId, text) => {
    if (!entryId) return;
    setAnalysisErrorById((prev) => ({ ...prev, [entryId]: "" }));
    setAnalysisLoadingById((prev) => ({ ...prev, [entryId]: true }));
    try {
      const res = await api.post("/analyze", {
        text,
        history_entry_id: entryId,
      });
      setThreadEntries((prev) => prev.map((e) => (e._id === entryId ? { ...e, analysis: res.data } : e)));
    } catch (err) {
      setAnalysisErrorById((prev) => ({
        ...prev,
        [entryId]: err.response?.data?.error || "Analysis failed.",
      }));
    } finally {
      setAnalysisLoadingById((prev) => ({ ...prev, [entryId]: false }));
    }
  };

  const handleGenerate = async () => {
    setError("");

    if (!message.trim()) {
      setError("Please enter some text.");
      return;
    }

    setLoading(true);
    try {
      const parentEntryId =
        continueFromEntryId || (threadEntries.length > 0 ? threadEntries[threadEntries.length - 1]._id : "");

      const response = await api.post("/ai/generate", {
        user_prompt: message.trim(),
        tone,
        content_type: contentType,
        thread_id: threadId || undefined,
        parent_entry_id: parentEntryId || undefined,
      });

      const nextEntry = response.data.historyEntry
        ? {
            ...response.data.historyEntry,
            // normalize for frontend usage
            threadId: response.data.historyEntry.threadId || response.data.historyEntry._id,
          }
        : {
            _id: `tmp-${Date.now()}`,
            threadId: threadId || "",
            parentEntryId: parentEntryId || undefined,
            prompt: message.trim(),
            output: response.data.reply,
            tone,
            contentType,
            createdAt: new Date().toISOString(),
          };

      const resolvedThreadId = nextEntry.threadId || threadId || nextEntry._id;
      setThreadId(resolvedThreadId);
      setThreadEntries((prev) => [...prev, { ...nextEntry, threadId: resolvedThreadId }]);
      setContinueFromEntryId(nextEntry._id);
      setMessage(nextEntry.output || "");

      if (!String(nextEntry._id || "").startsWith("tmp-")) {
        await runAnalyzeForEntry(nextEntry._id, nextEntry.output || "");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch {
      // ignore
    }
  };

  const handleImproveEntry = async (entry) => {
    const entryId = entry?._id;
    if (!entryId) return;

    const instruction = (improveTextById[entryId] || "").trim();
    if (!instruction) return;

    setError("");
    setImproveLoadingById((prev) => ({ ...prev, [entryId]: true }));
    try {
      const res = await api.post("/improve", {
        original_text: entry.output || "",
        instruction,
        thread_id: threadId || entry.threadId,
        parent_entry_id: entryId,
        source_entry_id: entryId,
        tone: entry.tone,
        content_type: entry.contentType,
      });

      const nextEntry = res.data.historyEntry
        ? {
            ...res.data.historyEntry,
            threadId: res.data.historyEntry.threadId || threadId || entry.threadId,
          }
        : {
            _id: `tmp-${Date.now()}`,
            threadId: threadId || entry.threadId || "",
            parentEntryId: entryId,
            prompt: instruction,
            output: res.data.output,
            tone: entry.tone,
            contentType: entry.contentType,
            createdAt: new Date().toISOString(),
          };

      const resolvedThreadId = nextEntry.threadId || threadId || entry.threadId || nextEntry._id;
      setThreadId(resolvedThreadId);
      setThreadEntries((prev) => [...prev, { ...nextEntry, threadId: resolvedThreadId }]);
      setContinueFromEntryId(nextEntry._id);
      setMessage(nextEntry.output || "");
      setImproveTextById((prev) => ({ ...prev, [entryId]: "" }));

      if (!String(nextEntry._id || "").startsWith("tmp-")) {
        await runAnalyzeForEntry(nextEntry._id, nextEntry.output || "");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Improve failed.");
    } finally {
      setImproveLoadingById((prev) => ({ ...prev, [entryId]: false }));
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

        {/* Thread */}
        {threadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-4">
            {threadError}
          </div>
        )}

        {(threadLoading || threadEntries.length > 0) && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-ink-800 font-semibold">Thread</h2>
              <span className="text-xs font-mono text-ink-500">
                {threadLoading ? "Loading…" : `${threadEntries.length} entr${threadEntries.length === 1 ? "y" : "ies"}`}
              </span>
            </div>

            {threadEntries.length === 0 ? (
              <p className="text-sm text-ink-600">No entries yet.</p>
            ) : (
              <div className="space-y-4">
                {threadEntries.map((entry, idx) => {
                  const entryId = entry._id;
                  const analysis = entry.analysis;
                  const analysisLoading = Boolean(analysisLoadingById[entryId]);
                  const analysisError = analysisErrorById[entryId] || "";
                  const improveText = improveTextById[entryId] || "";
                  const improveLoading = Boolean(improveLoadingById[entryId]);

                  return (
                    <div key={entryId} className="border border-cream-300 rounded-lg bg-cream-50/70">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-ink-500">
                                {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                              </span>
                              <span className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded font-medium">
                                {entry.tone}
                              </span>
                              <span className="text-xs text-ink-500 font-mono">{entry.contentType}</span>
                              <span className="text-xs font-mono text-ink-400">#{idx + 1}</span>
                            </div>
                            {entry.prompt ? (
                              <p className="text-xs text-ink-500 line-clamp-2">{entry.prompt}</p>
                            ) : null}
                          </div>

                          <div className="shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopy(entry.output || "")}
                              className="text-xs text-ink-500 hover:text-ink-800 px-2 py-1 rounded hover:bg-ink-100"
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-cream-300 pt-3 mt-3">
                          <p className="font-body text-ink-700 leading-relaxed whitespace-pre-wrap">{entry.output}</p>
                        </div>

                        {/* Evaluation beneath generation */}
                        <div className="mt-4 border-t border-cream-300 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-display text-sm text-ink-800 font-semibold">Evaluation</h3>
                            {analysisLoading && (
                              <span className="text-xs font-mono text-ink-500">Analyzing…</span>
                            )}
                          </div>

                          {analysisError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-3">
                              {analysisError}
                            </div>
                          )}

                          {analysis ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="border border-cream-300 rounded-lg p-3 bg-white/60">
                                  <div className="text-xs font-mono text-ink-500 uppercase tracking-wider">Professionalism</div>
                                  <div className="text-lg text-ink-800 font-semibold">{analysis.professionalism}/10</div>
                                </div>
                                <div className="border border-cream-300 rounded-lg p-3 bg-white/60">
                                  <div className="text-xs font-mono text-ink-500 uppercase tracking-wider">Clarity</div>
                                  <div className="text-lg text-ink-800 font-semibold">{analysis.clarity}/10</div>
                                </div>
                                <div className="border border-cream-300 rounded-lg p-3 bg-white/60">
                                  <div className="text-xs font-mono text-ink-500 uppercase tracking-wider">Tone</div>
                                  <div className="text-lg text-ink-800 font-semibold">{analysis.tone}</div>
                                </div>
                              </div>

                              <div className="border border-cream-300 rounded-lg p-4 bg-white/60">
                                <div className="text-xs font-mono text-ink-500 uppercase tracking-wider mb-2">
                                  Suggestions
                                </div>
                                {Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0 ? (
                                  <div className="space-y-1">
                                    {analysis.suggestions.map((s, sIdx) => (
                                      <p key={sIdx} className="text-sm text-ink-700">{s}</p>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-ink-700">No suggestions.</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => runAnalyzeForEntry(entryId, entry.output || "")}
                              disabled={analysisLoading}
                              className="btn-primary whitespace-nowrap"
                            >
                              {analysisLoading ? "Evaluating…" : "Evaluate this"}
                            </button>
                          )}
                        </div>

                        {/* Improve beneath evaluation */}
                        <div className="mt-4 border-t border-cream-300 pt-4">
                          <h3 className="font-display text-sm text-ink-800 font-semibold mb-2">Improve</h3>
                          <textarea
                            className="ruled-textarea"
                            rows={3}
                            placeholder="Tell what to improve (e.g., make it shorter, more polite, add a stronger CTA)…"
                            value={improveText}
                            onChange={(e) =>
                              setImproveTextById((prev) => ({ ...prev, [entryId]: e.target.value }))
                            }
                          />
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => handleImproveEntry(entry)}
                              disabled={improveLoading || !improveText.trim()}
                              className="btn-primary whitespace-nowrap"
                            >
                              {improveLoading ? "Improving…" : "Improve and keep in thread"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty state hint */}
        {threadEntries.length === 0 && !threadLoading && !loading && !error && (
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
