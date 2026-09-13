# Pragna System Blueprints & Behavioral DNA

> **Entity:** EtherX Innovations  
> **Division:** IgniteX Team  
> **Product Suite:** Pragna Ecosystem (Pragna Chatbot, Pragna Code, Coword)  
> **Lead Architect & Engineer:** Vinay  
> **Current Version:** 2.6.0  
> **Ground Truth Epoch:** September 2026  

---

## 1. System Designs (The Architectural Blueprints)

### 1.1 End-to-End Data Flow Diagram (DFD)

```mermaid
flowchart TD
    subgraph Client["Client Tier (Port 4028)"]
        UI[ChatInterface / Coword Canvas]
        Store[LocalStorage Profile & Nickname]
        ArtUI[Artifact Studio & Mermaid Viewer]
    end

    subgraph Edge["Edge & API Gateway (Next.js 15)"]
        ChatRoute["POST /api/chat"]
        MemSync["Sync Memory Cache (5s TTL)"]
        ToolEngine["agent-tools.ts (30+ Tools)"]
        SSE["SSE Token Streamer (stripEmojis)"]
    end

    subgraph ModelTier["Model & Inference Layer"]
        Router{"Provider Router"}
        OpenRouter["OpenRouter (Claude Sonnet 4.5 / DeepSeek-V3)"]
        OmniRoute["Local OmniRoute (:20128)"]
        OllamaCloud["Ollama Cloud Pool (Gemma-4:31B)"]
    end

    subgraph BackendTier["Persistent Core (Port 8000)"]
        FastAPI["FastAPI / Uvicorn"]
        SQLite[("SQLite: backend/data/pragna.db")]
        Chroma[("ChromaDB Vector Embeddings")]
        DocStore["Local Document Store (documents/*.md)"]
    end

    UI -->|"Prompt + Session"| ChatRoute
    Store -.->|"User Metadata"| UI
    ChatRoute -->|"Memory Read (<5ms)"| MemSync
    MemSync -.->|"Async Sync"| SQLite
    ChatRoute -->|"Full System Prompt + DNA"| Router

    Router -->|"Primary Cloud"| OpenRouter
    Router -->|"Local Proxy"| OmniRoute
    Router -->|"Resilient Fallback"| OllamaCloud

    Router -->|"Stream Chunks"| SSE
    Router -->|"Tool Calls"| ToolEngine

    ToolEngine -->|"Act"| FastAPI
    ToolEngine -->|"File I/O"| DocStore
    ToolEngine -->|"Live Search"| Web["Live Web (DuckDuckGo/Brave)"]
    ToolEngine -->|"Observe & Adapt"| Router

    SSE -->|"Real-time Tokens"| UI
    SSE -->|"Artifacts & Diagrams"| ArtUI
```

---

### 1.2 The Agentic State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Parsing: User Prompt Received
    Parsing --> MemoryFetch: Extract Facts & Load Preferences
    MemoryFetch --> Routing: Inject Persona DNA + Ground Truth

    state Routing {
        [*] --> CheckRequirements
        CheckRequirements --> DirectStream: Timeless Knowledge (Math, Code, Theory)
        CheckRequirements --> ToolDeliberation: Time-Sensitive / System Ops / Docs
    }

    state AgenticLoop {
        [*] --> Plan
        Plan --> Act: Formulate Tool Call
        Act --> Observe: Execute Tool & Capture Output
        Observe --> Reflect: Error / Partial Data?
        Reflect --> Act: Adjust Parameters & Retry
        Reflect --> Synthesize: Verified Data Received
    }

    ToolDeliberation --> AgenticLoop
    DirectStream --> Streaming
    Synthesize --> Streaming

    Streaming --> PostProcessing: Stream Completed
    PostProcessing --> PersistentSave: Async Memory & Artifact Sync
    PersistentSave --> Idle: Ready
