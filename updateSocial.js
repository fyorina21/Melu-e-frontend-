const fs = require('fs');
let c = fs.readFileSync('src/screens/assessments/SocialSkillsAssessmentScreen.tsx', 'utf8');
c = c.replace('const [saving, setSaving] = useState(false);', 'const [saving, setSaving] = useState(false);\n  const [profile, setProfile] = useState<any>(null);');
fs.writeFileSync('src/screens/assessments/SocialSkillsAssessmentScreen.tsx', c, 'utf8');
