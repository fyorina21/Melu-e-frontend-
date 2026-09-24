import re

with open('src/screens/programdirector/AssessmentSummaryReport.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r"\s*<InfoItem label=\"Program Type\".*?/>", "", content)
content = re.sub(r"\s*<InfoItem label=\"Therapy Group\".*?/>", "", content)
content = re.sub(r"\s*<InfoItem label=\"Enrollment Date\".*?/>", "", content)
content = re.sub(r"\s*<InfoItem label=\"Assessment Start\".*?/>", "", content)

with open('src/screens/programdirector/AssessmentSummaryReport.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed requested fields")