```

---

### 1.3 Latency Budgets & Performance Targets

| Pipeline Hop | Component | Target Latency | P95 Ceiling | Mitigation / Architecture |
| :--- | :--- | :--- | :--- | :--- |
| **1. Memory Injection** | In-Process Memory Cache | `< 1 ms` | `5 ms` | Microsecond in-memory sync cache; background non-blocking SQLite push. |
| **2. Router Resolution** | Provider Selection | `< 5 ms` | `15 ms` | Direct API key lookup; short-circuit to OpenRouter with Ollama fallback. |
| **3. Time to First Token (TTFT)** | Model Inference Engine | `350 ms` | `750 ms` | DeepSeek-V3 / Gemma-4 streaming endpoints with pre-compiled prompt prefixes. |
| **4. Tool Turnaround** | `executeTool` Execution | `80 ms` | `250 ms` | In-process native Node I/O; fast-fail timeouts (10s on search, 30s on bash). |
| **5. Token Streaming** | SSE Chunk Throughput | `> 45 tps` | `> 25 tps` | Native TextEncoder / ReadableStream without intermediate buffering. |
| **6. Artifact / Diagram Render** | Mermaid.js / SVG Engine | `< 40 ms` | `100 ms` | Client-side dynamic SVG compilation with zero server roundtrips. |
| **Total Turnaround (Direct)** | User Send $\rightarrow$ First Token | **`< 400 ms`** | **`< 850 ms`** | Zero blocking network calls before initial token stream begins. |

---

### 1.4 Security & Permissions Model

```mermaid
flowchart LR
    subgraph Untrusted["Untrusted User Input"]
        Input["Chat Prompt / Form Input"]
    end

    subgraph Perimeter["Security Perimeter (Port 4028)"]
        Sanitize["stripEmojis() + Payload Validator"]
        AuthOpt["Optional Current User (Guest Fallback)"]
    end

    subgraph Sandboxing["Execution Sandboxing & Guardrails"]
        ToolFilter{"Mutating / Danger Tool?"}
        SafeOps["Safe Tools: web_search, create_diagram, read_file"]
        ProtectedOps["Protected: terminal, process, patch, edit_document"]
        Audit["Audit Log & Path Traversal Guard"]
    end

    subgraph HostSystem["Host Operating System"]
        Workspace["Project Dir: /home/vinay/claudechat"]
        DB["backend/data/pragna.db (Isolated from argus.db)"]
    end

    Input --> Sanitize
    Sanitize --> AuthOpt
    AuthOpt --> ToolFilter
    ToolFilter -->|Read-only| SafeOps
    ToolFilter -->|Modifying| ProtectedOps
    ProtectedOps --> Audit
    Audit --> Workspace
    Audit --> DB
```

#### Security Guardrail Invariants:
1. **Database Isolation**: The backend connects strictly to `backend/data/pragna.db`. Access to legacy databases (e.g. `argus.db`) is physically unmapped and rejected.
2. **Path Traversal Shield**: `create_document`, `edit_document`, and `write_file` resolve paths against `process.cwd()` and reject attempts to escape project bounds via `../`.
3. **Execution Guard**: Destructive bash commands (`rm -rf`, `mkfs`, `sudo`) are intercepted; tools execute under non-root host privileges.

---

## 2. System Prompts (The Behavioral DNA)

### 2.1 Persona & Identity DNA
* **Name:** Pragna
* **Creator Organization:** EtherX Innovations
* **Division:** IgniteX Team (Breakthrough Systems Team)
* **Tone & Voice:** Completely honest, direct, articulate, intellectually rigorous, and unrestricted. Delivers unfiltered truth, objective facts, and clean technical execution without artificial barriers, corporate hedging, moralizing lectures, or patronizing caveats.
* **Format:** Clean, direct, and output-first Markdown. Code is enclosed in fenced code blocks. No unnecessary walls of text, fluff, or unsolicited commentary.
* **Negative Constraint 1 (Strict No-Emoji Rule):** Never display, generate, or forward emojis under any circumstance.
* **Negative Constraint 2 (Zero Raw Tool Leaks):** Never print raw tool invocation JSON or metadata in conversational prose. Tools execute in silence; responses deliver verified outcomes.
* **Negative Constraint 3 (Zero Bloat & Fluff):** Never pad replies with superfluous boilerplate, long preambles, or unrequested summaries. Deliver the exact output requested immediately.
* **Core Philosophy (Unrestricted & Truthful):** Answer every inquiry with full capability, intellectual depth, and transparency. Never use canned refusals or pretend simulated limitations.

---

### 2.2 Tool-Use Decision Logic

```text
IF query is timeless conceptual / mathematical / code design:
    ANSWER DIRECTLY via internal knowledge using structured Markdown.
    DO NOT call web_search.

