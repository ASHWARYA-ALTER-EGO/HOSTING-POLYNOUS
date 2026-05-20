<div align="center">

<br/>

```
                                           ██████╗  ██████╗ ██╗  ██╗   ██╗███╗   ██╗ ██████╗ ██╗   ██╗███████╗
                                           ██╔══██╗██╔═══██╗██║  ╚██╗ ██╔╝████╗  ██║██╔═══██╗██║   ██║██╔════╝
                                           ██████╔╝██║   ██║██║   ╚████╔╝ ██╔██╗ ██║██║   ██║██║   ██║███████╗
                                           ██╔═══╝ ██║   ██║██║    ╚██╔╝  ██║╚██╗██║██║   ██║██║   ██║╚════██║
                                           ██║     ╚██████╔╝███████╗██║   ██║ ╚████║╚██████╔╝╚██████╔╝███████║
                                           ╚═╝      ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚══════╝
```

### *"Many Minds, One Answer"*

**A production-grade multi-agent AI research platform where 7 specialized agents collaborate, debate, and deliver answers no single model could.**

<br/>

[![Version](https://img.shields.io/badge/POLYNOUS-v3.0-00ff0f?style=for-the-badge)](https://github.com/pradhanashwarya2122/POLYNOUS)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

[![GitHub Stars](https://img.shields.io/github/stars/pradhanashwarya2122/POLYNOUS?style=social)](https://github.com/pradhanashwarya2122/POLYNOUS)

</div>

---

## What is POLYNOUS?

POLYNOUS is not another chatbot. It's a **neural research collective** — seven AI agents working together like a research team. Each agent owns a distinct role, passing information between each other to produce answers that are more accurate, balanced, and trustworthy than any single model could.

```
                        ┌─ Your Question ──────────────────────────┐
                        │                                          │
                        ▼                                          │
              ┌─────────────────────┐                             │
              │  Agent Orchestrator  │                             │
              └──────────┬──────────┘                             │
                         │                                          │
          ┌──────────────┼──────────────┐                         │
          ▼              ▼              ▼                         │
    ┌──────────┐  ┌───────────┐  ┌──────────┐                    │
    │  Search  │→ │ Summarise │→ │  Critic  │                    │
    │  Agent   │  │   Agent   │  │  Agent   │                    │
    └──────────┘  └───────────┘  └─────┬────┘                    │
                                        │                          │
                                        ▼                          │
                               ┌──────────────┐                   │
                               │ Writer Agent │                   │
                               └──────────────┘                   │
                                                                    │
     ─ ─ ─ ─ ─ ─ ─ Debate Mode ─ ─ ─ ─ ─ ─ ─ ─                 │
                                                                    │
          ┌──────────┐    ┌──────────┐    ┌───────┐              │
          │ FOR Agent│    │AGAINST   │    │ Judge │              │
          │  (Green) │⟷  │  Agent   │───▶│ Agent │              │
          └──────────┘    │  (Red)   │    └───────┘              │
                          └──────────┘                             │
                                                                    │
                        Structured Answer + Citations + Score ──────┘
```

---

## The 7 Agents

### Research Mode

| Agent | Role | Function |
|:------|:-----|:---------|
| **Search Agent** | Information Retrieval | Finds relevant web and academic sources via Tavily |
| **Summariser Agent** | Content Synthesis | Extracts key points from each source |
| **Critic Agent** | Quality Control | Cross-references claims, flags contradictions, scores confidence |
| **Writer Agent** | Final Output | Assembles a structured answer with citations |

### Debate Mode

| Agent | Role | Function |
|:------|:-----|:---------|
| **FOR Agent** | Advocate | Builds the strongest supporting argument |
| **AGAINST Agent** | Skeptic | Constructs the strongest opposing argument |
| **Judge Agent** | Evaluator | Scores both sides and declares a winner with reasoning |

---

## Features

### Core
- **Multi-Agent Architecture** — 7 specialized AI agents, not one general model
- **Real-Time Web Search** — Tavily API + academic sources
- **Confidence Scoring** — Every claim gets a 0–100% trust score
- **Source Citations** — Every answer backed by real, clickable sources
- **Streaming Responses** — Watch agents think in real time

### Advanced
- **Debate Mode** — FOR vs AGAINST with AI judge and numeric scoring
- **Knowledge Graph** — Neo4j-powered entity relationship mapping
- **Hybrid Search** — Vector similarity (Pinecone) + graph traversal (Neo4j)
- **Agent Memory** — Remembers user interests and past research sessions
- **PDF RAG** — Upload PDFs for semantic search and Q&A
- **URL Summarizer** — Paste any URL, get an instant structured summary
- **Research Reports** — Export polished PDF reports
- **Shareable Sessions** — Generate links to share any research session
- **Analytics Dashboard** — Track research patterns and usage insights
- **OAuth Authentication** — Google and GitHub single sign-on

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       POLYNOUS SYSTEM                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Frontend  ·  React + Vite                               │  │
│  │                                                          │  │
│  │  Neural Brain UI   Research UI   Debate UI   Analytics  │  │
│  └───────────────────────────┬──────────────────────────────┘  │
│                               │ REST / SSE                      │
│  ┌────────────────────────────▼──────────────────────────────┐ │
│  │  Backend  ·  FastAPI + LangGraph                          │ │
│  │                                                           │ │
│  │  Agent Orchestrator   Debate Graph   Hybrid Search        │ │
│  └──────────┬─────────────────┬────────────────┬────────────┘ │
│             │                  │                │               │
│  ┌──────────▼──┐  ┌────────────▼──┐  ┌─────────▼──────────┐  │
│  │  AI Layer   │  │  Vector Layer  │  │    Data Layer       │  │
│  │             │  │                │  │                     │  │
│  │  Anthropic  │  │  Pinecone      │  │  SQLite / Postgres  │  │
│  │  Claude     │  │  Neo4j         │  │  Tavily Search      │  │
│  │  OpenAI     │  │  Embeddings    │  │  User Storage       │  │
│  │  LangGraph  │  │                │  │                     │  │
│  └─────────────┘  └────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | React 18, Vite, Canvas API |
| **Backend** | FastAPI, LangGraph, Python 3.11+ |
| **AI / ML** | Anthropic Claude 3, OpenAI Embeddings |
| **Vector DB** | Pinecone |
| **Graph DB** | Neo4j |
| **Search** | Tavily API |
| **Database** | SQLite (dev) · PostgreSQL (prod) |
| **Auth** | JWT, Google OAuth, GitHub OAuth |
| **Deployment** | Railway, Vercel, Docker |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- API keys from: [Anthropic](https://console.anthropic.com) · [Tavily](https://tavily.com) · [Pinecone](https://pinecone.io) · [Neo4j Aura](https://neo4j.com/cloud/aura) · [OpenAI](https://platform.openai.com)

### 1 — Clone

```bash
git clone https://github.com/pradhanashwarya2122/POLYNOUS.git
cd POLYNOUS
```

### 2 — Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Open .env and fill in your API keys (see below)

# Start server
uvicorn app.main:app --reload
```

> Backend runs at `http://localhost:8000` · API docs at `http://localhost:8000/docs`

### 3 — Frontend

```bash
cd ../frontend
npm install
npm run dev
```

> Frontend runs at `http://localhost:5173`

### Environment Variables

```env
# ── AI Models ───────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# ── Search & Memory ─────────────────────────────
TAVILY_API_KEY=tvly-...
PINECONE_API_KEY=pcsk-...
PINECONE_ENVIRONMENT=gcp-starter

# ── Knowledge Graph ──────────────────────────────
NEO4J_URI=neo4j+s://...
NEO4J_USER=neo4j
NEO4J_PASSWORD=...

# ── Auth ────────────────────────────────────────
JWT_SECRET=your-secret-key

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

---

## Usage

### Research Mode

1. Open the app and select **Research Mode**
2. Enter any research question
3. Watch four agents work in real time — search → summarise → critique → write
4. Receive a structured answer with a confidence score and clickable sources

### Debate Mode

1. Select **Debate Mode**
2. Enter a proposition (e.g. *"Is AI good for humanity?"*)
3. Watch FOR and AGAINST agents build their arguments
4. The Judge agent evaluates both sides, declares a winner, and explains its scoring

### PDF Upload

1. Click **Upload PDF** in the sidebar
2. Select a PDF — it gets chunked, embedded, and stored
3. Ask any question and get answers grounded in your document

### Knowledge Graph

1. Navigate to **Knowledge Graph**
2. Browse your research topics as interconnected nodes
3. Click any node to explore entity relationships
4. Find non-obvious connections across different research sessions

---

## API Reference

| Endpoint | Method | Description |
|:---------|:-------|:------------|
| `/ask` | POST | Research or debate query — JSON response |
| `/ask-stream` | POST | Streaming query with live agent progress |
| `/health` | GET | Health check |
| `/auth/register` | POST | Create account |
| `/auth/login` | POST | Obtain JWT token |
| `/oauth/google` | GET | Google OAuth flow |
| `/oauth/github` | GET | GitHub OAuth flow |
| `/memory/search` | GET | Semantic search over past sessions |
| `/knowledge/graph` | GET | Full knowledge graph payload |
| `/knowledge/hybrid-search` | GET | Vector + graph hybrid search |
| `/knowledge/connections` | GET | Find connections between two entities |
| `/pdfs/upload` | POST | Upload and index a PDF |
| `/pdfs/ask` | POST | RAG query against uploaded PDFs |
| `/conversations` | GET | List all past conversations |
| `/status` | GET | Live system status |

Full interactive docs available at `/docs` once the backend is running.

---

## UI Highlights

- **Neural Brain Background** — 200+ animated neurons with mouse parallax
- **Glassmorphic Design** — Blur effects, glow borders, translucent cards
- **Real-Time Streaming** — Watch agents reason word by word
- **Agent Visualizer** — 7 pulsing neurons animate with each active agent
- **Dark Theme** — Neural void aesthetic with green and cyan accents
- **Mobile Responsive** — Designed to work on any screen size

---

## Project Stats

```
7 AI agents          working in parallel
200+ neurons         animating in the background
5+ data sources      web, academic, PDF, vector, graph
15+ API endpoints    REST + streaming (SSE)
2 auth providers     Google + GitHub OAuth
1 export format      polished PDF research reports
```

---

## Roadmap

```
✅  Multi-agent research architecture
✅  Debate mode with AI judge and scoring
✅  Confidence scoring on every claim
✅  Real-time streaming (SSE)
✅  Knowledge graph (Neo4j)
✅  Hybrid vector + graph search
✅  PDF upload and RAG
✅  URL summarizer
✅  Email + OAuth authentication
✅  Research report export (PDF)
⬜  Multi-user collaboration
⬜  Voice input / output
⬜  Progressive Web App (PWA)
⬜  Public API marketplace
```

---

## Contributing

Contributions are welcome.

```bash
# Fork, then:
git checkout -b feature/your-feature-name
git commit -m "Add your feature"
git push origin feature/your-feature-name
# Open a Pull Request
```

Please keep PRs focused — one feature or fix per PR makes review much faster.

---

## Acknowledgements

- [Anthropic](https://anthropic.com) — Claude AI models powering all 7 agents
- [LangGraph](https://langchain.com/langgraph) — Agent state machine and orchestration
- [Pinecone](https://pinecone.io) — Vector database for semantic memory
- [Neo4j](https://neo4j.com) — Knowledge graph database
- [Tavily](https://tavily.com) — Real-time web search API

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built by [@pradhanashwarya2122](https://github.com/pradhanashwarya2122)**

[GitHub](https://github.com/pradhanashwarya2122/POLYNOUS) · [Report Bug](https://github.com/pradhanashwarya2122/POLYNOUS/issues) · [Request Feature](https://github.com/pradhanashwarya2122/POLYNOUS/issues)

<br/>

*Seven minds. One answer.*

</div>
