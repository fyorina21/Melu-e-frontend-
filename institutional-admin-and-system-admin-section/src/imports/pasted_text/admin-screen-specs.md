Administration Module – Screen Specifications
Administration Panel Overview
Field
Value
Screen ID
SCR-ADMIN-000
Screen Name Administration Panel – Overview
User Role
Institutional Administrator, System Administrator
Platform
Web / Desktop (Responsive)
Purpose, Pre-Conditions & Post-Conditions
Purpose: Provide a tabbed administration dashboard that separates clinical configuration (Institutional Admin) from
system/user configuration (System Admin).
Pre-Conditions: User logged in with Institutional Administrator role or System Administrator role.
Post-Conditions: User navigates to the desired configuration sub-screen.
Components & Interaction Details
Component
Type
Description
Validation / Behavior
Header
Clinical Configuration 
Tab
System Configuration 
Tab
Clinical Configuration 
Navigation
System Configuration 
Navigation
Text
Tab 
Button
Tab 
Button
Sidebar / 
Pills
Sidebar / 
Pills
Administration Panel with
Foundation logo
Visible to Institutional 
Administrators. Contains 
Forms, Trial Logging, 
ABC Lists, Schedule, 
Capacity, Goals.
Visible to System 
Administrators. Contains 
Staff, Roles, Permissions.
Form Builder, Trial 
Logging Format, ABC 
Dropdown Lists, Session 
Schedule & Capacity, 
Goal Domain Definitions
Staff Account 
Management, Role 
Management, Permission 
Configuration
Static
Default active tab for Institutional Admin
Default active tab for System Admin
Navigates to SCR-ADMIN-001 to SCR
ADMIN-005
Navigates to SCR-SYS-001 to SCR-SYS-003
Institutional Administration
Screen ID: SCR-ADMIN-001 – Form Builder
Field
Value
Screen ID
SCR-ADMIN-001
Screen Name Form Builder
User Role
Institutional Administrator
Platform
Web / Desktop
Purpose, Pre-Conditions & Post-Conditions
Purpose: Allow configuration of:Enrollment Wizard Form, IUP Form, ABLLS Assessment Form Configuration 
includes: Uploading a form template, Toggling fields on/off, Editing field labels, Drag-and-drop form building
Pre-Conditions: User logged in as Institutional Administrator.
Post-Conditions: Configuration is reflected in the live application.
Components & Interaction Details
Component
Type
Description
Form Selector
Upload Template
Form Canvas
Add New Field
Field Properties 
Modal
Toggle Visibility
Preview Form
Save Configuration
Reset to Default
Default Template 
Indicator
Dropdow
n
Button / 
File 
Upload
Drag
and-Drop
Area
Button
Modal
Toggle
Button
Button
Button
Badge
Enrollment Wizard
IUP Form
ABLLS Assessment 
Form
Upload form structure
Visual representation of
selected form
Add custom fields
Edit field properties
Hide/show field
Read-only preview
Save changes
Restore default 
configuration
Shows whether the 
Validation / Behavior
Required
Supports JSON/XML
Reorder, Edit, Delete, Show/Hide
Text, Number, Date, Dropdown, 
Checkbox, Radio, Text Area, File Upload
Label, Placeholder, Required, Help Text, 
Default Value
Hidden fields retain data
Uses current configuration
At least one field required
Confirmation required
current form is using the 
default configuration
Modification History
Note:
Section
Shows all changes made 
to this form
Displays: "Using Default Template" or 
"Custom Template"
Displays: Date, User, Field Name, Old Value, 
New Value
ABLLS Assessment Form: The ABLLS form ships with the default skill items as defined in SRS Section 3.3.3. 
Administrators may:
Add new skill items
Edit skill item descriptions
Change the order of items
Toggle items on/off (hide/show
Change the scoring type (e.g., add new score options)
Preference Assessment Item Inventory: The Preference Assessment form ships with a default inventory of items as 
defined in SRS Section 3.3.6. Administrators may:
Add new items to the inventory
Edit item names and categories
Delete items from the inventory
Reorder items within categories
Add new categories
Toggle items on/off (hide/show)
Reset to default inventory
Sensory Time Engagement Activities: The Sensory Time Engagement form ships with a default inventory of 12 
activities as defined in SRS Section 3.3.7. Administrators may:
Add new activities to the inventory
Edit activity names and descriptions
Delete activities from the inventory
Reorder activities
Toggle activities on/off (hide/show)
Reset to default inventory
Add this standard header to all form screens:
Form Header Component (Standard for all forms)
Component
Form Header
Form ID
Form Name
Revision
Page Indicator
Organization 
Logo
Type
Section
Read-only
Read-only
Read-only
Read-only
Image
Description
Displays form metadata
Form identifier
Name of the form
Revision number and date
Current page / Total 
pages
Foundation logo
Validation/Behavior
Always visible at top of form
Auto-populated from admin 
configuration
Auto-populated from admin 
configuration
Auto-populated from admin 
configuration
Auto-calculated
System-wide configuration
Screen ID: SCR-ADMIN-002 – Trial Logging Format Configuration
Field
Value
Screen ID
SCR-ADMIN-002
Screen Name Trial Logging Format
User Role
Institutional Administrator
Platform
Web / Desktop
Purpose, Pre-Conditions & Post-Conditions
Purpose: Configure: Prompt labels, Button colors, Trial stream layout, Mastery criteria
Pre-Conditions: User logged in as Institutional Administrator.
Post-Conditions: Changes reflected in SCR-002.
Components & Interaction Details
Component
Type
Description
Validation / Behavior
Prompt Level List
Add Prompt Level
Delete Prompt Level
Trial Stream Layout
Trial Stream Count
Mastery Criteria 
Configuration
Live Preview
Save Configuration
Table
Button
Button
Radio 
Group
Number 
Input
Section
Preview
Button
Existing prompt levels
Add custom prompt level
Remove prompt level
Configure layout
Number of trials 
displayed
Configure mastery rules
Visual representation
Save settings
Label, Color, Order, Status
Label must be unique
Confirmation required
Horizontal, Vertical, Card Grid
Range 3–20
Consecutive trials, percentage, automatic 
suggestion
Updates dynamically
At least one active prompt level required
Screen ID: SCR-ADMIN-003 – ABC Dropdown List Manager
Field
Value
Screen ID
SCR-ADMIN-003
Screen Name ABC Dropdown List Manager
User Role
Institutional Administrator
Platform
Web / Desktop
Purpose, Pre-Conditions & Post-Conditions
Purpose: Manage all dropdown options used in the ABC Data Sheet, including: Behavior Names & Definitions, 
Antecedent options, Consequence options, Location options, Frequency options (if configurable), Intensity options 
(if configurable), Category options (if configurable)
Pre-Conditions: User logged in as Institutional Administrator.
Post-Conditions: Changes reflected in SCR-003 and SCR-003A.
Components & Interaction Details
Component
List Selector
Behavior List
Add Behavior
Edit Behavior
Delete Behavior
Antecedent List
Add Antecedent
Consequence 
List
Location List
Save 
Configuration
Type
Tabs
Table
Button
Button
Button
Table
Button
Table
Table
Button
Description
Switch between lists
Existing behavior 
definitions
Add a new behavior
Edit existing 
behavior
Remove behavior
Existing antecedent 
options
Add a new 
antecedent
Existing 
consequence 
options
Existing location 
options
Save all changes
Validation/Behavior
Behaviors, Antecedents, Consequences, Locations, 
Frequencies, Intensities, Categories
Columns: Behavior Name, Definition, Default 
Category, Status, Actions
Behavior Name (required), Definition (required), 
Category (required)
Can edit Name, Definition, Category
Confirmation required. Cannot delete if in use
Columns: Antecedent Name, Type 
(Dropdown/Text), Status, Actions
Antecedent Name (required), Type (Dropdown or 
Text with Other)
Same structure as Antecedent
Columns: Location Name, Status, Actions
At least one active option required per list
Component
Type
Description
Validation/Behavior
Reset to Default
Button
Restore default 
options
Confirmation required
Screen ID: SCR-ADMIN-004 – Session Schedule & Capacity Configuration
Field
Value
Screen ID
SCR-ADMIN-004
Screen Name Session Schedule & Capacity
User Role
Institutional Administrator
Platform
Web / Desktop
Purpose, Pre-Conditions & Post-Conditions
Purpose: Configure: Session times, Therapy block duration, Staff-to-student capacity, Draft expiry period
Pre-Conditions: User logged in as Institutional Administrator.
Post-Conditions: Changes reflected in SCR-002 and SCR-008.
Components & Interaction Details
Component
Type
Description
Validation / Behavior
Session Schedule 
Section
Morning Round Start
Morning Round End
Afternoon Round Start
Afternoon Round End
Pre-Therapy Duration
Staff-to-Student 
Capacity
Draft Expiry Period
Session Block 
Definitions
Save Configuration
Section
Time 
Picker
Time 
Picker
Time 
Picker
Time 
Picker
Number 
Input
Number 
Input
Number 
Input
Table
Button
Time-based settings
Morning start time
Morning end time
Afternoon start time
Afternoon end time
Duration in minutes
Maximum students per 
teacher
Draft notification period
Define custom blocks
Save settings
Collapsible
Default 8:07 AM
Must be greater than start
Default 1:10 PM
Must be greater than start
Default 30
Minimum 1
Range 1–30 days
Editable
Validates time fields
Screen ID: SCR-ADMIN-005 – Goal Domain Definitions
Field
Value
Screen ID
SCR-ADMIN-005
Screen Name Goal Domain Definitions
User Role
Institutional Administrator
Platform
Web / Desktop
Purpose, Pre-Conditions & Post-Conditions
Purpose: Manage goal domains used by the Goal Bank.
Pre-Conditions: User logged in as Institutional Administrator.
Post-Conditions: Changes reflected in SCR-007.
Components & Interaction Details
Component
Type
Description
Domain List
Add Domain
Delete Domain
Save Configuration
Table
Button
Button
Button
Existing domains
Add new domain
Delete domain
Save changes
Validation / Behavior
Name, Description, Order, Status
Unique name required
Confirmation required
At least one active domain required
SCR-ADMIN-006: Task Analysis Templates
Screen ID: SCR-ADMIN-006
Screen Name: Task Analysis Templates
User Role: Institutional Administrator
Platform: Web / Desktop
Purpose: Manage task analysis templates used for multi-step goals.
Component Details:
Component
Template List
Add Template
Template 
Editor
Step Manager
Add Step
Edit Step
Delete Step
Mastery 
Criteria
Save 
Template
Delete 
Template
Type
Table
Button
Modal/Form
Reorderable 
List
Button
Button
Button
Section
Button
Button
Description
Displays existing 
templates
Create a new task 
analysis template
Create/edit template
Manage steps in the 
template
Add a new step
Edit step description
Remove step
Configure mastery 
criteria
Save template
Delete template
Validation/Behavior
Columns: Template Name, Steps Count, 
Status, Actions
Opens template editor
Fields: Template Name, Description, 
Steps List
Add, edit, delete, reorder steps
Step Description required
Text input
Confirmation required
Per-step and overall criteria
At least one step required
Confirmation required. Cannot delete if in
use
System Administration
Screen ID: SCR-SYS-001 – Staff Account Management
Field
Value
Screen ID
SCR-SYS-001
Screen Name Staff Account Management
User Role
System Administrator
Platform
Web / Desktop
Purpose, Pre-Conditions & Post-Conditions
Purpose: Manage staff accounts, including creation, editing, activation, deactivation, and password reset.
Pre-Conditions: User logged in as System Administrator.
Post-Conditions: Changes reflected immediately in authentication and role assignments.
Components & Interaction Details
Component
Type
Search Bar
Role Filter
Status Filter
Add Staff Button
Staff List
Staff Details Form
Save Changes Button
Reset Password 
Button
Activate / Deactivate 
Button
Cancel Button
Bulk Actions
Text Input
Dropdown
Dropdown
Button
Table
Modal
Button
Button
Button
Button
Checkbox + Dropdown
Description
Search by name or email
Filter by role
Filter by status
Create staff account
List staff accounts
Staff profile management
Save profile changes
Send password reset email
Toggle account status
Discard changes
Bulk operations
Confirmation required
Inactive users cannot log in
Screen ID: SCR-SYS-002 – Role Management
Field
Value
Screen ID
SCR-SYS-002
Screen Name Role Management
User Role
System Administrator
Platform
Web / Desktop
Purpose, Pre-Conditions & Post-Conditions
Purpose: Manage available system roles.
Pre-Conditions: User logged in as System Administrator.
Post-Conditions: Roles available for assignment and permission mapping.
Components & Interaction Details
Component
Type
Description
Role List
Add Role Button
Role Details Form
Delete Role Button
Save Changes Button
System Role Indicator
Table
Button
Modal
Button
Button
Badge
Existing roles
Create role
Create/Edit role
Delete role
Save role
Marks system roles
Validation / Behavior
Name, Description, Staff Count, Actions
System Admin only
Role Name, Description
Cannot delete assigned roles
Unique name validation
Cannot be deleted
Screen ID: SCR-SYS-003 – Permission Configuration (RBAC)
Field
Value
Screen ID
SCR-SYS-003
Screen Name Permission Configuration (RBAC)
User Role
System Administrator
Platform
Web / Desktop
Purpose, Pre-Conditions & Post-Conditions
Purpose: Configure role-based permissions using CRUD + Approve actions.
Permissions are additive for users with multiple roles.
Pre-Conditions: User logged in as System Administrator. At least one role exists.
Post-Conditions: Permission changes enforced at UI and API levels.
Components & Interaction Details
Component
Type
Description
Role Selector
Permission Matrix
Dropdown
Grid
Permission Checkbox Checkbox
Select All (Module)
Select All (Action)
Preset Templates
Live Preview
Save Configuration
Audit Trail Link
Permission Matrix
Modules
 Students - Enrollment
 Assessments
 IUP & Goals
 Active Therapy
 Reports
 Staff
 Admin
Checkbox
Checkbox
Buttons
Text Summary
Button
Link
Select role
Modules vs Actions
Permission assignment
All permissions for module
Action across modules
Default and copy templates
Human-readable permissions
Save permissions
Permission change log
Actions
 View
 Create
 Edit
 Delete
 Approve