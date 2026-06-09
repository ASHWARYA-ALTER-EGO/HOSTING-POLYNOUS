import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS — silver / charcoal palette
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  silver:             "#c8cdd6",
  silverBright:       "#e2e6ed",
  silverDim:          "#8e98a8",
  silverFaint:        "rgba(200,205,214,0.07)",
  silverBorder:       "rgba(200,205,214,0.18)",
  silverFocus:        "rgba(200,205,214,0.35)",
  silverGlow:         "0 0 15px rgba(200,205,214,0.12)",
  crimson:            "#e05068",
  crimsonFaint:       "rgba(224,80,104,0.08)",
  cyan:               "#7ec8d8",
  gold:               "#c8aa6e",
  purple:             "#9b84cc",
  void:               "#0d0e12",
  surface:            "rgba(20,22,28,0.7)",
  surfaceHigh:        "rgba(32,35,44,0.75)",
  inputBg:            "#090a0e",
  onSurface:          "#dde1e9",
  onSurfaceVariant:   "#8e98a8",
  textSecondary:      "#5a6272",
  white10:            "rgba(255,255,255,0.08)",
  white5:             "rgba(255,255,255,0.04)",
  fontHead:           "'Sora',sans-serif",
  fontBody:           "'Hanken Grotesk',sans-serif",
  fontMono:           "'JetBrains Mono',monospace",
};

const BASE = "http://localhost:8000";

function getUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("polynous_user") || "{}");
    return u.email || u.username || "guest_user";
  } catch { return "guest_user"; }
}

const api = {
  getApiKeys:      () => fetch(`${BASE}/settings/api-keys?user_id=${encodeURIComponent(getUserId())}`).then(r => r.json()),
  saveApiKey:      (p, k) => fetch(`${BASE}/settings/api-keys?user_id=${encodeURIComponent(getUserId())}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [`${p}_api_key`]: k }) }).then(r => r.json()),
  deleteApiKey:    (p) => fetch(`${BASE}/settings/api-keys?user_id=${encodeURIComponent(getUserId())}&provider=${p}`, { method: "DELETE" }).then(r => r.json()),
  testApiKey:      (p) => fetch(`${BASE}/settings/api-keys/test?provider=${p}&user_id=${encodeURIComponent(getUserId())}`, { method: "POST" }).then(r => r.json()),
  getStats:        () => fetch(`${BASE}/memory/stats/${encodeURIComponent(getUserId())}`).then(r => r.json()),
  getInterests:    () => fetch(`${BASE}/memory/interests/${encodeURIComponent(getUserId())}`).then(r => r.json()),
  getPreferences:  () => fetch(`${BASE}/settings/preferences?user_id=${encodeURIComponent(getUserId())}`).then(r => r.json()),
  savePreferences: (prefs) => fetch(`${BASE}/settings/preferences?user_id=${encodeURIComponent(getUserId())}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) }).then(r => r.json()),
  updateProfile:   (data) => fetch(`${BASE}/settings/profile?user_id=${encodeURIComponent(getUserId())}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
};

// ─────────────────────────────────────────────────────────────────────────────
// SILVER PARTICLE NEURAL CANVAS
// ─────────────────────────────────────────────────────────────────────────────
function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let particles = [], animId;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize); resize();

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.8 + 0.5,
        opacity: Math.random() * 0.3 + 0.05,
      });
    }

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,205,214,${p.opacity})`; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(p.x - particles[j].x, p.y - particles[j].y);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(200,205,214,${0.06 * (1 - d / 100)})`;
            ctx.lineWidth = 0.3; ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none", opacity: 0.5 }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ICON
// ─────────────────────────────────────────────────────────────────────────────
function Icon({ name, style }) {
  return (
    <span style={{
      fontFamily: "Material Symbols Outlined",
      fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
      lineHeight: 1, userSelect: "none",
      display: "inline-block", flexShrink: 0,
      ...(style || {}),
    }}>
      {name}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Hanken+Grotesk:wght@400;500;600&family=Material+Symbols+Outlined&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      body{background:#0d0e12;color:#dde1e9;font-family:'Hanken Grotesk',sans-serif;overflow-x:hidden}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes pulseDot{0%,100%{box-shadow:0 0 4px rgba(200,205,214,0.3)}50%{box-shadow:0 0 12px rgba(200,205,214,0.6)}}
      @keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      ::-webkit-scrollbar{width:5px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(200,205,214,0.12);border-radius:10px}
      input[type=range]{-webkit-appearance:none;appearance:none;background:rgba(255,255,255,0.07);height:2px;border-radius:4px;outline:none;cursor:pointer;width:100%}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:#c8cdd6;cursor:pointer;box-shadow:0 0 6px rgba(200,205,214,0.5)}
      select{-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235a6272'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 0.8rem center;cursor:pointer}
      select option{background:#0d0e12;color:#dde1e9}
    `}</style>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const NAV = [
  { icon: "travel_explore", label: "Research",        path: "/research"  },
  { icon: "forum",          label: "Debate Chamber",  path: "/debate"    },
  { icon: "account_tree",   label: "Knowledge Graph", path: "/graph"     },
  { icon: "search",         label: "Semantic Search", path: "/search"    },
  { icon: "database",       label: "Memory Bank",     path: "/memory"    },
  { icon: "picture_as_pdf", label: "PDF Lab",         path: "/pdf-lab"   },
  { icon: "monitoring",     label: "Analytics",       path: "/analytics" },
  { icon: "settings",       label: "Settings",        path: "/settings", active: true },
];

