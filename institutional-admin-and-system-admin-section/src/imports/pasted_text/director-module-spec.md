MELU'E FOUNDATION — DIRECTOR MODULE
FIGMA AI BUILD PROMPT — FULL SCREEN SPECIFICATION (SCR-DIR-001 to SCR-DIR-006)
 
HOW TO USE THIS PROMPT
Build all six screens listed below as one connected module. Section 0 is the global design system — apply it consistently across every screen. Every component, field, button, validation rule, and behavior listed under each screen must be present in the final design. Nothing listed is optional unless it explicitly says "optional."
 
================================================================
0. GLOBAL DESIGN SYSTEM & CONVENTIONS
================================================================
 
PRODUCT CONTEXT
- Product: web/desktop-first (responsive) admin module for Directors at an ABA (Applied Behavior Analysis) therapy foundation, with tablet support on all screens.
- Primary user: the Director role — oversees teachers, approves goal mastery, manages parent communication, reviews reports, and monitors student progress at a foundation-wide level.
- Tone: clinical, calm, trustworthy — this is a tool used around vulnerable child data, not a marketing product.
 
NAVIGATION SHELL (present on every screen)
- Persistent left sidebar: Foundation logo/wordmark at top; grouped navigation links to all 6 Director screens; logged-in Director's name/avatar pinned at the bottom.
- Top bar: page title + one-line subtitle on the left; live date/time (auto-updating) and a notification bell with unread-count badge on the right.
- Notification bell: clicking opens a dropdown panel listing recent notifications (assessment completions, approvals pending, escalations, capacity warnings) — each with a short label and relative timestamp.
 
RECURRING VISUAL LANGUAGE — PROMPT-LEVEL COLOR CODING
The system uses a 4-level ABA prompt hierarchy throughout trial data, task-analysis steps, and progress charts. Use this exact color coding consistently anywhere prompt levels appear (trial logs, step lists, legends):
- FP = Full Physical Prompt = red
- PP = Partial Physical Prompt = orange
- G = Gestural Prompt = yellow/amber
- + = Independent = green
 
STATUS & PILL CONVENTIONS
- Success / Approved / Mastered states = green pill
- Pending / Warning / Awaiting review states = amber/yellow pill
- Rejected / Overdue / Conflict states = red pill
- Neutral / inactive / unassigned states = grey pill
 
SHARED INTERACTION PATTERNS
- Every destructive or state-changing action (Remove All Assignments, Reject, Approve, Escalate, Archive) shows a confirmation dialog before committing.
- Every list/table screen includes a real-time search input plus one or more filter dropdowns relevant to that screen's data.
- Every report/record view offers Print and/or Export (PDF) actions.
- Modals: header with title + one-line context + close (X); scrollable body; footer with right-aligned action buttons (secondary/outline button on the left, primary button on the right).
 
================================================================
1. SCR-DIR-001 — DIRECTOR DASHBOARD
================================================================
 
Screen ID: SCR-DIR-001
Screen Name: Director Dashboard
User Role: Director
Platform: Web / Desktop (Responsive), Tablet
 
PURPOSE
Provide the Director with a high-level overview of foundation operations, key metrics, and quick access to core Director functions.
 
PRE-CONDITIONS
- User is logged in as Director.
 
POST-CONDITIONS
- User navigates to the required Director function from this screen.
 
REQUIRED COMPONENTS
- Header — static text "Director Dashboard" with the Foundation logo.
- Date/Time — read-only, auto-updating display of current date and time.
- Quick Stats Cards (5 cards) — Total Students · Active Teachers · Pending Mastery Approvals · Unread Parent Messages · Session Reports Pending Review. Each card is clickable and routes to the relevant screen.
- Recent Activity Feed — scrollable list of recent actions requiring Director attention. Each item is clickable and navigates to the related screen/record.
- Quick Action Buttons — Staff Scheduling · Mastery Approval · Parent Communication · Reports — each a one-tap shortcut to its screen.
- Notifications Bell — icon showing unread notification count as a badge.
 
================================================================
2. SCR-DIR-002 — STAFF SCHEDULING
================================================================
 
Screen ID: SCR-DIR-002
Screen Name: Staff Scheduling
User Role: Director
Platform: Web / Desktop (Responsive), Tablet
 
PURPOSE
Enable operational scheduling by linking teachers to students for specific session blocks.
 
PRE-CONDITIONS
- Teachers exist in the system.
- Students exist in the system.
- Session blocks are configured.
- Capacity limits are configured.
 
POST-CONDITIONS
- Teacher-to-student assignments are saved and reflected in teacher session dashboards.
 
REQUIRED COMPONENTS
- Teacher Selector — dropdown / search to select a teacher's schedule. Required field.
- Schedule View — calendar/grid view of the selected teacher's schedule, displaying assigned students and session blocks.
- Add Assignment button — opens the Assignment Editor modal.
- Edit Assignment button — opens the Assignment Editor modal pre-filled with the existing assignment.
- Assignment Editor (modal) — fields: Station, Block, Available Students list, Assigned Students list.
- Capacity Indicator — badge showing student count vs. capacity for the selected block, with a visual warning state when capacity is exceeded.
- Save Assignment button — persists changes; runs capacity validation before saving.
- Cancel button — discards changes; shows a confirmation dialog if there are unsaved changes.
- Remove All Assignments button — clears all assignments for the selected block; requires confirmation.
- View Teacher Summary button — opens a read-only summary of the teacher's full schedule.
- Conflict Detection — automated validation that prevents double-booking a student or teacher; displays a warning banner/message when a conflict is found.
 
