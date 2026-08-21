Directors Module
Director Screen Specifications
Screen ID: SCR-DIR-001 – Director Dashboard
Field
Value
Screen ID
SCR-DIR-001
Screen Name Director Dashboard
User Role
Director
Platform
Web / Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Provide the Director with a high-level overview of foundation operations, key metrics, and quick access to
core Director functions.
Pre-Conditions: User logged in as Director.
Post-Conditions: User navigates to the required Director function.
Components & Interaction Details
Component
Type
Description
Validation / Behavior
Header
Date/Time
Quick Stats Cards
Recent Activity Feed
Quick Action Buttons
Notifications Bell
Text
Director Dashboard with 
Foundation logo
Read-only Current date and time
Cards
Scrollable 
List
Buttons
Icon
Key foundation metrics
Recent actions requiring 
Director attention
Common Director actions
Unread notifications
Static
Auto-updates
Total Students, Active Teachers, Pending 
Mastery Approvals, Unread Parent Messages, 
Session Reports Pending Review
Click item to navigate
Staff Scheduling, Mastery Approval, Parent 
Communication, Reports
Displays notification count
Screen ID: SCR-DIR-002 – Staff Scheduling
Field
Value
Screen ID
SCR-DIR-002
Screen Name Staff Scheduling
User Role
Director
Platform
Web / Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Enable operational scheduling by linking teachers to students for specific session blocks.
Pre-Conditions
 Teachers exist in the system.
 Students exist in the system.
 Session blocks are configured.
 Capacity limits are configured.
Post-Conditions
Teacher-to-student assignments are saved and reflected in teacher session dashboards.
Components & Interaction Details
Component
Type
Teacher Selector
Schedule View
Add Assignment
Edit Assignment
Assignment Editor
Capacity Indicator
Save Assignment
Cancel
Remove All 
Assignments
View Teacher 
Summary
Conflict Detection
Dropdown / Search
Calendar / Grid
Button
Button
Modal
Badge
Button
Button
Button
Button
Automated Validation
Description
Select teacher schedule
Teacher schedule
Create assignment
Modify assignment
Manage student assignments
Student count vs capacity
Save assignment changes
Discard changes
Clear block assignments
View schedule summary
Prevent double booking
Confirmation required
Read-only
Screen ID: SCR-DIR-003 – Goal Mastery Approval(or SCR-PD-009 if Program Director is the approver)
Field
Value
Screen ID
SCR-DIR-003
Screen Name Goal Mastery Approval
User Role
Director / Program Director
Platform
Web / Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Review and approve goals that have completed Teacher B and Teacher C verification.
Pre-Conditions
 Goal submitted for mastery verification.
 Teacher B verification completed.
 Teacher C verification completed.
 Goal awaiting Director approval.
Post-Conditions
 Approved goals become Mastered and archived.
 Rejected goals return to Teacher A with feedback.
Components & Interaction Details
Component
Type
Description
Validation / Behavior
Pending Approval 
List
Filter Controls
Search
View Verification 
Details
View Trial Log
Table
Dropdow
ns
Text 
Input
Button
Button
Approval Detail View Modal
Approve Button
Reject Button
Notes Field
Print / Export
Button
Button
Text 
Area
Button
Goals awaiting approval Click row for details
Columns: Student Name, Goal Name, 
Teacher A, Teacher B, Teacher C, Date 
Submitted, Actions
Filter by student, 
teacher, station, date
Search students
Dynamic filtering
Real-time filtering
Opens modal showing 
all verification data
Opens chronological trial 
history
Full goal review 
information
Shows: Teacher A mastery data, Teacher 
B outcome & notes, Teacher C outcome 
& notes
Shows all trials logged by Teacher A for this 
goal
Student, Goal, Teacher A/B/C data
Approve mastery
Reject mastery request
Director notes
Export approval record
Confirmation required
Feedback required
Optional
PDF output
Screen ID: SCR-DIR-004 – Parent Communication
Field
Value
Screen ID
SCR-DIR-004
Screen Name Parent Communication
User Role
Director
Platform
Web / Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Centralized communication hub for all parent interactions.
Pre-Conditions
 Parent accounts exist.
 Messages or updates exist.
