import re

with open('src/api/mock/routes.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'DEFAULT_ABLLS_DOMAINS' not in content:
    content = content.replace(
        "import { newId, requiredParam, bodyAs, notFound, type MockHandlerContext } from './db';",
        "import { newId, requiredParam, bodyAs, notFound, type MockHandlerContext } from './db';\nimport { DEFAULT_ABLLS_DOMAINS, getMaxCellsForItem } from '../../screens/assessments/abllsConfigHelper';"
    )

replacement = '''
          const ablls = find('skills') || {};
  
          let computedAblls = DEFAULT_ABLLS_DOMAINS.map(domain => {
            let score = 0;
            let max = 0;
            if (ablls && ablls.scores && !Array.isArray(ablls.scores)) {
              domain.items.forEach(item => {
                const maxCells = getMaxCellsForItem(item);
                max += maxCells;
                const val = ablls.scores[item.id];
                if (val !== undefined && val !== 'NA' && val !== null) {
                  score += (typeof val === 'number' ? val : parseInt(String(val), 10)) || 0;
                }
              });
            } else {
              max = 100;
            }
            // Normalize to 100 percentage for the UI bar
            const percent = max > 0 ? Math.round((score / max) * 100) : 0;
            return {
              domain: domain.name,
              score: (ablls && ablls.scores && Object.keys(ablls.scores).length > 0) ? percent : null,
              max: 100
            };
          }).filter(d => d.score !== null);
          
          // Fallback if empty
          if (computedAblls.length === 0) {
            computedAblls = DEFAULT_ABLLS_DOMAINS.slice(0,4).map(d => ({ domain: d.name, score: null, max: 100 }));
          }

          const behavior = find('behavior') || {};
'''

content = re.sub(
    r"const ablls = find\('skills'\) \|\| \{\};.*?const behavior = find\('behavior'\) \|\| \{\};",
    replacement.strip() + "\n",
    content,
    flags=re.DOTALL
)

with open('src/api/mock/routes.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated ABLLS calculation")
