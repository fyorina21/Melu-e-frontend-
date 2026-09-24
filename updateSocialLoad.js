const fs = require('fs');
let c = fs.readFileSync('src/screens/assessments/SocialSkillsAssessmentScreen.tsx', 'utf8');
c = c.replace('import { useToast } from ' + String.fromCharCode(39) + '../../context/ToastContext' + String.fromCharCode(39) + ';', 'import { useToast } from ' + String.fromCharCode(39) + '../../context/ToastContext' + String.fromCharCode(39) + ';\nimport { getTeacherStudentProfile } from ' + String.fromCharCode(39) + '../../api/teacherExtrasApi' + String.fromCharCode(39) + ';\nimport { useEffect } from ' + String.fromCharCode(39) + 'react' + String.fromCharCode(39) + ';');
c = c.replace('const answered = Object.keys(scores).length;', 'const answered = Object.keys(scores).length;\n  useEffect(() => {\n    getTeacherStudentProfile(studentId).then(res => {\n      if (res?.data) setProfile(res.data);\n    }).catch(() => {});\n  }, [studentId]);');
fs.writeFileSync('src/screens/assessments/SocialSkillsAssessmentScreen.tsx', c, 'utf8');
