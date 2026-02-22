import React, { useState, useRef, useEffect } from "react";
import BubbleCanvas from './BubbleCanvas';
import { Send, Sparkles, Loader2, Bot, User, Menu, Plus, MessageSquare, Trash2, X, PanelLeftClose, PanelLeftOpen, Paperclip, Settings, LayoutGrid, Mic, ArrowUp, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  // Random welcome messages
  const welcomeMessages = [
    "How can Inflow AI help you today?",
    "What's on your mind today?",
    "Need help? Let’s figure it out.",
    "Confused? Bold of you to admit it",
    "Go on. Tell us what you messed up.",
    "What problem can we solve today?"
  ];

  useEffect(() => {
    // Pick a random message on initial load
    setWelcomeMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]);
  }, []);

  // Ref to store the full content received from backend
  const fullContentRef = useRef("");
  // Ref to track if we are currently streaming/typing
  const isTypingRef = useRef(false);

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key = "Older";
    if (date.toDateString() === today.toDateString()) {
      key = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Yesterday";
    } else if (today - date < 7 * 24 * 60 * 60 * 1000) { // Approx 7 days
      key = "Previous 7 Days";
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(session);
    return groups;
  }, {});

  const sessionGroups = ["Today", "Yesterday", "Previous 7 Days", "Older"];

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      setLoading(true);
      const res = await fetch(`http://127.0.0.1:8000/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        // Convert to UI message format
        const uiMessages = data.messages.map(m => ({
          type: m.sender,
          content: m.content
        }));
        setMessages(uiMessages);
        setCurrentSessionId(sessionId);
        // On mobile, close sidebar after selection. On desktop, keep it open.
        if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
        }
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    // Optionally focus input
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await fetch(`http://127.0.0.1:8000/sessions/${sessionId}`, { method: "DELETE" });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to handle smooth typing animation
  useEffect(() => {
    let intervalId;

    if (loading || isTypingRef.current) {
      intervalId = setInterval(() => {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          // Only animate if the last message is AI and needs update
          if (lastMsg?.type === "ai" && lastMsg.content.length < fullContentRef.current.length) {
            const nextCharIndex = lastMsg.content.length;
            const charsToAdd = fullContentRef.current.slice(nextCharIndex, nextCharIndex + 3);

            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...lastMsg,
              content: lastMsg.content + charsToAdd
            };
            return newMessages;
          } else if (lastMsg?.type === "ai" && lastMsg.content.length >= fullContentRef.current.length && !loading) {
            isTypingRef.current = false;
          }
          return prev;
        });
      }, 20);
    }

    return () => clearInterval(intervalId);
  }, [loading]);

  const handleAsk = async () => {
    if (!query.trim()) return;

    const userMessage = { type: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    fullContentRef.current = "";
    isTypingRef.current = true;

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          session_id: currentSessionId
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(response.statusText);
      }

      // Get Session ID if created new
      const newSessionId = response.headers.get("X-Session-ID");
      if (newSessionId && !currentSessionId) {
        setCurrentSessionId(newSessionId);
        fetchSessions(); // Refresh list to show new chat title
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      setMessages((prev) => [...prev, { type: "ai", content: "" }]);

      let rawStream = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        rawStream += chunk;

        let displayContent = rawStream;
        // Hide starting metadata JSON from the UI typing animation
        const match = displayContent.match(/\{"?(?:sources?|confidence|metadata)?"?[^}]*$/i);
        if (match && match.index > displayContent.length - 2000) {
          displayContent = displayContent.slice(0, match.index).trim();
        }

        fullContentRef.current = displayContent;
      }

      const full = rawStream;
      let contentOnly = full;
      let parsedSources = undefined;
      let parsedConfidence = undefined;

      const tryParseTrailingJSON = (text) => {
        for (let i = text.lastIndexOf('{'); i >= 0; i = text.lastIndexOf('{', i - 1)) {
          const possible = text.slice(i);
          try {
            const obj = JSON.parse(possible);
            if (obj && (obj.sources || obj.confidence || obj.metadata)) return { obj, index: i };
          } catch (e) {
          }
        }
        return null;
      };

      const result = tryParseTrailingJSON(full);
      if (result) {
        const { obj, index } = result;
        contentOnly = full.slice(0, index).trim();
        if (obj.sources) parsedSources = obj.sources;
        if (obj.confidence !== undefined) parsedConfidence = obj.confidence;
        if (!parsedSources && obj.metadata && obj.metadata.sources) parsedSources = obj.metadata.sources;
        if (!parsedConfidence && obj.metadata && obj.metadata.confidence !== undefined) parsedConfidence = obj.metadata.confidence;
      }

      fullContentRef.current = contentOnly;

      if (parsedSources || parsedConfidence !== undefined) {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          const updated = { ...last, content: contentOnly };
          if (parsedSources) {
            const unique = Array.from(new Set(parsedSources.map(s => s.source || s)));
            updated.sources = unique;
          }
          if (parsedConfidence !== undefined) updated.confidence = parsedConfidence;
          const copy = [...prev];
          copy[copy.length - 1] = updated;
          return copy;
        });
      }
    } catch (err) {
      console.error("Stream error:", err);
      const errorMessage = {
        type: "error",
        content: "Failed to connect to the server",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#100D14] text-white selection:bg-white/20 font-sans p-2">

      {/* Sidebar Container */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: -280, opacity: 0, width: 0 }}
              animate={{ x: 0, opacity: 1, width: "17rem" }}
              exit={{ x: -280, opacity: 0, width: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, ease: "easeInOut" }}
              className="absolute md:relative z-50 h-full bg-[#100D14] flex flex-col md:shadow-none overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between min-w-[17rem]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-white flex items-center justify-center rounded-full">
                    <div className="w-3.5 h-3.5 border-[2.5px] border-black rounded-full" />
                  </div>
                  <span className="font-bold text-xl tracking-wide text-white/90">Inflow AI</span>
                </div>

                {/* Close Sidebar Button */}
                <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors">
                  <PanelLeftClose className="w-4 h-4 hidden md:block" />
                  <X className="w-4 h-4 md:hidden" />
                </button>
              </div>

              <div className="px-3 pb-3 mt-1">
                <button
                  onClick={createNewChat}
                  className="w-full flex items-center gap-2 bg-[#2D2836] border border-white/5 hover:bg-[#353040] text-white/90 px-3 py-2.5 rounded-xl transition-all text-[13px] font-medium shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6 scrollbar-hide">
                {sessionGroups.map((group) => {
                  const groupSessions = groupedSessions[group];
                  if (!groupSessions || groupSessions.length === 0) return null;

                  return (
                    <div key={group}>
                      <h3 className="px-1 text-[11px] font-medium text-white/40 mb-1.5">{group === "Today" ? "Sessions" : group}</h3>
                      <div className="space-y-0.5">
                        {groupSessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => loadSession(session.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group relative",
                              currentSessionId === session.id
                                ? "bg-white/10 text-white font-medium"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />
                            <span className="flex-1 truncate text-[14px]">{session.title}</span>

                            <div
                              onClick={(e) => deleteSession(e, session.id)}
                              className={cn(
                                "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400 transition-colors",
                                "opacity-0 group-hover:opacity-100",
                                currentSessionId === session.id && "bg-transparent"
                              )}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {sessions.length === 0 && (
                  <div className="px-4 py-8 text-center text-white/30 text-[13px]">
                    No recent chats
                  </div>
                )}
              </div>


            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col relative h-full">
        <div className="w-full h-full bg-gradient-to-br from-[#2D1F3B] via-[#1D1728] to-[#120D16] rounded-l-[32px] md:rounded-[32px] border border-white/5 flex flex-col relative overflow-hidden shadow-2xl">

          {/* Subtle glowing blob backdrops */}
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-[#9F7AEA]/10 blur-[120px] rounded-full pointer-events-none" />

          {/* Header Area */}
          <div className="absolute top-5 left-6 right-6 z-30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors backdrop-blur-md"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )}
            </div>


          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth z-10 scrollbar-hide">
            <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end pb-[260px] pt-24 relative">
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center justify-center my-auto w-full absolute top-[15%] left-0 right-0 pointer-events-none"
                  >
                    <div className="relative w-48 h-48 mb-6 flex items-center justify-center pointer-events-auto">
                      <BubbleCanvas />
                    </div>
                    <h2 className="text-3xl sm:text-[32px] font-normal mb-10 text-center tracking-tight text-white drop-shadow-sm">
                      {welcomeMessage}
                    </h2>


                  </motion.div>
                ) : (
                  messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex gap-4 mb-8",
                        message.type === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.type !== "user" && (
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-7 h-7 rounded-sm bg-white/10 flex items-center justify-center text-white shadow-sm border border-white/5">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[85%] sm:max-w-[75%] px-5 py-3 text-[15px] leading-relaxed shadow-sm",
                          message.type === "user"
                            ? "bg-white/10 text-white rounded-[20px] rounded-br-[4px] border border-white/5 backdrop-blur-md"
                            : "bg-transparent text-[#E2E8F0] pl-0 pt-0"
                        )}
                      >
                        {message.type === "ai" ? (
                          <div className="prose prose-sm prose-invert max-w-none text-white/90">
                            <ReactMarkdown>{message.content.replace(/<<SOURCE_DATA>>/g, '')}</ReactMarkdown>
                          </div>
                        ) : null}

                        {message.type === "ai" && message.sources && message.sources.length > 0 && (
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {message.sources.map((s, i) => (
                              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full text-[12px] text-white/60 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer mr-1">
                                <FileText className="w-3.5 h-3.5 text-blue-400" />
                                {s}
                              </div>
                            ))}
                          </div>
                        )}

                        {message.type !== "ai" && (
                          <p className="whitespace-pre-wrap font-medium">{message.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 mb-8 ml-11">
                  <div className="bg-white/5 rounded-[16px] rounded-bl-[4px] px-4 py-3 border border-white/5 w-fit">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse delay-75" />
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Fixed Input Area and Feature Cards at Bottom */}
          <div className="absolute bottom-6 left-0 right-0 px-6 z-20 flex flex-col items-center pointer-events-none">

            {/* Input Box */}
            <motion.div
              initial={false}
              animate={{ width: messages.length === 0 && !query && !loading ? "800px" : "800px", maxWidth: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="pointer-events-auto w-full max-w-4xl"
            >
              <div
                className={cn(
                  "relative flex flex-col bg-[#1A1525]/60 border border-white/20 rounded-[28px] p-1 backdrop-blur-2xl shadow-2xl transition-all duration-300",
                  isFocused ? "border-[#9F7AEA]/50 bg-[#1F192E]/80 shadow-[0_0_30px_rgba(159,122,234,0.15)]" : "hover:border-white/30"
                )}
              >
                <div className="flex items-start gap-3 px-4 pt-4 pb-2">
                  <Sparkles className="w-5 h-5 text-[#B48EFC] flex-shrink-0 mt-0.5" />
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask Anything..."
                    rows={1}
                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/40 resize-none max-h-[120px] scrollbar-hide outline-none text-[15px] font-normal leading-relaxed"
                    style={{ minHeight: "28px" }}
                  />
                </div>

                {/* Input Actions Footer */}
                <div className="flex items-center justify-end px-3 pb-2 pt-2 mt-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAsk}
                    disabled={loading || !query.trim()}
                    className="w-8 h-8 rounded-full bg-[#B48EFC] text-black hover:bg-[#A374F9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-lg shadow-[#B48EFC]/20"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white shadow-none" />
                    ) : (
                      <ArrowUp className="w-4 h-4 stroke-[3]" />
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );

}

export default App;
