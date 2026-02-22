import fs from "fs";
const code = fs.readFileSync("src/App.jsx", "utf-8");

const newImports = `import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, Bot, User, Menu, Plus, MessageSquare, Trash2, X, PanelLeftClose, PanelLeftOpen, Paperclip, Settings, LayoutGrid, Mic, ArrowUp } from "lucide-react";`;
let newCode = code.replace(
  /import React.*\nimport \{ Send.*lucide-react";/s,
  newImports
);

const returnStartIdx = newCode.indexOf("  return (\n    <div className=\"relative flex h-screen");
if (returnStartIdx === -1) {  console.error("Could not find return statement start!"); process.exit(1); }

const newReturn = `  return (
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
                  <span className="font-semibold text-[15px] tracking-wide text-white/90">Zyricon</span>
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
                              "w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-all text-left group relative",
                              currentSessionId === session.id
                                ? "bg-white/10 text-white font-medium"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                            <span className="flex-1 truncate text-[13px]">{session.title}</span>

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

              {/* User Profile / Settings Placeholder at bottom */}
              <div className="pb-2 pt-2 z-10 mx-3">
                <div className="p-3 rounded-[16px] bg-[#1C1825] border border-white/5 relative overflow-hidden flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2 mt-1">
                    <User className="w-4 h-4 text-white/50" />
                  </div>
                  <p className="text-[13px] font-medium text-white mt-1">Upgrade to premium</p>
                  <p className="text-[10px] text-white/40 leading-snug mt-1.5 text-center px-1 mb-3">Boost productivity with seamless automation and responsive AI.</p>
                  <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[12px] font-medium transition-colors">
                    Upgrade
                  </button>
                </div>
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
              {/* Fake Model Selector */}
              <div className="px-4 py-2 rounded-full bg-[#1C1825]/80 border border-white/5 text-[13px] font-medium text-white/90 flex items-center gap-2 backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors shadow-sm">
                ChatGPT v4.0 <span className="text-white/40 text-[10px] ml-1">▼</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 hidden sm:flex">
              <button className="px-4 py-2 rounded-full bg-[#1C1825]/80 border border-white/5 text-[13px] font-medium text-white/90 hover:bg-white/10 transition-colors backdrop-blur-md flex items-center gap-2">
                Configuration <Settings className="w-3.5 h-3.5 ml-1" />
              </button>
              <button className="px-4 py-2 rounded-full bg-[#1C1825]/80 border border-white/5 text-[13px] font-medium text-white/90 hover:bg-white/10 transition-colors backdrop-blur-md flex items-center gap-2">
                Export <ArrowUp className="w-3.5 h-3.5 ml-1" />
              </button>
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
                    <div className="relative w-24 h-24 mb-6">
                       <div className="absolute inset-2 bg-gradient-to-tr from-[#9F7AEA] via-[#E2E8F0] to-[#4299E1] rounded-full blur-[2px] shadow-[0_0_40px_rgba(159,122,234,0.3),inset_0_-10px_20px_rgba(0,0,0,0.5)] border-[0.5px] border-white/40" />
                       <div className="absolute top-3 right-5 w-6 h-6 bg-white/60 blur-[3px] rounded-full" />
                    </div>
                    <h2 className="text-3xl sm:text-[32px] font-normal mb-10 text-center tracking-tight text-white drop-shadow-sm">
                      Ready to Create Something New?
                    </h2>
                    
                    {/* Suggestion Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-10 pointer-events-auto">
                      <button className="px-4 py-2 rounded-full bg-transparent border border-white/10 text-[13px] font-medium text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2">
                        Create Image <LayoutGrid className="w-3.5 h-3.5 ml-1" />
                      </button>
                      <button className="px-4 py-2 rounded-full bg-transparent border border-white/10 text-[13px] font-medium text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2">
                        Brainstorm <Sparkles className="w-3.5 h-3.5 ml-1" />
                      </button>
                      <button className="px-4 py-2 rounded-full bg-transparent border border-white/10 text-[13px] font-medium text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2">
                        Make a plan <MessageSquare className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>
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
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : null}
                        {message.type === "ai" && message.sources && message.sources.length > 0 && (
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {message.sources.map((s, i) => (
                              <div key={i} className="px-3 py-1 bg-white/5 rounded-full text-[11px] text-white/40 border border-white/5">
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
                <div className="flex items-center justify-between px-3 pb-2 pt-2 mt-auto">
                    <div className="flex items-center gap-4 text-[#A1A1AA] text-[13px]">
                      <button className="flex items-center gap-1.5 hover:text-white transition-colors"><Paperclip className="w-4 h-4"/> Attach</button>
                      <button className="flex items-center gap-1.5 hover:text-white transition-colors hidden sm:flex"><Settings className="w-4 h-4"/> Settings</button>
                      <button className="flex items-center gap-1.5 hover:text-white transition-colors hidden sm:flex"><LayoutGrid className="w-4 h-4"/> Options</button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#A1A1AA] hover:text-white flex items-center justify-center transition-colors">
                            <Mic className="w-4 h-4" />
                        </button>
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
              </div>
            </motion.div>

            {/* Bottom App Cards (only shown on empty state like in reference) */}
            <AnimatePresence>
              {messages.length === 0 && !loading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10, position: "absolute" }}
                  transition={{ delay: 0.1 }}
                  className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pointer-events-auto"
                >
                  <div className="bg-[#1C1825]/60 backdrop-blur-md rounded-2xl p-4 border border-white/5 hover:bg-[#1F192E]/80 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-white/5 rounded-full text-white/50">Create Image</span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1.5">Image Generator</h3>
                    <p className="text-[11px] text-white/40 leading-snug">Create high-quality images instantly from text.</p>
                  </div>
                  
                  <div className="bg-[#1C1825]/60 backdrop-blur-md rounded-2xl p-4 border border-white/5 hover:bg-[#1F192E]/80 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-white/5 rounded-full text-white/50">Make Slides</span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1.5">AI Presentation</h3>
                    <p className="text-[11px] text-white/40 leading-snug">Turn ideas into engaging, professional presentations.</p>
                  </div>

                  <div className="bg-[#1C1825]/60 backdrop-blur-md rounded-2xl p-4 border border-white/5 hover:bg-[#1F192E]/80 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-white/5 rounded-full text-white/50">Generate Code</span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1.5">Dev Assistant</h3>
                    <p className="text-[11px] text-white/40 leading-snug">Generate clean, production ready code in seconds.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
`;

newCode = newCode.slice(0, returnStartIdx) + newReturn + "\n}\n\nexport default App;\n";

fs.writeFileSync("src/App.jsx", newCode);
console.log("App.jsx patched successfully!");
