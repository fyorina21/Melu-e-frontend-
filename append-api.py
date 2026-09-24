with open('src/api/programDirectorApi.ts', 'a', encoding='utf-8') as f:
    f.write("\nexport const getAssessmentSummaryDashboard = (studentId?: string) => client.get('/program-director/assessment-summary-dashboard', { params: { studentId } });\n")
print("Done appending to API")
