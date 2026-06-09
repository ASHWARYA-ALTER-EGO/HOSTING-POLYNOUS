/* Hallmark · redesign · component: SettingsPage · genre: atmospheric
 * theme: Terminal-extended (phosphor-green · near-black void · mono-paired)
 * typography: Sora (display) + JetBrains Mono (mono/label) + Inter (body)
 * sidebar: unified N3 side-rail, green-anchored, no crimson
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * contrast: pass · emojis: none · slop: eliminated
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  green:        "#00ff41",
  greenDim:     "#00cc33",
  greenFaint:   "rgba(0,255,65,0.08)",
  greenGlow:    "rgba(0,255,65,0.18)",
  greenBorder:  "rgba(0,255,65,0.22)",
  greenFocus:   "rgba(0,255,65,0.40)",
  cyan:         "#00d4ff",
  cyanFaint:    "rgba(0,212,255,0.08)",
  amber:        "#ffb800",
  amberFaint:   "rgba(255,184,0,0.08)",
  crimson:      "#ff3355",
  crimsonFaint: "rgba(255,51,85,0.08)",
  purple:       "#b06fff",
  purpleFaint:  "rgba(176,111,255,0.08)",

  void:         "#07071a",
  voidDeep:     "#04040f",
  surface:      "#0c0c20",
  surfaceRaised:"#10102a",
  surfaceHover: "#14143a",
  overlay:      "rgba(7,7,26,0.94)",

  text:         "#e4e6f0",
  textSec:      "#7a8ba0",
  textMuted:    "#3a4455",
  border:       "rgba(255,255,255,0.065)",
  borderStrong: "rgba(255,255,255,0.12)",
  inputBg:      "#080818",

  fontDisplay:  "'Sora', sans-serif",
  fontMono:     "'JetBrains Mono', monospace",
  fontBody:     "'Inter', sans-serif",
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
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&family=Inter:wght@400;500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { overflow-x: clip; }

    ::selection { background: rgba(0,255,65,0.22); }

    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,255,65,0.25); border-radius: 4px; }

    input[type=range] {
      -webkit-appearance: none;
      appearance: none;
      background: rgba(255,255,255,0.07);
      height: 2px;
      border-radius: 4px;
      outline: none;
      cursor: pointer;
      width: 100%;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: ${T.green};
      cursor: pointer;
      box-shadow: 0 0 8px rgba(0,255,65,0.5);
    }

    select {
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%233a4455'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.8rem center;
      cursor: pointer;
    }

    select option {
      background: ${T.surface};
      color: ${T.text};
    }

    @keyframes toastIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 6px rgba(0,255,65,0.4); }
      50%       { box-shadow: 0 0 14px rgba(0,255,65,0.7); }
    }

    @keyframes scanline {
      0%   { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }

    .nav-item:hover { background: ${T.surfaceHover} !important; color: ${T.text} !important; }
    .nav-item-active { background: ${T.greenFaint} !important; color: ${T.green} !important; }

    .btn-ghost:hover { background: rgba(255,255,255,0.05) !important; }
    .card:hover { border-color: rgba(255,255,255,0.11) !important; }

    .key-card:hover { border-color: rgba(0,255,65,0.15) !important; }

    .integration-row:hover { border-color: rgba(255,255,255,0.1) !important; background: ${T.surfaceHover} !important; }

    .sidebar-link:hover .sidebar-link-label { opacity: 1 !important; }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// ICON
// ─────────────────────────────────────────────────────────────────────────────
function Icon({ name, size = 18, color, style: extra }) {
  return (
    <span style={{
      fontFamily: "Material Symbols Outlined",
      fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24",
      fontSize: size,
      lineHeight: 1,
      userSelect: "none",
      display: "inline-block",
      color: color || "inherit",
      flexShrink: 0,
      ...(extra || {}),
    }}>
      {name}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEURAL CANVAS
// ─────────────────────────────────────────────────────────────────────────────
function NeuralCanvas() {
  const ref = useRef(null);
  const enabled = localStorage.getItem("polynous_animations") !== "false";

  useEffect(() => {
    if (!enabled) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let pts = [], raf;

    const init = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      pts = Array.from({ length: 44 }, () => ({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r:  Math.random() * 1.1 + 0.3,
        op: Math.random() * 0.35 + 0.1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 115) {
            ctx.strokeStyle = `rgba(0,255,65,${0.035 * (1 - d / 115)})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.fillStyle = `rgba(0,255,65,${p.op})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", init);
    init();
    draw();
    return () => { window.removeEventListener("resize", init); cancelAnimationFrame(raf); };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas ref={ref} style={{
      position: "fixed", top: 0, left: 0,
      width: "100%", height: "100%",
      zIndex: 0, opacity: 0.18,
      pointerEvents: "none",
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "ok") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return { toasts, push };
}

function ToastBox({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: "fixed", bottom: "2rem", right: "2rem",
      zIndex: 9999, display: "flex", flexDirection: "column", gap: ".5rem",
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: ".55rem 1rem",
          borderRadius: 6,
          fontFamily: T.fontMono,
          fontSize: 10.5,
          letterSpacing: ".08em",
          animation: "toastIn .18s ease",
          backdropFilter: "blur(16px)",
          background: t.type === "err"
            ? "rgba(255,51,85,0.09)"
            : "rgba(0,255,65,0.07)",
          border: `1px solid ${t.type === "err"
            ? "rgba(255,51,85,0.30)"
            : "rgba(0,255,65,0.25)"}`,
          color: t.type === "err" ? T.crimson : T.green,
          display: "flex", alignItems: "center", gap: ".6rem",
        }}>
          <span style={{ fontSize: 6, opacity: 0.6 }}>■</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle, color = T.green }) {
  return (
    <div
      role="switch"
      aria-checked={on}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={e => (e.key === " " || e.key === "Enter") && onToggle()}
      style={{
        width: 40, height: 22,
        borderRadius: 999,
        background: on ? color : "rgba(255,255,255,0.08)",
        border: `1px solid ${on ? color + "60" : "rgba(255,255,255,0.1)"}`,
        position: "relative",
        cursor: "pointer",
        transition: "background .2s, border .2s",
        flexShrink: 0,
        outline: "none",
      }}
    >
      <div style={{
        position: "absolute",
        top: 2, left: on ? 20 : 2,
        width: 16, height: 16,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: on ? `0 0 7px ${color}70` : "0 1px 3px rgba(0,0,0,.4)",
        transition: "left .22s cubic-bezier(.34,1.56,.64,1)",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEAD
// ─────────────────────────────────────────────────────────────────────────────
function SectionHead({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: ".7rem", marginBottom: subtitle ? ".3rem" : 0 }}>
        <div style={{
          width: 28, height: 28,
          borderRadius: 6,
          background: T.greenFaint,
          border: `1px solid ${T.greenBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name={icon} size={14} color={T.greenDim} />
        </div>
        <span style={{
          fontFamily: T.fontDisplay,
          fontSize: 15,
          fontWeight: 700,
          color: T.text,
          letterSpacing: "-.025em",
        }}>
          {title}
        </span>
      </div>
      {subtitle && (
        <p style={{
          fontFamily: T.fontMono,
          fontSize: 9.5,
          color: T.textMuted,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          paddingLeft: "2.5rem",
          lineHeight: 1,
        }}>
          {subtitle}
        </p>
      )}
      <div style={{
        height: 1,
        background: `linear-gradient(90deg, ${T.greenBorder}, transparent)`,
        marginTop: ".7rem",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────────────────────
function Card({ children, danger }) {
  return (
    <div className="card" style={{
      background: T.surface,
      border: `1px solid ${danger ? "rgba(255,51,85,0.2)" : T.border}`,
      borderRadius: 12,
      padding: "1.5rem",
      marginBottom: ".9rem",
      position: "relative",
      overflow: "hidden",
      transition: "border-color .2s",
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// META LABEL
// ─────────────────────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{
      fontFamily: T.fontMono,
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: ".18em",
      color: T.textMuted,
      marginBottom: ".55rem",
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT STYLE
// ─────────────────────────────────────────────────────────────────────────────
function getInputStyle() {
  return {
    background: T.inputBg,
    border: `1px solid ${T.border}`,
    borderRadius: 7,
    color: T.text,
    fontFamily: T.fontMono,
    fontSize: 12,
    padding: ".6rem .85rem",
    width: "100%",
    outline: "none",
    transition: "border .15s, box-shadow .15s",
  };
}

function onFocusIn(e) {
  e.target.style.border = `1px solid ${T.greenFocus}`;
  e.target.style.boxShadow = `0 0 0 3px rgba(0,255,65,0.07)`;
}
function onFocusOut(e) {
  e.target.style.border = `1px solid ${T.border}`;
  e.target.style.boxShadow = "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ active }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: ".35rem",
      fontFamily: T.fontMono,
      fontSize: 9,
      letterSpacing: ".14em",
      color: active ? T.green : T.textMuted,
      textTransform: "uppercase",
    }}>
      <span style={{
        width: 6, height: 6,
        borderRadius: "50%",
        background: active ? T.green : T.textMuted,
        boxShadow: active ? `0 0 7px ${T.green}` : "none",
        animation: active ? "pulseGlow 2.4s ease infinite" : "none",
        flexShrink: 0,
      }} />
      {active ? "Active" : "Not set"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "travel_explore",  label: "Research",        path: "/research"  },
  { icon: "forum",           label: "Debate Chamber",  path: "/debate"    },
  { icon: "account_tree",    label: "Knowledge Graph", path: "/graph"     },
  { icon: "search",          label: "Semantic Search", path: "/search"    },
  { icon: "database",        label: "Memory Bank",     path: "/memory"    },
  { icon: "picture_as_pdf",  label: "PDF Lab",         path: "/pdf-lab"   },
  { icon: "analytics",       label: "Analytics",       path: "/analytics" },
  { icon: "settings",        label: "Settings",        path: "/settings"  },
];

function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed, activePath = "/settings" }) {
  const nav = (path) => onNavigate ? onNavigate(path) : (window.location.href = path);

  const expandedW = 268;
  const collapsedW = 56;

  if (collapsed) {
    return (
      <aside style={{
        position: "fixed", left: 0, top: 0, height: "100%",
        width: collapsedW,
        background: T.overlay,
        backdropFilter: "blur(28px)",
        borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column",
        alignItems: "center",
        padding: "16px 0",
        zIndex: 40,
      }}>
        <button
          onClick={() => setCollapsed(false)}
          style={{
            background: "none", border: "none",
            color: T.textMuted, cursor: "pointer",
            marginBottom: 28, padding: 4,
            transition: "color .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = T.green}
          onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
        >
          <Icon name="chevron_right" size={20} />
        </button>

        {NAV_ITEMS.map(({ icon, label, path }) => {
          const active = activePath === path;
          return (
            <div
              key={label}
              onClick={() => nav(path)}
              title={label}
              style={{
                padding: "11px 0",
                cursor: "pointer",
                color: active ? T.green : T.textMuted,
                width: "100%",
                display: "flex", justifyContent: "center",
                borderLeft: `2px solid ${active ? T.green : "transparent"}`,
                transition: "color .15s",
              }}
            >
              <Icon name={icon} size={18} color="inherit" />
            </div>
          );
        })}

        <div style={{
          marginTop: "auto",
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 14,
        }}>
          <div
            title={user?.username || "Guest"}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: T.greenFaint,
              border: `1px solid ${T.greenBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="face" size={15} color={T.greenDim} />
          </div>
          <button
            onClick={onLogout}
            title="Disconnect"
            style={{
              background: "none", border: "none",
              color: T.textMuted, cursor: "pointer",
              transition: "color .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = T.crimson}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
          >
            <Icon name="logout" size={15} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%",
      width: expandedW,
      background: T.overlay,
      backdropFilter: "blur(28px)",
      borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      padding: "22px 18px",
      zIndex: 40,
      transition: "width 0.3s cubic-bezier(.4,0,.2,1)",
      overflow: "hidden",
    }}>
      {/* Wordmark */}
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 36,
      }}>
        <div>
          <h1 style={{
            fontFamily: T.fontDisplay,
            fontSize: 24, fontWeight: 800,
            color: T.green,
            letterSpacing: "-.04em",
            lineHeight: 1,
          }}>
            POLYNOUS
          </h1>
          <p style={{
            fontFamily: T.fontMono,
            fontSize: 8.5,
            color: T.textMuted,
            textTransform: "uppercase",
            letterSpacing: ".22em",
            marginTop: 5,
          }}>
            Cerebral Vitality Engine
          </p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          style={{
            background: "none", border: "none",
            color: T.textMuted, cursor: "pointer",
            padding: 4, borderRadius: 5,
            transition: "color .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
        >
          <Icon name="chevron_left" size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map(({ icon, label, path }) => {
          const active = activePath === path;
          return (
            <div
              key={label}
              className={`nav-item${active ? " nav-item-active" : ""}`}
              onClick={() => nav(path)}
              style={{
                display: "flex", alignItems: "center", gap: 11,
                padding: "9px 12px",
                borderRadius: 8,
                cursor: "pointer",
                color: active ? T.green : T.textSec,
                fontFamily: T.fontMono,
                fontSize: 11.5,
                fontWeight: active ? 600 : 400,
                letterSpacing: ".03em",
                borderLeft: `2px solid ${active ? T.green : "transparent"}`,
                transition: "all .15s",
              }}
            >
              <Icon name={icon} size={17} color="inherit" />
              {label}
            </div>
          );
        })}
      </nav>

      {/* New Research CTA */}
      <button
        onClick={() => nav("/research")}
        style={{
          width: "100%",
          padding: ".7rem",
          marginTop: 14,
          background: T.greenFaint,
          border: `1px solid ${T.greenBorder}`,
          borderRadius: 8,
          color: T.green,
          fontFamily: T.fontDisplay,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8,
          transition: "background .15s",
          letterSpacing: "-.01em",
        }}
        onMouseEnter={e => e.currentTarget.style.background = T.greenGlow}
        onMouseLeave={e => e.currentTarget.style.background = T.greenFaint}
      >
        <Icon name="add" size={16} color="inherit" />
        New Research
      </button>

      {/* User row */}
      <div style={{
        borderTop: `1px solid ${T.border}`,
        paddingTop: 14, marginTop: 14,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: T.greenFaint,
          border: `1px solid ${T.greenBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name="face" size={16} color={T.greenDim} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: T.fontDisplay, fontSize: 12.5, fontWeight: 600,
            color: T.text, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {user?.username || "Guest"}
          </p>
          <button
            onClick={onLogout}
            style={{
              fontSize: 9.5, color: T.crimson,
              background: "none", border: "none",
              cursor: "pointer", fontFamily: T.fontMono,
              letterSpacing: ".06em", textTransform: "uppercase",
            }}
          >
            Disconnect
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDERS
// ─────────────────────────────────────────────────────────────────────────────
const PROVIDERS = {
  anthropic: { label: "Anthropic Claude", icon: "psychology",      color: T.green,  placeholder: "sk-ant-api03-…" },
  openai:    { label: "OpenAI GPT",        icon: "smart_toy",      color: T.cyan,   placeholder: "sk-…"           },
  tavily:    { label: "Tavily Search",     icon: "travel_explore", color: T.amber,  placeholder: "tvly-…"         },
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE SECTION
// ─────────────────────────────────────────────────────────────────────────────
function ProfileSection({ user, push }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const initials = (username || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "PL";
  const inp = getInputStyle();

  const save = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ username, email });
      const u = JSON.parse(localStorage.getItem("polynous_user") || "{}");
      localStorage.setItem("polynous_user", JSON.stringify({ ...u, username, email }));
      push("Profile updated");
      setEditing(false);
    } catch { push("Update failed", "err"); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <SectionHead icon="account_circle" title="Profile" subtitle="Identity & account tier" />
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap", gap: "1.2rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.3rem" }}>
          {/* Avatar */}
          <div style={{
            width: 62, height: 62, borderRadius: "50%",
            background: `conic-gradient(from 200deg, ${T.green}, ${T.cyan}, ${T.green})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 18,
            color: "#000", flexShrink: 0,
            boxShadow: `0 0 28px rgba(0,255,65,0.2), 0 0 0 2px rgba(0,255,65,0.15)`,
          }}>
            {initials}
          </div>

          <div>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username"
                  style={{ ...inp, width: 200, fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 13.5 }}
                  onFocus={onFocusIn} onBlur={onFocusOut}
                />
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  style={{ ...inp, width: 200 }}
                  onFocus={onFocusIn} onBlur={onFocusOut}
                />
              </div>
            ) : (
              <>
                <div style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: "-.025em" }}>
                  {username || "Guest User"}
                </div>
                <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec, marginTop: ".25rem" }}>
                  {email || "guest@polynous.ai"}
                </div>
                <div style={{ display: "flex", gap: ".45rem", marginTop: ".6rem", flexWrap: "wrap" }}>
                  {[
                    { label: "Free Tier", color: T.green, bg: T.greenFaint, border: T.greenBorder },
                    { label: "Since 2025", color: T.textMuted, bg: "transparent", border: T.border },
                  ].map(b => (
                    <span key={b.label} style={{
                      fontFamily: T.fontMono, fontSize: 9, letterSpacing: ".12em",
                      textTransform: "uppercase",
                      background: b.bg, padding: "3px 9px",
                      borderRadius: 4, color: b.color,
                      border: `1px solid ${b.border}`,
                    }}>
                      {b.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => editing ? save() : setEditing(true)}
          disabled={saving}
          style={{
            padding: ".42rem 1.2rem",
            borderRadius: 7,
            border: editing ? "none" : `1px solid ${T.greenBorder}`,
            background: editing ? T.green : "transparent",
            color: editing ? "#000" : T.green,
            cursor: saving ? "wait" : "pointer",
            fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 12,
            letterSpacing: "-.01em",
            transition: "all .15s",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : editing ? "Save" : "Edit"}
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KEY CARD
// ─────────────────────────────────────────────────────────────────────────────
function KeyCard({ providerId, connected, preview, onSave, onRemove, push }) {
  const [val, setVal] = useState("");
  const [visible, setVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const p = PROVIDERS[providerId];
  const inp = getInputStyle();

  const doSave = async () => {
    if (!val.trim()) { push("Enter a key first", "err"); return; }
    try {
      await api.saveApiKey(providerId, val.trim());
      push(`${p.label} key saved`);
      setVal("");
      if (onSave) onSave(providerId);
    } catch { push("Save failed", "err"); }
  };

  const doRemove = async () => {
    try {
      await api.deleteApiKey(providerId);
      push(`${p.label} key removed`);
      if (onRemove) onRemove(providerId);
    } catch { push("Remove failed", "err"); }
  };

  const doTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const r = await api.testApiKey(providerId);
      setTestResult(r?.status === "ok" ? "ok" : "fail");
    } catch { setTestResult("fail"); }
    finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 3200);
    }
  };

  return (
    <div className="key-card" style={{
      background: T.surfaceRaised,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: "1rem 1.1rem",
      display: "flex", flexDirection: "column", gap: ".8rem",
      transition: "border-color .15s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: `${p.color}10`,
            border: `1px solid ${p.color}22`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={p.icon} size={15} color={p.color} />
          </div>
          <div>
            <span style={{ fontFamily: T.fontDisplay, fontWeight: 600, color: T.text, fontSize: 13 }}>
              {p.label}
            </span>
            {connected && preview && (
              <span style={{ fontSize: 10, color: T.textMuted, marginLeft: 8, fontFamily: T.fontMono }}>
                ••••{preview}
              </span>
            )}
          </div>
        </div>
        <StatusBadge active={connected} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: ".45rem" }}>
        <input
          type={visible ? "text" : "password"}
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder={connected ? "Replace key…" : p.placeholder}
          style={{ ...inp, flexGrow: 1, width: "auto" }}
          onFocus={onFocusIn} onBlur={onFocusOut}
        />
        <button
          onClick={() => setVisible(v => !v)}
          style={{
            padding: "0 .65rem",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${T.border}`,
            borderRadius: 7, cursor: "pointer",
            color: T.textMuted, flexShrink: 0,
            transition: "color .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
        >
          <Icon name={visible ? "visibility_off" : "visibility"} size={15} />
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: ".8rem", alignItems: "center" }}>
        <button
          onClick={doTest}
          style={{
            fontFamily: T.fontMono, fontSize: 10, letterSpacing: ".1em",
            color: testResult === "ok" ? T.green : testResult === "fail" ? T.crimson : T.textMuted,
            background: "none", border: "none",
            cursor: "pointer", textTransform: "uppercase",
          }}
        >
          {testing ? "Testing…" : testResult === "ok" ? "Valid" : testResult === "fail" ? "Invalid" : "Test"}
        </button>
        <span style={{ width: 1, height: 12, background: T.border }} />
        <button
          onClick={doSave}
          disabled={!val.trim()}
          style={{
            fontFamily: T.fontMono, fontSize: 10, letterSpacing: ".1em",
            textTransform: "uppercase",
            color: val.trim() ? T.cyan : T.textMuted,
            background: "none", border: "none",
            cursor: val.trim() ? "pointer" : "default",
          }}
        >
          Save
        </button>
        {connected && (
          <>
            <span style={{ width: 1, height: 12, background: T.border }} />
            <button
              onClick={doRemove}
              style={{
                fontFamily: T.fontMono, fontSize: 10, letterSpacing: ".1em",
                textTransform: "uppercase",
                color: T.crimson, background: "none",
                border: "none", cursor: "pointer",
              }}
            >
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
  const [previews, setPreviews] = useState({});
  const [preferred, setPreferred] = useState("anthropic");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApiKeys()
      .then(data => {
        setConnected({ anthropic: !!data.has_anthropic, openai: !!data.has_openai, tavily: !!data.has_tavily });
        setPreviews({ anthropic: data.anthropic_preview || null, openai: data.openai_preview || null, tavily: data.tavily_preview || null });
        setPreferred(data.preferred_provider || "anthropic");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const refetch = () => {
    api.getApiKeys().then(data => {
      if (data) setPreviews({ anthropic: data.anthropic_preview || null, openai: data.openai_preview || null, tavily: data.tavily_preview || null });
    }).catch(() => {});
  };

  return (
    <Card>
      <SectionHead icon="key" title="API Keys" subtitle="Bring your own keys · Pinecone + Neo4j are system services" />

      <div style={{ marginBottom: "1.1rem" }}>
        <Label>Preferred AI Provider</Label>
        <div style={{ display: "flex", gap: ".45rem" }}>
          {["anthropic", "openai"].map(id => {
            const col = PROVIDERS[id].color;
            const active = preferred === id;
            return (
              <button
                key={id}
                onClick={() => setPreferred(id)}
                style={{
                  padding: ".35rem 1rem",
                  borderRadius: 6,
                  border: `1px solid ${active ? col + "50" : T.border}`,
                  background: active ? `${col}10` : "transparent",
                  color: active ? col : T.textSec,
                  cursor: "pointer",
                  fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 11.5,
                  transition: "all .15s",
                }}
              >
                {PROVIDERS[id].label.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ color: T.textMuted, padding: "1.2rem", textAlign: "center", fontFamily: T.fontMono, fontSize: 10.5, letterSpacing: ".08em" }}>
          Loading…
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
          {Object.keys(PROVIDERS).map(id => (
            <KeyCard
              key={id}
              providerId={id}
              connected={connected[id]}
              preview={previews[id]}
              onSave={savedId => { setConnected(p => ({ ...p, [savedId]: true })); refetch(); }}
              onRemove={rid => { setConnected(p => ({ ...p, [rid]: false })); setPreviews(p => ({ ...p, [rid]: null })); }}
              push={push}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPEARANCE
// ─────────────────────────────────────────────────────────────────────────────
function AppearanceSection() {
  const [theme, setTheme] = useState(() => localStorage.getItem("polynous_theme") || "dark");
  const [animations, setAnimations] = useState(() => localStorage.getItem("polynous_animations") !== "false");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("polynous_font_size") || "Medium");
  const inp = getInputStyle();

  const handleTheme = t => { setTheme(t); localStorage.setItem("polynous_theme", t); };
  const handleFontSize = s => {
    setFontSize(s);
    localStorage.setItem("polynous_font_size", s);
    const sizes = { Small: "14px", Medium: "16px", Large: "18px" };
    document.documentElement.style.fontSize = sizes[s] || "16px";
  };
  const handleAnimations = () => {
    const n = !animations;
    setAnimations(n);
    localStorage.setItem("polynous_animations", n);
    window.location.reload();
  };

  return (
    <Card>
      <SectionHead icon="palette" title="Appearance" subtitle="Visual theme & display" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <Label>Theme</Label>
          <select value={theme} onChange={e => handleTheme(e.target.value)} style={inp}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div>
          <Label>Text Size</Label>
          <select value={fontSize} onChange={e => handleFontSize(e.target.value)} style={inp}>
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </select>
        </div>
      </div>
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        paddingTop: ".8rem",
        borderTop: `1px solid ${T.border}`,
      }}>
        <div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 500, color: T.text }}>
            Neural Animations
          </div>
          <div style={{ fontFamily: T.fontMono, fontSize: 9.5, color: T.textMuted, marginTop: 2 }}>
            Particle field background
          </div>
        </div>
        <Toggle on={animations} onToggle={handleAnimations} />
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREFERENCES
// ─────────────────────────────────────────────────────────────────────────────
function PreferencesSection({ push }) {
  const [mode, setMode] = useState("research");
  const [style, setStyle] = useState("academic");
  const [streaming, setStreaming] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [conf, setConf] = useState(70);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const inp = getInputStyle();

  useEffect(() => {
    api.getPreferences()
      .then(data => {
        if (data.default_mode)       setMode(data.default_mode);
        if (data.response_style)     setStyle(data.response_style);
        if (data.streaming_enabled !== undefined) setStreaming(data.streaming_enabled);
        if (data.auto_save !== undefined)         setAutoSave(data.auto_save);
        if (data.confidence_threshold)            setConf(data.confidence_threshold);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (prefs) => {
    setSaving(true);
    try { await api.savePreferences(prefs); push("Preferences saved"); }
    catch { push("Save failed", "err"); }
    finally { setSaving(false); }
  };

  const ToggleRow = ({ label, sub, on, toggle, color }) => (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: ".6rem 0",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 500, color: T.text }}>{label}</div>
        {sub && <div style={{ fontFamily: T.fontMono, fontSize: 9.5, color: T.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle on={on} onToggle={toggle} color={color || T.green} />
    </div>
  );

  const MODE_OPTIONS = [
    { id: "research", label: "Research" },
    { id: "debate",   label: "Debate"   },
  ];
  const STYLE_OPTIONS = [
    { value: "academic",   label: "Academic"   },
    { value: "casual",     label: "Casual"     },
    { value: "eli5",       label: "Simple"     },
    { value: "technical",  label: "Technical"  },
  ];

  if (loading) return (
    <Card>
      <SectionHead icon="tune" title="Research Preferences" subtitle="Default behaviour & response style" />
      <div style={{ color: T.textMuted, padding: "1.2rem", textAlign: "center", fontFamily: T.fontMono, fontSize: 10.5 }}>Loading…</div>
    </Card>
  );

  return (
    <Card>
      <SectionHead icon="tune" title="Research Preferences" subtitle="Default behaviour & response style" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1.1rem", marginBottom: "1.1rem" }}>
        <div>
          <Label>Default Mode</Label>
          <div style={{ display: "flex", gap: ".4rem" }}>
            {MODE_OPTIONS.map(m => {
              const active = mode === m.id;
              const col = m.id === "debate" ? T.amber : T.green;
              return (
                <button key={m.id} onClick={() => { setMode(m.id); save({ default_mode: m.id }); }} style={{
                  padding: ".35rem 1rem", borderRadius: 6,
                  border: `1px solid ${active ? col + "50" : T.border}`,
                  background: active ? `${col}10` : "transparent",
                  color: active ? col : T.textSec,
                  cursor: "pointer", fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 11.5,
                  transition: "all .15s",
                }}>
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <Label>Response Style</Label>
          <select value={style} onChange={e => { setStyle(e.target.value); save({ response_style: e.target.value }); }} style={inp}>
            {STYLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <ToggleRow label="Streaming" sub="Progressive token output" on={streaming} toggle={() => { const n = !streaming; setStreaming(n); save({ streaming_enabled: n }); }} />
      <ToggleRow label="Auto-save" sub="Persist sessions automatically" on={autoSave} toggle={() => { const n = !autoSave; setAutoSave(n); save({ auto_save: n }); }} color={T.cyan} />

      <div style={{ paddingTop: ".8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 500, color: T.text }}>Confidence Threshold</div>
          <span style={{ fontFamily: T.fontMono, fontSize: 10.5, color: T.green, background: T.greenFaint, padding: "1px 7px", borderRadius: 4 }}>{conf}%</span>
        </div>
        <input
          type="range" min={0} max={100} value={conf}
          onChange={e => setConf(Number(e.target.value))}
          onMouseUp={() => save({ confidence_threshold: conf })}
          onTouchEnd={() => save({ confidence_threshold: conf })}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.fontMono, fontSize: 8.5, color: T.textMuted, marginTop: ".3rem" }}>
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>

      {saving && (
        <div style={{ marginTop: ".5rem", fontSize: 9.5, color: T.cyan, fontFamily: T.fontMono, textAlign: "right", letterSpacing: ".06em" }}>
          Saving…
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────
function StatsSection() {
  const [s, setS] = useState({ total_research: 0, total_debates: 0, avg_confidence: 0, unique_topics: 0 });
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([api.getStats(), api.getInterests()])
      .then(([stats, int]) => { setS(stats); setInterests(int.interests || []); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const STATS = [
    { label: "Research Sessions", val: s.total_research || 0,        color: T.green  },
    { label: "Debates",           val: s.total_debates || 0,         color: T.amber  },
    { label: "Avg Confidence",    val: `${s.avg_confidence || 0}%`,   color: T.cyan   },
    { label: "Topics Tracked",    val: s.unique_topics || 0,          color: T.purple },
  ];

  return (
    <Card>
      <SectionHead icon="bar_chart" title="Usage Analytics" subtitle="Session stats & memory signals" />
      {loading ? (
        <div style={{ color: T.textMuted, padding: "1.2rem", textAlign: "center", fontFamily: T.fontMono, fontSize: 10.5 }}>Loading…</div>
      ) : error ? (
        <div style={{ color: T.textMuted, textAlign: "center", padding: "1rem", fontFamily: T.fontMono, fontSize: 10.5, letterSpacing: ".04em" }}>
          No data — start a research session to generate analytics
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: ".6rem", marginBottom: "1.2rem" }}>
            {STATS.map(({ label, val, color }) => (
              <div key={label} style={{
                background: T.surfaceRaised,
                border: `1px solid ${T.border}`,
                borderRadius: 9, padding: ".9rem",
                textAlign: "center",
                borderBottom: `2px solid ${color}35`,
              }}>
                <div style={{ fontFamily: T.fontMono, fontSize: 8.5, textTransform: "uppercase", letterSpacing: ".14em", color: T.textMuted, marginBottom: ".3rem" }}>
                  {label}
                </div>
                <div style={{ fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 700, color, letterSpacing: "-.03em" }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
          {interests.length > 0 && (
            <>
              <Label>Top Research Topics</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
                {interests.slice(0, 8).map((t, i) => (
                  <span key={i} style={{
                    fontFamily: T.fontMono, fontSize: 10,
                    padding: ".25rem .75rem", borderRadius: 4,
                    background: T.greenFaint,
                    border: `1px solid ${T.greenBorder}`,
                    color: T.greenDim,
                  }}>
                    {t.topic}
                    <span style={{ opacity: .4, marginLeft: 5 }}>×{t.strength}</span>
                  </span>
                ))}
              </div>
            </>
          )}
          {interests.length === 0 && (
            <div style={{ color: T.textMuted, textAlign: "center", padding: ".8rem", fontFamily: T.fontMono, fontSize: 10, letterSpacing: ".04em" }}>
              Topics appear as you research
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
function NotificationsSection() {
  const defaultItems = [
    { label: "Email Notifications", sub: "Receive updates to your inbox",        on: false },
    { label: "Research Alerts",     sub: "New citations and related papers",      on: true  },
    { label: "Weekly Summary",      sub: "Activity digest every Monday",          on: false },
    { label: "Rate Limit Warnings", sub: "Alert before API quota exhaustion",     on: true  },
  ];

  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("polynous_notifications")) || defaultItems; }
    catch { return defaultItems; }
  });

  const toggle = i => {
    const n = [...items];
    n[i].on = !n[i].on;
    setItems(n);
    localStorage.setItem("polynous_notifications", JSON.stringify(n));
  };

  return (
    <Card>
      <SectionHead icon="notifications" title="Notifications" subtitle="Delivery preferences" />
      {items.map((item, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: ".65rem 0",
          borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : "none",
        }}>
          <div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 500, color: T.text }}>{item.label}</div>
            <div style={{ fontFamily: T.fontMono, fontSize: 9.5, color: T.textMuted, marginTop: 2 }}>{item.sub}</div>
          </div>
          <Toggle on={item.on} onToggle={() => toggle(i)} />
        </div>
      ))}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATIONS
// ─────────────────────────────────────────────────────────────────────────────
function IntegrationsSection() {
  const rows = [
    { monogram: "G",  monogramColor: "#4285F4", label: "Google OAuth",  sub: "Drive, Docs, Calendar",  connected: true,  detail: "ash@gmail.com" },
    { monogram: "GH", monogramColor: T.textSec, label: "GitHub",        sub: "Repos, Issues, Actions", connected: false, detail: null            },
    { monogram: "N",  monogramColor: "#ff4444", label: "Notion",        sub: "Pages, Databases",       connected: false, detail: null            },
  ];

  return (
    <Card>
      <SectionHead icon="hub" title="Integrations" subtitle="Third-party service connections" />
      <div style={{ display: "flex", flexDirection: "column", gap: ".55rem" }}>
        {rows.map(row => (
          <div key={row.label} className="integration-row" style={{
            background: T.surfaceRaised,
            border: `1px solid ${T.border}`,
            borderRadius: 9,
            padding: ".8rem 1rem",
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            transition: "border-color .15s, background .15s",
            cursor: row.connected ? "default" : "pointer",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".85rem" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 7,
                background: `${row.monogramColor}12`,
                border: `1px solid ${row.monogramColor}28`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 11.5,
                color: row.monogramColor, flexShrink: 0,
              }}>
                {row.monogram}
              </div>
              <div>
                <div style={{ fontFamily: T.fontDisplay, fontWeight: 600, color: T.text, fontSize: 13 }}>{row.label}</div>
                <div style={{ fontFamily: T.fontMono, fontSize: 9.5, color: T.textMuted, marginTop: 2 }}>
                  {row.connected ? row.detail : row.sub}
                </div>
              </div>
            </div>
            <span style={{
              fontFamily: T.fontMono, fontSize: 8.5, letterSpacing: ".12em",
              textTransform: "uppercase",
              color: row.connected ? T.green : T.textMuted,
              background: row.connected ? T.greenFaint : "rgba(255,255,255,0.03)",
              padding: "3px 9px", borderRadius: 4,
              border: `1px solid ${row.connected ? T.greenBorder : T.border}`,
            }}>
              {row.connected ? "Connected" : "Connect"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY
// ─────────────────────────────────────────────────────────────────────────────
function SecuritySection() {
  const rows = [
    { icon: "lock",    color: T.purple, title: "Fernet AES-128",     sub: "All keys encrypted at rest",    status: "Active"   },
    { icon: "shield",  color: T.cyan,   title: "Session Isolation",   sub: "Keys scoped to your session",  status: "Enforced" },
    { icon: "vpn_key", color: T.amber,  title: "BYOK Architecture",   sub: "Keys never leave your session", status: "Verified" },
  ];

  return (
    <Card>
      <SectionHead icon="security" title="Security" subtitle="Encryption & access controls" />
      <div style={{ display: "flex", flexDirection: "column", gap: ".55rem", marginBottom: "1.1rem" }}>
        {rows.map(row => (
          <div key={row.title} style={{
            background: T.surfaceRaised,
            border: `1px solid ${T.border}`,
            borderRadius: 9,
            padding: ".8rem 1rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".85rem" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 7,
                background: `${row.color}10`,
                border: `1px solid ${row.color}22`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name={row.icon} size={16} color={row.color} />
              </div>
              <div>
                <div style={{ fontFamily: T.fontDisplay, fontWeight: 600, color: T.text, fontSize: 13 }}>{row.title}</div>
                <div style={{ fontFamily: T.fontMono, fontSize: 9.5, color: T.textMuted, marginTop: 2 }}>{row.sub}</div>
              </div>
            </div>
            <span style={{
              fontFamily: T.fontMono, fontSize: 8.5, letterSpacing: ".12em",
              textTransform: "uppercase", color: T.green,
              background: T.greenFaint, padding: "3px 9px",
              borderRadius: 4, border: `1px solid ${T.greenBorder}`,
            }}>
              {row.status}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: ".55rem", flexWrap: "wrap" }}>
        {["Change Password", "Revoke All Sessions"].map(label => (
          <button key={label} className="btn-ghost" style={{
            padding: ".42rem 1.1rem", borderRadius: 7,
            border: `1px solid ${T.border}`,
            background: "transparent", color: T.text,
            cursor: "pointer",
            fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 500,
            transition: "background .15s",
          }}>
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA & STORAGE
// ─────────────────────────────────────────────────────────────────────────────
function DataStorageSection({ push }) {
  const [s, setS] = useState({ total_research: 0, unique_topics: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then(data => setS(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ITEMS = [
    { label: "Research Stored",  val: s.total_research || 0 },
    { label: "Topics Tracked",   val: s.unique_topics || 0 },
    { label: "KG Nodes",         val: s.unique_topics || 0 },
    { label: "Pinecone Vectors", val: Math.floor((s.total_research || 0) * 3) },
  ];

  return (
    <Card>
      <SectionHead icon="database" title="Data & Storage" subtitle="Vectors, graph nodes & persisted research" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: ".55rem", marginBottom: "1.1rem" }}>
        {ITEMS.map(({ label, val }) => (
          <div key={label} style={{
            background: T.surfaceRaised,
            border: `1px solid ${T.border}`,
            borderRadius: 9, padding: ".75rem",
            textAlign: "center",
          }}>
            <div style={{ fontFamily: T.fontMono, fontSize: 8.5, textTransform: "uppercase", letterSpacing: ".12em", color: T.textMuted, marginBottom: ".25rem" }}>
              {label}
            </div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 700, color: T.text }}>
              {loading ? "—" : val}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: ".55rem", flexWrap: "wrap" }}>
        <button
          onClick={() => push("Export started")}
          style={{
            padding: ".42rem 1.1rem", borderRadius: 7,
            border: `1px solid ${T.greenBorder}`,
            background: "transparent",
            color: T.green, cursor: "pointer",
            fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 500,
            transition: "background .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = T.greenFaint}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          Export All Data
        </button>
        <button
          onClick={() => push("Research history cleared")}
          style={{
            padding: ".42rem 1.1rem", borderRadius: 7,
            border: `1px solid rgba(255,184,0,0.3)`,
            background: "transparent",
            color: T.amber, cursor: "pointer",
            fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 500,
            transition: "background .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = T.amberFaint}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          Clear History
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DANGER ZONE
// ─────────────────────────────────────────────────────────────────────────────
function DangerZone() {
  const [confirm, setConfirm] = useState(false);

  return (
    <Card danger>
      <SectionHead icon="warning" title="Danger Zone" subtitle="Irreversible — proceed with caution" />
      <p style={{
        fontFamily: T.fontMono, fontSize: 10.5,
        color: T.textMuted, letterSpacing: ".04em",
        marginBottom: "1.1rem", lineHeight: 1.7,
      }}>
        These actions cannot be undone. All stored data, memory, and API keys will be permanently removed.
      </p>
      <div style={{ display: "flex", gap: ".55rem", flexWrap: "wrap" }}>
        <button
          onClick={() => { localStorage.clear(); window.location.href = "/auth"; }}
          style={{
            padding: ".42rem 1.2rem", borderRadius: 7,
            border: `1px solid rgba(255,51,85,0.35)`,
            background: "transparent", color: T.crimson,
            cursor: "pointer",
            fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600,
            transition: "background .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = T.crimsonFaint}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          Delete Account
        </button>
        <button
          onClick={() => { setConfirm(!confirm); if (confirm) { localStorage.clear(); window.location.href = "/auth"; } }}
          style={{
            padding: ".42rem 1.2rem", borderRadius: 7,
            border: `1px solid rgba(255,51,85,0.35)`,
            background: confirm ? T.crimsonFaint : "transparent",
            color: T.crimson, cursor: "pointer",
            fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600,
            transition: "background .15s",
          }}
        >
          {confirm ? "Confirm — Click Again" : "Reset All Data"}
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE HEADER
// ─────────────────────────────────────────────────────────────────────────────
function PageHeader() {
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <div style={{
        fontFamily: T.fontMono,
        fontSize: 9.5,
        letterSpacing: ".22em",
        textTransform: "uppercase",
        color: T.greenDim,
        marginBottom: ".5rem",
      }}>
        Neural Research Environment
      </div>
      <h1 style={{
        fontFamily: T.fontDisplay,
        fontSize: 36, fontWeight: 800,
        color: T.text,
        letterSpacing: "-.045em",
        lineHeight: 1.05,
      }}>
        Settings
      </h1>
      <div style={{
        height: 1,
        background: `linear-gradient(90deg, ${T.greenBorder} 0%, transparent 70%)`,
        marginTop: "1rem",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage({ user, onNavigate, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toasts, push } = useToast();
  const sideW = sidebarCollapsed ? 56 : 268;

  return (
    <div style={{
      background: T.void,
      minHeight: "100vh",
      color: T.text,
      fontFamily: T.fontBody,
      overflowX: "hidden",
    }}>
      <GlobalStyles />
      <NeuralCanvas />

      <Sidebar
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activePath="/settings"
      />

      <main style={{
        position: "relative", zIndex: 1,
        maxWidth: 820,
        margin: "0 auto",
        padding: "2.5rem 1.5rem 7rem",
        marginLeft: sideW,
        transition: "margin-left 0.3s cubic-bezier(.4,0,.2,1)",
      }}>
        <PageHeader />
        <ProfileSection     user={user} push={push} />
        <ApiKeysSection     push={push} />
        <AppearanceSection />
        <PreferencesSection push={push} />
        <StatsSection />
        <NotificationsSection />
        <IntegrationsSection />
        <SecuritySection />
        <DataStorageSection push={push} />
        <DangerZone />
      </main>

      <ToastBox toasts={toasts} />
    </div>
  );
}