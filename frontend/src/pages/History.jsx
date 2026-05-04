import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../services/api";

const History = () => {
  const navigate = useNavigate();

  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftsError, setDraftsError] = useState("");
  const [openThreadId, setOpenThreadId] = useState(null);

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

  const threads = useMemo(() => {
    const byThread = new Map();
    for (const entry of draftItems) {
      const key = entry.threadId || entry._id;
      const list = byThread.get(key) || [];
      list.push(entry);
      byThread.set(key, list);
    }

    const threadItems = Array.from(byThread.entries()).map(([key, entries]) => {
      const sorted = [...entries].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
      const last = sorted[sorted.length - 1];
      return { threadId: key, entries: sorted, last };
    });

    return threadItems.sort((a, b) => (b.last?.createdAt || "").localeCompare(a.last?.createdAt || ""));
  }, [draftItems]);

  const handleDeleteDraft = async (id) => {
    setDraftsError("");
    try {
      await api.delete(`/history/${id}`);
      setDrafts((prev) => prev.filter((d) => d._id !== id));
      // if a thread becomes empty, UI will naturally collapse
    } catch (err) {
      setDraftsError(err.response?.data?.error || "Could not delete draft.");
    }
  };

  const handleContinue = (threadId, draft) => {
    navigate("/dashboard", {
      state: {
        threadId,
        parentEntryId: draft?._id || "",
        seedText: draft?.output || "",
        tone: draft?.tone || "casual",
        contentType: draft?.contentType || "message",
      },
    });
  };

  return (
    <div className="min-h-screen">
      <main className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-display text-lg text-ink-800 font-semibold">History</h1>
              <span className="text-xs font-mono text-ink-500">
                {threads.length} thread{threads.length === 1 ? "" : "s"}
              </span>
            </div>

            {draftsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-4">
                {draftsError}
              </div>
            )}

            {draftsLoading ? (
              <p className="text-sm text-ink-600">Loading drafts…</p>
            ) : threads.length === 0 ? (
              <p className="text-sm text-ink-600">No drafts yet.</p>
            ) : (
              <motion.div className="space-y-3" layout>
                {threads.map((t) => {
                  const isOpen = openThreadId === t.threadId;
                  const last = t.last;
                  return (
                    <motion.div
                      key={t.threadId}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="border border-cream-300 rounded-lg bg-cream-50/70"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenThreadId(isOpen ? null : t.threadId)}
                        className="w-full text-left p-4 flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-ink-500">
                              {last?.createdAt ? new Date(last.createdAt).toLocaleString() : ""}
                            </span>
                            <span className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded font-medium">
                              {last?.tone}
                            </span>
                            <span className="text-xs text-ink-500 font-mono">{last?.contentType}</span>
                            <span className="text-xs font-mono text-ink-400">{t.entries.length} entr{t.entries.length === 1 ? "y" : "ies"}</span>
                          </div>
                          <p className="text-sm text-ink-700 font-body leading-relaxed line-clamp-2">{last?.prompt}</p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <motion.button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContinue(t.threadId, last);
                            }}
                            className="text-xs text-ink-600 hover:text-ink-900 px-2 py-1 rounded hover:bg-ink-100"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Continue
                          </motion.button>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="px-4 pb-4 overflow-hidden"
                          >
                            <div className="border-t border-cream-300 pt-3 space-y-3">
                              {t.entries.map((d) => (
                                <motion.div
                                  key={d._id}
                                  layout
                                  className="border border-cream-300 rounded-lg p-3 bg-white/60"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-xs font-mono text-ink-500 mb-1">
                                        {d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}
                                      </div>
                                      <div className="text-xs font-mono uppercase tracking-wider text-ink-500 mb-1">Prompt</div>
                                      <p className="text-sm text-ink-700 whitespace-pre-wrap mb-2">{d.prompt}</p>
                                      <div className="text-xs font-mono uppercase tracking-wider text-ink-500 mb-1">Output</div>
                                      <p className="text-sm text-ink-700 whitespace-pre-wrap">{d.output}</p>
                                    </div>

                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                      <motion.button
                                        type="button"
                                        onClick={() => handleContinue(t.threadId, d)}
                                        className="text-xs text-ink-600 hover:text-ink-900 px-2 py-1 rounded hover:bg-ink-100"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        Continue
                                      </motion.button>
                                      <motion.button
                                        type="button"
                                        onClick={() => handleDeleteDraft(d._id)}
                                        className="text-xs text-ink-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        Delete
                                      </motion.button>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default History;