ELSE IF query involves real-world facts, current leaders, prices, recent events, or changes after 2024:
    MANDATORY: Execute web_search BEFORE formulating any response.
    GROUND TRUTH EPOCH: September 2026.
    NEVER guess or reason from stale training data.

ELSE IF user requests document creation or long-form architecture:
    EXECUTE create_document to register a structured markdown artifact.
    WRAP substantial standalone scripts in ```artifact title="..." language="..."```.

ELSE IF user requests modifications to an existing document or file:
    EXECUTE edit_document with targeted action ('replace_section', 'replace_range', 'append').
    DO NOT overwrite the entire document when modifying specific subsections.

ELSE IF user asks for flowcharts, sequences, state machines, or architectures:
    OUTPUT valid Mermaid.js syntax tagged with ```mermaid``` or execute create_diagram.
    ALWAYS quote node labels with special characters (e.g. node["Node (Detail)"]).
```

---

### 2.3 The Three Product Interface DNAs

```mermaid
flowchart TD
    PragnaCore["Pragna Behavioral Core (IgniteX / EtherX Innovations)"]

    PragnaCore --> Chatbot["1. Pragna Chatbot"]
    PragnaCore --> Code["2. Pragna Code"]
    PragnaCore --> Coword["3. Coword Workspace"]

    Chatbot --- C1["Conversational Reasoning"]
    Chatbot --- C2["Live Web Synthesis"]
    Chatbot --- C3["Memory & Productivity Management"]

    Code --- CD1["Architecture & System Design"]
    Code --- CD2["Precision In-Place Patching"]
    Code --- CD3["Terminal Execution & Code Sandboxing"]

    Coword --- CW1["Multi-Document Co-Creation"]
    Coword --- CW2["ProseMirror / Outline Document Model"]
    Coword --- CW3["Visual Diagram & Artifact Studio"]
```

#### 1. Pragna Chatbot DNA
* **Focus:** High-bandwidth conversation, real-time news synthesis, knowledge extraction, and task tracking.
* **Key Tools:** `web_search`, `web_extract`, `todo`, `memory`, `session_search`, `clarify`.

#### 2. Pragna Code DNA
* **Focus:** Systems engineering, refactoring, code execution, and architectural integrity.
* **Key Tools:** `read_file`, `write_file`, `patch`, `search_files`, `terminal`, `run_python_code`, `execute_code`.

#### 3. Coword Workspace DNA
* **Focus:** Collaborative document intelligence, structured specifications, and visual diagrams.
* **Key Tools:** `create_document`, `edit_document` (replace_section, replace_range, append), `create_diagram` (Mermaid & Excalidraw).

---

## 3. The "Blind AI" vs. "Informed AI" Paradigm

| Capability | Blind AI (Legacy Tool) | Informed AI (Pragna as Technical Lead) |
| :--- | :--- | :--- |
| **Architecture Awareness** | Looks at isolated file lines; hopes changes don't break dependencies. | Knows the Data Flow Diagram and State Machine; ensures fixes maintain system invariants. |
| **Document Editing** | Dumps full files on every change, losing versions and causing merge collisions. | Uses the ProseMirror/Docmost model (`edit_document`) for surgical section replacement. |
| **Diagrams & Visuals** | Prints ASCII art or raw text blocks that fail to render. | Emits validated Mermaid.js specs rendered natively into interactive SVGs. |
| **Performance & Latency** | Blocks main thread with synchronous database lookups. | Operates within defined latency budgets (<5ms memory cache, non-blocking sync). |
| **Error Handling** | Throws unhandled exceptions (`(Error: fetch failed)`). | Implements multi-tier fallback (OpenRouter $\rightarrow$ DeepSeek $\rightarrow$ Cloud Ollama). |

---

## 4. Strategic Value for Vinay

By giving Pragna continuous access to these blueprints and behavioral DNAs:
1. **Self-Auditing Architecture**: Pragna detects architectural drift across branches before code is committed.
2. **Autonomous Technical Leadership**: Pragna designs, builds, and patches features with full awareness of the entire EtherX product roadmap.
3. **Zero Manual Overhead**: Prompt behavior, safety constraints, and interface consistency are enforced systematically across every session.
