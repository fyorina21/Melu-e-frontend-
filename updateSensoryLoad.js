const fs = require('fs');
let c = fs.readFileSync('src/screens/assessments/SensoryAssessmentScreen.tsx', 'utf8');
c = c.replace('import { openPrintWindow } from ' + String.fromCharCode(39) + '../../utils/webExport' + String.fromCharCode(39) + ';', 'import { openPrintWindow } from ' + String.fromCharCode(39) + '../../utils/webExport' + String.fromCharCode(39) + ';\nimport { getTeacherStudentProfile } from ' + String.fromCharCode(39) + '../../api/teacherExtrasApi' + String.fromCharCode(39) + ';\nimport { useEffect } from ' + String.fromCharCode(39) + 'react' + String.fromCharCode(39) + ';');
c = c.replace('const [profile, setProfile] = useState<any>(null);', 'const [profile, setProfile] = useState<any>(null);\n  useEffect(() => {\n    getTeacherStudentProfile(studentId).then(res => {\n      if (res?.data) setProfile(res.data);\n    }).catch(() => {});\n  }, [studentId]);');
fs.writeFileSync('src/screens/assessments/SensoryAssessmentScreen.tsx', c, 'utf8');
