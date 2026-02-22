import fs from "fs";

let code = fs.readFileSync("src/App.jsx", "utf-8");

// First, make sure we import the FileText icon
if (!code.includes("FileText")) {
    code = code.replace(
        "import { Send, Sparkles, Loader2, Bot, User, Menu, Plus, MessageSquare, Trash2, X, PanelLeftClose, PanelLeftOpen, Paperclip, Settings, LayoutGrid, Mic, ArrowUp } from \"lucide-react\";",
        "import { Send, Sparkles, Loader2, Bot, User, Menu, Plus, MessageSquare, Trash2, X, PanelLeftClose, PanelLeftOpen, Paperclip, Settings, LayoutGrid, Mic, ArrowUp, FileText } from \"lucide-react\";"
    );
}

// Now replace the simple chips with a PDF icon + filename
const originalChipsCode = `{message.type === "ai" && message.sources && message.sources.length > 0 && (
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {message.sources.map((s, i) => (
                              <div key={i} className="px-3 py-1 bg-white/5 rounded-full text-[11px] text-white/40 border border-white/5">
                                {s}
                              </div>
                            ))}
                          </div>
                        )}`;

const newChipsCode = `{message.type === "ai" && message.sources && message.sources.length > 0 && (
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {message.sources.map((s, i) => (
                              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full text-[12px] text-white/60 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer mr-1">
                                <FileText className="w-3.5 h-3.5 text-blue-400" />
                                {s}
                              </div>
                            ))}
                          </div>
                        )}`;

code = code.replace(originalChipsCode, newChipsCode);

fs.writeFileSync("src/App.jsx", code);
