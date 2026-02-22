const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  /import \{ Send, Sparkles, Loader2, Bot, User, Menu, Plus, MessageSquare, Trash2, X, PanelLeftClose, PanelLeftOpen \} from "lucide-react";/g,
  'import { Send, Sparkles, Loader2, Bot, User, Menu, Plus, MessageSquare, Trash2, X, PanelLeftClose, PanelLeftOpen, Paperclip, Settings, LayoutGrid, Mic, ArrowUp } from "lucide-react";'
);

fs.writeFileSync('src/App.jsx', code);
