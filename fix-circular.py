import re

with open('src/api/mock/routes.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the import
content = content.replace("import { DEFAULT_ABLLS_DOMAINS, getMaxCellsForItem } from '../../screens/assessments/abllsConfigHelper';", "")

replacement = '''
          const ablls = find('skills') || {};
  
          // Hardcode domains to prevent circular dependency
          const ABLLS_DOMAINS = [
            { name: 'Cooperation and Reinforcer Effectiveness', max: 100 },
            { name: 'Visual Performance', max: 100 },
            { name: 'Receptive Language', max: 100 },
            { name: 'Vocal Imitation', max: 100 },
            { name: 'Requests (Mands)', max: 100 },
            { name: 'Labeling (Tacts)', max: 100 },
            { name: 'Intraverbals', max: 100 },
            { name: 'Spontaneous Vocalizations', max: 100 },
            { name: 'Syntax and Grammar', max: 100 },
            { name: 'Play and Leisure', max: 100 },
            { name: 'Social Interaction', max: 100 },
            { name: 'Group Instruction', max: 100 },
            { name: 'Classroom Routines', max: 100 },
            { name: 'Generalized Responding', max: 100 },
            { name: 'Reading', max: 100 },
            { name: 'Math', max: 100 },
            { name: 'Writing', max: 100 },
            { name: 'Spelling', max: 100 },
            { name: 'Dressing', max: 100 },
            { name: 'Eating', max: 100 },
            { name: 'Grooming', max: 100 },
            { name: 'Toileting', max: 100 },
            { name: 'Gross Motor', max: 100 },
            { name: 'Fine Motor', max: 100 }
          ];

          let computedAblls = ABLLS_DOMAINS.map((domain, index) => {
            const letterCode = String.fromCharCode(65 + index); // A, B, C...
            let score = 0;
            let max = 0;
            if (ablls && ablls.scores && !Array.isArray(ablls.scores)) {
              // Estimate based on score keys matching the letter
              Object.keys(ablls.scores).forEach(key => {
                if (key.startsWith(letterCode)) {
                  const val = ablls.scores[key];
                  if (val !== undefined && val !== 'NA' && val !== null) {
                    score += (typeof val === 'number' ? val : parseInt(String(val), 10)) || 0;
                  }
                  max += 4; // Max score per item is usually 4
                }
              });
            } else {
              max = 100;
            }
            
            // Normalize to percentage
            const percent = max > 0 ? Math.round((score / max) * 100) : 0;
            return {
              domain: domain.name,
              score: (ablls && ablls.scores && Object.keys(ablls.scores).length > 0) ? percent : null,
              max: 100
            };
          }).filter(d => d.score !== null);
          
          if (computedAblls.length === 0) {
            computedAblls = ABLLS_DOMAINS.slice(0, 4).map(d => ({ domain: d.name, score: null, max: 100 }));
          }
'''

content = re.sub(
    r"const ablls = find\('skills'\) \|\| \{\};.*?if \(computedAblls\.length === 0\) \{.*?\}",
    replacement.strip() + "\n",
    content,
    flags=re.DOTALL
)

with open('src/api/mock/routes.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed circular dependency in routes.ts")
