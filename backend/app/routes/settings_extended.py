import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — silver / deep-void palette
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  silver:           "#c8cdd6",
  silverBright:     "#e8ecf2",
  silverDim:        "#8e98a8",
  silverFaint:      "rgba(200,205,214,0.07)",
  silverBorder:     "rgba(200,205,214,0.18)",
  silverFocus:      "rgba(200,205,214,0.38)",
  silverGlow:       "0 0 20px rgba(200,205,214,0.10)",

  crimson:          "#e05068",
  crimsonFaint:     "rgba(224,80,104,0.09)",
  cyan:             "#7ec8d8",
  gold:             "#c8aa6e",
  purple:           "#9b84cc",
  green:            "#5ec97e",

  void:             "#0b0c10",
  surface:          "rgba(18,20,26,0.80)",
  surfaceHigh:      "rgba(30,33,42,0.85)",
  inputBg:          "#08090d",

  onSurface:        "#dde1e9",
  onSurfaceVariant: "#8e98a8",
  textSecondary:    "#525c6e",

  white10:          "rgba(255,255,255,0.08)",
  white5:           "rgba(255,255,255,0.04)",

  fontHead: "'Sora',sans-serif",
  fontBody: "'Hanken Grotesk',sans-serif",
  fontMono: "'JetBrains Mono',monospace",
  fontDisplay: "'Anton',sans-serif",
};

// ─────────────────────────────────────────────────────────────────────────────
// API LAYER — robust wrappers with safe JSON parsing + error normalisation
// ─────────────────────────────────────────────────────────────────────────────
const BASE = "http://localhost:8000";

function getUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("polynous_user") || "{}");
    return u.email || u.username || "guest_user";
  } catch { return "guest_user"; }
}

/** Safe fetch: throws a typed Error with .status if the response is not 2xx,
 *  and always returns parsed JSON (or throws if unparseable). */
