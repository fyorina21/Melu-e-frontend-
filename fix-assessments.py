import re

with open('src/api/mock/routes.ts', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''
          const LIKERT_SCORE: Record<string, number> = { Never: 0, 'Almost Never': 1, Seldom: 2, 'Half the Time': 3, Usually: 4, 'Almost Always': 5, Always: 6 };
          const massAnswers = behavior.massAnswers || {};
          const fastAnswers = behavior.fastAnswers || {};
          const records = behavior.records || [];
          
          let sensory = 0, escape = 0, attention = 0, tangible = 0;
          if (massAnswers['M1']) sensory += LIKERT_SCORE[massAnswers['M1']] || 0;
          if (massAnswers['M5']) sensory += LIKERT_SCORE[massAnswers['M5']] || 0;
          if (massAnswers['M10']) sensory += LIKERT_SCORE[massAnswers['M10']] || 0;
          
          if (massAnswers['M2']) escape += LIKERT_SCORE[massAnswers['M2']] || 0;
          if (massAnswers['M6']) escape += LIKERT_SCORE[massAnswers['M6']] || 0;
          if (massAnswers['M9']) escape += LIKERT_SCORE[massAnswers['M9']] || 0;
          
          if (massAnswers['M3']) attention += LIKERT_SCORE[massAnswers['M3']] || 0;
          if (massAnswers['M7']) attention += LIKERT_SCORE[massAnswers['M7']] || 0;
          if (massAnswers['M11']) attention += LIKERT_SCORE[massAnswers['M11']] || 0;
          
          if (massAnswers['M4']) tangible += LIKERT_SCORE[massAnswers['M4']] || 0;
          if (massAnswers['M8']) tangible += LIKERT_SCORE[massAnswers['M8']] || 0;
          if (massAnswers['M12']) tangible += LIKERT_SCORE[massAnswers['M12']] || 0;

          const massScores = [
            { function: 'Sensory', score: sensory },
            { function: 'Escape', score: escape },
            { function: 'Attention', score: attention },
            { function: 'Tangible', score: tangible },
          ];
          const massDominant = massScores.reduce((max, s) => s.score > max.score ? s : max, massScores[0]).function;

          let socialPos = 0, socialNeg = 0, autoPos = 0, autoNeg = 0;
          if (fastAnswers['F1']) socialPos++;
          if (fastAnswers['F7']) socialPos++;
          if (fastAnswers['F8']) socialPos++;
          
          if (fastAnswers['F2']) socialNeg++;
          if (fastAnswers['F6']) socialNeg++;
          
          if (fastAnswers['F3']) autoPos++;
          if (fastAnswers['F5']) autoPos++;
          
          if (fastAnswers['F4']) autoNeg++;

          const fastScores = [
            { function: 'Social - Positive', score: socialPos },
            { function: 'Social - Negative', score: socialNeg },
            { function: 'Automatic - Positive', score: autoPos },
            { function: 'Automatic - Negative', score: autoNeg },
          ];
          const fastHypothesized = fastScores.reduce((max, s) => s.score > max.score ? s : max, fastScores[0]).function;

          const prefItems = preference.items || [];
          const sortedPrefs = prefItems.sort((a: any, b: any) => (b.timerSeconds || 0) - (a.timerSeconds || 0)).slice(0, 5).map((item: any, idx: number) => ({
            rank: idx + 1,
            item: item.name,
            duration: Math.floor((item.timerSeconds || 0) / 60) + ' min ' + ((item.timerSeconds || 0) % 60) + ' sec',
            frequency: 1,
            context: item.category
          }));

            return {
              students,
              studentInfo: {
                fullName: student.fullName,
                dateOfBirth: student.dateOfBirth || 'Unknown',
                age: student.age || 'Unknown',
                diagnosis: 'Autism Spectrum Disorder',
                parentGuardian: mockDb.all('users').find(u => u.childIds && u.childIds.includes(student.id))?.name || 'Unknown',
                phone: 'Not provided',
                programType: student.programType || 'Unknown',
                therapyGroup: student.therapyGroup || 'Unknown',
                station: 'Station 1',
                enrollmentDate: 'Unknown',
                assessmentStart: 'Unknown',
                assessmentEnd: 'Unknown',
              },
            ablls: computedAblls,
            behavior: {
              mass: {
                scores: massScores,
                dominantFunction: massDominant,
              },
              fast: {
                scores: fastScores,
                hypothesizedFunction: fastHypothesized,
              },
              abc: {
                totalIncidents: records.length,
                topAntecedents: records.length > 0 ? [
                  { antecedent: records[0].trigger || 'Unknown', count: records.length }
                ] : [],
              },
            },
            preference: sortedPrefs.length > 0 ? sortedPrefs : [
              { rank: 1, item: 'None recorded', duration: '0 min', frequency: 0, context: 'None' }
            ],
'''

content = re.sub(
    r"return \{\s*students,\s*studentInfo: \{.*?preference: .*?\],",
    replacement.strip(),
    content,
    flags=re.DOTALL
)

with open('src/api/mock/routes.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated mock logic for true calculations")
