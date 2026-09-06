import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./DiscoverPage.css";

/*
 * DiscoverPage - public gallery of recent shared research + debate reports.
 * Social proof + SEO. Anonymised: no owner info, just topic + snippet + views.
 */

function Card({ item }) {
  const isDebate = item.kind === "debate";
  const kicker = isDebate ? "DEBATE" : "RESEARCH";
  const when = item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB",
    { day: "2-digit", month: "short", year: "numeric" }) : "";
  return (
    <Link to={item.url_path} className={"dp-card kind-" + item.kind}>
      <div className="dp-card-head">
        <span className={"dp-kicker " + item.kind}>{kicker}</span>
        <span className="dp-when">{when}</span>
      </div>
      <div className="dp-title">{item.title || "Untitled"}</div>
      {item.snippet && <p className="dp-snippet">{item.snippet}</p>}
      <div className="dp-foot">
        <span className="dp-views">{item.views} view{item.views === 1 ? "" : "s"}</span>
        <span className="dp-open">Open {isDebate ? "verdict" : "report"} &rarr;</span>
      </div>
    </Link>
  );
}

export default function DiscoverPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  useEffect(() => {
    (async () => {
      setBusy(true); setErr("");
      try {
        const kind = filter === "all" ? "" : filter;
        const res = await fetch(`${API_BASE_URL}/discover?kind=${kind}&limit=36`);
        if (!res.ok) throw new Error("Gallery is offline right now.");
        const j = await res.json();
        setItems(j.items || []);
      } catch (e) { setErr(String(e.message || e)); }
      setBusy(false);
    })();
  }, [filter]);
  return (
    <div className="dp-page">
      <header className="dp-head">
        <div className="dp-eyebrow">Public gallery</div>
        <h1>What people are researching &amp; debating</h1>
        <p className="dp-lede">
          A live feed of research reports and judged debates the community has
          made public. Read any of them without signing in.
        </p>
        <div className="dp-filters">
          {["all", "research", "debate"].map((k) => (
            <button key={k}
              className={"dp-filter" + (filter === k ? " on" : "")}
              onClick={() => setFilter(k)}>
              {k === "all" ? "Everything" : k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
      </header>
      {busy && <div className="dp-loading">Loading the gallery...</div>}
      {err && <div className="dp-err">{err}</div>}
      {!busy && !err && items.length === 0 && (
        <div className="dp-empty">
          <p>Nothing shared yet under this filter.</p>
          <Link to="/research" className="dp-cta">Run the first one</Link>
        </div>
      )}
      <div className="dp-grid">
        {items.map((it) => <Card key={it.id} item={it} />)}
      </div>
      <footer className="dp-footer">
        <p>Want your own? <Link to="/research">Start a research run</Link> or <Link to="/debate">stage a debate</Link>. Anything you save with "Copy public link" lands here.</p>
      </footer>
    </div>
  );
}
