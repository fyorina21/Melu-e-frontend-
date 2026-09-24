const fs = require('fs');

function updateFile(file, importSearch, importReplace, stateSearch, stateReplace, loadSearch, loadReplace) {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(importSearch, importReplace);
  c = c.replace(stateSearch, stateReplace);
  c = c.replace(loadSearch, loadReplace);
  c = c.replace('<Text style={styles.studentName}>Student A</Text>', '<Text style={styles.studentName}>{profile?.fullName || ' + String.fromCharCode(39) + 'Student' + String.fromCharCode(39) + '}</Text>');
  c = c.replace('<Text style={styles.studentAge}>Age 6</Text>', '<Text style={styles.studentAge}>Age {profile?.age || ' + String.fromCharCode(39) + '?' + String.fromCharCode(39) + '}</Text>');
  fs.writeFileSync(file, c, 'utf8');
}

updateFile(
  'src/screens/assessments/SensoryAssessmentScreen.tsx',
  'saveSensoryAssessment, getSensoryAssessment',
  'saveSensoryAssessment, getSensoryAssessment, getTeacherStudentProfile',
  'const [activeTab, setActiveTab] = useState<' + String.fromCharCode(39) + 'Profile' + String.fromCharCode(39) + ' | ' + String.fromCharCode(39) + 'Observation' + String.fromCharCode(39) + ' | ' + String.fromCharCode(39) + 'Notes' + String.fromCharCode(39) + '>(' + String.fromCharCode(39) + 'Profile' + String.fromCharCode(39) + ');',
  'const [activeTab, setActiveTab] = useState<' + String.fromCharCode(39) + 'Profile' + String.fromCharCode(39) + ' | ' + String.fromCharCode(39) + 'Observation' + String.fromCharCode(39) + ' | ' + String.fromCharCode(39) + 'Notes' + String.fromCharCode(39) + '>(' + String.fromCharCode(39) + 'Profile' + String.fromCharCode(39) + ');\n  const [profile, setProfile] = useState<any>(null);',
  'const { data: saved } = await getSensoryAssessment(studentId);',
  'const profileRes = await getTeacherStudentProfile(studentId).catch(() => null);\n      if (profileRes?.data) setProfile(profileRes.data);\n      const { data: saved } = await getSensoryAssessment(studentId);'
);

updateFile(
  'src/screens/assessments/SocialSkillsAssessmentScreen.tsx',
  'saveSocialSkillsAssessment, getSocialSkillsAssessment',
  'saveSocialSkillsAssessment, getSocialSkillsAssessment, getTeacherStudentProfile',
  'const [activeTab, setActiveTab] = useState<SocialSkillsTab>(' + String.fromCharCode(39) + 'Basic' + String.fromCharCode(39) + ');',
  'const [activeTab, setActiveTab] = useState<SocialSkillsTab>(' + String.fromCharCode(39) + 'Basic' + String.fromCharCode(39) + ');\n  const [profile, setProfile] = useState<any>(null);',
  'const { data: saved } = await getSocialSkillsAssessment(studentId);',
  'const profileRes = await getTeacherStudentProfile(studentId).catch(() => null);\n      if (profileRes?.data) setProfile(profileRes.data);\n      const { data: saved } = await getSocialSkillsAssessment(studentId);'
);
