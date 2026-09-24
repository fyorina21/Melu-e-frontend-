const fs = require('fs');
let c = fs.readFileSync('src/screens/assessments/SensoryAssessmentScreen.tsx', 'utf8');
c = c.replace('const [assessmentDate, setAssessmentDate] = useState(' + String.fromCharCode(39) + '08/21/2026' + String.fromCharCode(39) + ');', 'const [assessmentDate, setAssessmentDate] = useState(' + String.fromCharCode(39) + '08/21/2026' + String.fromCharCode(39) + ');\n  const [profile, setProfile] = useState<any>(null);');
fs.writeFileSync('src/screens/assessments/SensoryAssessmentScreen.tsx', c, 'utf8');