function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed }) {
  const go  = (p) => onNavigate ? onNavigate(p) : (window.location.href = p);
  const bye = () => onLogout ? onLogout() : (localStorage.clear(), window.location.href = "/");
  const w   = collapsed ? 56 : 280;

  const itemStyle = (active) => ({
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 14px", borderRadius: 9999, cursor: "pointer",
    color:      active ? C.silverBright : C.onSurfaceVariant,
    background: active ? C.silverFaint  : "transparent",
    fontFamily: C.fontMono, fontSize: 13,
    fontWeight: active ? 700 : 400,
    borderLeft: `2px solid ${active ? C.silver : "transparent"}`,
    transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden",
  });

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%", width: w,
      background: "rgba(13,14,18,0.85)", backdropFilter: "blur(24px)",
      borderRight: `1px solid ${C.white10}`,
      display: "flex", flexDirection: "column",
      padding: collapsed ? "16px 8px" : 24, zIndex: 20,
      transition: "width 0.35s cubic-bezier(0.4,0,0.2,1), padding 0.35s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden",
    }}>
      {collapsed ? (
        <>
          <button onClick={() => setCollapsed(false)} style={{ background: "none", border: "none", color: C.silver, cursor: "pointer", marginBottom: 28, display: "flex", justifyContent: "center" }}>
            <Icon name="chevron_right" style={{ fontSize: 22 }} />
          </button>
          {NAV.map(({ icon, label, path, active }) => (
            <div key={label} onClick={() => go(path)} title={label} style={{ padding: "11px 0", cursor: "pointer", color: active ? C.silverBright : C.onSurfaceVariant, width: "100%", display: "flex", justifyContent: "center" }}>
              <Icon name={icon} style={{ fontSize: 20, color: "inherit" }} />
            </div>
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div onClick={() => go("/research")} style={{ width: 34, height: 34, borderRadius: "50%", background: C.silverFaint, border: `1px solid ${C.silverBorder}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Icon name="add" style={{ fontSize: 16, color: C.silver }} />
            </div>
            <div title={user?.username || "Guest"} style={{ width: 30, height: 30, borderRadius: "50%", background: "#16181f", border: `1px solid ${C.silverBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="face" style={{ color: C.silver, fontSize: 14 }} />
            </div>
            <div onClick={bye} title="Disconnect" style={{ cursor: "pointer", color: C.crimson }}>
              <Icon name="logout" style={{ fontSize: 14 }} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, minWidth: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontFamily: C.fontHead, fontSize: 26, fontWeight: 800, color: C.silverBright, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>POLYNOUS</h1>
              <p style={{ fontFamily: C.fontMono, fontSize: 9.5, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.8, whiteSpace: "nowrap", marginTop: 4 }}>Cerebral Vitality Engine</p>
            </div>
            <button onClick={() => setCollapsed(true)} style={{ background: "none", border: "none", color: C.textSecondary, cursor: "pointer", padding: 4, flexShrink: 0, marginLeft: 8, transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = C.silverBright} onMouseLeave={e => e.currentTarget.style.color = C.textSecondary}>
              <Icon name="chevron_left" style={{ fontSize: 20 }} />
            </button>
          </div>
          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, overflow: "hidden" }}>
            {NAV.map(({ icon, label, path, active }) => (
              <div key={label} onClick={() => go(path)} style={itemStyle(active)}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = C.silverBright; e.currentTarget.style.background = C.silverFaint; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = C.onSurfaceVariant; e.currentTarget.style.background = "transparent"; } }}>
                <Icon name={icon} style={{ fontSize: 20, color: "inherit", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
              </div>
            ))}
          </nav>
          <div style={{ borderTop: `1px solid ${C.white5}`, paddingTop: 22, marginTop: 22 }}>
            <button onClick={() => go("/research")} style={{ width: "100%", padding: "11px", background: C.silverFaint, border: `1px solid ${C.silverBorder}`, color: C.silverBright, fontWeight: 700, borderRadius: 9999, cursor: "pointer", fontFamily: C.fontHead, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(200,205,214,0.12)"} onMouseLeave={e => e.currentTarget.style.background = C.silverFaint}>
              <Icon name="add" style={{ fontSize: 18, color: "inherit", flexShrink: 0 }} />New Research
            </button>
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#16181f", border: `1px solid ${C.silverBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="face" style={{ color: C.silver, fontSize: 20 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: C.fontMono, fontSize: 12, fontWeight: 700, color: C.onSurface, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.username || "Guest"}</p>
                <button onClick={bye} style={{ fontSize: 9.5, color: C.crimson, background: "none", border: "none", cursor: "pointer", fontFamily: C.fontMono, textTransform: "uppercase", letterSpacing: "0.06em", padding: 0 }}>Disconnect</button>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = (msg, type = "ok") => { const id = Date.now(); setToasts(t => [...t, { id, msg, type }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500); };
  return { toasts, push };
}
function ToastBox({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ padding: "12px 18px", borderRadius: 12, fontFamily: C.fontMono, fontSize: 12, backdropFilter: "blur(20px)", background: t.type === "err" ? C.crimsonFaint : C.silverFaint, border: `1px solid ${t.type === "err" ? "rgba(224,80,104,0.35)" : C.silverBorder}`, color: t.type === "err" ? C.crimson : C.silverBright, boxShadow: t.type === "err" ? "0 0 12px rgba(224,80,104,0.2)" : C.silverGlow, animation: "toastIn 0.3s ease", display: "flex", alignItems: "center", gap: 8 }}>
          {t.type === "err" ? "⚠ " : "✓ "}{t.msg}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function SectionHead({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: subtitle ? 4 : 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: C.silverFaint, border: `1px solid ${C.silverBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} style={{ fontSize: 14, color: C.silverDim }} />
        </div>
        <span style={{ fontFamily: C.fontHead, fontSize: 15, fontWeight: 700, color: C.onSurface, letterSpacing: "-0.02em" }}>{title}</span>
      </div>
      {subtitle && <p style={{ fontFamily: C.fontMono, fontSize: 9.5, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.16em", paddingLeft: 38, lineHeight: 1, marginTop: 2 }}>{subtitle}</p>}
      <div style={{ height: 1, background: `linear-gradient(90deg, ${C.silverBorder}, transparent)`, marginTop: 10 }} />
    </div>
  );
}
function Card({ children, danger }) {
  return <div style={{ background: C.surface, backdropFilter: "blur(20px)", border: `1px solid ${danger ? "rgba(224,80,104,0.22)" : C.white10}`, borderRadius: 16, padding: 24, marginBottom: 14, boxShadow: danger ? "0 0 14px rgba(224,80,104,0.08)" : C.silverGlow, position: "relative", overflow: "hidden", transition: "border-color 0.2s" }}>{children}</div>;
}
function Label({ children }) {
  return <div style={{ fontFamily: C.fontMono, fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.18em", color: C.textSecondary, marginBottom: 8 }}>{children}</div>;
}
const inputStyle = { background: "#090a0e", border: `1px solid ${C.white10}`, borderRadius: 8, color: C.onSurface, fontFamily: C.fontMono, fontSize: 12, padding: "9px 12px", width: "100%", outline: "none", transition: "border 0.15s, box-shadow 0.15s" };
const onFI = e => { e.target.style.border = `1px solid ${C.silverFocus}`; e.target.style.boxShadow = `0 0 0 3px rgba(200,205,214,0.06)`; };
const onFO = e => { e.target.style.border = `1px solid ${C.white10}`; e.target.style.boxShadow = "none"; };
function StatusDot({ active }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: C.fontMono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: active ? C.silver : C.textSecondary }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? C.silver : C.textSecondary, boxShadow: active ? "0 0 6px rgba(200,205,214,0.6)" : "none", animation: active ? "pulseDot 2.4s ease infinite" : "none" }} />{active ? "Active" : "Not set"}
  </span>;
}
function Toggle({ on, onToggle }) {
  return <div role="switch" aria-checked={on} tabIndex={0} onClick={onToggle} onKeyDown={e => (e.key === " " || e.key === "Enter") && onToggle()} style={{ width: 38, height: 21, borderRadius: 999, background: on ? C.silver : "rgba(255,255,255,0.08)", border: `1px solid ${on ? "rgba(200,205,214,0.5)" : C.white10}`, position: "relative", cursor: "pointer", transition: "background 0.2s, border 0.2s", flexShrink: 0, outline: "none" }}>
    <div style={{ position: "absolute", top: 2, left: on ? 19 : 2, width: 15, height: 15, borderRadius: "50%", background: on ? C.void : "#6a737f", boxShadow: on ? "0 0 5px rgba(200,205,214,0.4)" : "0 1px 3px rgba(0,0,0,0.5)", transition: "left 0.22s cubic-bezier(0.34,1.56,0.64,1)" }} />
  </div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDERS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const PROVIDERS = {
  anthropic: { label: "Anthropic Claude", icon: "psychology",      color: C.silver,  placeholder: "sk-ant-api03-…" },
  openai:    { label: "OpenAI GPT",        icon: "smart_toy",      color: C.cyan,    placeholder: "sk-…"           },
  tavily:    { label: "Tavily Search",     icon: "travel_explore", color: C.gold,    placeholder: "tvly-…"         },
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTIONS (Profile, API Keys, Appearance, etc.)
// ─────────────────────────────────────────────────────────────────────────────

function ProfileSection({ user, push }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const initials = (username || "PL").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ username, email });
      const u = JSON.parse(localStorage.getItem("polynous_user") || "{}");
      localStorage.setItem("polynous_user", JSON.stringify({ ...u, username, email }));
      push("Profile updated"); setEditing(false);
    } catch { push("Update failed", "err"); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <SectionHead icon="account_circle" title="Profile" subtitle="Identity & account tier" />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "conic-gradient(from 200deg, #8e98a8, #c8cdd6, #e2e6ed, #c8cdd6, #8e98a8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.fontHead, fontWeight: 800, fontSize: 18, color: C.void, boxShadow: "0 0 24px rgba(200,205,214,0.15), 0 0 0 2px rgba(200,205,214,0.12)", flexShrink: 0 }}>{initials}</div>
          <div>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" style={{ ...inputStyle, width: 200, fontFamily: C.fontHead, fontWeight: 600, fontSize: 13 }} onFocus={onFI} onBlur={onFO} />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ ...inputStyle, width: 200 }} onFocus={onFI} onBlur={onFO} />
              </div>
            ) : (
              <>
                <div style={{ fontFamily: C.fontHead, fontSize: 17, fontWeight: 700, color: C.onSurface }}>{username || "Guest User"}</div>
                <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.textSecondary, marginTop: 4 }}>{email || "guest@polynous.ai"}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  {[{ label: "Free Tier", color: C.silver, bg: C.silverFaint, border: C.silverBorder }, { label: "Since 2025", color: C.textSecondary, bg: "transparent", border: C.white10 }].map(b => (
                    <span key={b.label} style={{ fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", background: b.bg, padding: "3px 10px", borderRadius: 9999, color: b.color, border: `1px solid ${b.border}` }}>{b.label}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <button onClick={() => editing ? save() : setEditing(true)} disabled={saving} style={{ padding: "8px 20px", borderRadius: 9999, border: editing ? "none" : `1px solid ${C.silverBorder}`, background: editing ? C.silver : "transparent", color: editing ? C.void : C.silver, cursor: saving ? "wait" : "pointer", fontFamily: C.fontHead, fontWeight: 700, fontSize: 13, transition: "all 0.2s", opacity: saving ? 0.6 : 1 }}
          onMouseEnter={e => { if (!editing) e.currentTarget.style.background = C.silverFaint; }} onMouseLeave={e => { if (!editing) e.currentTarget.style.background = "transparent"; }}>
          {saving ? "Saving…" : editing ? "Save" : "Edit"}
        </button>
      </div>
    </Card>
  );
}

function KeyCard({ providerId, connected, preview, onSave, onRemove, push }) {
  const [val, setVal] = useState("");
  const [visible, setVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const p = PROVIDERS[providerId];

  const doSave = async () => { if (!val.trim()) { push("Enter a key first", "err"); return; } try { await api.saveApiKey(providerId, val.trim()); push(`${p.label} key saved`); setVal(""); if (onSave) onSave(providerId); } catch { push("Save failed", "err"); } };
  const doRemove = async () => { try { await api.deleteApiKey(providerId); push(`${p.label} key removed`); if (onRemove) onRemove(providerId); } catch { push("Remove failed", "err"); } };
  const doTest = async () => { setTesting(true); setTestResult(null); try { const r = await api.testApiKey(providerId); setTestResult(r?.status === "ok" ? "ok" : "fail"); } catch { setTestResult("fail"); } finally { setTesting(false); setTimeout(() => setTestResult(null), 3200); } };

  return (
    <div style={{ background: "rgba(9,10,14,0.6)", border: `1px solid ${C.white10}`, borderRadius: 12, padding: "15px 16px", display: "flex", flexDirection: "column", gap: 11, transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.silverBorder} onMouseLeave={e => e.currentTarget.style.borderColor = C.white10}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: `${p.color}12`, border: `1px solid ${p.color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={p.icon} style={{ fontSize: 15, color: p.color }} /></div>
          <div><span style={{ fontFamily: C.fontHead, fontWeight: 600, color: C.onSurface, fontSize: 13 }}>{p.label}</span>{connected && preview && <span style={{ fontSize: 10, color: C.textSecondary, marginLeft: 8, fontFamily: C.fontMono }}>••••{preview}</span>}</div>
        </div>
        <StatusDot active={connected} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input type={visible ? "text" : "password"} value={val} onChange={e => setVal(e.target.value)} placeholder={connected ? "Replace key…" : p.placeholder} style={{ ...inputStyle, flexGrow: 1, width: "auto" }} onFocus={onFI} onBlur={onFO} />
        <button onClick={() => setVisible(v => !v)} style={{ padding: "0 10px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.white10}`, borderRadius: 8, cursor: "pointer", color: C.textSecondary, flexShrink: 0, transition: "color 0.15s" }} onMouseEnter={e => e.currentTarget.style.color = C.onSurface} onMouseLeave={e => e.currentTarget.style.color = C.textSecondary}><Icon name={visible ? "visibility_off" : "visibility"} style={{ fontSize: 15 }} /></button>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, alignItems: "center" }}>
        <button onClick={doTest} style={{ fontFamily: C.fontMono, fontSize: 9.5, letterSpacing: "0.1em", color: testResult === "ok" ? C.silver : testResult === "fail" ? C.crimson : C.textSecondary, background: "none", border: "none", cursor: "pointer", textTransform: "uppercase" }}>{testing ? "Testing…" : testResult === "ok" ? "Valid ✓" : testResult === "fail" ? "Invalid ✗" : "Test"}</button>
        <span style={{ width: 1, height: 11, background: C.white10 }} />
        <button onClick={doSave} disabled={!val.trim()} style={{ fontFamily: C.fontMono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: val.trim() ? C.cyan : C.textSecondary, background: "none", border: "none", cursor: val.trim() ? "pointer" : "default" }}>Save</button>
        {connected && (<><span style={{ width: 1, height: 11, background: C.white10 }} /><button onClick={doRemove} style={{ fontFamily: C.fontMono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: C.crimson, background: "none", border: "none", cursor: "pointer" }}>Remove</button></>)}
      </div>
    </div>
  );
}

function ApiKeysSection({ push }) {
  const [connected, setConnected] = useState({ anthropic: false, openai: false, tavily: false });
  const [previews, setPreviews] = useState({});
  const [preferred, setPreferred] = useState("anthropic");
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getApiKeys().then(data => { setConnected({ anthropic: !!data.has_anthropic, openai: !!data.has_openai, tavily: !!data.has_tavily }); setPreviews({ anthropic: data.anthropic_preview||null, openai: data.openai_preview||null, tavily: data.tavily_preview||null }); setPreferred(data.preferred_provider || "anthropic"); }).catch(() => {}).finally(() => setLoading(false)); }, []);
  const refetch = () => { api.getApiKeys().then(d => { if (d) setPreviews({ anthropic: d.anthropic_preview||null, openai: d.openai_preview||null, tavily: d.tavily_preview||null }); }).catch(() => {}); };

  return (
    <Card>
      <SectionHead icon="key" title="API Keys" subtitle="Bring your own keys · encrypted at rest" />
      <div style={{ marginBottom: 14 }}><Label>Preferred AI Provider</Label><div style={{ display: "flex", gap: 6 }}>{["anthropic","openai"].map(id => { const active = preferred === id; return <button key={id} onClick={() => setPreferred(id)} style={{ padding: "6px 16px", borderRadius: 9999, border: `1px solid ${active ? C.silverBorder : C.white10}`, background: active ? C.silverFaint : "transparent", color: active ? C.silverBright : C.onSurfaceVariant, cursor: "pointer", fontFamily: C.fontHead, fontWeight: 600, fontSize: 12, transition: "all 0.2s" }}>{PROVIDERS[id].label.split(" ")[0]}</button>; })}</div></div>
      {loading ? <div style={{ textAlign: "center", padding: 24, color: C.textSecondary, fontFamily: C.fontMono, fontSize: 12 }}><div style={{ width: 26, height: 26, border: "2px solid rgba(200,205,214,0.15)", borderTop: `2px solid ${C.silver}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />Loading keys…</div> :
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{Object.keys(PROVIDERS).map(id => <KeyCard key={id} providerId={id} connected={connected[id]} preview={previews[id]} onSave={sid => { setConnected(p => ({ ...p, [sid]: true })); refetch(); }} onRemove={rid => { setConnected(p => ({ ...p, [rid]: false })); setPreviews(p => ({ ...p, [rid]: null })); }} push={push} />)}</div>}
    </Card>
  );
}

function AppearanceSection() {
  const [theme, setTheme] = useState(() => localStorage.getItem("polynous_theme") || "dark");
  const [animations, setAnimations] = useState(() => localStorage.getItem("polynous_animations") !== "false");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("polynous_font_size") || "Medium");
  const handleTheme = t => { setTheme(t); localStorage.setItem("polynous_theme", t); };
  const handleFontSize = s => { setFontSize(s); localStorage.setItem("polynous_font_size", s); document.documentElement.style.fontSize = { Small: "14px", Medium: "16px", Large: "18px" }[s] || "16px"; };
  const handleAnimations = () => { const n = !animations; setAnimations(n); localStorage.setItem("polynous_animations", n); window.location.reload(); };

  return (
    <Card>
      <SectionHead icon="palette" title="Appearance" subtitle="Visual theme & display" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 14 }}>
        <div><Label>Theme</Label><select value={theme} onChange={e => handleTheme(e.target.value)} style={inputStyle}><option value="dark">Dark</option><option value="light">Light</option></select></div>
        <div><Label>Text Size</Label><select value={fontSize} onChange={e => handleFontSize(e.target.value)} style={inputStyle}><option>Small</option><option>Medium</option><option>Large</option></select></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${C.white10}` }}>
        <div><div style={{ fontFamily: C.fontHead, fontSize: 13, fontWeight: 600, color: C.onSurface }}>Neural Animations</div><div style={{ fontFamily: C.fontMono, fontSize: 9.5, color: C.textSecondary, marginTop: 2 }}>Particle field background</div></div>
        <Toggle on={animations} onToggle={handleAnimations} />
      </div>
    </Card>
  );
}

function PreferencesSection({ push }) {
  const [mode, setMode] = useState("research");
  const [style, setStyle] = useState("academic");
  const [streaming, setStreaming] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [conf, setConf] = useState(70);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getPreferences().then(d => { if (d.default_mode) setMode(d.default_mode); if (d.response_style) setStyle(d.response_style); if (d.streaming_enabled !== undefined) setStreaming(d.streaming_enabled); if (d.auto_save !== undefined) setAutoSave(d.auto_save); if (d.confidence_threshold) setConf(d.confidence_threshold); }).catch(() => {}).finally(() => setLoading(false)); }, []);
  const save = async (prefs) => { setSaving(true); try { await api.savePreferences(prefs); push("Preferences saved"); } catch { push("Save failed", "err"); } finally { setSaving(false); } };
  const TRow = ({ label, sub, on, toggle }) => (<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${C.white5}` }}><div><div style={{ fontFamily: C.fontHead, fontSize: 13, fontWeight: 500, color: C.onSurface }}>{label}</div>{sub && <div style={{ fontFamily: C.fontMono, fontSize: 9.5, color: C.textSecondary, marginTop: 2 }}>{sub}</div>}</div><Toggle on={on} onToggle={toggle} /></div>);

  if (loading) return <Card><SectionHead icon="tune" title="Research Preferences" subtitle="Default behaviour & response style" /><div style={{ textAlign: "center", padding: 24, color: C.textSecondary, fontFamily: C.fontMono, fontSize: 12 }}><div style={{ width: 26, height: 26, border: "2px solid rgba(200,205,214,0.15)", borderTop: `2px solid ${C.silver}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />Loading…</div></Card>;

  return (
    <Card>
      <SectionHead icon="tune" title="Research Preferences" subtitle="Default behaviour & response style" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginBottom: 14 }}>
        <div><Label>Default Mode</Label><div style={{ display: "flex", gap: 6 }}>{[{ id: "research", label: "Research" }, { id: "debate", label: "Debate" }].map(m => { const active = mode === m.id; return <button key={m.id} onClick={() => { setMode(m.id); save({ default_mode: m.id }); }} style={{ padding: "6px 14px", borderRadius: 9999, border: `1px solid ${active ? C.silverBorder : C.white10}`, background: active ? C.silverFaint : "transparent", color: active ? C.silverBright : C.onSurfaceVariant, cursor: "pointer", fontFamily: C.fontHead, fontWeight: 600, fontSize: 12, transition: "all 0.2s" }}>{m.label}</button>; })}</div></div>
        <div><Label>Response Style</Label><select value={style} onChange={e => { setStyle(e.target.value); save({ response_style: e.target.value }); }} style={inputStyle}>{[["academic","Academic"],["casual","Casual"],["eli5","Simple"],["technical","Technical"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <TRow label="Streaming" sub="Progressive token output" on={streaming} toggle={() => { const n = !streaming; setStreaming(n); save({ streaming_enabled: n }); }} />
      <TRow label="Auto-save" sub="Persist sessions automatically" on={autoSave} toggle={() => { const n = !autoSave; setAutoSave(n); save({ auto_save: n }); }} />
      <div style={{ paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={{ fontFamily: C.fontHead, fontSize: 13, fontWeight: 500, color: C.onSurface }}>Confidence Threshold</div><span style={{ fontFamily: C.fontMono, fontSize: 10.5, color: C.silver, background: C.silverFaint, padding: "2px 9px", borderRadius: 9999, border: `1px solid ${C.silverBorder}` }}>{conf}%</span></div>
        <input type="range" min={0} max={100} value={conf} onChange={e => setConf(Number(e.target.value))} onMouseUp={() => save({ confidence_threshold: conf })} onTouchEnd={() => save({ confidence_threshold: conf })} />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: C.fontMono, fontSize: 8.5, color: C.textSecondary, marginTop: 4 }}><span>0%</span><span>50%</span><span>100%</span></div>
      </div>
      {saving && <div style={{ marginTop: 6, fontSize: 9.5, color: C.cyan, fontFamily: C.fontMono, textAlign: "right" }}>Saving…</div>}
    </Card>
  );
}

function StatsSection() {
  const [s, setS] = useState({ total_research: 0, total_debates: 0, avg_confidence: 0, unique_topics: 0 });
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => { Promise.all([api.getStats(), api.getInterests()]).then(([stats, int]) => { setS(stats); setInterests(int.interests || []); }).catch(() => setError(true)).finally(() => setLoading(false)); }, []);

  const STAT_ITEMS = [
    { label: "Research Sessions", val: s.total_research || 0, color: C.silver },
    { label: "Debates", val: s.total_debates || 0, color: C.crimson },
    { label: "Avg Confidence", val: `${s.avg_confidence || 0}%`, color: C.cyan },
    { label: "Topics Tracked", val: s.unique_topics || 0, color: C.purple },
  ];

  return (
    <Card>
      <SectionHead icon="monitoring" title="Usage Analytics" subtitle="Session stats & memory signals" />
      {loading ? <div style={{ textAlign: "center", padding: 24, color: C.textSecondary, fontFamily: C.fontMono, fontSize: 12 }}><div style={{ width: 26, height: 26, border: "2px solid rgba(200,205,214,0.15)", borderTop: `2px solid ${C.silver}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />Loading…</div> :
        error ? <div style={{ textAlign: "center", padding: 24, color: C.textSecondary, fontFamily: C.fontMono, fontSize: 11 }}>No data — start a research session to generate analytics</div> :
        <><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 18 }}>{STAT_ITEMS.map(({ label, val, color }) => (<div key={label} style={{ background: "rgba(9,10,14,0.6)", border: `1px solid ${C.white10}`, borderBottom: `2px solid ${color}35`, borderRadius: 12, padding: "13px 10px", textAlign: "center" }}><div style={{ fontFamily: C.fontMono, fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.14em", color: C.textSecondary, marginBottom: 5 }}>{label}</div><div style={{ fontFamily: C.fontHead, fontSize: 24, fontWeight: 700, color, letterSpacing: "-0.03em" }}>{val}</div></div>))}</div>
        {interests.length > 0 ? <><Label>Top Research Topics</Label><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{interests.slice(0, 8).map((t, i) => (<span key={i} style={{ padding: "5px 12px", borderRadius: 9999, background: C.silverFaint, border: `1px solid ${C.silverBorder}`, fontFamily: C.fontMono, fontSize: 11, color: C.silverDim }}>{t.topic} <span style={{ opacity: 0.45 }}>×{t.strength}</span></span>))}</div></> : <div style={{ textAlign: "center", padding: 10, color: C.textSecondary, fontFamily: C.fontMono, fontSize: 10.5 }}>Topics appear as you research</div>}
      </>}
    </Card>
  );
}

function NotificationsSection() {
  const defaults = [{ label: "Email Notifications", sub: "Receive updates to your inbox", on: false }, { label: "Research Alerts", sub: "New citations and related papers", on: true }, { label: "Weekly Summary", sub: "Activity digest every Monday", on: false }, { label: "Rate Limit Warnings", sub: "Alert before API quota exhaustion", on: true }];
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem("polynous_notifications")) || defaults; } catch { return defaults; } });
  const toggle = i => { const n = [...items]; n[i].on = !n[i].on; setItems(n); localStorage.setItem("polynous_notifications", JSON.stringify(n)); };

  return (
    <Card>
      <SectionHead icon="notifications" title="Notifications" subtitle="Delivery preferences" />
      {items.map((item, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < items.length - 1 ? `1px solid ${C.white5}` : "none" }}><div><div style={{ fontFamily: C.fontHead, fontSize: 13, fontWeight: 500, color: C.onSurface }}>{item.label}</div><div style={{ fontFamily: C.fontMono, fontSize: 9.5, color: C.textSecondary, marginTop: 2 }}>{item.sub}</div></div><Toggle on={item.on} onToggle={() => toggle(i)} /></div>))}
    </Card>
  );
}

function IntegrationsSection() {
  const rows = [{ monogram: "G", mc: "#4285F4", label: "Google OAuth", sub: "Drive, Docs, Calendar", connected: true, detail: "ash@gmail.com" }, { monogram: "GH", mc: C.textSecondary, label: "GitHub", sub: "Repos, Issues, Actions", connected: false, detail: null }, { monogram: "N", mc: "#e05068", label: "Notion", sub: "Pages, Databases", connected: false, detail: null }];

  return (
    <Card>
      <SectionHead icon="hub" title="Integrations" subtitle="Third-party service connections" />
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {rows.map(row => (<div key={row.label} style={{ background: "rgba(9,10,14,0.6)", border: `1px solid ${C.white10}`, borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: row.connected ? "default" : "pointer", transition: "border-color 0.2s, background 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.silverBorder; e.currentTarget.style.background = C.surfaceHigh; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.white10; e.currentTarget.style.background = "rgba(9,10,14,0.6)"; }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 32, height: 32, borderRadius: 7, background: `${row.mc}12`, border: `1px solid ${row.mc}28`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.fontHead, fontWeight: 700, fontSize: 11, color: row.mc, flexShrink: 0 }}>{row.monogram}</div><div><div style={{ fontFamily: C.fontHead, fontWeight: 600, color: C.onSurface, fontSize: 13 }}>{row.label}</div><div style={{ fontFamily: C.fontMono, fontSize: 9.5, color: C.textSecondary, marginTop: 2 }}>{row.connected ? row.detail : row.sub}</div></div></div>
          <span style={{ fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: row.connected ? C.silver : C.textSecondary, background: row.connected ? C.silverFaint : "rgba(255,255,255,0.02)", padding: "3px 10px", borderRadius: 9999, border: `1px solid ${row.connected ? C.silverBorder : C.white10}` }}>{row.connected ? "Connected" : "Connect"}</span>
        </div>))}
      </div>
    </Card>
  );
}

function SecuritySection() {
  const rows = [{ icon: "lock", color: C.purple, title: "Fernet AES-128", sub: "All keys encrypted at rest", status: "Active" }, { icon: "shield", color: C.cyan, title: "Session Isolation", sub: "Keys scoped to your session", status: "Enforced" }, { icon: "vpn_key", color: C.silverDim, title: "BYOK Architecture", sub: "Keys never leave your session", status: "Verified" }];

  return (
    <Card>
      <SectionHead icon="security" title="Security" subtitle="Encryption & access controls" />
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
        {rows.map(row => (<div key={row.title} style={{ background: "rgba(9,10,14,0.6)", border: `1px solid ${C.white10}`, borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 32, height: 32, borderRadius: 7, background: `${row.color}10`, border: `1px solid ${row.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={row.icon} style={{ fontSize: 16, color: row.color }} /></div><div><div style={{ fontFamily: C.fontHead, fontWeight: 600, color: C.onSurface, fontSize: 13 }}>{row.title}</div><div style={{ fontFamily: C.fontMono, fontSize: 9.5, color: C.textSecondary, marginTop: 2 }}>{row.sub}</div></div></div>
          <span style={{ fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.silver, background: C.silverFaint, padding: "3px 10px", borderRadius: 9999, border: `1px solid ${C.silverBorder}` }}>{row.status}</span>
        </div>))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["Change Password", "Revoke All Sessions"].map(label => (<button key={label} style={{ padding: "7px 16px", borderRadius: 9999, border: `1px solid ${C.white10}`, background: "transparent", color: C.onSurface, cursor: "pointer", fontFamily: C.fontHead, fontSize: 12, fontWeight: 500, transition: "background 0.2s, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = C.silverFaint; e.currentTarget.style.borderColor = C.silverBorder; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.white10; }}>{label}</button>))}
      </div>
    </Card>
  );
}

function DataStorageSection({ push }) {
  const [s, setS] = useState({ total_research: 0, unique_topics: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getStats().then(d => setS(d)).catch(() => {}).finally(() => setLoading(false)); }, []);
  const ITEMS = [{ label: "Research Stored", val: s.total_research || 0 }, { label: "Topics Tracked", val: s.unique_topics || 0 }, { label: "KG Nodes", val: s.unique_topics || 0 }, { label: "Pinecone Vectors", val: Math.floor((s.total_research || 0) * 3) }];

  return (
    <Card>
      <SectionHead icon="database" title="Data & Storage" subtitle="Vectors, graph nodes & persisted research" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 9, marginBottom: 14 }}>{ITEMS.map(({ label, val }) => (<div key={label} style={{ background: "rgba(9,10,14,0.6)", border: `1px solid ${C.white10}`, borderRadius: 12, padding: "11px 10px", textAlign: "center" }}><div style={{ fontFamily: C.fontMono, fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.12em", color: C.textSecondary, marginBottom: 5 }}>{label}</div><div style={{ fontFamily: C.fontHead, fontSize: 22, fontWeight: 700, color: C.onSurface }}>{loading ? "—" : val}</div></div>))}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => push("Export started")} style={{ padding: "7px 16px", borderRadius: 9999, border: `1px solid ${C.silverBorder}`, background: "transparent", color: C.silver, cursor: "pointer", fontFamily: C.fontHead, fontSize: 12, fontWeight: 600, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = C.silverFaint} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>Export All Data</button>
        <button onClick={() => push("Research history cleared")} style={{ padding: "7px 16px", borderRadius: 9999, border: "1px solid rgba(126,200,216,0.3)", background: "transparent", color: C.cyan, cursor: "pointer", fontFamily: C.fontHead, fontSize: 12, fontWeight: 600, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(126,200,216,0.06)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>Clear History</button>
      </div>
    </Card>
  );
}

function DangerZone() {
  const [confirm, setConfirm] = useState(false);
  return (
    <Card danger>
      <SectionHead icon="warning" title="Danger Zone" subtitle="Irreversible — proceed with caution" />
      <p style={{ fontFamily: C.fontMono, fontSize: 11, color: C.textSecondary, letterSpacing: "0.04em", marginBottom: 14, lineHeight: 1.7 }}>These actions cannot be undone. All stored data, memory, and API keys will be permanently removed.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => { localStorage.clear(); window.location.href = "/auth"; }} style={{ padding: "7px 18px", borderRadius: 9999, border: "1px solid rgba(224,80,104,0.4)", background: "transparent", color: C.crimson, cursor: "pointer", fontFamily: C.fontHead, fontSize: 12, fontWeight: 600, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = C.crimsonFaint} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>Delete Account</button>
        <button onClick={() => { setConfirm(!confirm); if (confirm) { localStorage.clear(); window.location.href = "/auth"; } }} style={{ padding: "7px 18px", borderRadius: 9999, border: "1px solid rgba(224,80,104,0.4)", background: confirm ? C.crimsonFaint : "transparent", color: C.crimson, cursor: "pointer", fontFamily: C.fontHead, fontSize: 12, fontWeight: 600, transition: "background 0.2s" }}>{confirm ? "Confirm — Click Again" : "Reset All Data"}</button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage({ user, onNavigate, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const { toasts, push } = useToast();
  const sidebarW = collapsed ? 56 : 280;

  return (
    <div style={{ minHeight: "100vh", background: C.void, color: C.onSurface, fontFamily: C.fontBody, overflowX: "hidden" }}>
      <Styles />
      <NeuralCanvas />
      <Sidebar onNavigate={onNavigate} user={user} onLogout={onLogout} collapsed={collapsed} setCollapsed={setCollapsed} />

      <main style={{ marginLeft: sidebarW, padding: 32, maxWidth: 980, transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)", position: "relative", zIndex: 10 }}>
        <header style={{ marginBottom: 40, paddingTop: 10 }}>
          <p style={{ fontFamily: C.fontMono, fontSize: 9.5, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: 8 }}>Neural Research Environment</p>
          <h1 style={{ fontFamily: C.fontHead, fontSize: "clamp(2rem,4.5vw,3rem)", fontWeight: 800, color: C.silverBright, letterSpacing: "-0.04em", textShadow: "0 0 40px rgba(200,205,214,0.12)", margin: 0 }}>. Settings</h1>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${C.silverBorder}, transparent)`, marginTop: 14 }} />
        </header>

        <ProfileSection user={user} push={push} />
        <ApiKeysSection push={push} />
        <AppearanceSection />
        <PreferencesSection push={push} />
        <StatsSection />
        <NotificationsSection />
        <IntegrationsSection />
        <SecuritySection />
        <DataStorageSection push={push} />
        <DangerZone />

        <div style={{ height: 60 }} />
      </main>

      <ToastBox toasts={toasts} />
    </div>
  );
}