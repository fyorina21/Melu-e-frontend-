import re

with open('src/api/mock/routes.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"(pattern: '/sessions/:id/summary',\s+handler: \(ctx\) => \{\s+const id = requiredParam\(ctx, 'id'\);\s+const summary = mockDb\.findById\('sessionSummaries', id\);).*?(^\s*\},$)"
new_handler = """\\1
      const nameById = (sid: string) =>
        (mockDb.all('students') as Array<{ id: string; fullName?: string }>).find(
          (s) => s.id === sid
        )?.fullName || sid;
        
      const recordedIncidents = (
        mockDb.all('incidents') as Array<{
          sessionId?: string;
          studentId: string;
          time: string;
          behavior: string;
          antecedent: string;
          consequence: string;
          location: string;
          notes: string;
        }>
      )
        .filter((i) => i.sessionId === id)
        .map((i) => ({
          time: i.time,
          behavior: i.behavior || 'Unspecified behavior',
          studentName: nameById(i.studentId),
          antecedent: i.antecedent,
          consequence: i.consequence,
          location: i.location,
          notes: i.notes,
        }));

      const students = mockDb.all('students').filter((s) => s.status !== 'paused' && studentVisibleToCurrentUser(s.id) && isSessionReady(s.id)).map((s) => ({
        id: s.id,
        name: s.fullName,
        goals: s.goals.map((g) => {
          const trials = (mockDb.all('trials') as any[]).filter((t) => t.studentGoalId === g.id && t.sessionId === id);
          const totalTrials = trials.length;
          const indep = trials.filter((t) => (t.promptLabel || t.promptLevelId || '').toUpperCase() === 'INDEPENDENT').length;
          const independencePercent = totalTrials > 0 ? Math.round((indep / totalTrials) * 100) : g.progressPercent;
          const promptBreakdown = trials.reduce((acc: any, t) => {
            const lvl = t.promptLabel || t.promptLevelId || 'G';
            acc[lvl] = (acc[lvl] || 0) + 1;
            return acc;
          }, {});
          const trialLog = trials.map((t) => ({
            promptLevel: t.promptLabel || t.promptLevelId || 'G',
            timestamp: t.loggedAt ? new Date(t.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          return {
            id: g.id,
            name: g.name,
            goalType: 'standard' as const,
            independencePercent,
            totalTrials,
            promptBreakdown,
            trialLog,
          };
        }),
      }));

      const incidents = recordedIncidents.length > 0 ? recordedIncidents : [];

      if (summary) {
        return {
          ...summary,
          stationName: summary.station || '',
          teacherName: summary.teacher || '',
          startTime: summary.startedAt ? new Date(summary.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          endTime: summary.endedAt ? new Date(summary.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          durationMinutes: summary.durationMinutes || 0,
          students,
          incidents,
        };
      }

      return {
        id: id,
        stationName: 'Station 1 - Basic Skills',
        teacherName: 'Current Teacher',
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationMinutes: 90,
        notes: '',
        status: 'pending_review',
        students,
        incidents,
      };
    },"""

result = re.sub(pattern, new_handler, content, flags=re.DOTALL | re.MULTILINE)

with open('src/api/mock/routes.ts', 'w', encoding='utf-8') as f:
    f.write(result)
