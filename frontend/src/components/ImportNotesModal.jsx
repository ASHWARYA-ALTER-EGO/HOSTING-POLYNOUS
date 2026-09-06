import { useEffect, useState } from "react";
import { API_BASE_URL, getAuthToken } from "../config";
import "./ReportActions.css";
import "./ImportNotesModal.css";

/*
 * ImportNotesModal - paste a ChatGPT/NotebookLM/plain-text export, extract
 * capitalised topic phrases server-side, seed the caller's KG and save a
 * research entry. No LLM key needed: this is the wedge that steals users from
 * other tools, so it must work even without credentials.
 */

const PRESETS = [
  { key: "chatgpt", label: "ChatGPT export", hint: "Copy any conversation." },
  { key: "notebooklm", label: "NotebookLM", hint: "Paste an audio-overview transcript or notes." },
  { key: "notes", label: "Plain notes", hint: "Meeting notes, article, anything." },
];

export default function ImportNotesModal({ open, onClose, onImported }) {
  const [source, setSource] = useState("chatgpt");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(null);

  useEffect(() => {
    if (!open) return;
    setErr(""); setOk(null);
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const run = async () => {
    if (text.trim().length < 40) { setErr("Paste at least a paragraph."); return; }
    setBusy(true); setErr(""); setOk(null);
    try {
      const tok = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/import/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(tok ? { Authorization: "Bearer " + tok } : {}) },
        body: JSON.stringify({ text, source, title: title.trim() || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || (res.status === 401 ? "Sign in to import into your graph." : "Import failed."));
      }
      const j = await res.json();
      setOk(j);
      if (typeof onImported === "function") onImported(j);
    } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };

  return (
    <div className="ra-back" onClick={onClose}>
      <div className="ra-modal ra-tone-chain" onClick={(e) => e.stopPropagation()}>
        <div className="ra-head">
          <div>
            <div className="ra-title">Import into your graph</div>
            <div className="ra-sub">Paste anything - a ChatGPT chat, NotebookLM notes, plain text. We'll extract concepts and add them to your graph.</div>
          </div>
          <button className="ra-x" onClick={onClose}>&times;</button>
        </div>
        <div className="ra-body">
          <div className="inm-tabs">
            {PRESETS.map((p) => (
              <button key={p.key}
                className={"inm-tab" + (source === p.key ? " on" : "")}
                onClick={() => setSource(p.key)}>
                <span>{p.label}</span>
                <small>{p.hint}</small>
              </button>
            ))}
          </div>
          <input className="inm-title" placeholder="Give this a title (optional)"
                 value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="ra-textarea inm-textarea" rows={11}
                    placeholder={source === "chatgpt" ? "Paste the ChatGPT conversation..." : source === "notebooklm" ? "Paste NotebookLM notes or transcript..." : "Paste your notes..."}
                    value={text} onChange={(e) => setText(e.target.value)} />
          <div className="inm-meta">{text.length.toLocaleString()} chars &middot; max ~200KB</div>
          {err && <div className="ra-err">{err}</div>}
          {ok && (
            <div className="ra-out ra-fade inm-ok">
              <div className="ra-lead">
                <span className="ra-kicker">Imported</span>
                <div className="ra-lead-text">{ok.message}</div>
              </div>
              <div className="inm-topics">
                {(ok.topics || []).map((t) => <span key={t} className="inm-chip">{t}</span>)}
              </div>
              <p className="ra-hint">Head over to <a href="/graph">your knowledge graph</a> to see them wired up.</p>
            </div>
          )}
          <div className="inm-actions">
            <button className="ra-btn" onClick={onClose}>Close</button>
            <button className="ra-btn ra-btn-primary" disabled={busy || text.trim().length < 40}
                    onClick={run}>
              {busy ? "Importing..." : ok ? "Import more" : "Extract concepts &rarr;"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
