import fs from "fs";
let code = fs.readFileSync("src/App.jsx", "utf-8");

code = code.replace(
  /import \{ Send/,
  "import BubbleCanvas from './BubbleCanvas';\nimport { Send"
);

code = code.replace(
  /<div className="relative w-24 h-24 mb-6">[\s\S]*?<\/div>/m,
  `<div className="relative w-48 h-48 mb-6 flex items-center justify-center pointer-events-auto">
                      <BubbleCanvas />
                    </div>`
);

fs.writeFileSync("src/App.jsx", code);
console.log("Patched App.jsx");
