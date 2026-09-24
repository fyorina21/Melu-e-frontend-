const fs = require("fs");
let content = fs.readFileSync("src/api/mock/routes.ts", "utf-8");
content = content.replace(/\\\`/g, "`").replace(/\\\$\{/g, "${");
fs.writeFileSync("src/api/mock/routes.ts", content);

