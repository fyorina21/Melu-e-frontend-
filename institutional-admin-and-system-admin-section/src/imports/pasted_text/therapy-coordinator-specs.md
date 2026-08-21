Therapy Coordinator – Screen Specifications
Screen ID: SCR-TC-001 – Therapy Coordinator Dashboard
Field
Screen ID
Value
SCR-TC-001
Screen Name Therapy Coordinator Dashboard
User Role
Therapy Coordinator
Platform
Web / Desktop (responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Provide the Therapy Coordinator with a centralized dashboard that aggregates all operational 
data for the foundation. The dashboard enables real-time supervision of active sessions, visibility into 
pending reviews, and quick access to daily operational tasks.
Pre-Conditions: User logged in as Therapy Coordinator.
Post-Conditions: User navigates to the desired sub-screen (Live Session Monitoring, Session Review, 
Student Progress, etc.).
Components & Interaction Details
Component
Header
Date/Time
Quick Stats 
Cards
Type
Text
Description
"Therapy 
Coordinator 
Dashboard" 
Read-only Current date and 
time.
Cards 
(Grid)
Display key 
operational metrics.
Static.
Auto-updates.
Validation / Behavior
Each card shows a number and label, with a link to 
the relevant screen. - Active Sessions Now → SCR
TC-002 - Sessions Pending Review → SCR-TC-003- Students in Therapy → SCR-TC-004 - Teachers 
On Duty → SCR-TC-005
Live Session 
Status
Pending 
Review Alerts
Daily 
Operational 
Summary
Quick Action 
Buttons
Notifications 
Bell
Visual 
Board / 
List
Scrollable 
List
Section
Buttons
Icon
Shows real-time 
status of all active 
therapy sessions.
Shows session 
summaries awaiting
review.
Summary of daily 
operations.
Navigation 
shortcuts.
System 
notifications.
Status indicators: Green / Yellow / Red based on 
session condition.
Click "Review" → SCR-TC-003
Sessions completed, trials logged, incidents, goals 
mastered
Links to SCR-TC-002 to SCR-TC-005
Red badge shows unread alerts
Screen ID: SCR-TC-002 – Live Session Monitoring
Purpose
Enable real-time monitoring of active therapy sessions.
Pre-Conditions:
User logged in as Therapy Coordinator.
At least one session is active (teacher logged in and started a session).
Post-Conditions: Coordinator gains real-time visibility into all active sessions and can take action if 
needed.
Components
Component
Active Sessions 
Grid
Type
Grid / Card 
View
Description
Displays all active 
sessions.
Session Detail 
View
Send Alert to 
Teacher
View Teacher 
Screen
Modal / Inline 
Panel
Button
Button
Detailed session 
monitoring.
Sends notification to 
teacher device.
Validation / Behavior
Shows teacher, station, timer, students,
trial count, status
Shows student-level session data and 
incidents
Requires message + alert type
Live teacher screen view. Post-MVP (disabled)
Session Status 
Filter
Station Filter
Refresh
Export Session 
Log
Dropdown
Dropdown
Button
Button
Filters sessions by status. All / On Track / Needs Attention / 
Overdue
Filters by station.
Manual refresh.
Exports session data.
Station 1 / Station 2
Auto-refresh every 30 seconds
CSV/PDF export
Screen ID: SCR-TC-003 – Session Summary Review
Purpose
Review and approve or request changes to session summaries.
Pre-Conditions:
User logged in as Therapy Coordinator.
At least one session summary has been submitted by a teacher (SCR-005).
Post-Conditions:
Session summary is approved (becomes part of the student's permanent record).
Session summary is returned to the teacher for revision (with feedback).
Teacher receives notification of the decision.
Components
Component
Pending Review List
Filter Controls
Search
Session Summary 
Detail View
Approve Session
Request Changes
Type
Scrollable Table
Dropdowns / Date 
Pickers
Text Input
Modal
Button
Button
Add Coordinator Notes Text Area
Print/Export PDF
Button
View Student Progress Button
Bulk Approve
Description
Lists submitted session 
summaries.
Filters results.
Search sessions.
Full session review.
Approves summary.
Sends back for revision.
Internal notes.
Exports summary.
Opens SCR-TC-004.
Checkbox + Button Approves multiple.
Validation / Behavior
Review action opens full 
summary
Student, Teacher, Station, 
Date
Real-time filter
Includes approval 
workflow
Moves to permanent record
Requires reason + section 
selection
Internal only
PDF generation
Context navigation
Confirmation required
Screen ID: SCR-TC-004 – Student Progress Monitoring
Purpose
Track student progress across therapy sessions.
Pre-Conditions: User logged in as Therapy Coordinator. Student data exists.
Post-Conditions: Coordinator gains full visibility into student progress.
Components
Component
Student Selector
Type
Dropdown / 
Search
Description
Select student.
Student Profile 
Summary
Card
Assessment Summary Section
Current Goals
Session History
Goal Progress Chart
Behavior Incident 
Trends
Notes Section
Alert Flag
Print Report
Section
Scrollable Table
Chart (Line)
Chart / List
Text Area
Toggle
Button
Basic student info.
6-week assessment 
summary.
Active goals tracking.
Past sessions list.
Goal performance over 
time.
Behavior tracking.
Internal notes.
Flag student.
Export report.
Validation / Behavior
Required
Links to SCR-006A
Skills, behavior, preferences
Progress %, status
Click opens session 
summary
Multi-goal visualization
Frequency + details
Internal only
Creates notification
PDF output
Screen ID: SCR-TC-005 – Operational Management
Purpose
Manage teacher schedules and operational logistics.
Pre-Conditions: User logged in as Therapy Coordinator. Staff and student data exist.
Post-Conditions: Operational changes are tracked and reflected in the system.
Components
Component
Type
Teacher Schedule View Calendar / 
Grid
Teacher Filter
Performance Metrics
Mark Teacher 
Unavailable
Reassign Students
Dropdown
Section
Button
Button
View Teacher Summary Button
Export Schedule
Student Unassigned 
Alert
Button
Warning
Description
Weekly schedule 
view.
Filter teachers.
KPI tracking.
Set unavailability.
Reassign students.
Teacher analytics 
view.
Export schedule.
Validation / Behavior
Shows assignments
All / specific
Sessions, trials, independence, 
incidents
Requires reason + date
Capacity validation required
Full performance view
PDF/CSV
Missing assignments. Highlights issues
Screen ID: SCR-TC-006 – Parent Communication (Coordinator View)
Purpose
Manage communication between therapy team and parents.
Pre-Conditions:
Parent accounts exist (linked to students).
Parent has initiated a conversation, or Coordinator needs to share operational updates.
Post-Conditions: Messages are sent and tracked. Communication history is preserved.
Components
Component
Conversation List
Type
Description
Validation / Behavior
Scrollable List Parent conversations. Includes unread badges
Filter Controls
Search
Conversation View
Share Schedule
Share Progress Update
Dropdowns Filter conversations. Student / Date
Text Input
Search messages.
Real-time
Chat Interface Messaging interface. Thread-based view
Button
Button
Escalate to Program Director Button
Escalate to Director
Communication Log
Mark as Resolved
Button
Tab
Button
Share schedule.
Share charts.
Escalation flow.
Adds message context
Links SCR-PD-008
Sends notification
High-level escalation. Director notified
History view.
Audit trail
Closes conversation. Moves to resolved
Parent – Screen Specifications
Screen ID: SCR-PAR-001 – Parent Dashboard
Field Value
Screen ID SCR-PAR-001
Screen NameParent Dashboard
User Role Parent / Guardian
Platform Mobile / Web
Purpose
Centralized view of child’s therapy journey.
Components
Component Type Description Validation / Behavior
Header Text Welcome message Personalized
Child Progress SummaryCard High-level progress Independence %, sessions
Recent Updates Feed List Therapy updates Click navigates
Quick Actions ButtonsNavigation shortcutsProgress, observation, communication
Notifications Bell Icon Alerts Badge count
Communication ShortcutCard Latest message Opens SCR-PAR-004
Screen ID: SCR-PAR-002 – Child Progress View
Purpose
Provide detailed child progress visibility.
Components
Component Type Description Validation / Behavior
Student Header Read-onlyStudent info Auto
Overall Progress Summary Section Progress indicators Goals, sessions
Goal Progress Charts Chart Goal tracking Weekly visualization
Session History Table Session list Click opens details
Session Summary View Modal Session details Parent-friendly
Behavior Incident SummarySection Behavior trends Simplified
Assessment Results Section Assessment summary Simplified language
IUP Summary Section Therapy plan summaryPDF export
Notes Read-onlyShared notes Filtered visibility
Screen ID: SCR-PAR-003 – Home Observation Log
Purpose
Allow parents to record home-based observations.
Components
Component
Type
Description Validation / Behavior
Observation History List
Add Observation
Past observations Click to view
Button Create new entry Opens form
Observation Form
Modal Data entry
Required fields
Acknowledged Status Badge Status tracking Color-coded
Team Response
Section Staff replies
Visible updates
Request from Team Section Requested logs Pre-filled form
Screen ID: SCR-PAR-004 – Parent Communication
Purpose
Enable direct communication with therapy team.
Components
Component
Conversation List
Type
Description
Validation / Behavior
Scrollable List Messages overview Unread tracking
Conversation View Chat Interface Messaging system
Threaded view
Send Message
Quick Actions
Button
Buttons
Team Identification Tags
Escalation Status
Badge
Communication Log Tab
Mark as Resolved
Button
Send communication Required text
Templates
Sender labels
Pre-filled messages
Role-based
Escalation tracking Transparency
History
Close thread
Audit
Reopen allowed