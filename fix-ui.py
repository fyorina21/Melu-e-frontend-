import re

with open('src/screens/programdirector/AssessmentSummaryReport.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fields to remove: Program, Diagnosis, Phone, Group, Enrollment, Assessment End
content = re.sub(r"^\s*<InfoItem label=\"Diagnosis\" value=\{studentInfo\.diagnosis\} />\n", "", content, flags=re.MULTILINE)
content = re.sub(r"^\s*<InfoItem label=\"Phone\" value=\{studentInfo\.phone\} />\n", "", content, flags=re.MULTILINE)
content = re.sub(r"^\s*<InfoItem label=\"Program\" value=\{studentInfo\.programType\} />\n", "", content, flags=re.MULTILINE)
content = re.sub(r"^\s*<InfoItem label=\"Group\" value=\{studentInfo\.therapyGroup\} />\n", "", content, flags=re.MULTILINE)
content = re.sub(r"^\s*<InfoItem label=\"Enrollment\" value=\{studentInfo\.enrollmentDate\} />\n", "", content, flags=re.MULTILINE)
content = re.sub(r"^\s*<InfoItem label=\"Assessment End\" value=\{studentInfo\.assessmentEnd\} />\n", "", content, flags=re.MULTILINE)

with open('src/screens/programdirector/AssessmentSummaryReport.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed fields from AssessmentSummaryReport.tsx")
