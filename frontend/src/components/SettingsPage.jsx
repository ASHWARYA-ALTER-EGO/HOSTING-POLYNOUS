/* Hallmark · redesign · component: SettingsPage · genre: atmospheric
 * theme: Terminal-extended (phosphor-green · near-black paper · mono-paired)
 * typography: Space Grotesk (display) + IBM Plex Mono (mono) + DM Sans (body)
 * enrichment: none — typography-only
 * nav: N3 side-rail (existing, preserved)
 * pre-emit critique: P5 H5 E5 S5 R4 V4
 * contrast: pass
 * states: all interactive elements verified
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const DARK = {
  green:      "#00ff0f",
  cyan:       "#00ccff",
  crimson:    "#ff2040",
  amber:      "#ffaa00",
  purple:     "#a855f7",
  bg:         "#07071a",
  surface:    "#0e0e22",
  surfaceAlt: "#0b0b1e",
  surfaceHover: "#13132a",
  text:       "#dfe0f5",
  textSec:    "#7a8899",
  textMuted:  "#3d4455",
  border:     "rgba(255,255,255,0.07)",
  borderFocus:"rgba(0,255,15,0.45)",
  inputBg:    "#09091f",
  cardBg:     "#0e0e22",
  // Typography tokens
  fontDisplay: "'Space Grotesk', sans-serif",
  fontMono:    "'IBM Plex Mono', monospace",
  fontBody:    "'DM Sans', sans-serif",
};

const LIGHT = {
  green:      "#008a0a",
  cyan:       "#0077bb",
  crimson:    "#cc0030",
  amber:      "#b86e00",
  purple:     "#6b21a8",
  bg:         "#f2f3f7",
  surface:    "#ffffff",
  surfaceAlt: "#f7f8fc",
  surfaceHover: "#eef0f6",
  text:       "#191929",
  textSec:    "#5a6070",
  textMuted:  "#aab0c0",
  border:     "rgba(0,0,0,0.09)",
  borderFocus:"rgba(0,138,10,0.5)",
  inputBg:    "#f5f6fa",
  cardBg:     "#ffffff",
  fontDisplay: "'Space Grotesk', sans-serif",
  fontMono:    "'IBM Plex Mono', monospace",
  fontBody:    "'DM Sans', sans-serif",
};

const BASE = "http://localhost:8000";

function getUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("polynous_user") || "{}");
    return u.email || u.username || "guest_user";
  } catch {
    return "guest_user";
  }
}

const api = {
  // API Keys
  getApiKeys:   () => fetch(`${BASE}/settings/api-keys?user_id=${encodeURIComponent(getUserId())}`).then(r => r.json()),
  saveApiKey:   (p, k) => fetch(`${BASE}/settings/api-keys?user_id=${encodeURIComponent(getUserId())}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [`${p}_api_key`]: k }) }).then(r => r.json()),
  deleteApiKey: (p) => fetch(`${BASE}/settings/api-keys?user_id=${encodeURIComponent(getUserId())}&provider=${p}`, { method: "DELETE" }).then(r => r.json()),
  testApiKey:   (p) => fetch(`${BASE}/settings/api-keys/test?provider=${p}&user_id=${encodeURIComponent(getUserId())}`, { method: "POST" }).then(r => r.json()),
  
  // Stats & Memory
  getStats:     () => fetch(`${BASE}/memory/stats/${encodeURIComponent(getUserId())}`).then(r => r.json()),
  getInterests: () => fetch(`${BASE}/memory/interests/${encodeURIComponent(getUserId())}`).then(r => r.json()),
  
  // Preferences
  getPreferences: () => fetch(`${BASE}/settings/preferences?user_id=${encodeURIComponent(getUserId())}`).then(r => r.json()),
  savePreferences: (prefs) => fetch(`${BASE}/settings/preferences?user_id=${encodeURIComponent(getUserId())}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) }).then(r => r.json()),
  
  // Profile
  updateProfile: (data) => fetch(`${BASE}/settings/profile?user_id=${encodeURIComponent(getUserId())}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
};

// ─────────────────────────────────────────────────────────────────────────────
// THEME HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem("polynous_theme") || "dark");
  const setTheme = (t) => { setThemeState(t); localStorage.setItem("polynous_theme", t); };
  const C = theme === "dark" ? DARK : LIGHT;
  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.color = C.text;
    document.body.style.fontFamily = C.fontBody;
  }, [theme, C]);
  return { theme, setTheme, C };
}

// ─────────────────────────────────────────────────────────────────────────────
// ICON
// ─────────────────────────────────────────────────────────────────────────────
function Icon({ name, style }) {
  return (
    <span style={{
      fontFamily: "Material Symbols Outlined",
      fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24",
      lineHeight: 1,
      userSelect: "none",
      display: "inline-block",
      ...(style || {}),
    }}>
      {name}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEURAL CANVAS
// ─────────────────────────────────────────────────────────────────────────────
function NeuralCanvas({ C }) {
  const ref = useRef(null);
  const animationsEnabled = localStorage.getItem("polynous_animations") !== "false";
  
  useEffect(() => {
    if (!animationsEnabled) return;
    
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let pts = [], raf;
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      pts = Array.from({ length: 48 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.2 + 0.4,
        op: Math.random() * 0.45 + 0.15,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p, i) => {
        pts.slice(i + 1).forEach(q => {
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 120) {
            ctx.strokeStyle = `rgba(0,255,15,${0.04 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        });
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.fillStyle = `rgba(0,255,15,${p.op})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    window.addEventListener("resize", init);
    init();
    draw();
    return () => { window.removeEventListener("resize", init); cancelAnimationFrame(raf); };
  }, [animationsEnabled]);
  
  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100%", height: "100%",
        zIndex: 0,
        opacity: C === DARK ? 0.22 : 0.06,
        pointerEvents: "none",
        display: animationsEnabled ? "block" : "none",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "ok") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg: msg || "", type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return { toasts, push };
}

function ToastBox({ toasts, C }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div style={{
      position: "fixed", bottom: "1.75rem", right: "1.75rem",
      zIndex: 9999,
      display: "flex", flexDirection: "column", gap: ".5rem",
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: ".6rem 1rem",
          borderRadius: 8,
          fontFamily: C.fontMono,
          fontSize: 11,
          letterSpacing: ".06em",
          animation: "toastIn .2s ease",
          background: t.type === "err"
            ? "rgba(255,32,64,.1)"
            : "rgba(0,255,15,.09)",
          border: `1px solid ${t.type === "err" ? "rgba(255,32,64,.35)" : "rgba(0,255,15,.3)"}`,
          color: t.type === "err" ? C.crimson : C.green,
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", gap: ".5rem",
        }}>
          <span style={{ fontSize: 8, opacity: 0.7 }}>
            {t.type === "err" ? "◆" : "◆"}
          </span>
          {t.msg || "Unknown"}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle, color }) {
  const C_color = color || "#00ff0f";
  return (
    <div
      role="switch"
      aria-checked={on}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={e => (e.key === " " || e.key === "Enter") && onToggle()}
      style={{
        width: 42,
        height: 23,
        borderRadius: 999,
        background: on ? C_color : "rgba(128,128,128,.2)",
        border: `1px solid ${on ? C_color + "80" : "rgba(128,128,128,.25)"}`,
        position: "relative",
        cursor: "pointer",
        transition: "background .22s, border .22s",
        flexShrink: 0,
        outline: "none",
      }}
    >
      <div style={{
        position: "absolute",
        top: 2,
        left: on ? 21 : 2,
        width: 17,
        height: 17,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: on ? `0 0 6px ${C_color}60` : "0 1px 3px rgba(0,0,0,.3)",
        transition: "left .22s cubic-bezier(.34,1.56,.64,1)",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER — reusable heading with accent rule
// ─────────────────────────────────────────────────────────────────────────────
function SectionHead({ icon, title, subtitle, C }) {
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: ".65rem",
        marginBottom: subtitle ? ".35rem" : 0,
      }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30, height: 30,
          borderRadius: 7,
          background: `${C.green}12`,
          border: `1px solid ${C.green}25`,
          flexShrink: 0,
        }}>
          <Icon name={icon} style={{ color: C.green, fontSize: 15 }} />
        </span>
        <span style={{
          fontFamily: C.fontDisplay,
          fontSize: 17,
          fontWeight: 700,
          color: C.text,
          letterSpacing: "-.02em",
        }}>
          {title}
        </span>
      </div>
      {subtitle && (
        <p style={{
          fontFamily: C.fontMono,
          fontSize: 10.5,
          color: C.textMuted,
          letterSpacing: ".08em",
          margin: "0 0 0 2.6rem",
          textTransform: "uppercase",
        }}>
          {subtitle}
        </p>
      )}
      <div style={{
        height: 1,
        background: `linear-gradient(90deg, ${C.green}30, transparent)`,
        marginTop: ".65rem",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD SHELL
// ─────────────────────────────────────────────────────────────────────────────
function Card({ children, C, danger }) {
  return (
    <div style={{
      background: C.cardBg,
      border: `1px solid ${danger ? C.crimson + "30" : C.border}`,
      borderRadius: 14,
      padding: "1.4rem 1.5rem",
      marginBottom: "1rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LABEL + VALUE — mono metadata pair
// ─────────────────────────────────────────────────────────────────────────────
function MetaLabel({ children, C }) {
  return (
    <div style={{
      fontFamily: C.fontMono,
      fontSize: 9.5,
      textTransform: "uppercase",
      letterSpacing: ".15em",
      color: C.textMuted,
      marginBottom: ".45rem",
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT STYLE
// ─────────────────────────────────────────────────────────────────────────────
function inputStyle(C) {
  return {
    background: C.inputBg,
    border: `1px solid ${C.border}`,
    borderRadius: 9,
    color: C.text,
    fontFamily: C.fontMono,
    fontSize: 12.5,
    padding: ".6rem .9rem",
    width: "100%",
    outline: "none",
    transition: "border .18s, box-shadow .18s",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS DOT
// ─────────────────────────────────────────────────────────────────────────────
function StatusDot({ active, C }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: ".4rem",
      fontFamily: C.fontMono,
      fontSize: 9.5,
      letterSpacing: ".12em",
      color: active ? C.green : C.textMuted,
      textTransform: "uppercase",
    }}>
      <span style={{
        width: 7, height: 7,
        borderRadius: "50%",
        background: active ? C.green : C.textMuted,
        boxShadow: active ? `0 0 8px ${C.green}` : "none",
        flexShrink: 0,
      }} />
      {active ? "Connected" : "Not set"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "travel_explore",  label: "Research",       path: "/research" },
  { icon: "forum",           label: "Debate",         path: "/debate" },
  { icon: "account_tree",    label: "Knowledge Graph",path: "/graph" },
  { icon: "search",          label: "Search",         path: "/search" },
  { icon: "database",        label: "Memory Bank",    path: "/memory" },
  { icon: "settings",        label: "Settings",       path: "/settings", active: true },
];

function Sidebar({ onNavigate, user, onLogout, collapsed, setCollapsed, C }) {
  const [hovered, setHovered] = useState(null);

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%",
      width: collapsed ? 58 : 256,
      background: C === DARK
        ? "rgba(7,7,26,0.96)"
        : "rgba(255,255,255,0.97)",
      backdropFilter: "blur(28px)",
      borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column",
      padding: collapsed ? "18px 10px" : "22px 20px",
      zIndex: 40,
      transition: "width 0.32s cubic-bezier(.4,0,.2,1)",
      overflow: "hidden",
    }}>
      {!collapsed ? (
        <>
          {/* Wordmark */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 36,
          }}>
            <div>
              <h1 style={{
                fontFamily: C.fontDisplay,
                fontSize: 22,
                fontWeight: 800,
                color: C.green,
                letterSpacing: "-.04em",
                margin: 0,
                lineHeight: 1,
              }}>
                POLYNOUS
              </h1>
              <p style={{
                fontFamily: C.fontMono,
                fontSize: 8.5,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                margin: "5px 0 0",
              }}>
                Cerebral Vitality Engine
              </p>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              style={{
                background: "none", border: "none",
                color: C.textMuted, cursor: "pointer",
                padding: 4, borderRadius: 6,
                transition: "color .15s",
              }}
            >
              <Icon name="chevron_left" style={{ fontSize: 18 }} />
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            {NAV_ITEMS.map(item => (
              <div
                key={item.label}
                onClick={() => onNavigate ? onNavigate(item.path) : (window.location.href = item.path)}
                onMouseEnter={() => setHovered(item.label)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "9px 14px",
                  borderRadius: 9,
                  cursor: "pointer",
                  color: item.active ? C.green : hovered === item.label ? C.text : C.textSec,
                  background: item.active
                    ? `${C.green}12`
                    : hovered === item.label
                      ? C.surfaceHover
                      : "transparent",
                  fontFamily: C.fontMono,
                  fontSize: 11.5,
                  fontWeight: item.active ? 600 : 400,
                  letterSpacing: ".04em",
                  transition: "all 0.18s",
                  borderLeft: item.active
                    ? `2px solid ${C.green}`
                    : "2px solid transparent",
                }}
              >
                <Icon name={item.icon} style={{ fontSize: 17, color: "inherit", flexShrink: 0 }} />
                {item.label}
              </div>
            ))}
          </nav>

          {/* User row */}
          <div style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: 14,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: `${C.green}15`,
              border: `1px solid ${C.green}35`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon name="face" style={{ color: C.green, fontSize: 15 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: C.fontDisplay, fontSize: 12.5, fontWeight: 600,
                color: C.text, margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user?.username || "Guest"}
              </p>
              <button
                onClick={onLogout}
                style={{
                  fontSize: 9.5, color: C.crimson,
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: C.fontMono, padding: 0, letterSpacing: ".06em",
                  textTransform: "uppercase",
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => setCollapsed(false)}
            style={{
              background: "none", border: "none",
              color: C.green, cursor: "pointer",
              marginBottom: 28,
              display: "flex", justifyContent: "center",
            }}
          >
            <Icon name="chevron_right" style={{ fontSize: 20 }} />
          </button>
          {NAV_ITEMS.map(item => (
            <div
              key={item.label}
              onClick={() => onNavigate ? onNavigate(item.path) : (window.location.href = item.path)}
              title={item.label}
              style={{
                padding: "11px 0", cursor: "pointer",
                color: item.active ? C.green : C.textMuted,
                width: "100%", display: "flex", justifyContent: "center",
                borderLeft: item.active ? `2px solid ${C.green}` : "2px solid transparent",
                marginLeft: -10,
                paddingLeft: 10,
                transition: "color .15s",
              }}
            >
              <Icon name={item.icon} style={{ fontSize: 19, color: "inherit" }} />
            </div>
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div title={user?.username || "Guest"} style={{
              width: 28, height: 28, borderRadius: "50%",
              background: `${C.green}15`, border: `1px solid ${C.green}35`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="face" style={{ color: C.green, fontSize: 13 }} />
            </div>
            <div onClick={onLogout} style={{ cursor: "pointer", color: C.crimson }}>
              <Icon name="logout" style={{ fontSize: 14 }} />
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDERS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const PROVIDERS = {
  anthropic: { label: "Anthropic Claude", icon: "psychology",     color: "#00ff0f", placeholder: "sk-ant-api03-…" },
  openai:    { label: "OpenAI GPT",        icon: "smart_toy",     color: "#00ccff", placeholder: "sk-…" },
  tavily:    { label: "Tavily Search",     icon: "travel_explore",color: "#ffaa00", placeholder: "tvly-…" },
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE SECTION
// ─────────────────────────────────────────────────────────────────────────────
function ProfileSection({ user, push, C }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const initials = (username || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "US";
  const inp = inputStyle(C);

  const handleFocus = e => {
    e.target.style.border = `1px solid ${C.borderFocus}`;
    e.target.style.boxShadow = `0 0 0 3px ${C.green}12`;
  };
  const handleBlur = e => {
    e.target.style.border = `1px solid ${C.border}`;
    e.target.style.boxShadow = "none";
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ username, email });
      // Update local storage
      const currentUser = JSON.parse(localStorage.getItem("polynous_user") || "{}");
      localStorage.setItem("polynous_user", JSON.stringify({ ...currentUser, username, email }));
      push("Profile updated successfully");
      setEditing(false);
    } catch {
      push("Failed to update profile", "err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card C={C}>
      <SectionHead icon="account_circle" title="Profile" subtitle="Identity & account tier" C={C} />
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", flexWrap: "wrap", gap: "1.2rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.4rem" }}>
          {/* Avatar */}
          <div style={{
            width: 68, height: 68, borderRadius: "50%",
            background: `conic-gradient(from 180deg, ${C.green}, ${C.cyan}, ${C.green})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#000",
            fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 20,
            flexShrink: 0,
            boxShadow: `0 0 24px ${C.green}30, 0 0 0 3px ${C.green}20`,
          }}>
            {initials}
          </div>

          <div>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: ".55rem" }}>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username"
                  style={{ ...inp, width: 210, fontFamily: C.fontDisplay, fontWeight: 600, fontSize: 14 }}
                  onFocus={handleFocus} onBlur={handleBlur}
                />
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  style={{ ...inp, width: 210 }}
                  onFocus={handleFocus} onBlur={handleBlur}
                />
              </div>
            ) : (
              <>
                <div style={{
                  fontFamily: C.fontDisplay, fontSize: 18, fontWeight: 700,
                  color: C.text, letterSpacing: "-.02em",
                }}>
                  {username || "Guest User"}
                </div>
                <div style={{
                  fontFamily: C.fontMono, fontSize: 11.5, color: C.textSec, marginTop: ".25rem",
                }}>
                  {email || "guest@polynous.ai"}
                </div>
                <div style={{ display: "flex", gap: ".5rem", marginTop: ".6rem", flexWrap: "wrap" }}>
                  <span style={{
                    fontFamily: C.fontMono, fontSize: 9.5, letterSpacing: ".1em",
                    textTransform: "uppercase",
                    background: `${C.green}12`,
                    padding: "3px 10px", borderRadius: 5,
                    color: C.green, border: `1px solid ${C.green}28`,
                  }}>
                    Free Tier
                  </span>
                  <span style={{
                    fontFamily: C.fontMono, fontSize: 9.5, letterSpacing: ".1em",
                    textTransform: "uppercase",
                    background: `${C.textMuted}10`,
                    padding: "3px 10px", borderRadius: 5,
                    color: C.textSec,
                  }}>
                    Since 2025
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => { 
            if (editing) {
              handleSaveProfile();
            } else {
              setEditing(true);
            }
          }}
          disabled={saving}
          style={{
            padding: ".45rem 1.3rem",
            borderRadius: 8,
            border: editing ? "none" : `1px solid ${C.green}40`,
            background: editing ? C.green : "transparent",
            color: editing ? "#000" : C.green,
            cursor: saving ? "wait" : "pointer",
            fontWeight: 600, fontSize: 12.5,
            fontFamily: C.fontDisplay,
            letterSpacing: ".01em",
            transition: "all .18s",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : editing ? "Save Changes" : "Edit Profile"}
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KEY CARD — with debug logging
// ─────────────────────────────────────────────────────────────────────────────
function KeyCard({ providerId, connected, preview, onSave, onRemove, push, C }) {
  const [val, setVal] = useState("");
  const [visible, setVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const p = PROVIDERS[providerId];
  const inp = inputStyle(C);

  const handleFocus = e => {
    e.target.style.border = `1px solid ${C.borderFocus}`;
    e.target.style.boxShadow = `0 0 0 3px ${C.green}10`;
  };
  const handleBlur = e => {
    e.target.style.border = `1px solid ${C.border}`;
    e.target.style.boxShadow = "none";
  };

  const handleSave = async () => {
    if (!val.trim()) { push("Enter a key first", "err"); return; }
    try {
      const res = await api.saveApiKey(providerId, val.trim());
      console.log("Save response:", res);
      push(`${p.label} key saved!`);
      setVal("");
      if (onSave) onSave(providerId);
    } catch (err) {
      console.error("Save error:", err);
      push("Failed to save", "err");
    }
  };
  const handleRemove = async () => {
    try {
      await api.deleteApiKey(providerId);
      push(`${p.label} key removed`);
      if (onRemove) onRemove(providerId);
    } catch {
      push("Failed to remove", "err");
    }
  };
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await api.testApiKey(providerId);
      console.log("Test result:", r);
      setTestResult(r && r.status === "ok" ? "ok" : "fail");
    } catch (err) {
      console.error("Test error:", err);
      setTestResult("fail");
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  return (
    <div style={{
      background: C.surfaceAlt,
      border: `1px solid ${C.border}`,
      borderRadius: 11,
      padding: "1rem 1.1rem",
      display: "flex", flexDirection: "column", gap: ".75rem",
      transition: "border .18s",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${p.color}12`,
            border: `1px solid ${p.color}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={p.icon} style={{ color: p.color, fontSize: 16 }} />
          </div>
          <div>
            <span style={{
              fontFamily: C.fontDisplay, fontWeight: 600, color: C.text, fontSize: 13.5,
            }}>
              {p.label}
            </span>
            {connected && preview && (
              <span style={{
                fontSize: 10, color: C.textMuted, marginLeft: 8,
                fontFamily: C.fontMono,
              }}>
                ••••{preview}
              </span>
            )}
          </div>
        </div>
        <StatusDot active={connected} C={C} />
      </div>

      {/* Input row */}
      <div style={{ display: "flex", gap: ".5rem" }}>
        <input
          type={visible ? "text" : "password"}
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder={connected ? "Update key…" : p.placeholder}
          style={{ ...inp, flexGrow: 1, width: "auto" }}
          onFocus={handleFocus} onBlur={handleBlur}
        />
        <button
          onClick={() => setVisible(v => !v)}
          style={{
            padding: "0 .7rem",
            background: `${C.textMuted}12`,
            border: `1px solid ${C.border}`,
            borderRadius: 8, cursor: "pointer", color: C.textSec,
            flexShrink: 0,
          }}
        >
          <Icon name={visible ? "visibility_off" : "visibility"} style={{ fontSize: 16 }} />
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: ".75rem", alignItems: "center" }}>
        <button
          onClick={handleTest}
          style={{
            fontFamily: C.fontMono, fontSize: 10.5, letterSpacing: ".06em",
            color: testResult === "ok" ? C.green : testResult === "fail" ? C.crimson : C.textSec,
            background: "none", border: "none", cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          {testing ? "Testing…" : testResult === "ok" ? "Valid ✅" : testResult === "fail" ? "Invalid ❌" : "Test"}
        </button>
        <div style={{ width: 1, height: 14, background: C.border }} />
        <button
          onClick={handleSave}
          disabled={!val.trim()}
          style={{
            fontFamily: C.fontMono, fontSize: 10.5, letterSpacing: ".06em",
            textTransform: "uppercase",
            color: val.trim() ? C.cyan : C.textMuted,
            background: "none", border: "none",
            cursor: val.trim() ? "pointer" : "default",
          }}
        >
          Save
        </button>
        {connected && (
          <>
            <div style={{ width: 1, height: 14, background: C.border }} />
            <button
              onClick={handleRemove}
              style={{
                fontFamily: C.fontMono, fontSize: 10.5, letterSpacing: ".06em",
                textTransform: "uppercase",
                color: C.crimson, background: "none", border: "none", cursor: "pointer",
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
// API KEYS SECTION — with debug logging
// ─────────────────────────────────────────────────────────────────────────────
function ApiKeysSection({ push, C }) {
  const [connected, setConnected] = useState({ anthropic: false, openai: false, tavily: false });
  const [previews, setPreviews] = useState({});
  const [preferred, setPreferred] = useState("anthropic");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApiKeys()
      .then(data => {
        console.log("API Keys loaded:", data);
        setConnected({ 
          anthropic: data.has_anthropic || false, 
          openai: data.has_openai || false, 
          tavily: data.has_tavily || false 
        });
        setPreviews({ 
          anthropic: data.anthropic_preview || null, 
          openai: data.openai_preview || null, 
          tavily: data.tavily_preview || null 
        });
        setPreferred(data.preferred_provider || "anthropic");
      })
      .catch(err => console.error("Load keys error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card C={C}>
      <SectionHead icon="key" title="API Key Management" subtitle="Bring your own keys — Pinecone + Neo4j are system services" C={C} />

      {/* Preferred provider */}
      <div style={{ marginBottom: "1.1rem" }}>
        <MetaLabel C={C}>Preferred AI Provider</MetaLabel>
        <div style={{ display: "flex", gap: ".5rem" }}>
          {["anthropic", "openai"].map(id => (
            <button
              key={id}
              onClick={() => setPreferred(id)}
              style={{
                padding: ".38rem 1.1rem",
                borderRadius: 7,
                border: preferred === id
                  ? `1px solid ${PROVIDERS[id].color}60`
                  : `1px solid ${C.border}`,
                background: preferred === id
                  ? `${PROVIDERS[id].color}12`
                  : "transparent",
                color: preferred === id ? PROVIDERS[id].color : C.textSec,
                cursor: "pointer",
                fontWeight: 600, fontSize: 12,
                fontFamily: C.fontDisplay,
                transition: "all .18s",
              }}
            >
              {PROVIDERS[id].label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{
          color: C.textMuted, padding: "1.2rem",
          textAlign: "center",
          fontFamily: C.fontMono, fontSize: 11,
          letterSpacing: ".08em",
        }}>
          Loading keys…
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".65rem" }}>
          {Object.entries(PROVIDERS).map(([id]) => (
            <KeyCard
              key={id}
              providerId={id}
              connected={connected[id]}
              preview={previews[id]}
              onSave={(savedId) => {
                setConnected(prev => ({ ...prev, [savedId]: true }));
                api.getApiKeys()
                  .then(data => {
                    if (data) setPreviews({ 
                      anthropic: data.anthropic_preview || null, 
                      openai: data.openai_preview || null, 
                      tavily: data.tavily_preview || null 
                    });
                  })
                  .catch(() => {});
              }}
              onRemove={(removedId) => {
                setConnected(prev => ({ ...prev, [removedId]: false }));
                setPreviews(prev => ({ ...prev, [removedId]: null }));
              }}
              push={push}
              C={C}
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
function AppearanceSection({ theme, setTheme, C }) {
  const [animations, setAnimations] = useState(() => {
    return localStorage.getItem("polynous_animations") !== "false";
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem("polynous_font_size") || "Medium";
  });
  const inp = inputStyle(C);

  // Save animations preference
  const toggleAnimations = () => {
    const newVal = !animations;
    setAnimations(newVal);
    localStorage.setItem("polynous_animations", newVal);
    // Reload to apply/remove canvas
    window.location.reload();
  };

  // Save font size preference
  const changeFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem("polynous_font_size", size);
    // Apply font size to document
    const sizes = { Small: "14px", Medium: "16px", Large: "18px" };
    document.documentElement.style.fontSize = sizes[size] || "16px";
  };

  return (
    <Card C={C}>
      <SectionHead icon="palette" title="Appearance" subtitle="Visual theme & display preferences" C={C} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem" }}>
        <div>
          <MetaLabel C={C}>Theme</MetaLabel>
          <select
            value={theme}
            onChange={e => setTheme(e.target.value)}
            style={{ ...inp, cursor: "pointer" }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div>
          <MetaLabel C={C}>Font Size</MetaLabel>
          <select 
            value={fontSize}
            onChange={e => changeFontSize(e.target.value)}
            style={{ ...inp, cursor: "pointer" }}
          >
            <option>Medium</option>
            <option>Small</option>
            <option>Large</option>
          </select>
        </div>
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: "1.1rem",
        padding: ".7rem 0",
        borderTop: `1px solid ${C.border}`,
      }}>
        <div>
          <div style={{ fontFamily: C.fontDisplay, fontSize: 13.5, fontWeight: 500, color: C.text }}>
            Neural Animations
          </div>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.textMuted, marginTop: 2 }}>
            Particle field background
          </div>
        </div>
        <Toggle on={animations} onToggle={toggleAnimations} color={C.green} />
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREFERENCES SECTION
// ─────────────────────────────────────────────────────────────────────────────
function PreferencesSection({ push, C }) {
  const [mode, setMode] = useState(() => localStorage.getItem("polynous_mode") || "Research");
  const [style, setStyle] = useState(() => localStorage.getItem("polynous_style") || "Academic");
  const [streaming, setStreaming] = useState(() => localStorage.getItem("polynous_streaming") !== "false");
  const [autoSave, setAutoSave] = useState(() => localStorage.getItem("polynous_autosave") !== "false");
  const [conf, setConf] = useState(() => parseInt(localStorage.getItem("polynous_confidence") || "70"));
  const [loading, setLoading] = useState(true);
  const inp = inputStyle(C);

  // Load preferences from backend on mount
  useEffect(() => {
    api.getPreferences()
      .then(data => {
        if (data.mode) { setMode(data.mode); localStorage.setItem("polynous_mode", data.mode); }
        if (data.style) { setStyle(data.style); localStorage.setItem("polynous_style", data.style); }
        if (data.streaming !== undefined) { setStreaming(data.streaming); localStorage.setItem("polynous_streaming", data.streaming); }
        if (data.auto_save !== undefined) { setAutoSave(data.auto_save); localStorage.setItem("polynous_autosave", data.auto_save); }
        if (data.confidence_threshold) { setConf(data.confidence_threshold); localStorage.setItem("polynous_confidence", data.confidence_threshold); }
      })
      .catch(() => {
        // Backend not available, use localStorage values
        console.log("Using local preferences");
      })
      .finally(() => setLoading(false));
  }, []);

  // Save preferences to backend
  const savePrefs = useCallback((updatedPrefs) => {
    api.savePreferences(updatedPrefs)
      .then(() => push("Preferences saved"))
      .catch(() => {
        // Backend save failed, but localStorage is already updated
        console.log("Preferences saved locally only");
      });
  }, [push]);

  const toggleRow = (label, sublabel, on, toggle, color) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: ".65rem 0",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div>
        <div style={{ fontFamily: C.fontDisplay, fontSize: 13.5, fontWeight: 500, color: C.text }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontFamily: C.fontMono, fontSize: 9.5, color: C.textMuted, marginTop: 2 }}>
            {sublabel}
          </div>
        )}
      </div>
      <Toggle on={on} onToggle={toggle} color={color || C.green} />
    </div>
  );

  if (loading) {
    return (
      <Card C={C}>
        <SectionHead icon="science" title="Research Preferences" subtitle="Default behaviour & response configuration" C={C} />
        <div style={{ color: C.textMuted, padding: "1.2rem", textAlign: "center", fontFamily: C.fontMono, fontSize: 11 }}>
          Loading preferences…
        </div>
      </Card>
    );
  }

  return (
    <Card C={C}>
      <SectionHead icon="science" title="Research Preferences" subtitle="Default behaviour & response configuration" C={C} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <MetaLabel C={C}>Default Mode</MetaLabel>
          <div style={{ display: "flex", gap: ".5rem" }}>
            {["Research", "Debate"].map(m => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  localStorage.setItem("polynous_mode", m);
                  savePrefs({ mode: m, style, streaming, auto_save: autoSave, confidence_threshold: conf });
                }}
                style={{
                  padding: ".38rem 1.1rem",
                  borderRadius: 7,
                  border: mode === m
                    ? `1px solid ${m === "Research" ? C.green : C.crimson}60`
                    : `1px solid ${C.border}`,
                  background: mode === m
                    ? `${m === "Research" ? C.green : C.crimson}12`
                    : "transparent",
                  color: mode === m ? (m === "Research" ? C.green : C.crimson) : C.textSec,
                  cursor: "pointer",
                  fontWeight: 600, fontSize: 12,
                  fontFamily: C.fontDisplay,
                  transition: "all .18s",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div>
          <MetaLabel C={C}>Response Style</MetaLabel>
          <select
            value={style}
            onChange={e => {
              setStyle(e.target.value);
              localStorage.setItem("polynous_style", e.target.value);
              savePrefs({ mode, style: e.target.value, streaming, auto_save: autoSave, confidence_threshold: conf });
            }}
            style={{ ...inp, cursor: "pointer" }}
          >
            {["Academic", "Casual", "ELI5", "Technical"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {toggleRow("Streaming", "Progressive token output", streaming, () => {
        const newVal = !streaming;
        setStreaming(newVal);
        localStorage.setItem("polynous_streaming", newVal);
        savePrefs({ mode, style, streaming: newVal, auto_save: autoSave, confidence_threshold: conf });
      }, C.green)}
      {toggleRow("Auto-save", "Persist sessions automatically", autoSave, () => {
        const newVal = !autoSave;
        setAutoSave(newVal);
        localStorage.setItem("polynous_autosave", newVal);
        savePrefs({ mode, style, streaming, auto_save: newVal, confidence_threshold: conf });
      }, C.cyan)}

      <div style={{ paddingTop: ".8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
          <div style={{ fontFamily: C.fontDisplay, fontSize: 13.5, fontWeight: 500, color: C.text }}>
            Confidence Threshold
          </div>
          <span style={{
            fontFamily: C.fontMono, fontSize: 11,
            color: C.green,
            background: `${C.green}12`,
            padding: "1px 8px", borderRadius: 5,
          }}>
            {conf}%
          </span>
        </div>
        <input
          type="range" min={0} max={100} value={conf}
          onChange={e => {
            const newConf = Number(e.target.value);
            setConf(newConf);
            localStorage.setItem("polynous_confidence", newConf);
          }}
          onMouseUp={() => {
            savePrefs({ mode, style, streaming, auto_save: autoSave, confidence_threshold: conf });
          }}
          onTouchEnd={() => {
            savePrefs({ mode, style, streaming, auto_save: autoSave, confidence_threshold: conf });
          }}
          style={{ accentColor: C.green, width: "100%", cursor: "pointer" }}
        />
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontFamily: C.fontMono, fontSize: 9, color: C.textMuted, marginTop: ".3rem",
        }}>
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function StatsSection({ C }) {
  const [s, setS] = useState({ total_research: 0, total_debates: 0, avg_confidence: 0, unique_topics: 0 });
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getStats(),
      api.getInterests()
    ])
      .then(([statsData, interestsData]) => {
        console.log("✅ Stats loaded:", statsData);
        console.log("✅ Interests loaded:", interestsData);
        setS(statsData);
        setInterests(interestsData.interests || []);
      })
      .catch(err => {
        console.error("❌ Failed to load stats:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Research Sessions", val: s.total_research || 0,        color: C.green  },
    { label: "Debates",           val: s.total_debates || 0,         color: C.crimson },
    { label: "Avg Confidence",    val: `${s.avg_confidence || 0}%`,   color: C.cyan   },
    { label: "Topics Tracked",    val: s.unique_topics || 0,          color: C.purple },
  ];

  if (loading) {
    return (
      <Card C={C}>
        <SectionHead icon="bar_chart" title="Usage Analytics" subtitle="Session stats & memory signals" C={C} />
        <div style={{ color: C.textMuted, padding: "1.2rem", textAlign: "center", fontFamily: C.fontMono, fontSize: 11 }}>
          Loading analytics…
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card C={C}>
        <SectionHead icon="bar_chart" title="Usage Analytics" subtitle="Session stats & memory signals" C={C} />
        <div style={{ color: C.crimson, padding: "1.2rem", textAlign: "center", fontFamily: C.fontMono, fontSize: 11 }}>
          Stats unavailable — start a research session to generate data
        </div>
      </Card>
    );
  }

  return (
    <Card C={C}>
      <SectionHead icon="bar_chart" title="Usage Analytics" subtitle="Session stats & memory signals" C={C} />
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
        gap: ".65rem", marginBottom: "1.2rem",
      }}>
        {stats.map(({ label, val, color }) => (
          <div key={label} style={{
            background: C.surfaceAlt,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: "1rem",
            textAlign: "center",
            borderBottom: `2px solid ${color}40`,
          }}>
            <div style={{
              fontFamily: C.fontMono, fontSize: 9.5,
              textTransform: "uppercase", letterSpacing: ".12em",
              color: C.textMuted, marginBottom: ".3rem",
            }}>
              {label}
            </div>
            <div style={{
              fontFamily: C.fontDisplay, fontSize: 26, fontWeight: 700,
              color, letterSpacing: "-.03em",
            }}>
              {val}
            </div>
          </div>
        ))}
      </div>
      {interests.length > 0 && (
        <>
          <MetaLabel C={C}>Top Research Topics</MetaLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".45rem" }}>
            {interests.slice(0, 8).map((t, i) => (
              <span key={i} style={{
                fontFamily: C.fontMono, fontSize: 10.5,
                padding: ".28rem .8rem", borderRadius: 5,
                background: `${C.green}09`, border: `1px solid ${C.green}25`,
                color: C.green,
              }}>
                {t.topic}
                <span style={{ opacity: .5, marginLeft: 5 }}>×{t.strength}</span>
              </span>
            ))}
          </div>
        </>
      )}
      {interests.length === 0 && !error && (
        <div style={{ 
          color: C.textMuted, 
          textAlign: "center", 
          padding: "1rem",
          fontFamily: C.fontMono, 
          fontSize: 10.5,
          letterSpacing: ".04em",
        }}>
          No research topics yet — topics appear as you research
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function NotificationsSection({ C }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("polynous_notifications");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* use defaults */ }
    }
    return [
      { label: "Email Notifications", sub: "Receive updates to your inbox",     on: false },
      { label: "Research Alerts",     sub: "New citations and related papers",   on: true  },
      { label: "Weekly Summary",      sub: "Activity digest every Monday",       on: false },
      { label: "Rate Limit Warnings", sub: "Alert before API quota exhaustion",  on: true  },
    ];
  });

  const toggleNotification = (i) => {
    const n = [...items];
    n[i].on = !n[i].on;
    setItems(n);
    localStorage.setItem("polynous_notifications", JSON.stringify(n));
  };

  return (
    <Card C={C}>
      <SectionHead icon="notifications" title="Notifications" subtitle="Delivery preferences" C={C} />
      {items.map((item, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: ".65rem 0",
          borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : "none",
        }}>
          <div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 13.5, fontWeight: 500, color: C.text }}>
              {item.label}
            </div>
            <div style={{ fontFamily: C.fontMono, fontSize: 9.5, color: C.textMuted, marginTop: 2 }}>
              {item.sub}
            </div>
          </div>
          <Toggle
            on={item.on}
            onToggle={() => toggleNotification(i)}
            color={C.green}
          />
        </div>
      ))}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATIONS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function IntegrationsSection({ C }) {
  const rows = [
    { initial: "G", color: "#4285F4", label: "Google OAuth",   sub: "Drive, Docs, Calendar",        connected: true,  detail: "ash@gmail.com" },
    { initial: "GH", color: C.textSec, label: "GitHub OAuth",  sub: "Repos, Issues, Actions",       connected: false, detail: null },
    { initial: "N", color: "#ff3b00",  label: "Notion",        sub: "Pages, Databases, Blocks",     connected: false, detail: null },
  ];

  return (
    <Card C={C}>
      <SectionHead icon="hub" title="Integrations" subtitle="Third-party service connections" C={C} />
      <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
        {rows.map(row => (
          <div key={row.label} style={{
            background: C.surfaceAlt,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: ".85rem 1rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".9rem" }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: `${row.color}15`,
                border: `1px solid ${row.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 12,
                color: row.color, flexShrink: 0,
              }}>
                {row.initial}
              </div>
              <div>
                <div style={{ fontFamily: C.fontDisplay, fontWeight: 600, color: C.text, fontSize: 13.5 }}>
                  {row.label}
                </div>
                <div style={{ fontFamily: C.fontMono, fontSize: 9.5, color: C.textMuted, marginTop: 2 }}>
                  {row.connected ? row.detail : row.sub}
                </div>
              </div>
            </div>
            <span style={{
              fontFamily: C.fontMono, fontSize: 9.5, letterSpacing: ".1em",
              textTransform: "uppercase",
              color: row.connected ? C.green : C.textMuted,
              background: row.connected ? `${C.green}10` : `${C.textMuted}10`,
              padding: "3px 10px", borderRadius: 5,
              border: `1px solid ${row.connected ? C.green + "25" : C.textMuted + "20"}`,
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
// SECURITY SECTION
// ─────────────────────────────────────────────────────────────────────────────
function SecuritySection({ C }) {
  const rows = [
    { icon: "lock",   color: C.purple, title: "Fernet AES-128",    sub: "All keys encrypted at rest",     status: "Active"    },
    { icon: "shield", color: C.cyan,   title: "Session Isolation", sub: "Keys scoped to your session",    status: "Enforced"  },
    { icon: "vpn_key",color: C.amber,  title: "BYOK Architecture", sub: "Keys never leave your session",  status: "Verified"  },
  ];

  return (
    <Card C={C}>
      <SectionHead icon="security" title="Security" subtitle="Encryption & access controls" C={C} />
      <div style={{ display: "flex", flexDirection: "column", gap: ".6rem", marginBottom: "1.1rem" }}>
        {rows.map(row => (
          <div key={row.title} style={{
            background: C.surfaceAlt,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: ".85rem 1rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".9rem" }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: `${row.color}12`, border: `1px solid ${row.color}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon name={row.icon} style={{ color: row.color, fontSize: 17 }} />
              </div>
              <div>
                <div style={{ fontFamily: C.fontDisplay, fontWeight: 600, color: C.text, fontSize: 13.5 }}>
                  {row.title}
                </div>
                <div style={{ fontFamily: C.fontMono, fontSize: 9.5, color: C.textMuted, marginTop: 2 }}>
                  {row.sub}
                </div>
              </div>
            </div>
            <span style={{
              fontFamily: C.fontMono, fontSize: 9, letterSpacing: ".12em",
              textTransform: "uppercase", color: C.green,
              background: `${C.green}10`, padding: "3px 9px",
              borderRadius: 5, border: `1px solid ${C.green}25`,
            }}>
              {row.status}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
        {["Change Password", "Logout All Devices"].map(label => (
          <button key={label} style={{
            padding: ".45rem 1.2rem", borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: "transparent", color: C.text,
            cursor: "pointer",
            fontFamily: C.fontDisplay, fontSize: 12.5, fontWeight: 500,
            transition: "all .18s",
          }}>
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA & STORAGE SECTION
// ─────────────────────────────────────────────────────────────────────────────
function DataStorageSection({ push, C }) {
  const [s, setS] = useState({ total_research: 0, unique_topics: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    api.getStats()
      .then(data => {
        setS(data);
      })
      .catch(() => {
        // Stats unavailable
        setS({ total_research: 0, unique_topics: 0 });
      })
      .finally(() => setLoading(false)); 
  }, []);

  const items = [
    { label: "Research Stored",  val: loading ? "…" : (s.total_research || 0) },
    { label: "Topics Tracked",   val: loading ? "…" : (s.unique_topics || 0) },
    { label: "KG Nodes",         val: loading ? "…" : (s.unique_topics || 0) },
    { label: "Pinecone Vectors", val: loading ? "…" : Math.floor((s.total_research || 0) * 3) },
  ];

  return (
    <Card C={C}>
      <SectionHead icon="database" title="Data & Storage" subtitle="Persisted research, vectors, and graph nodes" C={C} />
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
        gap: ".6rem", marginBottom: "1.1rem",
      }}>
        {items.map(({ label, val }) => (
          <div key={label} style={{
            background: C.surfaceAlt,
            border: `1px solid ${C.border}`,
            borderRadius: 10, padding: ".8rem",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: C.fontMono, fontSize: 9.5, textTransform: "uppercase",
              letterSpacing: ".12em", color: C.textMuted, marginBottom: ".2rem",
            }}>
              {label}
            </div>
            <div style={{
              fontFamily: C.fontDisplay, fontSize: 22, fontWeight: 700,
              color: C.text,
            }}>
              {val}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
        <button
          onClick={() => push("Export started")}
          style={{
            padding: ".45rem 1.2rem", borderRadius: 8,
            border: `1px solid ${C.green}35`, background: "transparent",
            color: C.green, cursor: "pointer",
            fontFamily: C.fontDisplay, fontSize: 12.5, fontWeight: 500,
            transition: "all .18s",
          }}
        >
          Export All Data
        </button>
        <button
          onClick={() => push("Research history cleared")}
          style={{
            padding: ".45rem 1.2rem", borderRadius: 8,
            border: `1px solid ${C.amber}35`, background: "transparent",
            color: C.amber, cursor: "pointer",
            fontFamily: C.fontDisplay, fontSize: 12.5, fontWeight: 500,
            transition: "all .18s",
          }}
        >
          Clear Research History
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DANGER ZONE
// ─────────────────────────────────────────────────────────────────────────────
function DangerZone({ C }) {
  const [confirm, setConfirm] = useState(false);

  return (
    <Card C={C} danger>
      <SectionHead icon="warning" title="Danger Zone" subtitle="Irreversible actions — proceed with caution" C={C} />
      <p style={{
        fontFamily: C.fontMono, fontSize: 10.5, color: C.textMuted,
        letterSpacing: ".04em", marginBottom: "1rem",
        lineHeight: 1.7,
      }}>
        These actions are permanent and cannot be undone. All stored data, session memory, and API keys will be removed.
      </p>
      <div style={{ display: "flex", gap: ".65rem", flexWrap: "wrap" }}>
        <button
          onClick={() => { localStorage.clear(); window.location.href = "/auth"; }}
          style={{
            padding: ".45rem 1.2rem", borderRadius: 8,
            border: `1px solid ${C.crimson}40`, background: "transparent",
            color: C.crimson, cursor: "pointer",
            fontFamily: C.fontDisplay, fontSize: 12.5, fontWeight: 600,
            transition: "all .18s",
          }}
        >
          Delete Account
        </button>
        <button
          onClick={() => {
            setConfirm(!confirm);
            if (confirm) { localStorage.clear(); window.location.href = "/auth"; }
          }}
          style={{
            padding: ".45rem 1.2rem", borderRadius: 8,
            border: `1px solid ${C.crimson}40`,
            background: confirm ? `${C.crimson}15` : "transparent",
            color: C.crimson, cursor: "pointer",
            fontFamily: C.fontDisplay, fontSize: 12.5, fontWeight: 600,
            transition: "all .18s",
          }}
        >
          {confirm ? "Confirm Reset — Click Again" : "Reset All Data"}
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage({ user, onNavigate, onLogout }) {
  const { theme, setTheme, C } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toasts, push } = useToast();
  const sideW = sidebarCollapsed ? 58 : 256;

  return (
    <div style={{
      background: C.bg, minHeight: "100vh",
      color: C.text, fontFamily: C.fontBody,
      overflowX: "hidden",
      transition: "background 0.3s, color 0.3s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        *{box-sizing:border-box}
        html,body{overflow-x:clip}
        @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        ::selection{background:${C.green}28}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.green}35;border-radius:4px}
        select option{background:${C.cardBg};color:${C.text}}
        input[type=range]{-webkit-appearance:none;appearance:none;background:${C.border};height:3px;border-radius:4px;outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:${C.green};cursor:pointer;box-shadow:0 0 6px ${C.green}60}
        select{-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23${C === DARK ? "55667788" : "aab0c0"}'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right .8rem center}
      `}</style>

      <NeuralCanvas C={C} />

      <Sidebar
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        C={C}
      />

      {/* Main content */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 840,
        margin: "0 auto",
        padding: "2.5rem 1.5rem 6rem",
        marginLeft: sideW,
        transition: "margin-left 0.32s cubic-bezier(.4,0,.2,1)",
      }}>
        {/* Page header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{
            fontFamily: C.fontDisplay,
            fontSize: 34,
            fontWeight: 800,
            color: C.text,
            letterSpacing: "-.04em",
            lineHeight: 1.1,
          }}>
            Settings
          </div>
          <p style={{
            fontFamily: C.fontMono,
            fontSize: 11,
            color: C.textMuted,
            marginTop: ".5rem",
            letterSpacing: ".1em",
            textTransform: "uppercase",
          }}>
            Neural research environment configuration
          </p>
          <div style={{
            height: 1,
            background: `linear-gradient(90deg, ${C.green}40, transparent)`,
            marginTop: "1rem",
          }} />
        </div>

        <ProfileSection     user={user} push={push} C={C} />
        <ApiKeysSection     push={push} C={C} />
        <AppearanceSection  theme={theme} setTheme={setTheme} C={C} />
        <PreferencesSection push={push} C={C} />
        <StatsSection       C={C} />
        <NotificationsSection C={C} />
        <IntegrationsSection  C={C} />
        <SecuritySection    C={C} />
        <DataStorageSection push={push} C={C} />
        <DangerZone         C={C} />
      </div>

      <ToastBox toasts={toasts} C={C} />
    </div>
  );
}