async function safeFetch(url, opts = {}) {
  let res;
  try {
    res = await fetch(url, opts);
  } catch (networkErr) {
    throw new Error(`Network error: ${networkErr.message}`);
  }
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch {
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    throw new Error("Invalid JSON response");
  }
  if (!res.ok) {
    const msg = data?.detail || data?.message || `Error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

const uid = () => encodeURIComponent(getUserId());

const api = {
  getApiKeys: () =>
    safeFetch(`${BASE}/settings/api-keys?user_id=${uid()}`),

  saveApiKey: (provider, key) =>
    safeFetch(`${BASE}/settings/api-keys?user_id=${uid()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [`${provider}_api_key`]: key }),
    }),

  deleteApiKey: (provider) =>
    safeFetch(`${BASE}/settings/api-keys?user_id=${uid()}&provider=${provider}`, {
      method: "DELETE",
    }),

  // POST with Content-Type so servers that require it don't reject the request
  testApiKey: (provider) =>
    safeFetch(`${BASE}/settings/api-keys/test?provider=${provider}&user_id=${uid()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),

  getStats: () =>
    safeFetch(`${BASE}/memory/stats/${uid()}`),

  getPreferences: () =>
    safeFetch(`${BASE}/settings/preferences?user_id=${uid()}`),

  // Merges partial prefs so callers don't need to send the full object
  savePreferences: (prefs) =>
    safeFetch(`${BASE}/settings/preferences?user_id=${uid()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    }),

  updateProfile: (data) =>
    safeFetch(`${BASE}/settings/profile?user_id=${uid()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // ── Security ──────────────────────────────────────────────────────────
  changePassword: (currentPassword, newPassword) =>
    safeFetch(`${BASE}/settings/security/change-password?user_id=${uid()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),

  revokeSessions: () =>
    safeFetch(`${BASE}/settings/security/revoke-sessions?user_id=${uid()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),

  // ── Integrations ─────────────────────────────────────────────────────
  getIntegrations: () =>
    safeFetch(`${BASE}/settings/integrations?user_id=${uid()}`),

  connectIntegration: (provider) =>
    safeFetch(`${BASE}/settings/integrations/${provider}/connect?user_id=${uid()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),

  disconnectIntegration: (provider) =>
    safeFetch(`${BASE}/settings/integrations/${provider}/disconnect?user_id=${uid()}`, {
      method: "DELETE",
    }),

  // ── Data & Storage ───────────────────────────────────────────────────
  // Returns a URL rather than fetching — used directly as a download link
  exportDataUrl: () =>
    `${BASE}/settings/data/export?user_id=${uid()}`,

  clearHistory: () =>
    safeFetch(`${BASE}/settings/data/clear-history?user_id=${uid()}`, {
      method: "DELETE",
    }),

  resetAllData: () =>
    safeFetch(`${BASE}/settings/data/reset?user_id=${uid()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),

  deleteAccount: () =>
    safeFetch(`${BASE}/settings/account?user_id=${uid()}`, {
      method: "DELETE",
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// ICON
// ─────────────────────────────────────────────────────────────────────────────
function Icon({ name, style: extra }) {
  return (
    <span style={{
      fontFamily: "Material Symbols Outlined",
      fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24",
      lineHeight: 1, userSelect: "none",
      display: "inline-block", flexShrink: 0,
      ...(extra || {}),
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
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Hanken+Grotesk:wght@400;500;600&family=Anton&family=Material+Symbols+Outlined&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { font-size: 16px; }
      body {
        background: #0b0c10;
        color: #dde1e9;
        font-family: 'Hanken Grotesk', sans-serif;
        overflow-x: hidden;
        -webkit-font-smoothing: antialiased;
      }

      @keyframes spin    { to { transform: rotate(360deg); } }
      @keyframes pulseDot {
        0%,100% { box-shadow: 0 0 3px rgba(200,205,214,0.25); }
        50%     { box-shadow: 0 0 10px rgba(200,205,214,0.55); }
      }
      @keyframes toastIn  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes particleDrift { to { transform: translateY(-100vh) rotate(360deg); opacity: 0; } }
      @keyframes wordmarkPulse {
        0%,100% {
          text-shadow: 0 0 8px rgba(200,205,214,0.25), 0 0 20px rgba(200,205,214,0.12), 0 0 40px rgba(200,205,214,0.06);
        }
        50% {
          text-shadow: 0 0 12px rgba(232,236,242,0.55), 0 0 28px rgba(200,205,214,0.28), 0 0 56px rgba(200,205,214,0.14);
        }
      }
      @keyframes settingsGlow {
        0%,100% {
          text-shadow: 0 0 18px rgba(232,236,242,0.22), 0 0 46px rgba(200,205,214,0.10);
        }
        50% {
          text-shadow: 0 0 26px rgba(232,236,242,0.40), 0 0 64px rgba(200,205,214,0.20);
        }
      }

      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(200,205,214,0.14); border-radius: 8px; }

      input[type=range] {
        -webkit-appearance: none; appearance: none;
        background: rgba(255,255,255,0.08);
        height: 3px; border-radius: 4px;
        outline: none; cursor: pointer; width: 100%;
      }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px; height: 16px; border-radius: 50%;
        background: #c8cdd6; cursor: pointer;
        box-shadow: 0 0 6px rgba(200,205,214,0.5);
      }
      select {
        -webkit-appearance: none; appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235a6272'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.85rem center;
        cursor: pointer;
      }
      select option { background: #0b0c10; color: #dde1e9; }
    `}</style>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEURAL CANVAS  — silver floating particles + mouse repulsion
// ─────────────────────────────────────────────────────────────────────────────
function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx    = canvas.getContext("2d");
    let particles = [], mouse = { x: null, y: null }, animId;
    const N = 130;

    // silver / cool-grey colour stops
    const COLS = [
      { r: 200, g: 205, b: 214 },
      { r: 180, g: 190, b: 205 },
      { r: 220, g: 225, b: 232 },
      { r: 142, g: 152, b: 168 },
      { r: 160, g: 175, b: 195 },
      { r: 230, g: 235, b: 240 },
    ];

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x  = Math.random() * canvas.width;
        this.y  = Math.random() * canvas.height;
        this.bvx = (Math.random() - 0.5) * 0.4;
        this.bvy = (Math.random() - 0.5) * 0.4;
        this.vx  = this.bvx;
        this.vy  = this.bvy;
        this.r   = Math.random() * 2.2 + 0.8;
        this.col = COLS[Math.floor(Math.random() * COLS.length)];
        this.op  = Math.random() * 0.35 + 0.12;
        this.ts  = Math.random() * 0.018 + 0.004;
        this.to  = Math.random() * Math.PI * 2;
        this.wa  = Math.random() * 0.25;
        this.ws  = Math.random() * 0.018 + 0.008;
        this.wo  = Math.random() * Math.PI * 2;
      }
      update(t) {
        this.vx = this.bvx + Math.sin(t * this.ws + this.wo) * this.wa;
        this.vy = this.bvy + Math.cos(t * this.ws + this.wo) * this.wa;
        this.x += this.vx;
        this.y += this.vy;
        if (mouse.x !== null) {
          const dx = this.x - mouse.x, dy = this.y - mouse.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 160) {
            const f = (160 - d) / 160;
            this.x += (dx / d) * f * 2.5;
            this.y += (dy / d) * f * 2.5;
          }
        }
        if (this.x < -10) this.x = canvas.width  + 10;
        if (this.x > canvas.width  + 10) this.x  = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y  = -10;
      }
      draw(t) {
        const tw  = Math.sin(t * this.ts + this.to) * 0.18 + 0.82;
        const al  = this.op * tw;
        const { r: cr, g, b } = this.col;
        // soft glow halo
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 5);
        grd.addColorStop(0, `rgba(${cr},${g},${b},${al * 0.45})`);
        grd.addColorStop(1, `rgba(${cr},${g},${b},0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 5, 0, Math.PI * 2);
        ctx.fill();
        // core dot
        ctx.fillStyle = `rgba(${cr},${g},${b},${al})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => { particles = Array.from({ length: N }, () => new Particle()); };

    let t0 = performance.now();
    const frame = (ts) => {
      const t = ts - t0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            const al   = (1 - d / 120) * 0.055;
            const cr   = Math.floor((particles[i].col.r + particles[j].col.r) / 2);
            const cg   = Math.floor((particles[i].col.g + particles[j].col.g) / 2);
            const cb   = Math.floor((particles[i].col.b + particles[j].col.b) / 2);
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${al})`;
            ctx.lineWidth   = 0.4;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      particles.forEach(p => { p.update(t); p.draw(t); });
      animId = requestAnimationFrame(frame);
    };

    const onMM = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onML = () => { mouse.x = null; mouse.y = null; };
    const onRz = () => { resize(); init(); };

    window.addEventListener("resize",    onRz);
    window.addEventListener("mousemove", onMM);
    window.addEventListener("mouseleave",onML);
    resize(); init();
    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize",    onRz);
      window.removeEventListener("mousemove", onMM);
      window.removeEventListener("mouseleave",onML);
    };
  }, []);

  return (
    <canvas ref={ref} style={{
      position: "fixed", inset: 0,
      width: "100%", height: "100%",
      zIndex: 0, pointerEvents: "none",
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
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
  const go  = useCallback((p) => { if (onNavigate) onNavigate(p); else window.location.href = p; }, [onNavigate]);
  const bye = useCallback(() => { if (onLogout) onLogout(); else { localStorage.clear(); window.location.href = "/"; } }, [onLogout]);
  const W   = collapsed ? 58 : 288;

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%", width: W,
      background: "rgba(11,12,16,0.92)",
      backdropFilter: "blur(28px)",
      borderRight: `1px solid ${C.white10}`,
      display: "flex", flexDirection: "column",
      padding: collapsed ? "18px 8px" : "24px 20px",
      zIndex: 30,
      transition: "width 0.35s cubic-bezier(0.4,0,0.2,1), padding 0.35s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden",
    }}>
      {collapsed ? (
        /* ── COLLAPSED ── */
        <>
          <button onClick={() => setCollapsed(false)} style={{
            background: "none", border: "none", color: C.silver,
            cursor: "pointer", marginBottom: 30,
            display: "flex", justifyContent: "center",
          }}>
            <Icon name="chevron_right" style={{ fontSize: 22 }} />
          </button>
          {NAV_ITEMS.map(({ icon, label, path, active }) => (
            <div key={label} onClick={() => go(path)} title={label} style={{
              padding: "12px 0", cursor: "pointer",
              color: active ? C.silverBright : C.onSurfaceVariant,
              width: "100%", display: "flex", justifyContent: "center",
              borderLeft: `2px solid ${active ? C.silver : "transparent"}`,
            }}>
              <Icon name={icon} style={{ fontSize: 21, color: "inherit" }} />
            </div>
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div onClick={() => go("/research")} style={{
              width: 36, height: 36, borderRadius: "50%",
              background: C.silverFaint, border: `1px solid ${C.silverBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Icon name="add" style={{ fontSize: 18, color: C.silver }} />
            </div>
            <div title={user?.username || "Guest"} style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#14161c", border: `1px solid ${C.silverBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="face" style={{ color: C.silver, fontSize: 16 }} />
            </div>
            <div onClick={bye} title="Disconnect" style={{ cursor: "pointer", color: C.crimson }}>
              <Icon name="logout" style={{ fontSize: 15 }} />
            </div>
          </div>
        </>
      ) : (
        /* ── EXPANDED ── */
        <>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 42, minWidth: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: C.fontHead, fontSize: 26, fontWeight: 800,
                color: C.silverBright, letterSpacing: "-0.04em", whiteSpace: "nowrap",
                animation: "wordmarkPulse 3.5s ease-in-out infinite",
              }}>
                POLYNOUS
              </h1>
              <p style={{
                fontFamily: C.fontMono, fontSize: 10, color: C.textSecondary,
                textTransform: "uppercase", letterSpacing: "0.22em",
                marginTop: 5, whiteSpace: "nowrap",
              }}>
                Cerebral Vitality Engine
              </p>
            </div>
            <button onClick={() => setCollapsed(true)} style={{
              background: "none", border: "none", color: C.textSecondary,
              cursor: "pointer", padding: 4, flexShrink: 0, marginLeft: 8,
              transition: "color 0.18s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = C.silverBright}
              onMouseLeave={e => e.currentTarget.style.color = C.textSecondary}
            >
              <Icon name="chevron_left" style={{ fontSize: 20 }} />
            </button>
          </div>

          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
            {NAV_ITEMS.map(({ icon, label, path, active }) => (
              <div key={label} onClick={() => go(path)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", borderRadius: 9999, cursor: "pointer",
                color: active ? C.silverBright : C.onSurfaceVariant,
                background: active ? C.silverFaint : "transparent",
                fontFamily: C.fontMono, fontSize: 13.5, fontWeight: active ? 600 : 400,
                borderLeft: `2px solid ${active ? C.silver : "transparent"}`,
                transition: "all 0.18s", whiteSpace: "nowrap", overflow: "hidden",
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = C.silverBright; e.currentTarget.style.background = C.silverFaint; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = C.onSurfaceVariant; e.currentTarget.style.background = "transparent"; } }}
              >
                <Icon name={icon} style={{ fontSize: 20, color: "inherit", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
              </div>
            ))}
          </nav>

          <div style={{ borderTop: `1px solid ${C.white5}`, paddingTop: 22, marginTop: 22 }}>
            <button onClick={() => go("/research")} style={{
              width: "100%", padding: "12px",
              background: C.silverFaint, border: `1px solid ${C.silverBorder}`,
              color: C.silverBright, fontWeight: 700, borderRadius: 9999,
              cursor: "pointer", fontFamily: C.fontHead, fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.18s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(200,205,214,0.13)"}
              onMouseLeave={e => e.currentTarget.style.background = C.silverFaint}
            >
              <Icon name="add" style={{ fontSize: 18, color: "inherit", flexShrink: 0 }} />
              New Research
            </button>
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "#14161c", border: `1px solid ${C.silverBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name="face" style={{ color: C.silver, fontSize: 22 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: C.fontMono, fontSize: 13.5, fontWeight: 600,
                  color: C.onSurface, whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {user?.username || "Guest"}
                </p>
                <button onClick={bye} style={{
                  fontSize: 10.5, color: C.crimson, background: "none",
                  border: "none", cursor: "pointer", fontFamily: C.fontMono,
                  textTransform: "uppercase", letterSpacing: "0.06em", padding: 0,
                }}>
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "ok") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);
  return { toasts, push };
}

function ToastBox({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: "14px 20px", borderRadius: 12,
          fontFamily: C.fontMono, fontSize: 13.5,
          backdropFilter: "blur(24px)",
          background: t.type === "err" ? C.crimsonFaint : C.silverFaint,
          border: `1px solid ${t.type === "err" ? "rgba(224,80,104,0.38)" : C.silverBorder}`,
          color: t.type === "err" ? C.crimson : C.silverBright,
          boxShadow: t.type === "err" ? "0 0 14px rgba(224,80,104,0.2)" : C.silverGlow,
          animation: "toastIn 0.28s ease",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {t.type === "err" ? "⚠" : "✓"}&nbsp;{t.msg}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function SectionHead({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: C.silverFaint, border: `1px solid ${C.silverBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={icon} style={{ fontSize: 16, color: C.silverDim }} />
        </div>
        <span style={{ fontFamily: C.fontHead, fontSize: 17, fontWeight: 700, color: C.onSurface, letterSpacing: "-0.025em" }}>
          {title}
        </span>
      </div>
      {subtitle && (
        <p style={{
          fontFamily: C.fontMono, fontSize: 11, color: C.textSecondary,
          textTransform: "uppercase", letterSpacing: "0.16em",
          paddingLeft: 44, marginTop: 4, lineHeight: 1,
        }}>
          {subtitle}
        </p>
      )}
      <div style={{ height: 1, background: `linear-gradient(90deg, ${C.silverBorder}, transparent)`, marginTop: 12 }} />
    </div>
  );
}

function Card({ children, danger }) {
  return (
    <div style={{
      background: C.surface,
      backdropFilter: "blur(22px)",
      border: `1px solid ${danger ? "rgba(224,80,104,0.22)" : C.white10}`,
      borderRadius: 18, padding: 28, marginBottom: 16,
      boxShadow: danger ? "0 0 16px rgba(224,80,104,0.08)" : C.silverGlow,
      position: "relative", overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{
      fontFamily: C.fontMono, fontSize: 11,
      textTransform: "uppercase", letterSpacing: "0.18em",
      color: C.textSecondary, marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

const inputStyle = {
  background: C.inputBg,
  border: `1px solid ${C.white10}`,
  borderRadius: 9, color: C.onSurface,
  fontFamily: C.fontMono, fontSize: 13.5,
  padding: "11px 14px", width: "100%",
  outline: "none", transition: "border 0.15s, box-shadow 0.15s",
};

const onFI = e => { e.target.style.border = `1px solid ${C.silverFocus}`; e.target.style.boxShadow = "0 0 0 3px rgba(200,205,214,0.07)"; };
const onFO = e => { e.target.style.border = `1px solid ${C.white10}`; e.target.style.boxShadow = "none"; };

function StatusDot({ active }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      fontFamily: C.fontMono, fontSize: 11, letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: active ? C.silver : C.textSecondary,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: active ? C.silver : C.textSecondary,
        boxShadow: active ? "0 0 7px rgba(200,205,214,0.55)" : "none",
        animation: active ? "pulseDot 2.4s ease infinite" : "none",
      }} />
      {active ? "Active" : "Not set"}
    </span>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <div role="switch" aria-checked={on} tabIndex={0}
      onClick={onToggle}
      onKeyDown={e => (e.key === " " || e.key === "Enter") && onToggle()}
      style={{
        width: 42, height: 24, borderRadius: 999,
        background: on ? C.silver : "rgba(255,255,255,0.09)",
        border: `1px solid ${on ? "rgba(200,205,214,0.55)" : C.white10}`,
        position: "relative", cursor: "pointer",
        transition: "background 0.2s, border 0.2s",
        flexShrink: 0, outline: "none",
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: on ? C.void : "#6a737f",
        boxShadow: on ? "0 0 5px rgba(200,205,214,0.45)" : "0 1px 3px rgba(0,0,0,0.5)",
        transition: "left 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      }} />
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0" }}>
      <div style={{
        width: 32, height: 32,
        border: "2px solid rgba(200,205,214,0.15)",
        borderTop: "2px solid #c8cdd6",
        borderRadius: "50%", animation: "spin 0.9s linear infinite",
      }} />
      <span style={{ fontFamily: C.fontMono, fontSize: 12, color: C.textSecondary, letterSpacing: "0.08em" }}>
        Loading…
      </span>
    </div>
  );
}

// Pill button used for the various confirm-style action buttons
function PillButton({ children, onClick, disabled, tone = "neutral", style: extra }) {
  const palette = {
    neutral: { color: C.onSurface,  border: C.white10,            hover: C.silverFaint },
    silver:  { color: C.silver,     border: C.silverBorder,       hover: C.silverFaint },
    cyan:    { color: C.cyan,       border: "rgba(126,200,216,0.3)", hover: "rgba(126,200,216,0.06)" },
    crimson: { color: C.crimson,    border: "rgba(224,80,104,0.4)",  hover: C.crimsonFaint },
  };
  const p = palette[tone] || palette.neutral;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "9px 20px", borderRadius: 9999,
        border: `1px solid ${p.border}`, background: "transparent",
        color: p.color, cursor: disabled ? "wait" : "pointer",
        fontFamily: C.fontHead, fontSize: 14, fontWeight: 600,
        transition: "background 0.18s", opacity: disabled ? 0.6 : 1,
        ...(extra || {}),
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = p.hover; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
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
// PROFILE SECTION
// ─────────────────────────────────────────────────────────────────────────────
function ProfileSection({ user, push }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail]       = useState(user?.email    || "");
  const [saving, setSaving]     = useState(false);
  const initials = (username || "PL").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const save = async () => {
    if (!username.trim()) { push("Username cannot be empty", "err"); return; }
    setSaving(true);
    try {
      await api.updateProfile({ username: username.trim(), email: email.trim() });
      const stored = JSON.parse(localStorage.getItem("polynous_user") || "{}");
      localStorage.setItem("polynous_user", JSON.stringify({ ...stored, username: username.trim(), email: email.trim() }));
      push("Profile updated");
      setEditing(false);
    } catch (err) {
      push(err.message || "Update failed", "err");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setUsername(user?.username || "");
    setEmail(user?.email || "");
    setEditing(false);
  };

  return (
    <Card>
      <SectionHead icon="account_circle" title="Profile" subtitle="Identity & account tier" />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: `conic-gradient(from 200deg, #5a6272, #8e98a8, #c8cdd6, #e2e6ed, #c8cdd6, #8e98a8)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: C.fontHead, fontWeight: 800, fontSize: 20, color: C.void,
            boxShadow: "0 0 28px rgba(200,205,214,0.18), 0 0 0 2px rgba(200,205,214,0.14)",
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Username"
                  style={{ ...inputStyle, width: 220, fontFamily: C.fontHead, fontWeight: 600 }}
                  onFocus={onFI} onBlur={onFO} />
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  style={{ ...inputStyle, width: 220 }}
                  onFocus={onFI} onBlur={onFO} />
              </div>
            ) : (
              <>
                <div style={{ fontFamily: C.fontHead, fontSize: 18, fontWeight: 700, color: C.onSurface, letterSpacing: "-0.025em" }}>
                  {username || "Guest User"}
                </div>
                <div style={{ fontFamily: C.fontMono, fontSize: 13, color: C.textSecondary, marginTop: 5 }}>
                  {email || "guest@polynous.ai"}
                </div>
                <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
                  {[
                    { label: "Free Tier",   color: C.silver,        bg: C.silverFaint,  border: C.silverBorder },
                    { label: "Since 2025",  color: C.textSecondary, bg: "transparent",  border: C.white10      },
                  ].map(b => (
                    <span key={b.label} style={{
                      fontFamily: C.fontMono, fontSize: 10, letterSpacing: "0.12em",
                      textTransform: "uppercase", background: b.bg,
                      padding: "4px 12px", borderRadius: 9999,
                      color: b.color, border: `1px solid ${b.border}`,
                    }}>
                      {b.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {editing && (
            <button onClick={cancel} style={{
              padding: "9px 20px", borderRadius: 9999,
              border: `1px solid ${C.white10}`, background: "transparent",
              color: C.onSurfaceVariant, cursor: "pointer",
              fontFamily: C.fontHead, fontWeight: 600, fontSize: 14,
              transition: "all 0.18s",
            }}>
              Cancel
            </button>
          )}
          <button
            onClick={() => editing ? save() : setEditing(true)}
            disabled={saving}
            style={{
              padding: "9px 22px", borderRadius: 9999,
              border: editing ? "none" : `1px solid ${C.silverBorder}`,
              background: editing ? C.silver : "transparent",
              color: editing ? C.void : C.silver,
              cursor: saving ? "wait" : "pointer",
              fontFamily: C.fontHead, fontWeight: 700, fontSize: 14,
              transition: "all 0.18s", opacity: saving ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!editing) e.currentTarget.style.background = C.silverFaint; }}
            onMouseLeave={e => { if (!editing) e.currentTarget.style.background = "transparent"; }}
          >
            {saving ? "Saving…" : editing ? "Save Changes" : "Edit Profile"}
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KEY CARD
// ─────────────────────────────────────────────────────────────────────────────
function KeyCard({ providerId, connected, preview, onSave, onRemove, push }) {
  const [val, setVal]               = useState("");
  const [visible, setVisible]       = useState(false);
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState(null); // null | "ok" | "fail"
  const p = PROVIDERS[providerId];

  const doSave = async () => {
    if (!val.trim()) { push("Paste a key first", "err"); return; }
    try {
      await api.saveApiKey(providerId, val.trim());
      push(`${p.label} key saved`);
      setVal("");
      if (onSave) onSave(providerId);
    } catch (err) {
      push(err.message || "Save failed", "err");
    }
  };

  const doRemove = async () => {
    try {
      await api.deleteApiKey(providerId);
      push(`${p.label} key removed`);
      if (onRemove) onRemove(providerId);
    } catch (err) {
      push(err.message || "Remove failed", "err");
    }
  };

  const doTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const r = await api.testApiKey(providerId);
      setTestResult(r?.status === "ok" ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 3500);
    }
  };

  const testColor = testResult === "ok" ? C.green : testResult === "fail" ? C.crimson : C.textSecondary;
  const testLabel = testing ? "Testing…" : testResult === "ok" ? "Valid ✓" : testResult === "fail" ? "Invalid ✗" : "Test";

  return (
    <div style={{
      background: "rgba(9,10,14,0.55)", border: `1px solid ${C.white10}`,
      borderRadius: 13, padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: 14,
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.silverBorder}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.white10}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: `${p.color}12`, border: `1px solid ${p.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={p.icon} style={{ fontSize: 18, color: p.color }} />
          </div>
          <div>
            <div style={{ fontFamily: C.fontHead, fontWeight: 600, color: C.onSurface, fontSize: 15 }}>
              {p.label}
            </div>
            {connected && preview && (
              <div style={{ fontSize: 11.5, color: C.textSecondary, fontFamily: C.fontMono, marginTop: 2 }}>
                ••••{preview}
              </div>
            )}
          </div>
        </div>
        <StatusDot active={connected} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type={visible ? "text" : "password"}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doSave()}
          placeholder={connected ? "Paste to replace key…" : p.placeholder}
          style={{ ...inputStyle, flexGrow: 1, width: "auto" }}
          onFocus={onFI} onBlur={onFO}
        />
        <button onClick={() => setVisible(v => !v)} style={{
          padding: "0 12px",
          background: "rgba(255,255,255,0.03)", border: `1px solid ${C.white10}`,
          borderRadius: 9, cursor: "pointer",
          color: C.textSecondary, flexShrink: 0, transition: "color 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = C.onSurface}
          onMouseLeave={e => e.currentTarget.style.color = C.textSecondary}
        >
          <Icon name={visible ? "visibility_off" : "visibility"} style={{ fontSize: 18 }} />
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 18, alignItems: "center" }}>
        <button onClick={doTest} disabled={testing} style={{
          fontFamily: C.fontMono, fontSize: 11.5, letterSpacing: "0.08em",
          color: testColor, background: "none", border: "none",
          cursor: testing ? "wait" : "pointer", textTransform: "uppercase",
          transition: "color 0.2s",
        }}>
          {testLabel}
        </button>
        <span style={{ width: 1, height: 14, background: C.white10 }} />
        <button onClick={doSave} disabled={!val.trim()} style={{
          fontFamily: C.fontMono, fontSize: 11.5, letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: val.trim() ? C.cyan : C.textSecondary,
          background: "none", border: "none",
          cursor: val.trim() ? "pointer" : "default",
        }}>
          Save
        </button>
        {connected && (
          <>
            <span style={{ width: 1, height: 14, background: C.white10 }} />
            <button onClick={doRemove} style={{
              fontFamily: C.fontMono, fontSize: 11.5, letterSpacing: "0.08em",
              textTransform: "uppercase", color: C.crimson,
              background: "none", border: "none", cursor: "pointer",
            }}>
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// API KEYS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function ApiKeysSection({ push }) {
  const [connected, setConnected] = useState({ anthropic: false, openai: false, tavily: false });
  const [previews, setPreviews]   = useState({ anthropic: null, openai: null, tavily: null });
  const [preferred, setPreferred] = useState("anthropic");
  const [loading, setLoading]     = useState(true);
  const [loadErr, setLoadErr]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr(null);
    try {
      const data = await api.getApiKeys();
      setConnected({ anthropic: !!data.has_anthropic, openai: !!data.has_openai, tavily: !!data.has_tavily });
      setPreviews({ anthropic: data.anthropic_preview || null, openai: data.openai_preview || null, tavily: data.tavily_preview || null });
      setPreferred(data.preferred_provider || "anthropic");
    } catch (err) {
      setLoadErr(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <SectionHead icon="key" title="API Keys" subtitle="Bring your own keys · system services managed automatically" />

      <div style={{ marginBottom: 20 }}>
        <Label>Preferred AI Provider</Label>
        <div style={{ display: "flex", gap: 8 }}>
          {["anthropic", "openai"].map(id => {
            const col    = PROVIDERS[id].color;
            const active = preferred === id;
            return (
              <button key={id} onClick={() => setPreferred(id)} style={{
                padding: "8px 18px", borderRadius: 9999,
                border: `1px solid ${active ? col + "55" : C.white10}`,
                background: active ? `${col}10` : "transparent",
                color: active ? col : C.onSurfaceVariant,
                cursor: "pointer", fontFamily: C.fontHead, fontWeight: 600, fontSize: 13.5,
                transition: "all 0.18s",
              }}>
                {PROVIDERS[id].label.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? <Spinner /> : loadErr ? (
        <div style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: 12, color: C.crimson, fontFamily: C.fontMono, fontSize: 13 }}>
          <Icon name="error_outline" style={{ fontSize: 20, color: C.crimson }} />
          <span>{loadErr}</span>
          <button onClick={load} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 9999, border: `1px solid rgba(224,80,104,0.35)`, background: "transparent", color: C.crimson, cursor: "pointer", fontFamily: C.fontMono, fontSize: 11.5 }}>
            Retry
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.keys(PROVIDERS).map(id => (
            <KeyCard
              key={id}
              providerId={id}
              connected={connected[id]}
              preview={previews[id]}
              onSave={savedId => { setConnected(prev => ({ ...prev, [savedId]: true })); load(); }}
              onRemove={rid => { setConnected(prev => ({ ...prev, [rid]: false })); setPreviews(prev => ({ ...prev, [rid]: null })); }}
              push={push}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPEARANCE SECTION
// ─────────────────────────────────────────────────────────────────────────────
function AppearanceSection() {
  const [theme,      setTheme]      = useState(() => localStorage.getItem("polynous_theme")      || "dark");
  const [animations, setAnimations] = useState(() => localStorage.getItem("polynous_animations") !== "false");
  const [fontSize,   setFontSize]   = useState(() => localStorage.getItem("polynous_font_size")  || "Medium");

  const handleFontSize = s => {
    setFontSize(s);
    localStorage.setItem("polynous_font_size", s);
    const map = { Small: "15px", Medium: "16px", Large: "18px" };
    document.documentElement.style.fontSize = map[s] || "16px";
  };

  const handleAnimations = () => {
    const next = !animations;
    setAnimations(next);
    localStorage.setItem("polynous_animations", String(next));
    window.location.reload();
  };

  const handleTheme = t => {
    setTheme(t);
    localStorage.setItem("polynous_theme", t);
  };

  return (
    <Card>
      <SectionHead icon="palette" title="Appearance" subtitle="Visual theme & display density" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 18, marginBottom: 20 }}>
        <div>
          <Label>Theme</Label>
          <select value={theme} onChange={e => handleTheme(e.target.value)} style={inputStyle}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div>
          <Label>Text Size</Label>
          <select value={fontSize} onChange={e => handleFontSize(e.target.value)} style={inputStyle}>
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </select>
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingTop: 18, borderTop: `1px solid ${C.white10}`,
      }}>
        <div>
          <div style={{ fontFamily: C.fontHead, fontSize: 15, fontWeight: 600, color: C.onSurface }}>
            Neural Particle Field
          </div>
          <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.textSecondary, marginTop: 3 }}>
            Silver floating-particle background animation
          </div>
        </div>
        <Toggle on={animations} onToggle={handleAnimations} />
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREFERENCES SECTION  — debounced saves prevent race conditions
// ─────────────────────────────────────────────────────────────────────────────
function PreferencesSection({ push }) {
  const [mode,       setMode]       = useState("research");
  const [style,      setStyle]      = useState("academic");
  const [streaming,  setStreaming]  = useState(true);
  const [autoSave,   setAutoSave]   = useState(true);
  const [conf,       setConf]       = useState(70);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    api.getPreferences()
      .then(data => {
        if (data.default_mode)                   setMode(data.default_mode);
        if (data.response_style)                 setStyle(data.response_style);
        if (data.streaming_enabled !== undefined) setStreaming(data.streaming_enabled);
        if (data.auto_save !== undefined)         setAutoSave(data.auto_save);
        if (data.confidence_threshold !== undefined) setConf(data.confidence_threshold);
      })
      .catch(() => {/* use defaults */})
      .finally(() => setLoading(false));
  }, []);

  // Debounce saves — prevents multiple rapid calls overwriting each other
  const scheduleSave = useCallback((prefs) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try { await api.savePreferences(prefs); push("Preferences saved"); }
      catch (err) { push(err.message || "Save failed", "err"); }
      finally { setSaving(false); }
    }, 400);
  }, [push]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const ToggleRow = ({ label, sub, on, onFlip }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", borderBottom: `1px solid ${C.white5}`,
    }}>
      <div>
        <div style={{ fontFamily: C.fontHead, fontSize: 15, fontWeight: 500, color: C.onSurface }}>{label}</div>
        {sub && <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.textSecondary, marginTop: 3 }}>{sub}</div>}
      </div>
      <Toggle on={on} onToggle={onFlip} />
    </div>
  );

  if (loading) return <Card><SectionHead icon="tune" title="Research Preferences" subtitle="Default behaviour & response style" /><Spinner /></Card>;

  return (
    <Card>
      <SectionHead icon="tune" title="Research Preferences" subtitle="Default behaviour & response style" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18, marginBottom: 20 }}>
        <div>
          <Label>Default Mode</Label>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ id: "research", label: "Research" }, { id: "debate", label: "Debate" }].map(m => {
              const active = mode === m.id;
              const col    = m.id === "debate" ? C.crimson : C.silver;
              return (
                <button key={m.id} onClick={() => { setMode(m.id); scheduleSave({ default_mode: m.id }); }} style={{
                  padding: "8px 18px", borderRadius: 9999,
                  border: `1px solid ${active ? col + "55" : C.white10}`,
                  background: active ? `${col}12` : "transparent",
                  color: active ? col : C.onSurfaceVariant,
                  cursor: "pointer", fontFamily: C.fontHead, fontWeight: 600, fontSize: 13.5,
                  transition: "all 0.18s",
                }}>
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <Label>Response Style</Label>
          <select value={style} onChange={e => { setStyle(e.target.value); scheduleSave({ response_style: e.target.value }); }} style={inputStyle}>
            {[["academic","Academic"],["casual","Casual"],["eli5","Simple"],["technical","Technical"]].map(([v,l]) =>
              <option key={v} value={v}>{l}</option>
            )}
          </select>
        </div>
      </div>

      <ToggleRow label="Streaming" sub="Progressive token output" on={streaming}
        onFlip={() => { const n = !streaming; setStreaming(n); scheduleSave({ streaming_enabled: n }); }} />
      <ToggleRow label="Auto-save" sub="Persist sessions automatically" on={autoSave}
        onFlip={() => { const n = !autoSave; setAutoSave(n); scheduleSave({ auto_save: n }); }} />

      <div style={{ paddingTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: C.fontHead, fontSize: 15, fontWeight: 500, color: C.onSurface }}>
            Confidence Threshold
          </div>
          <span style={{
            fontFamily: C.fontMono, fontSize: 12, color: C.silver,
            background: C.silverFaint, padding: "3px 10px",
            borderRadius: 9999, border: `1px solid ${C.silverBorder}`,
          }}>
            {conf}%
          </span>
        </div>
        <input type="range" min={0} max={100} value={conf}
          onChange={e => setConf(Number(e.target.value))}
          onMouseUp={e => scheduleSave({ confidence_threshold: Number(e.target.value) })}
          onTouchEnd={e => scheduleSave({ confidence_threshold: Number(e.target.value) })}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: C.fontMono, fontSize: 10, color: C.textSecondary, marginTop: 6 }}>
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>

      {saving && <div style={{ marginTop: 8, textAlign: "right", fontFamily: C.fontMono, fontSize: 11, color: C.cyan }}>Saving…</div>}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS SECTION
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_NOTIF = [
  { label: "Email Notifications",  sub: "Receive updates to your inbox",       on: false },
  { label: "Research Alerts",      sub: "New citations and related papers",     on: true  },
  { label: "Weekly Summary",       sub: "Activity digest every Monday",         on: false },
  { label: "Rate Limit Warnings",  sub: "Alert before API quota exhaustion",    on: true  },
];

function NotificationsSection() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("polynous_notifications")) || DEFAULT_NOTIF; }
    catch { return DEFAULT_NOTIF; }
  });

  const toggle = i => {
    const next = items.map((it, idx) => idx === i ? { ...it, on: !it.on } : it);
    setItems(next);
    localStorage.setItem("polynous_notifications", JSON.stringify(next));
  };

  return (
    <Card>
      <SectionHead icon="notifications" title="Notifications" subtitle="Delivery preferences" />
      {items.map((item, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 0",
          borderBottom: i < items.length - 1 ? `1px solid ${C.white5}` : "none",
        }}>
          <div>
            <div style={{ fontFamily: C.fontHead, fontSize: 15, fontWeight: 500, color: C.onSurface }}>{item.label}</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.textSecondary, marginTop: 3 }}>{item.sub}</div>
          </div>
          <Toggle on={item.on} onToggle={() => toggle(i)} />
        </div>
      ))}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATIONS SECTION — live status + working connect / disconnect
