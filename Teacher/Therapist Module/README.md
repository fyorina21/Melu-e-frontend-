# Nahom — Teacher / Therapist Module (18 screens)

Role: **Teacher (Therapist)** — the daily clinical operations user.

## Screens owned

| # | Screen | Spec |
|---|---|---|
| 1 | Teacher Dashboard | SCR-TEA-001 |
| 2 | Assessment Dashboard (6-week) | SCR-010 |
| 3 | Skills Assessment (ABLLS-R) | SCR-011 / SCR-TEA-002 |
| 4 | ABLLS Need Analysis Map | SCR-TEA-002A |
| 5 | Behavior Assessment (MASS/FAST + ABC) | SCR-012 / SCR-013 / SCR-TEA-003 |
| 6 | Preference Assessment | SCR-012 |
| 7 | Sensory Assessment | SCR-012 |
| 8 | ABC Log | SCR-003A |
| 9 | Session Data Collection | SCR-002 |
| 10 | Goal Mastery Check | SCR-004 |
| 11 | Session Summary | SCR-005 |
| 12 | Daily Notes & Summaries | SCR-TEA-004 |
| 13 | Session Note Editor | SCR-TEA-004 |
| 14 | Goal Progress Update | SCR-TEA (draft) |
| 15 | Scheduling Calendar | MR-38 |
| 16 | Attendance | MR-40 |
| 17 | Student Profile | SCR-006A |
| 18 | Parent Communication (Teacher view) | SCR-TEA-005 |

## Files → Issues (at the split)

| File | Issue |
|---|---|
| `TeacherDashboardScreen.tsx` | SCR-TEA-001 |
| `AssessmentDashboardScreen.tsx` | SCR-010 |
| `SkillsAssessmentScreen.tsx` | MR-22 |
| `AbllsNeedAnalysisMapScreen.tsx` | SCR-TEA-002A |
| `BehaviorAssessmentScreen.tsx` | SCR-TEA-003 / SCR-013 (MR-23) |
| `PreferenceAssessmentScreen.tsx` | MR-24 |
| `SensoryAssessmentScreen.tsx` | MR-25 |
| `AbcLogScreen.tsx` | SCR-003A |
| `BehaviorIncidentModal.tsx` | SCR-003 |
| `SessionDataCollectionScreen.tsx` | MR-33 |
| `GoalMasteryCheckScreen.tsx` | SCR-004 |
| `SessionSummaryScreen.tsx` | SCR-005 |
| `DailyNotesScreen.tsx` | MR-35 |
| `SessionNoteEditorScreen.tsx` | MR-35 |
| `GoalProgressScreen.tsx` | MR-36 |
| `SchedulingCalendarScreen.tsx` | MR-38 |
| `AppointmentFormModal.tsx` | MR-39 |
| `MarkUnavailableModal.tsx` | SCR-TC-005 / MR-38 |
| `AttendanceScreen.tsx` | MR-40 |
| `StudentProfileScreen.tsx` | SCR-006A |
| `TeacherParentCommunicationScreen.tsx` | SCR-TEA-005 |

## Files in this folder

- `screens/` — the 18 screens above (+ shared session/scheduling components)
- `sessionApi.ts`, `teacherExtrasApi.ts` — Teacher API contracts
- `SessionStack.tsx`, `teacherTabNavigation.tsx` — Teacher navigation

## Demo login

`teacher@melue.org` (any password).

## Your work (for your GitHub)

This folder is **your contribution** to the Melu'e Foundation app. You own
the **Teacher / Therapist module**: 18 screens covering the full daily
clinical workflow — dashboards, session data collection, ABLLS-R and
behavior assessments, goal mastery, session summaries, notes, scheduling,
attendance, and parent messaging.

Push this folder to your own GitHub repo using the commands in the
top-level `README.md`. In your repo, present it as:
"Melu'e Foundation — Teacher (Therapist) module: 18 screens."

## Highlight

Session Data Collection with the wall-clock session timer
(`src/stores/sessionTimerStore.ts`) that survives tab switches and only
resets when a session is submitted.
