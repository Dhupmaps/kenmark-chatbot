import os
import time
import sqlite3
from typing import Optional, List

import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Try to import groq if available (optional). We will fall back gracefully.
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except Exception:
    GROQ_AVAILABLE = False

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.environ.get("CHAT_DB", "chatlogs.db")
KNOWLEDGE_FILE = os.environ.get("KNOWLEDGE_FILE", "knowledge.xlsx")
ADMIN_KEY = os.environ.get("ADMIN_KEY", "changeme")

# Initialize SQLite DB for logs and simple analytics
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            message TEXT,
            ts REAL
        )
        """
    )
    conn.commit()
    conn.close()

init_db()

# Load knowledge into memory (list of dicts)
def load_knowledge() -> List[dict]:
    if not os.path.exists(KNOWLEDGE_FILE):
        return []
    try:
        df = pd.read_excel(KNOWLEDGE_FILE)
        df = df.fillna("")
        return df.to_dict(orient="records")
    except Exception as e:
        print("Error loading knowledge file:", e)
        return []

knowledge_base = load_knowledge()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

# Simple retriever: substring match with scoring by overlap
def find_relevant_context(query: str, data: List[dict], top_k: int = 3) -> List[str]:
    q = query.lower()
    scored = []
    q_tokens = set([t for t in q.split() if len(t) > 2])

    for item in data:
        qtext = str(item.get("Question", "")).lower()
        atext = str(item.get("Answer", "")).lower()
        score = 0
        # direct substring matches
        if q in qtext or q in atext:
            score += 10
        # overlap tokens
        item_tokens = set([t for t in (qtext + " " + atext).split() if len(t) > 2])
        overlap = q_tokens.intersection(item_tokens)
        score += len(overlap)
        if score > 0:
            scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = []
    for s, it in scored[:top_k]:
        results.append(f"Q: {it.get('Question','')}\nA: {it.get('Answer','')}")
    return results

# Simple helper to log chats
def log_chat(session_id: Optional[str], role: str, message: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO chats (session_id, role, message, ts) VALUES (?, ?, ?, ?)",
              (session_id, role, message, time.time()))
    conn.commit()
    conn.close()

# LLM adapter: try Groq client if available, else try Ollama (local), else error
def call_llm(system_prompt: str, user_prompt: str, model: Optional[str] = None) -> str:
    # Prefer Groq (if package and env key available)
    groq_key = os.environ.get("GROQ_API_KEY")
    if GROQ_AVAILABLE and groq_key:
        try:
            client = Groq(api_key=groq_key)
            # Use a lightweight completion call; exact API may vary by Groq SDK version
            # We'll use a generic `client.chat.completions.create` if available, else fallback
            if hasattr(client, "chat"):
                resp = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    model=model or "llama3-8b-8192",
                )
                # SDKs vary; try to extract text defensively
                try:
                    return resp.choices[0].message.content
                except Exception:
                    return str(resp)
        except Exception as e:
            print("Groq call failed:", e)
    # Try Ollama local server (if available)
    ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434")
    try:
        import requests
        payload = {
            "model": model or "llama2",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        }
        r = requests.post(f"{ollama_url}/api/chat", json=payload, timeout=15)
        if r.status_code == 200:
            data = r.json()
            # Ollama response format may vary
            return data.get("response") or str(data)
    except Exception as e:
        print("Ollama request failed:", e)

    raise Exception("No LLM provider configured (set GROQ_API_KEY or run a local Ollama and set OLLAMA_URL).")

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    user_message = request.message.strip()
    session = request.session_id

    if not user_message:
        raise HTTPException(status_code=400, detail="Empty message")

    # Log user message
    log_chat(session, "user", user_message)

    # Retrieve context from knowledge base
    contexts = find_relevant_context(user_message, knowledge_base, top_k=3)

    if not contexts:
        # When there's no relevant knowledge, we must not hallucinate
        reply = "I don't have that information yet."
        log_chat(session, "bot", reply)
        return {"response": reply, "from_knowledge": False}

    context_text = "\n\n".join(contexts)

    system_prompt = (
        "You are a helpful assistant for Kenmark ITan Solutions. "
        "Answer the user's question using ONLY the context provided below. "
        "If the answer is not in the context, respond: 'I don't have that information yet.' "
        "Be concise and polite."
    )

    user_prompt = f"Context:\n{context_text}\n\nQuestion: {user_message}"

    try:
        ai_response = call_llm(system_prompt, user_prompt)
        # Defensive: if response is empty, return polite fallback
        if not ai_response or ai_response.strip() == "":
            ai_response = "I don't have that information yet."
    except Exception as e:
        print("LLM error:", e)
        raise HTTPException(status_code=503, detail=str(e))

    log_chat(session, "bot", ai_response)
    return {"response": ai_response, "from_knowledge": True}

@app.post("/admin/upload")
async def upload_knowledge(file: UploadFile = File(...), x_admin_key: Optional[str] = Header(None), background: BackgroundTasks = None):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

    contents = await file.read()
    # Save to the knowledge file and reload
    with open(KNOWLEDGE_FILE, "wb") as f:
        f.write(contents)

    # Reload in background
    def reload():
        global knowledge_base
        knowledge_base = load_knowledge()
    background.add_task(reload)

    return {"status": "ok", "message": f"Uploaded and reloaded {file.filename}"}

@app.get("/analytics/top-questions")
async def top_questions(limit: int = 10):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Very simple analytics: most frequent user messages (normalized)
    c.execute("SELECT message, COUNT(*) as cnt FROM chats WHERE role='user' GROUP BY message ORDER BY cnt DESC LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    return {"top": [{"message": r[0], "count": r[1]} for r in rows]}

# Add a lightweight health endpoint
@app.get("/health")
async def health():
    return {"status": "ok", "knowledge_count": len(knowledge_base)}