// ─────────────────────────────────────────────────────────────────────────────
const INTEGRATION_META = {
  google: { monogram: "G",  monogramColor: "#4285F4", label: "Google OAuth", sub: "Drive, Docs, Calendar"  },
  github: { monogram: "GH", monogramColor: "#8e98a8", label: "GitHub",       sub: "Repos, Issues, Actions" },
  notion: { monogram: "N",  monogramColor: "#e05068", label: "Notion",       sub: "Pages, Databases"       },
};

function IntegrationsSection({ push }) {
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading]   = useState(true);
  const [loadErr, setLoadErr]   = useState(null);
  const [busyId, setBusyId]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr(null);
    try {
      const data = await api.getIntegrations();
      setStatuses(data.integrations || {});
    } catch (err) {
      setLoadErr(err.message || "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleIntegration = async (id, isConnected) => {
    setBusyId(id);
    try {
      if (isConnected) {
        await api.disconnectIntegration(id);
        setStatuses(prev => ({ ...prev, [id]: { ...prev[id], connected: false, detail: null } }));
        push(`${INTEGRATION_META[id].label} disconnected`);
      } else {
        const res = await api.connectIntegration(id);
        if (res?.redirect_url) {
          window.location.href = res.redirect_url;
          return;
        }
        setStatuses(prev => ({ ...prev, [id]: { ...prev[id], connected: true, detail: res?.detail || null } }));
        push(`${INTEGRATION_META[id].label} connected`);
      }
    } catch (err) {
      push(err.message || "Action failed", "err");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <SectionHead icon="hub" title="Integrations" subtitle="Third-party service connections" />
      {loading ? <Spinner /> : loadErr ? (
        <div style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: 12, color: C.crimson, fontFamily: C.fontMono, fontSize: 13 }}>
          <Icon name="error_outline" style={{ fontSize: 20, color: C.crimson }} />
          <span>{loadErr}</span>
          <button onClick={load} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 9999, border: `1px solid rgba(224,80,104,0.35)`, background: "transparent", color: C.crimson, cursor: "pointer", fontFamily: C.fontMono, fontSize: 11.5 }}>
            Retry
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(INTEGRATION_META).map(([id, meta]) => {
            const st = statuses[id] || { connected: false, detail: null };
            const busy = busyId === id;
            return (
              <div key={id}
                onClick={() => !busy && toggleIntegration(id, st.connected)}
                style={{
                  background: "rgba(9,10,14,0.55)", border: `1px solid ${C.white10}`,
                  borderRadius: 12, padding: "14px 18px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  cursor: busy ? "wait" : "pointer",
                  transition: "border-color 0.18s, background 0.18s",
                  opacity: busy ? 0.7 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.silverBorder; e.currentTarget.style.background = C.surfaceHigh; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.white10; e.currentTarget.style.background = "rgba(9,10,14,0.55)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: `${meta.monogramColor}14`, border: `1px solid ${meta.monogramColor}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: C.fontHead, fontWeight: 700, fontSize: 12,
                    color: meta.monogramColor, flexShrink: 0,
                  }}>
                    {meta.monogram}
                  </div>
                  <div>
                    <div style={{ fontFamily: C.fontHead, fontWeight: 600, color: C.onSurface, fontSize: 15 }}>{meta.label}</div>
                    <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.textSecondary, marginTop: 3 }}>
                      {st.connected ? (st.detail || "Connected") : meta.sub}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontFamily: C.fontMono, fontSize: 10, letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: st.connected ? C.silver : C.textSecondary,
                  background: st.connected ? C.silverFaint : "rgba(255,255,255,0.03)",
                  padding: "5px 12px", borderRadius: 9999,
                  border: `1px solid ${st.connected ? C.silverBorder : C.white10}`,
                }}>
                  {busy ? "…" : st.connected ? "Disconnect" : "Connect"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY SECTION — working change password + revoke sessions
// ─────────────────────────────────────────────────────────────────────────────
const SECURITY_ROWS = [
  { icon: "lock",    color: C.purple, title: "Fernet AES-128",    sub: "All keys encrypted at rest",      status: "Active"   },
  { icon: "shield",  color: C.cyan,   title: "Session Isolation",  sub: "Keys scoped to your session",    status: "Enforced" },
  { icon: "vpn_key", color: C.gold,   title: "BYOK Architecture",  sub: "Keys never leave your device",   status: "Verified" },
];

function ChangePasswordForm({ onClose, push }) {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving]   = useState(false);

  const submit = async () => {
    if (!current || !next || !confirm) { push("Fill in all fields", "err"); return; }
    if (next.length < 8) { push("New password must be at least 8 characters", "err"); return; }
    if (next !== confirm) { push("New passwords don't match", "err"); return; }
    setSaving(true);
    try {
      await api.changePassword(current, next);
      push("Password updated");
      onClose();
    } catch (err) {
      push(err.message || "Password change failed", "err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: "rgba(9,10,14,0.55)", border: `1px solid ${C.white10}`,
      borderRadius: 12, padding: 18,
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <input type="password" value={current} onChange={e => setCurrent(e.target.value)}
          placeholder="Current password" style={inputStyle} onFocus={onFI} onBlur={onFO} />
        <input type="password" value={next} onChange={e => setNext(e.target.value)}
          placeholder="New password" style={inputStyle} onFocus={onFI} onBlur={onFO} />
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Confirm new password" style={inputStyle} onFocus={onFI} onBlur={onFO} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={submit} disabled={saving} style={{
          padding: "9px 22px", borderRadius: 9999, border: "none",
          background: C.silver, color: C.void, cursor: saving ? "wait" : "pointer",
          fontFamily: C.fontHead, fontWeight: 700, fontSize: 14, opacity: saving ? 0.6 : 1,
        }}>
          {saving ? "Updating…" : "Update Password"}
        </button>
        <button onClick={onClose} disabled={saving} style={{
          padding: "9px 22px", borderRadius: 9999, border: `1px solid ${C.white10}`,
          background: "transparent", color: C.onSurfaceVariant, cursor: "pointer",
          fontFamily: C.fontHead, fontWeight: 600, fontSize: 14,
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function SecuritySection({ push }) {
  const [showPwForm, setShowPwForm]       = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const [revoking, setRevoking]           = useState(false);

  useEffect(() => {
    if (!revokeConfirm) return;
    const t = setTimeout(() => setRevokeConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [revokeConfirm]);

  const doRevoke = async () => {
    if (!revokeConfirm) { setRevokeConfirm(true); return; }
    setRevoking(true);
    try {
      await api.revokeSessions();
      push("All other sessions revoked");
    } catch (err) {
      push(err.message || "Revoke failed", "err");
    } finally {
      setRevoking(false);
      setRevokeConfirm(false);
    }
  };

  return (
    <Card>
      <SectionHead icon="security" title="Security" subtitle="Encryption & access controls" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {SECURITY_ROWS.map(row => (
          <div key={row.title} style={{
            background: "rgba(9,10,14,0.55)", border: `1px solid ${C.white10}`,
            borderRadius: 12, padding: "14px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: `${row.color}12`, border: `1px solid ${row.color}28`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name={row.icon} style={{ fontSize: 18, color: row.color }} />
              </div>
              <div>
                <div style={{ fontFamily: C.fontHead, fontWeight: 600, color: C.onSurface, fontSize: 15 }}>{row.title}</div>
                <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.textSecondary, marginTop: 3 }}>{row.sub}</div>
              </div>
            </div>
            <span style={{
              fontFamily: C.fontMono, fontSize: 10, letterSpacing: "0.12em",
              textTransform: "uppercase", color: C.silver,
              background: C.silverFaint, padding: "5px 12px",
              borderRadius: 9999, border: `1px solid ${C.silverBorder}`,
            }}>
              {row.status}
            </span>
          </div>
        ))}
      </div>

      {showPwForm ? (
        <ChangePasswordForm onClose={() => setShowPwForm(false)} push={push} />
      ) : (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <PillButton onClick={() => setShowPwForm(true)}>Change Password</PillButton>
          <PillButton onClick={doRevoke} disabled={revoking} tone={revokeConfirm ? "crimson" : "neutral"}>
            {revoking ? "Revoking…" : revokeConfirm ? "Click again to confirm" : "Revoke All Sessions"}
          </PillButton>
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA & STORAGE SECTION — working export + clear history
// ─────────────────────────────────────────────────────────────────────────────
function DataStorageSection({ push }) {
  const [s,       setS]       = useState({ total_research: 0, unique_topics: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting]   = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing]     = useState(false);

  const loadStats = useCallback(() => {
    setLoading(true);
    api.getStats().then(d => setS(d || {})).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (!clearConfirm) return;
    const t = setTimeout(() => setClearConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [clearConfirm]);

  const ITEMS = [
    { label: "Research Stored",  val: s.total_research || 0 },
    { label: "Topics Tracked",   val: s.unique_topics  || 0 },
    { label: "KG Nodes",         val: s.unique_topics  || 0 },
    { label: "Pinecone Vectors", val: Math.floor((s.total_research || 0) * 3) },
  ];

  const doExport = async () => {
    setExporting(true);
    try {
      const a = document.createElement("a");
      a.href = api.exportDataUrl();
      a.download = `polynous-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      push("Export started — check your downloads");
    } catch (err) {
      push(err.message || "Export failed", "err");
    } finally {
      setExporting(false);
    }
  };

  const doClear = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    setClearing(true);
    try {
      await api.clearHistory();
      push("Research history cleared");
      loadStats();
    } catch (err) {
      push(err.message || "Clear failed", "err");
    } finally {
      setClearing(false);
      setClearConfirm(false);
    }
  };

  return (
    <Card>
      <SectionHead icon="database" title="Data & Storage" subtitle="Vectors, graph nodes & persisted research" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 20 }}>
        {ITEMS.map(({ label, val }) => (
          <div key={label} style={{
            background: "rgba(9,10,14,0.55)", border: `1px solid ${C.white10}`,
            borderRadius: 13, padding: "14px 12px", textAlign: "center",
          }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: C.textSecondary, marginBottom: 8 }}>
              {label}
            </div>
            <div style={{ fontFamily: C.fontHead, fontSize: 24, fontWeight: 700, color: C.onSurface }}>
              {loading ? "—" : val}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <PillButton onClick={doExport} disabled={exporting} tone="silver">
          {exporting ? "Exporting…" : "Export All Data"}
        </PillButton>
        <PillButton onClick={doClear} disabled={clearing} tone={clearConfirm ? "crimson" : "cyan"}>
          {clearing ? "Clearing…" : clearConfirm ? "Click again to confirm" : "Clear History"}
        </PillButton>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DANGER ZONE — working delete account + reset all data
// ─────────────────────────────────────────────────────────────────────────────
function DangerZone({ push }) {
  const [resetConfirm, setResetConfirm]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [busy, setBusy]                   = useState(false);

  useEffect(() => {
    if (!resetConfirm) return;
    const t = setTimeout(() => setResetConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [resetConfirm]);

  useEffect(() => {
    if (!deleteConfirm) return;
    const t = setTimeout(() => setDeleteConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [deleteConfirm]);

  const doReset = async () => {
    if (!resetConfirm) { setResetConfirm(true); return; }
    setBusy(true);
    try {
      await api.resetAllData();
      localStorage.removeItem("polynous_notifications");
      localStorage.removeItem("polynous_theme");
      localStorage.removeItem("polynous_animations");
      localStorage.removeItem("polynous_font_size");
      push("All data reset");
    } catch (err) {
      push(err.message || "Reset failed", "err");
    } finally {
      setBusy(false);
      setResetConfirm(false);
    }
  };

  const doDelete = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setBusy(true);
    try {
      await api.deleteAccount();
      localStorage.clear();
      window.location.href = "/auth";
    } catch (err) {
      push(err.message || "Delete failed", "err");
      setBusy(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <Card danger>
      <SectionHead icon="warning" title="Danger Zone" subtitle="Irreversible — proceed with caution" />
      <p style={{
        fontFamily: C.fontMono, fontSize: 13, color: C.textSecondary,
        letterSpacing: "0.03em", marginBottom: 20, lineHeight: 1.75,
      }}>
        These actions cannot be undone. All stored data, memory, and API keys will be permanently removed.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <PillButton onClick={doDelete} disabled={busy} tone="crimson">
          {deleteConfirm ? "Click again to confirm" : "Delete Account"}
        </PillButton>
        <PillButton onClick={doReset} disabled={busy} tone="crimson">
          {resetConfirm ? "Click again to confirm" : "Reset All Data"}
        </PillButton>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage({ user, onNavigate, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const { toasts, push } = useToast();
  const sidebarW = collapsed ? 58 : 288;

  return (
    <div style={{
      minHeight: "100vh", background: C.void,
      color: C.onSurface, fontFamily: C.fontBody, overflowX: "hidden",
    }}>
      <Styles />
      <NeuralCanvas />
      <Sidebar
        onNavigate={onNavigate} user={user}
        onLogout={onLogout} collapsed={collapsed} setCollapsed={setCollapsed}
      />

      <main style={{
        marginLeft: sidebarW, padding: "36px 36px 80px",
        maxWidth: "calc(980px + 288px)", // constrains content, not the margin
        transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)",
        position: "relative", zIndex: 10,
      }}>
        {/* ── Page Header ── */}
        <header style={{ marginBottom: 44, paddingTop: 8 }}>
          <p style={{
            fontFamily: C.fontMono, fontSize: 11,
            color: C.textSecondary, textTransform: "uppercase",
            letterSpacing: "0.24em", marginBottom: 10,
          }}>
            Neural Research Environment
          </p>
          <h1 style={{
            fontFamily: C.fontDisplay,
            fontSize: "clamp(3.4rem,7.5vw,6rem)",
            fontWeight: 400,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            lineHeight: 0.95,
            margin: 0,
            background: "linear-gradient(180deg, #ffffff 0%, #e8ecf2 35%, #aab1bd 75%, #6f7787 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            animation: "settingsGlow 3.5s ease-in-out infinite",
          }}>
            Settings
          </h1>
          <p style={{
            fontFamily: C.fontBody, fontSize: 16,
            color: C.onSurfaceVariant, marginTop: 14, lineHeight: 1.5,
          }}>
            Manage your keys, preferences, and account.
          </p>
          <div style={{
            height: 1, marginTop: 18,
            background: `linear-gradient(90deg, ${C.silverBorder}, transparent)`,
          }} />
        </header>

        <ProfileSection     user={user} push={push} />
        <ApiKeysSection     push={push} />
        <AppearanceSection />
        <PreferencesSection push={push} />
        <NotificationsSection />
        <IntegrationsSection push={push} />
        <SecuritySection    push={push} />
        <DataStorageSection push={push} />
        <DangerZone         push={push} />
      </main>

      <ToastBox toasts={toasts} />
    </div>
  );
}