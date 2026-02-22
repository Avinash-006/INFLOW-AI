import json
import os
import sqlite3
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from vectorstore import search_with_scores
from retrieval import format_docs, extract_sources, compute_confidence


DB_PATH = "chat.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT,
            created_at TIMESTAMP
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            sender TEXT,
            content TEXT,
            created_at TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        )
    ''')
    conn.commit()
    conn.close()


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


class Question(BaseModel):
    query: str
    session_id: Optional[str] = None


class Session(BaseModel):
    id: str
    title: str
    created_at: str


class Message(BaseModel):
    sender: str
    content: str
    created_at: str


class ChatHistory(BaseModel):
    session_id: str
    messages: List[Message]


def create_app(vectorstore, generation_chain, rewrite_chain, fallback_chain) -> FastAPI:
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Session-ID"],
    )

    init_db()

    @app.get("/sessions", response_model=List[Session])
    async def get_sessions():
        conn = get_db_connection()
        sessions = conn.execute('SELECT * FROM sessions ORDER BY created_at DESC').fetchall()
        conn.close()
        return [dict(s) for s in sessions]

    @app.post("/sessions", response_model=Session)
    async def create_session():
        session_id = str(uuid.uuid4())
        title = "New Chat"
        created_at = datetime.now().isoformat()

        conn = get_db_connection()
        conn.execute('INSERT INTO sessions (id, title, created_at) VALUES (?, ?, ?)',
                     (session_id, title, created_at))
        conn.commit()
        conn.close()

        return {"id": session_id, "title": title, "created_at": created_at}

    @app.get("/sessions/{session_id}", response_model=ChatHistory)
    async def get_session_history(session_id: str):
        conn = get_db_connection()
        messages = conn.execute('SELECT sender, content, created_at FROM messages WHERE session_id = ? ORDER BY id ASC', (session_id,)).fetchall()
        conn.close()

        return {
            "session_id": session_id,
            "messages": [dict(m) for m in messages]
        }

    @app.delete("/sessions/{session_id}")
    async def delete_session(session_id: str):
        conn = get_db_connection()
        conn.execute('DELETE FROM messages WHERE session_id = ?', (session_id,))
        conn.execute('DELETE FROM sessions WHERE id = ?', (session_id,))
        conn.commit()
        conn.close()
        return {"message": "Session deleted"}

    @app.post("/ask")
    async def ask_question(payload: Question):
        session_id = payload.session_id

        if not session_id:
            session_id = str(uuid.uuid4())

            conn = get_db_connection()
            conn.execute('INSERT INTO sessions (id, title, created_at) VALUES (?, ?, ?)',
                         (session_id, payload.query[:30] + "...", datetime.now().isoformat()))
            conn.commit()
            conn.close()

        conn = get_db_connection()
        history_rows = conn.execute(
            'SELECT sender, content FROM messages WHERE session_id = ? ORDER BY id ASC',
            (session_id,)
        ).fetchall()
        
        recent_history = history_rows[-6:]
        history_text = "\n".join([f"{row['sender']}: {row['content']}" for row in recent_history])

        conn.execute('INSERT INTO messages (session_id, sender, content, created_at) VALUES (?, ?, ?, ?)',
                     (session_id, 'user', payload.query, datetime.now().isoformat()))
        conn.commit()
        conn.close()

        search_query = payload.query
        if history_text.strip():
            try:
                rewritten_query = await rewrite_chain.ainvoke({
                    "history": history_text,
                    "question": payload.query
                })
                if rewritten_query and isinstance(rewritten_query, str) and rewritten_query.strip():
                    search_query = rewritten_query.strip()
            except Exception:
                pass

        docs_with_scores = search_with_scores(vectorstore, search_query)
        sources = extract_sources(docs_with_scores)
        confidence = compute_confidence(docs_with_scores)
        context = format_docs([doc for doc, _ in docs_with_scores])

        use_fallback = not docs_with_scores or confidence < 0.3

        async def generate():
            full_response = ""
            try:
                if use_fallback:
                    chain = fallback_chain
                    inputs = {"question": payload.query}
                else:
                    domain_name = os.getenv("DOMAIN_NAME", "companies, colleges, and universities")
                    chain = generation_chain
                    inputs = {"context": context, "question": payload.query, "DOMAIN_NAME": domain_name}

                async for chunk in chain.astream(inputs):
                    full_response += chunk
                    yield chunk

                conn = get_db_connection()
                conn.execute('INSERT INTO messages (session_id, sender, content, created_at) VALUES (?, ?, ?, ?)',
                             (session_id, 'ai', full_response, datetime.now().isoformat()))
                conn.commit()
                conn.close()

                if use_fallback:
                    metadata = json.dumps({"confidence": confidence, "sources": [], "fallback": True})
                else:
                    metadata = json.dumps({"confidence": confidence, "sources": sources, "fallback": False})
                yield f"\n\n<<SOURCE_DATA>>{metadata}"

            except Exception as e:
                yield f"Error: {str(e)}"

        return StreamingResponse(generate(), media_type="text/plain", headers={"X-Session-ID": session_id})

    @app.get("/")
    async def root():
        return {
            "message": "RAG API running with TXT, PDF, OCR support (Gemini 1.5 Flash, LangChain 1.x)"
        }

    return app
