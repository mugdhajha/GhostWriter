// pages/Profile.jsx

import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const TONES = ["casual", "formal", "professional", "informal", "humorous"];

const TONE_COLORS = {
  casual: "bg-blue-50 text-blue-600 border-blue-200",
  formal: "bg-purple-50 text-purple-600 border-purple-200",
  professional: "bg-green-50 text-green-600 border-green-200",
  informal: "bg-yellow-50 text-yellow-700 border-yellow-200",
  humorous: "bg-orange-50 text-orange-600 border-orange-200",
};

const Profile = () => {
  const [samples, setSamples] = useState([]);
  const [newText, setNewText] = useState("");
  const [newTone, setNewTone] = useState("casual");
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [addingLoading, setAddingLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [addError, setAddError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSamples = useCallback(async () => {
    try {
      const res = await api.get("/samples");
      setSamples(res.data.samples);
    } catch (err) {
      setFetchError("Could not load samples. Please refresh.");
    } finally {
      setLoadingSamples(false);
    }
  }, []);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  const handleAdd = async () => {
    setAddError("");
    setSuccessMsg("");

    if (!newText.trim()) {
      setAddError("Please enter some sample text.");
      return;
    }

    if (newText.trim().length < 10) {
      setAddError("Sample must be at least 10 characters.");
      return;
    }

    setAddingLoading(true);
    try {
      await api.post("/samples/add", { text: newText.trim(), tone: newTone });
      setNewText("");
      setSuccessMsg("Sample added successfully.");
      fetchSamples();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setAddError(err.response?.data?.error || "Failed to add sample.");
    } finally {
      setAddingLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/samples/${id}`);
      setSamples((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert("Failed to delete sample. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl text-cream-100 font-semibold mb-2">
            Writing samples
          </h1>
          <p className="text-cream-200 text-sm">
            The more samples you add, the better GhostWriter++ can mimic your voice.
          </p>
        </div>

        {/* Add sample */}
        <div className="card p-6 mb-8">
          <h2 className="font-display text-lg text-ink-700 font-semibold mb-4">
            Add a new sample
          </h2>

          <div className="mb-4">
            <label className="label">Your writing</label>
            <textarea
              className="ruled-textarea"
              rows={5}
              placeholder="Paste or type something you've written — an email, a message, a post. The more natural, the better."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-ink-300">Minimum 10 characters</span>
              <span className="text-xs text-ink-300 font-mono">{newText.length} chars</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="label">Tone of this sample</label>
              <select
                className="input-field"
                value={newTone}
                onChange={(e) => setNewTone(e.target.value)}
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
                onClick={handleAdd}
                disabled={addingLoading}
                className="btn-primary whitespace-nowrap"
              >
                {addingLoading ? "Adding…" : "Add sample"}
              </button>
            </div>
          </div>

          {addError && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded">
              {addError}
            </div>
          )}

          {successMsg && (
            <div className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded">
              {successMsg}
            </div>
          )}
        </div>

        {/* Samples list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-cream-100 font-semibold">
              Your samples
            </h2>
            {samples.length > 0 && (
              <span className="text-xs font-mono text-cream-100 bg-ink-800/40 border border-ink-700/40 px-2 py-1 rounded">
                {samples.length} sample{samples.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {fetchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-4">
              {fetchError}
            </div>
          )}

          {loadingSamples ? (
            <div className="text-center py-12 text-cream-100">
              <div className="text-sm">Loading samples…</div>
            </div>
          ) : samples.length === 0 ? (
            <div className="text-center py-12 text-ink-300 card">
              <div className="text-4xl mb-3 opacity-30">📝</div>
              <p className="text-sm font-body">No samples yet.</p>
              <p className="text-xs mt-1">Add your first writing sample above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {samples.map((sample) => (
                <div key={sample._id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded border ${
                            TONE_COLORS[sample.tone] || "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {sample.tone}
                        </span>
                        <span className="text-xs text-ink-300 font-mono">
                          {new Date(sample.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-ink-600 font-body leading-relaxed line-clamp-3">
                        {sample.text}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(sample._id)}
                      disabled={deletingId === sample._id}
                      className="shrink-0 text-ink-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 disabled:opacity-40"
                      title="Delete sample"
                    >
                      {deletingId === sample._id ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