Post-Conditions
Messages are sent and communication history is maintained.
Components & Interaction Details
Component
Type
Description
Conversation List
Filter Controls
Search
Conversation View
Send Message
Mark Read / Unread
Escalate to Director
Communication Log
Print Communication 
Log
List
Dropdown
s
Active parent 
conversations
Filter conversations
Text Input Search conversations
Chat 
Interface
Button
Button
Button
Tab / 
Button
Button
View conversation thread
Send message
Manage read status
Flag conversation
Historical communication
record
Export communication 
history
Validation / Behavior
Displays unread status
Student, Sender, Date
Real-time filtering
Message history and response area
Message required
Toggle state
Creates Director notification
Read-only
PDF output
Screen ID: SCR-DIR-005 – Reports & Oversight
Field
Value
Screen ID
SCR-DIR-005
Screen Name Reports & Oversight
User Role
Director
Platform
Web / Desktop (Responsive)
Purpose, Pre-Conditions & Post-Conditions
Purpose: Provide reporting, oversight, and analytics capabilities across the foundation.
Pre-Conditions: Session and student data exist.
Post-Conditions: Reports generated, reviewed, exported, or shared.
Components & Interaction Details
Component
Type
Report Type Selector
Filter Controls
Student Selector
Session Reports List
Student Progress 
Chart
Bi-Annual Report 
Generator
Preview PDF
Download PDF
Email Report to 
Parent
Foundation Overview
Dashboard
Export Overview
Tabs
Filters
Search Dropdown
Table
Chart
Button
Button
Button
Button
Dashboard
Button
Description
Report categories
Student, Teacher, Station, Date
Select student
Submitted session summaries
Goal progress over time
Generate report
Preview report
Download report
Share report
Aggregate metrics
Export dashboard
Interactive
Validates available data
Uses Parent Communication
Foundation-wide analytics
Screen ID: SCR-DIR-006 – Student Progress Monitoring
Field
Value
Screen ID
SCR-DIR-006
Screen Name Student Progress Monitoring
User Role
Director
Platform
Web / Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Provide a detailed, student-level view of assessments, goals, sessions, and behavior trends.
Pre-Conditions: Student selected.
Post-Conditions: Director can review comprehensive student progress.
Components & Interaction Details
Component
Type
Student Selector
Student Profile 
Summary
Dropdown / Search
Card
Assessment Summary Section
Current Goals
Section
Session History
Behavior Incident 
Trends
Goal Progress Chart
Notes Section
Print Report
Table
Chart / List
Line Chart
Text Area
Button
Description
Select student
Student overview
Assessment results overview
Active goals
Completed sessions
Incident analysis
Goal progress over time
Internal Director notes
Generate student report
Links to Student Profile
Trend visualization
Program Director Screen Specifications
Screen ID: SCR-PD-001 – Program Director Dashboard
Screen Information
Field
Value
Screen ID
SCR-PD-001
Screen Name Program Director Dashboard
User Role
Program Director
Platform
Web/Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Provide the Program Director with a centralized dashboard that aggregates all students in the assessment
to-IUP pipeline, highlights students ready for IUP creation, and provides quick access to assessment data and goal 
assignment tools.
Pre-Conditions: User logged in as Program Director.
Post-Conditions: User navigates to the desired sub-screen (Assessment Review, IUP Generation, Goal Assignment,
etc.).
Components & Interaction Details
Component
Type
Header
Quick Stats 
Cards
Text
Cards 
(Grid)
Description
"Program Director 
Dashboard"
Display key metrics 
relevant to the 
Program Director.
Static.
Validation / Behavior
Each card shows a number and label, with a link to the 
relevant screen.- Students in Assessment: # (links to 
SCR-PD-002)- Assessment Complete (Ready for IUP): #
(links to SCR-PD-003)- Active IUP Plans: # (links to 
SCR-PD-004)- Goals Assigned This Month: # (links to 
SCR-PD-005)
Shows students 
Assessment 
Pipeline View
Recent 
Activity Feed
Quick Action 
Buttons
Notifications 
Bell
Visual 
Flow / List
Scrollable 
List
Buttons
Icon
progressing through 
the assessment-to
IUP pipeline.
Shows recent actions
requiring Program 
Director attention.
Direct links to 
common Program 
Director tasks.
Indicates unread 
notifications.
Stages:1. In Assessment – Students currently undergoing
6-week assessment
2. Assessment Complete – Students ready for IUP 
creation
3. IUP Created – Students with active IUPs
Click any stage to filter and navigate to the relevant list.
Examples:- "Assessment completed for Student X – 
Ready for IUP"- "IUP draft saved for Student Y"- "Goal 
Bank updated with new goal: 'Toileting Independence'"- Review Assessments → SCR-PD-002- Generate IUP 
→ SCR-PD-003- Assign Goals → SCR-PD-005- View 
Goal Bank → SCR-PD-006
Red badge shows count. Click opens notification panel 
(assessment completions, IUP draft reminders, etc.).
Screen ID: SCR-PD-002 – Assessment Review & Approval
Field
Value
Screen ID
SCR-PD-002
Screen Name Assessment Review & Approval
User Role
Program Director
Platform
Web/Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Provide the Program Director with a comprehensive view of all completed and in-progress 6-week 
assessments.
Pre-Conditions:Assessment data exists (SCR-010, SCR-012, Skills/Behavior assessments).
Post-Conditions: Assessments are reviewed, marked as "Ready for IUP", and the student status is updated.
Components & Interaction Details
Component
Type
Assessment List Scrollable 
Table
Description
Displays all students 
with assessment data.
Validation / Behavior
Columns:- Student Name- Age- Program/Group- 
Assessment Status (In Progress, Complete, Reviewed)- 
Date Completed- Actions (View Report, Mark as 
Reviewed)
Filter Controls Dropdowns /
Date Pickers
Search
View Report
Assessment 
Summary 
Dashboard
Mark as 
Reviewed
Generate 
Assessment 
PDF
Notes
Text Input
Button
Visual 
Dashboard 
(within 
View 
Report)
Button
Button
Text Area
Filter assessments by 
Student, Program, 
Group, Status, or Date 
Range.
Search assessments by 
Student Name.
Opens the Assessment 
Summary Report (SCR
015) for the selected 
student.
Graphical summary of 
assessment data.
Marks the assessment 
as reviewed and 
indicates readiness for 
IUP creation.
Downloads the 
complete assessment 
report as a PDF.
Allows the Program 
Director to add internal 
notes about the 
assessment.
Reduces the list to relevant items.
Real-time filter.
Displays:- Student Information (auto-populated)- Skills 
Assessment (ABLLS): Summary scores, need map, and 
detailed domain results- Behavior Assessment 
(MASS/FAST): Questionnaire results, identified behavior
functions- Preference Assessment: Ranked list of top 
preferred items- IUP Status: Indicates if an IUP has been 
created- Skills Radar Chart: Visual representation of ABLLS 
domain scores- Behavior Function Summary: Pie chart or
bar chart showing identified behavior functions- Top 
Preferences: Ranked list with icons
Confirmation dialog: "Mark this assessment as reviewed 
and ready for IUP creation?"Updates student status to 
"Ready for IUP".
Named: 
[StudentName]_AssessmentSummary_[Date].pdf
Not visible to parents or teachers (internal use only). 
Timestamp and author logged.
Screen ID: SCR-PD-003 – IUP Generation & Management
Screen Information
Field
Value
Screen ID
SCR-PD-003
Screen Name IUP Generation & Management
User Role
Program Director
Platform
Web/Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Enable the Program Director to create a comprehensive Individualized Behavior Intervention Plan (IUP) 
for a student, using data from the 6-week assessment to inform clinical decisions. The IUP includes student 
information, assessment summary, selected goals (up to 2 per station), and intervention strategies.
Pre-Conditions:
Student has completed the 6-week assessment (SCR-010, SCR-012).
Student status is "Ready for IUP" or "IUP Draft".
Assessment data is available for review.
Post-Conditions:
IUP is created and saved (as draft or finalized).
Goals are assigned to the student (up to 2 per station).
Student status updates to "Active Therapy" (when IUP is finalized).
Goals appear in SCR-002 (Today's Session Dashboard) for teachers.
Components & Interaction Details
Component
Student 
Selector
IUP Header
Assessment 
Summary 
(Context 
Panel)
IUP Form
Goal 
Assignment 
Section
Type
Dropdown / 
Search
Read-only 
Section
Read-only 
Panel
Multi
section 
Form
Interactive 
Area
Description
Select the student 
for whom you are 
creating the IUP.
Auto-populated 
student 
information.
Displays a 
summary of the 
student's 6-week 
assessment results 
to inform IUP 
decisions.
The main IUP 
document.
Assign goals to 
Station 1 and 
Station 2.
Validation / Behavior
List shows all students with status "Ready for IUP" or "IUP Draft". 
Required.- Student Name- Age, DOB- Program/Group- Enrollment Date
Includes:- Skills Assessment (ABLLS): Key strengths and areas of 
need (top 3 each)- Behavior Assessment: Identified behavior 
functions and recommendations- Preference Assessment: the system 
shall auto-populate the "Reinforcement Strategies" section with the 
student's top 5 preferences from the Preference Assessment. Teachers
may select specific reinforcers from the full preference list.
Sensory Engagement Summary: When creating an IUP, the system 
shall display a summary of the student's Sensory Time Engagement 
Assessment results, including:Activities the student enjoyed, 
Activities the student refused, Engagement support levels required 
This data shall be available for the Program Director to reference 
when developing the IUP, particularly for the "Reinforcement 
Strategies" and "Antecedent Manipulations" sections.
Contains editable sections:- 
form from the admin panel- Station 1 (Basic Skills): Up to 2 goals- Station 2 (Advanced Skills): 
Up to 2 goalsFor each slot:- Goal Selector (Search/select from Goal 
Bank - SCR-007)- Goal Name (auto-populated from Goal Bank)- 
Goal Description (auto-populated)- Mastery Criteria (pre-filled, 
optionally editable per student)- Notes (optional text for 
individualization)
Goal Type Selection: When assigning a goal from the Goal Bank, the 
Component
Type
Description
Validation / Behavior
Program Director shall be able to:
View the goal type (Standard or Task Analysis)
For Task Analysis goals, view the full step list
Customize the step list for the individual student (add/remove steps)
Set per-step mastery criteria
Set overall mastery criteria
Add Goal 
Button
Remove Goal 
Button
Goal Details 
View
Auto-Suggest 
Goals
Draft Save
Button 
(within each
slot)
Button 
(trash icon, 
within each 
slot)
Read-only 
Modal
Button
Button
Preview IUP Button
Finalize IUP Button
Print/Export 
PDF
Button
Opens the Goal 
Selector modal 
(SCR-007 style) to
browse and select 
a goal.
Removes the 
assigned goal from
the slot.
Click on an 
assigned goal to 
view its full 
details.
System suggests 
goals based on the 
assessment data 
(ABLLS scores 
and areas of need).
Saves the IUP as a 
draft without 
finalizing.
Opens a read-only 
preview of the 
complete IUP 
document.
Finalizes the IUP.
Exports the final 
IUP as a PDF 
document.- Filters by domain- Shows only goals appropriate for the student's 
age and group- Prevents duplicate assignment of the same goal within
the IUP
Confirmation: "Remove this goal from the IUP?"
Shows: Goal Name, Domain, Description, and any associated data.
Post-MVP enhancement (currently out of scope). For MVP, this 
button is hidden or disabled.
Allows the Program Director to return later. Draft status is indicated 
in the IUP list.
Shows all sections in a printable format.- Validates that at least one goal is assigned per applicable station.- 
Confirmation: "Finalize this IUP for [Student Name]? This will move
the student to Active Therapy status."- Upon confirmation: Student 
status updates to "Active Therapy", goals become visible in SCR
002, and the IUP is archived as a permanent record.
Named: [StudentName]_IUP_[Date].pdf
Screen ID: SCR-PD-004 – IUP Library Management
Screen Information
Field
Value
Screen ID
SCR-PD-004
Screen Name IUP Library Management
User Role
Program Director
Platform
Web/Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Provide the Program Director with a comprehensive view of all IUPs in the system—drafts, active, and 
archived. This screen enables the Program Director to: View all IUPs for all students, Filter by status (Draft, Active, 
Archived), Open an IUP for editing (Draft only) or viewing (Active/Archived), Track IUP creation and update 
history
Pre-Conditions: User logged in as Program Director. IUPs exist in the system.
Post-Conditions: User navigates to the selected IUP for viewing or editing.
Components & Interaction Details
Component
IUP List
Type
Scrollable 
Table
Description
Displays all IUPs in the
system.
Validation / Behavior
Columns:- Student Name- Program/Group- Status 
(Draft, Active, Archived)- Date Created- Last 
Updated- Actions (View, Edit - Draft only)
Filter 
Controls
Search
View IUP
Edit IUP
Dropdowns
Filter IUPs by Student, 
Program, Group, or 
Status.
Text Input Search IUPs by Student
Name.
Button
Button
Archive IUP Button
Print/Export 
PDF
Button
Opens the IUP in read
only mode.
Opens the IUP in edit 
mode (SCR-PD-003) 
for draft IUPs only.
Archives an IUP 
(typically when a 
student graduates or 
transitions).
Exports the IUP as a 
PDF document.
Reduces the list to relevant items.
Real-time filter.
Displays the complete IUP document (same format as 
finalized IUP). Includes all assessment data and goals.
Only visible for IUPs with status "Draft".
Confirmation required. Archiving does not delete data;
it moves it to a historical state.
Named: [StudentName]_IUP_[Date].pdf
Screen ID: SCR-PD-005 – Student Caseload Management
Screen Information
Field
Value
Screen ID
SCR-PD-005
Screen Name Student Caseload Management
User Role
Program Director
Platform
Web/Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Enable the Program Director to manage goal assignments for students outside of the full IUP creation 
workflow. This screen extends the functionality of SCR-007 (Goal Bank & IUP Assignment).
Pre-Conditions: User logged in as Program Director. Student exists in the system. Goal Bank exists.
Post-Conditions: Goals are assigned, updated, or removed from the student's active therapy plan.
Components & Interaction Details
Component
Student 
Selector
Current Goals 
View
Goal Bank 
Browser
Assignment 
Slot Selection
Type
Dropdown /
Search
Section
Section
Interactive 
Area
Replace Goal Modal
Goal Details 
View
Add New 
Modal
Goal to Bank Button
Save Changes Button
Remove Goal Button
View Goal 
Progress
Button
Description
Select the student whose 
goals you want to manage.
Displays the student's 
current goal assignments.
The Goal Bank (SCR-007) 
integrated into this screen.
When a goal is selected from
the Goal Bank, the Program 
Director chooses which slot 
to assign it to.
Appears if the user attempts 
to assign a goal when all 
slots are full.
Click on any goal (assigned 
or in the Goal Bank) to view
full details.
Opens a form to create a 
new goal in the Goal Bank.
Persists all goal assignment 
changes.
Removes a goal from the 
student's active plan.
For assigned goals, opens 
the goal progress chart 
(graph) for that student.
Validation / Behavior
List shows all active students. Required.- Station 1 (Basic Skills): Up to 2 goals- Station 2 
(Advanced Skills): Up to 2 goalsFor each goal:- Goal Name 
(click to view details)- Status (Active, In Progress, 
Mastered)- Progress % (if applicable)- Remove Goal button 
(with confirmation)- Search by goal name or keyword- Domain Filter chips 
(Communication, Motor, Social, Self-Help, Cognition)- 
Goal List: Scrollable list of goal cards. Each card shows:- 
Goal Name- Domain- Description (short)- Assign button 
(adds to selected slot)
Options:- Station 1, Slot 1 (if empty)- Station 1, Slot 2 (if 
empty)- Station 2, Slot 1 (if empty)- Station 2, Slot 2 (if 
empty)- Replace Existing Goal (if all slots are full, prompt 
to replace one)
Shows current assigned goals. User selects which goal to 
replace with the new one.
Shows: Goal Name, Domain, Description, Date Created, 
Last Modified.
Same as SCR-007 (Goal Bank). Requires: Goal Name, 
Domain, Description.
Validates that the student has at least one goal assigned per 
applicable station.
Confirmation required. The goal is not deleted from the 
Goal Bank, only unassigned from the student.
Navigates to SCR-PD-008 (Graph & Chart View) pre
filtered for the selected goal.
Screen ID: SCR-PD-006 – Clinical Quality Monitoring
Screen Information
Field
Value
Screen ID
SCR-PD-006
Screen Name Clinical Quality Monitoring
User Role
Program Director
Platform
Web/Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Provide the Program Director with a dedicated interface to manage the Goal Bank. This includes adding, 
editing, deactivating, and organizing goals by domain. This screen extends SCR-007 (Goal Bank & IUP 
Assignment) with full management capabilities.
Pre-Conditions: User logged in as Program Director.
Post-Conditions: Goal Bank is updated with new goals, edits, or deactivations.
Components & Interaction Details
Component
Goal List
Search
Domain 
Filter
Add New 
Goal
Goal Details 
Form
Type
Scrollable 
Table
Description
Displays all goals 
in the Goal Bank.
Text Input Search goals by 
name or keyword. Real-time filter.
Dropdown /
Chips
Button
Modal / 
Inline Panel
Delete Goal Button
Preview 
Goal
Button
Filter goals by 
domain.
Opens the Goal 
Details form in 
"Create" mode.
Appears when 
creating or editing 
a goal.
Permanently 
deletes a goal from
the Goal Bank.
Opens a read-only 
preview of the 
goal's full details.
Validation / Behavior
Columns:- Goal Name- Domain (Communication, Motor, 
Social, Self-Help, Cognition)- Description (truncated)- 
Usage Count (number of students currently assigned this 
goal)- Status (Active, Inactive)- Actions (Edit, 
Delete/Deactivate)
Options: All, Communication, Motor, Social, Self-Help, 
Cognition.
Accessible to Program Directors only.
Contains:- Goal Name (Text, Required, Unique)- Domain 
(Dropdown, Required)- Description (Text Area, Required)- 
Mastery Criteria Template (Optional, used for auto
populating IUP)- Suggested Age Range (Optional, for 
filtering)- Status (Active/Inactive toggle)- Confirmation required- Cannot delete a goal currently 
assigned to any active student- If assigned, the goal must be 
deactivated instead
Includes any associated data.
Screen ID: SCR-PD-007 – Parent Communication (Program Director View)
Screen Information
Field
Value
Screen ID
SCR-PD-007
Screen Name Parent Communication
User Role
Program Director
Platform
Web/Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Provide the Program Director with a communication hub similar to SCR-DIR-004, but focused on clinical 
aspects such as: Sharing IUP updates with parents, Discussing assessment results, Updating parents on goal 
progress, Addressing parent questions about therapy plans
Pre-Conditions: Parent accounts exist (linked to students).
Parent has initiated a conversation, or Program Director wants to share an update.
Post-Conditions: Messages are sent and tracked. Communication history is preserved.
Components & Interaction Details
Component
Type
Description
Displays all active 
Conversation 
List
Filter Controls
Search
Conversation 
View
Share 
Assessment 
Report
Share IUP
Share Progress 
Update
Escalate to 
Director
Communication 
Log
Scrollable List
Dropdowns
Text Input
Chat-Like 
Interface
Button (within 
conversation)
Button (within 
conversation)
Button (within 
conversation)
Button
Button / Tab
conversations with parents 
for students the Program 
Director is responsible for.
Filter conversations by 
Student or Date Range.
Search conversations by 
Student Name, Parent Name, 
or Message Content.
Opens when a conversation is
selected.
Attaches the Assessment 
Summary Report (SCR-015) 
to the conversation.
Attaches the finalized IUP to 
the conversation.
Shares a goal progress chart 
(SCR-PD-008) with the 
parent.
Flags a conversation for 
Director attention.
View a historical summary of
all communications for this 
student.
Validation / Behavior
Each item shows:- Student Name- Parent Name- Last
Message Preview- Timestamp- Unread Badge (if 
new message from parent)Click to open the 
conversation.
Reduces the list to relevant items.
Real-time filter.
Shows:- Header: Student photo, Name, Parent 
Name- Message Thread: Chronological list of all 
messages- Message Input: Text area + Send button- 
Share Updates Button: Quick action to share IUP 
updates, assessment summaries, or progress reports.- Opens a preview of the report- Program Director 
can add a message explaining the report- Sends the 
report as a PDF attachment- Opens a preview of the IUP- Program Director can 
add a message explaining the plan- Sends the IUP as 
a PDF attachment- Allows the Program Director to select a specific 
goal and date range- Generates a visual chart and 
includes it in the message
Creates a notification in the Director's dashboard 
(SCR-DIR-001).
Useful for audits and continuity.
Screen ID: SCR-PD-008 – Graph & Chart View
Screen Information
Field
Value
Screen ID
SCR-PD-008
Screen Name Graph & Chart View
User Role
Program Director
Platform
Web/Desktop (Responsive), Tablet
Purpose, Pre-Conditions & Post-Conditions
Purpose: Enable the Program Director to generate and view visual data representations (graphs and charts) for 
students. This supports clinical decision-making by visualizing progress, trends, and patterns over time.
Pre-Conditions:
User logged in as Program Director.
Student data exists (session logs, trial data, assessments).
Post-Conditions: Charts and graphs are generated and viewable/exportable.
Components & Interaction Details
Component
Student 
Selector
Chart Type 
Selector
Goal 
Selector (for 
Goal 
Progress)
Date Range 
Selector
Chart 
Rendering
Type
Dropdown 
/ Search
Tabs / 
Dropdown
Multi
Select 
Dropdown
Date 
Picker
Chart Area
Export Chart Button
Share Chart Button
Print Chart
Button
Description
Select the student 
whose data you 
want to visualize.
Select the type of 
chart to generate.
Select one or more
goals to display on
the chart.
Select the date 
range for the data.
Displays the 
selected chart type
with the selected 
data.
Exports the chart 
as an image 
(PNG) or PDF.
Shares the chart 
via the Parent 
Communication 
module (SCR-PD
007).
Prints the chart for
documentation.
Validation / Behavior
List shows all active students. Required.
Options:- Goal Progress (Line Chart): Shows independence 
percentage over time for selected goals- Trial Distribution 
(Bar Chart): Shows breakdown of prompts used (FP, PP, G, 
+)- Behavior Incident Trends (Bar/Line Chart): Shows 
frequency of behavior types over time- Assessment Summary
(Radar Chart): Visualizes ABLLS domain scores
Shows all goals (active and mastered) for the selected 
student.
Default: Last 30 daysOptions: Last 7 days, Last 30 days, Last
90 days, Custom range- Interactive (hover/click for data points)- Responsive (scales 
to screen size)- Auto-refreshes when filters change
Named: [StudentName]_[ChartType]_[DateRange].png
Links to SCR-PD-007, pre-populating with the chart 
attachment.
Opens print dialog.