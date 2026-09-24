const fs = require('fs');
let content = fs.readFileSync('src/api/mock/routes.ts', 'utf-8');
content = content.replace(/\)\);\s*\}\s*const behavior = find\('behavior'\)/, "const behavior = find('behavior')");
fs.writeFileSync('src/api/mock/routes.ts', content, 'utf-8');
