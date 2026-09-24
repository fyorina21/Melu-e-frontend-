const fs = require('fs');
let content = fs.readFileSync('src/api/mock/routes.ts', 'utf-8');
content = content.replace("          }\n));\n          }\n\n          const behavior", "          }\n\n          const behavior");
fs.writeFileSync('src/api/mock/routes.ts', content, 'utf-8');