================================================================
3. SCR-DIR-003 — GOAL MASTERY APPROVAL
================================================================
 
Screen ID: SCR-DIR-003 (also referenced as SCR-PD-009 when the Program Director is the approver — treat as one shared screen with role-based access, not a duplicate)
Screen Name: Goal Mastery Approval
User Role: Director / Program Director
Platform: Web / Desktop (Responsive), Tablet
 
PURPOSE
Review and approve goals that have completed Teacher B and Teacher C verification.
 
PRE-CONDITIONS
- Goal submitted for mastery verification.
- Teacher B verification completed.
- Teacher C verification completed.
- Goal awaiting Director approval.
 
POST-CONDITIONS
- Approved goals become "Mastered" and are archived.
- Rejected goals return to Teacher A with feedback.
 
REQUIRED COMPONENTS
- Pending Approval List (table) — columns: Student Name, Goal Name, Teacher A, Teacher B, Teacher C, Date Submitted, Actions. Clicking a row opens the detail view.
- Filter Controls — dropdowns to filter by student, teacher, station, and date — dynamic filtering.
- Search — text input, real-time filtering of students.
- View Verification Details button — opens a modal showing all verification data: Teacher A's mastery data, Teacher B's outcome & notes, Teacher C's outcome & notes.
- View Trial Log button — opens a chronological trial history — all trials logged by Teacher A for this goal.
- Approval Detail View (modal) — full goal review information: Student, Goal, and Teacher A/B/C data together in one view.
- Approve button — approves mastery; requires confirmation.
- Reject button — rejects the mastery request; feedback text is required before submitting.
- Notes field — free-text area for Director notes — optional.
- Print / Export button — exports the approval record as a PDF.
 
================================================================
4. SCR-DIR-004 — PARENT COMMUNICATION
================================================================
 
Screen ID: SCR-DIR-004
Screen Name: Parent Communication
User Role: Director
Platform: Web / Desktop (Responsive), Tablet
 
PURPOSE
Centralized communication hub for all parent interactions.
 
PRE-CONDITIONS
- Parent accounts exist.
- Messages or updates exist.
 
POST-CONDITIONS
- Messages are sent and communication history is maintained.
 
REQUIRED COMPONENTS
- Conversation List — list of active parent conversations; displays unread status per conversation.
- Filter Controls — dropdowns to filter conversations by Student, Sender, Date.
- Search — text input, real-time filtering of conversations.
- Conversation View — chat-style interface showing message history plus a response/input area.
- Send Message button — sends the composed message; message text is required.
- Mark Read / Unread button — toggles the read state of a conversation.
- Escalate to Director button — flags the conversation and creates a notification in the Director's dashboard.
- Communication Log (tab/button) — read-only historical record of all communication.
- Print Communication Log button — exports the communication history as a PDF.
 
================================================================
5. SCR-DIR-005 — REPORTS & OVERSIGHT
================================================================
 
Screen ID: SCR-DIR-005
Screen Name: Reports & Oversight
User Role: Director
Platform: Web / Desktop (Responsive)
 
PURPOSE
Provide reporting, oversight, and analytics capabilities across the foundation.
 
PRE-CONDITIONS
- Session and student data exist.
 
POST-CONDITIONS
- Reports are generated, reviewed, exported, or shared.
 
REQUIRED COMPONENTS
- Report Type Selector (tabs) — Session Reports · Bi-Annual Reports · Student Progress · Foundation Overview.
- Filter Controls — filter by Student, Teacher, Station, Date — dynamic updates.
- Student Selector — search/dropdown; required specifically for student-level reports.
- Session Reports List (table) — read-only list of submitted session summaries.
- Student Progress Chart — interactive chart of goal progress over time.
- Bi-Annual Report Generator button — generates the report; validates that sufficient data exists first.
- Preview PDF button — opens a PDF viewer to preview the report before export.
- Download PDF button — exports/downloads the report file.
- Email Report to Parent button — shares the report via the Parent Communication module (SCR-DIR-004).
- Foundation Overview Dashboard — aggregate, foundation-wide analytics view.
- Export Overview button — exports the overview dashboard as PDF or CSV.
 
================================================================
6. SCR-DIR-006 — STUDENT PROGRESS MONITORING
================================================================
 
Screen ID: SCR-DIR-006
Screen Name: Student Progress Monitoring
User Role: Director
Platform: Web / Desktop (Responsive), Tablet
 
PURPOSE
Provide a detailed, student-level view of assessments, goals, sessions, and behavior trends.
 
PRE-CONDITIONS
- A student has been selected.
 
POST-CONDITIONS
- Director can review comprehensive student progress.
 
REQUIRED COMPONENTS
- Student Selector — dropdown/search to choose a student — required.
- Student Profile Summary (card) — student overview with a link through to the full Student Profile.
- Assessment Summary (section) — overview of Skills, Behavior, and Preference assessment results.
- Current Goals (section) — active goals with progress percentages displayed for each.
- Session History (table) — read-only list of completed sessions.
- Behavior Incident Trends — chart or list with trend visualization of behavior incidents over time.
- Goal Progress Chart — line chart of goal progress over time; downloadable.
- Notes Section — free-text area for internal Director notes; entries are timestamped.
- Print Report button — generates a PDF export of the student report.
 
================================================================
COVERAGE CHECK
================================================================
Every field, button, list column, modal, and validation rule from the original Director Screen Specifications (SCR-DIR-001 through SCR-DIR-006) is represented above. Treat each named component as a distinct element that must exist in the frame for that screen — do not merge, rename, or drop any of them.
 
