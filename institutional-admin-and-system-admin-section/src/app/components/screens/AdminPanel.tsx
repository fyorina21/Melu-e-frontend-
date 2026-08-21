import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Users,
  Shield,
  Lock,
  ClipboardList,
  BarChart2,
  BookOpen,
  ListChecks,
  Calendar,
  Target,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Upload,
  Save,
  RefreshCw,
  X,
  Check,
  LogOut,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
  Search,
  Copy,
  AlertTriangle,
  CheckSquare,
  Square,
  User,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | 'form-builder'
  | 'trial-logging'
  | 'abc-dropdowns'
  | 'session-schedule'
  | 'goal-domains'
  | 'task-analysis'
  | 'staff-accounts'
  | 'role-management'
  | 'permissions';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockFormFields = [
  { id: '1', type: 'Text', label: 'Full Name', required: true, visible: true },
  { id: '2', type: 'Date', label: 'Date of Birth', required: true, visible: true },
  { id: '3', type: 'Dropdown', label: 'Program Type', required: false, visible: true },
  { id: '4', type: 'Text', label: 'Parent Name', required: false, visible: true },
  { id: '5', type: 'Text', label: 'Phone', required: false, visible: true },
];

const mockPromptLevels = [
  { id: '1', name: 'FP', color: '#EF4444', order: 1, status: 'Active' },
  { id: '2', name: 'PP', color: '#F97316', order: 2, status: 'Active' },
  { id: '3', name: 'G', color: '#3B82F6', order: 3, status: 'Active' },
  { id: '4', name: '+', color: '#22C55E', order: 4, status: 'Active' },
];

const mockBehaviors = [
  { id: '1', name: 'Self-Injurious Behavior', definition: 'Any behavior that causes harm to self', category: 'Physical', status: 'Active' },
  { id: '2', name: 'Aggression', definition: 'Physical or verbal acts directed toward others', category: 'Physical', status: 'Active' },
  { id: '3', name: 'Elopement', definition: 'Leaving designated area without permission', category: 'Safety', status: 'Active' },
];

const mockAntecedents = [
  { id: '1', name: 'Task demand', type: 'Academic', status: 'Active' },
  { id: '2', name: 'Transition', type: 'Environmental', status: 'Active' },
  { id: '3', name: 'Denial of access', type: 'Social', status: 'Active' },
  { id: '4', name: 'Unstructured time', type: 'Environmental', status: 'Active' },
];

const mockConsequences = [
  { id: '1', name: 'Escape task', type: 'Negative Reinforcement', status: 'Active' },
  { id: '2', name: 'Attention', type: 'Positive Reinforcement', status: 'Active' },
  { id: '3', name: 'Tangible item', type: 'Positive Reinforcement', status: 'Active' },
];

const mockLocations = [
  { id: '1', name: 'Classroom A', status: 'Active' },
  { id: '2', name: 'Therapy Room 1', status: 'Active' },
  { id: '3', name: 'Outdoor Area', status: 'Active' },
  { id: '4', name: 'Sensory Room', status: 'Inactive' },
];

const mockDomains = [
  { id: '1', name: 'Cognitive', description: 'Problem solving, memory, attention', order: 1, status: 'Active' },
  { id: '2', name: 'Receptive Language', description: 'Understanding verbal/non-verbal communication', order: 2, status: 'Active' },
  { id: '3', name: 'Expressive Language', description: 'Verbal and non-verbal expression', order: 3, status: 'Active' },
  { id: '4', name: 'Social Skills', description: 'Interaction, turn-taking, peer engagement', order: 4, status: 'Active' },
  { id: '5', name: 'Motor Skills', description: 'Fine and gross motor development', order: 5, status: 'Active' },
  { id: '6', name: 'Adaptive', description: 'Daily living and self-care skills', order: 6, status: 'Active' },
];

const mockTemplates = [
  { id: '1', name: 'Hand Washing', steps: 8, status: 'Active' },
  { id: '2', name: 'Tooth Brushing', steps: 6, status: 'Active' },
  { id: '3', name: 'Getting Dressed', steps: 10, status: 'Active' },
];

const mockStaff = [
  { id: '1', name: 'Teacher A', email: 'teachera@melue.org', role: 'teacher', phone: '555-0101', status: 'Active', selected: false },
  { id: '2', name: 'Teacher B', email: 'teacherb@melue.org', role: 'teacher', phone: '555-0102', status: 'Active', selected: false },
  { id: '3', name: 'Coordinator A', email: 'coordinator@melue.org', role: 'coordinator', phone: '555-0103', status: 'Active', selected: false },
  { id: '4', name: 'Director A', email: 'director@melue.org', role: 'director', phone: '555-0104', status: 'Active', selected: false },
  { id: '5', name: 'Teacher C', email: 'teacherc@melue.org', role: 'teacher', phone: '555-0105', status: 'Inactive', selected: false },
];

const mockRoles = [
  { id: '1', name: 'teacher', description: 'Direct therapy provider', count: 8, system: true },
  { id: '2', name: 'coordinator', description: 'Coordinates caseloads and scheduling', count: 2, system: true },
  { id: '3', name: 'director', description: 'Clinical oversight and approval', count: 1, system: true },
  { id: '4', name: 'institutional_admin', description: 'Clinical configuration and management', count: 1, system: true },
  { id: '5', name: 'sysadmin', description: 'Full system access and configuration', count: 1, system: true },
];

const MODULES = ['Students / Enrollment', 'Assessments', 'IUP & Goals', 'Active Therapy', 'Reports', 'Staff', 'Admin'];
const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Approve'];

const defaultPermMatrix: Record<string, Record<string, boolean>> = {
  teacher: {
    'Students / Enrollment-View': true, 'Students / Enrollment-Create': false, 'Students / Enrollment-Edit': false, 'Students / Enrollment-Delete': false, 'Students / Enrollment-Approve': false,
    'Assessments-View': true, 'Assessments-Create': true, 'Assessments-Edit': true, 'Assessments-Delete': false, 'Assessments-Approve': false,
    'IUP & Goals-View': true, 'IUP & Goals-Create': false, 'IUP & Goals-Edit': false, 'IUP & Goals-Delete': false, 'IUP & Goals-Approve': false,
    'Active Therapy-View': true, 'Active Therapy-Create': true, 'Active Therapy-Edit': true, 'Active Therapy-Delete': false, 'Active Therapy-Approve': false,
    'Reports-View': true, 'Reports-Create': false, 'Reports-Edit': false, 'Reports-Delete': false, 'Reports-Approve': false,
    'Staff-View': false, 'Staff-Create': false, 'Staff-Edit': false, 'Staff-Delete': false, 'Staff-Approve': false,
    'Admin-View': false, 'Admin-Create': false, 'Admin-Edit': false, 'Admin-Delete': false, 'Admin-Approve': false,
  },
  coordinator: {
    'Students / Enrollment-View': true, 'Students / Enrollment-Create': true, 'Students / Enrollment-Edit': true, 'Students / Enrollment-Delete': false, 'Students / Enrollment-Approve': false,
    'Assessments-View': true, 'Assessments-Create': true, 'Assessments-Edit': true, 'Assessments-Delete': false, 'Assessments-Approve': true,
    'IUP & Goals-View': true, 'IUP & Goals-Create': true, 'IUP & Goals-Edit': true, 'IUP & Goals-Delete': false, 'IUP & Goals-Approve': false,
    'Active Therapy-View': true, 'Active Therapy-Create': true, 'Active Therapy-Edit': true, 'Active Therapy-Delete': false, 'Active Therapy-Approve': false,
    'Reports-View': true, 'Reports-Create': true, 'Reports-Edit': false, 'Reports-Delete': false, 'Reports-Approve': false,
    'Staff-View': true, 'Staff-Create': false, 'Staff-Edit': false, 'Staff-Delete': false, 'Staff-Approve': false,
    'Admin-View': false, 'Admin-Create': false, 'Admin-Edit': false, 'Admin-Delete': false, 'Admin-Approve': false,
  },
  director: {
    'Students / Enrollment-View': true, 'Students / Enrollment-Create': true, 'Students / Enrollment-Edit': true, 'Students / Enrollment-Delete': true, 'Students / Enrollment-Approve': true,
    'Assessments-View': true, 'Assessments-Create': true, 'Assessments-Edit': true, 'Assessments-Delete': false, 'Assessments-Approve': true,
    'IUP & Goals-View': true, 'IUP & Goals-Create': true, 'IUP & Goals-Edit': true, 'IUP & Goals-Delete': false, 'IUP & Goals-Approve': true,
    'Active Therapy-View': true, 'Active Therapy-Create': true, 'Active Therapy-Edit': true, 'Active Therapy-Delete': false, 'Active Therapy-Approve': true,
    'Reports-View': true, 'Reports-Create': true, 'Reports-Edit': true, 'Reports-Delete': false, 'Reports-Approve': true,
    'Staff-View': true, 'Staff-Create': false, 'Staff-Edit': false, 'Staff-Delete': false, 'Staff-Approve': false,
    'Admin-View': false, 'Admin-Create': false, 'Admin-Edit': false, 'Admin-Delete': false, 'Admin-Approve': false,
  },
  institutional_admin: {
    'Students / Enrollment-View': true, 'Students / Enrollment-Create': true, 'Students / Enrollment-Edit': true, 'Students / Enrollment-Delete': true, 'Students / Enrollment-Approve': true,
    'Assessments-View': true, 'Assessments-Create': true, 'Assessments-Edit': true, 'Assessments-Delete': true, 'Assessments-Approve': true,
    'IUP & Goals-View': true, 'IUP & Goals-Create': true, 'IUP & Goals-Edit': true, 'IUP & Goals-Delete': true, 'IUP & Goals-Approve': true,
    'Active Therapy-View': true, 'Active Therapy-Create': true, 'Active Therapy-Edit': true, 'Active Therapy-Delete': true, 'Active Therapy-Approve': true,
    'Reports-View': true, 'Reports-Create': true, 'Reports-Edit': true, 'Reports-Delete': true, 'Reports-Approve': true,
    'Staff-View': true, 'Staff-Create': true, 'Staff-Edit': true, 'Staff-Delete': false, 'Staff-Approve': true,
    'Admin-View': true, 'Admin-Create': true, 'Admin-Edit': true, 'Admin-Delete': false, 'Admin-Approve': false,
  },
  sysadmin: {
    'Students / Enrollment-View': true, 'Students / Enrollment-Create': true, 'Students / Enrollment-Edit': true, 'Students / Enrollment-Delete': true, 'Students / Enrollment-Approve': true,
    'Assessments-View': true, 'Assessments-Create': true, 'Assessments-Edit': true, 'Assessments-Delete': true, 'Assessments-Approve': true,
    'IUP & Goals-View': true, 'IUP & Goals-Create': true, 'IUP & Goals-Edit': true, 'IUP & Goals-Delete': true, 'IUP & Goals-Approve': true,
    'Active Therapy-View': true, 'Active Therapy-Create': true, 'Active Therapy-Edit': true, 'Active Therapy-Delete': true, 'Active Therapy-Approve': true,
    'Reports-View': true, 'Reports-Create': true, 'Reports-Edit': true, 'Reports-Delete': true, 'Reports-Approve': true,
    'Staff-View': true, 'Staff-Create': true, 'Staff-Edit': true, 'Staff-Delete': true, 'Staff-Approve': true,
    'Admin-View': true, 'Admin-Create': true, 'Admin-Edit': true, 'Admin-Delete': true, 'Admin-Approve': true,
  },
};

// ─── Utility Components ────────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  const colorMap: Record<string, string> = {
    teacher: 'bg-blue-100 text-blue-800',
    coordinator: 'bg-purple-100 text-purple-800',
    director: 'bg-indigo-100 text-indigo-800',
    institutional_admin: 'bg-yellow-100 text-yellow-800',
    sysadmin: 'bg-red-100 text-red-800',
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-gray-100 text-gray-600',
    System: 'bg-gray-800 text-white',
  };
  const cls = color ? colorMap[color] ?? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  );
}

function YellowButton({ children, onClick, type = 'button', small }: { children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'; small?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-[#FCD34D] text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:ring-offset-1 ${small ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'}`}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:ring-offset-1 ${
        danger
          ? 'border-red-300 text-red-600 hover:bg-red-50'
          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

function IconButton({ icon: Icon, onClick, title, danger }: { icon: React.ElementType; onClick?: () => void; title?: string; danger?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${
        danger ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={15} />
    </button>
  );
}

function InputField({
  label, value, onChange, type = 'text', placeholder, min, max,
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; min?: number; max?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent"
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent bg-white"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:ring-offset-1 ${enabled ? 'bg-[#38BDF8]' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  );
}

function PillChips({ options, value, onSelect }: { options: string[]; value: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-[#FCD34D]/60 ${
            value === opt
              ? 'bg-[#FCD34D] border-[#FCD34D] text-gray-900'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {opt === 'All' ? 'All' : opt.replace(/_/g, ' ')}
        </button>
      ))}
    </div>
  );
}

function SelectDropdown({
  value, options, onChange, placeholder, displayValue,
}: {
  value: string; options: string[]; onChange: (v: string) => void;
  placeholder?: string; displayValue?: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
      >
        <span className="capitalize">{displayValue ? displayValue(value) : value || placeholder || 'Select...'}</span>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-0.5 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-52 overflow-y-auto overflow-x-hidden">
            {options.map((opt) => {
              const label = opt === 'All' ? 'All' : opt.replace(/_/g, ' ');
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left capitalize transition-colors ${
                    value === opt ? 'bg-[#FEF9C3] font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{label}</span>
                  {value === opt && <Check size={12} className="text-[#0EA5E9]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Section: Form Builder ─────────────────────────────────────────────────────

function FormBuilder() {
  const [selectedForm, setSelectedForm] = useState('Enrollment Wizard');
  const [fields, setFields] = useState(mockFormFields);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [addingField, setAddingField] = useState(false);
  const [newField, setNewField] = useState({ type: 'Text', label: '', required: false });
  const [isCustomTemplate, setIsCustomTemplate] = useState(false);

  const toggleRequired = (id: string) =>
    setFields((f) => f.map((x) => (x.id === id ? { ...x, required: !x.required } : x)));
  const toggleVisible = (id: string) =>
    setFields((f) => f.map((x) => (x.id === id ? { ...x, visible: !x.visible } : x)));
  const deleteField = (id: string) => setFields((f) => f.filter((x) => x.id !== id));
  const addField = () => {
    if (!newField.label.trim()) return;
    setFields((f) => [...f, { id: String(Date.now()), ...newField, visible: true }]);
    setNewField({ type: 'Text', label: '', required: false });
    setAddingField(false);
    setIsCustomTemplate(true);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Form Builder" description="SCR-ADMIN-001 · Configure enrollment and assessment form templates" />

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedForm}
          onChange={(e) => setSelectedForm(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white"
        >
          {['Enrollment Wizard', 'IUP Form', 'ABLLS Assessment Form'].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
          <Upload size={15} />
          Upload Template
          <input type="file" accept=".json,.xml" className="hidden" />
        </label>
        <span className="ml-auto">
          {isCustomTemplate ? (
            <Badge color="institutional_admin">Custom Template</Badge>
          ) : (
            <Badge color="Active">Using Default Template</Badge>
          )}
        </span>
      </div>

      {/* Form Canvas */}
      <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Form Canvas — {selectedForm}</p>
        {fields.map((field) => (
          <div
            key={field.id}
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 group"
          >
            <span className="text-xs font-mono bg-[#38BDF8]/10 text-[#0284C7] border border-[#38BDF8]/30 rounded px-1.5 py-0.5 shrink-0">
              {field.type}
            </span>
            <span className="flex-1 text-sm font-medium text-gray-800">{field.label}</span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              Required
              <Toggle enabled={field.required} onChange={() => toggleRequired(field.id)} />
            </div>
            <IconButton icon={field.visible ? Eye : EyeOff} onClick={() => toggleVisible(field.id)} title={field.visible ? 'Hide' : 'Show'} />
            <IconButton icon={Trash2} onClick={() => deleteField(field.id)} danger title="Delete field" />
          </div>
        ))}

        {/* Add Field Inline */}
        {addingField ? (
          <div className="flex flex-wrap items-end gap-3 bg-white border border-[#38BDF8]/40 rounded-lg px-4 py-3 mt-2">
            <div className="w-36">
              <label className="block text-xs font-medium text-gray-700 mb-1">Field Type</label>
              <select
                value={newField.type}
                onChange={(e) => setNewField((f) => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white"
              >
                {['Text', 'Number', 'Date', 'Dropdown', 'Checkbox', 'Radio', 'TextArea', 'File'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
              <input
                type="text"
                value={newField.label}
                onChange={(e) => setNewField((f) => ({ ...f, label: e.target.value }))}
                placeholder="Field label..."
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <span className="text-xs text-gray-600">Required</span>
              <Toggle enabled={newField.required} onChange={() => setNewField((f) => ({ ...f, required: !f.required }))} />
            </div>
            <div className="flex gap-2 pb-0.5">
              <YellowButton onClick={addField} small>Add Field</YellowButton>
              <GhostButton onClick={() => setAddingField(false)}>Cancel</GhostButton>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingField(true)}
            className="flex items-center gap-2 text-sm text-[#0284C7] hover:text-[#38BDF8] mt-2 font-medium"
          >
            <Plus size={15} /> Add New Field
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <YellowButton onClick={() => setPreviewOpen(true)}>
          <span className="flex items-center gap-2"><Eye size={15} /> Preview Form</span>
        </YellowButton>
        <YellowButton>
          <span className="flex items-center gap-2"><Save size={15} /> Save Configuration</span>
        </YellowButton>
        <GhostButton danger onClick={() => { setFields(mockFormFields); setIsCustomTemplate(false); }}>
          <span className="flex items-center gap-2"><RefreshCw size={15} /> Reset to Default</span>
        </GhostButton>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Form Preview — {selectedForm}</h3>
              <IconButton icon={X} onClick={() => setPreviewOpen(false)} />
            </div>
            <div className="space-y-3">
              {fields.filter((f) => f.visible).map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">
                    {field.type} field
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <GhostButton onClick={() => setPreviewOpen(false)}>Close</GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Trial Logging ────────────────────────────────────────────────────

function TrialLogging() {
  const [levels, setLevels] = useState(mockPromptLevels);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState({ name: '', color: '', order: 0 });
  const [addingLevel, setAddingLevel] = useState(false);
  const [newLevel, setNewLevel] = useState({ name: '', color: '#6366F1', order: 5 });
  const [layout, setLayout] = useState<'Horizontal' | 'Vertical' | 'Card Grid'>('Horizontal');
  const [streamCount, setStreamCount] = useState(5);
  const [consecutive, setConsecutive] = useState(5);
  const [independence, setIndependence] = useState(80);
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const COLOR_SWATCHES = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'];

  const startEdit = (lv: (typeof levels)[0]) => {
    setEditingId(lv.id);
    setEditBuf({ name: lv.name, color: lv.color, order: lv.order });
  };
  const saveEdit = (id: string) => {
    setLevels((ls) => ls.map((l) => (l.id === id ? { ...l, ...editBuf } : l)));
    setEditingId(null);
  };
  const deleteLevel = (id: string) => {
    setLevels((ls) => ls.filter((l) => l.id !== id));
    setDeleteConfirmId(null);
  };
  const addLevel = () => {
    if (!newLevel.name.trim()) return;
    setLevels((ls) => [...ls, { id: String(Date.now()), ...newLevel, status: 'Active' }]);
    setNewLevel({ name: '', color: '#6366F1', order: levels.length + 2 });
    setAddingLevel(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Trial Logging Format" description="SCR-ADMIN-002 · Configure prompt levels, trial layout, and mastery criteria" />

      {/* Prompt Level Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Prompt Levels</h3>
          <button
            type="button"
            onClick={() => setAddingLevel(true)}
            className="flex items-center gap-1.5 text-sm text-[#0284C7] hover:text-[#38BDF8] font-medium"
          >
            <Plus size={14} /> Add Prompt Level
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
            <tr>
              {['Name', 'Color', 'Order', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {levels.map((lv) => (
              <tr key={lv.id} className="hover:bg-gray-50">
                {editingId === lv.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editBuf.name}
                        onChange={(e) => setEditBuf((b) => ({ ...b, name: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        {COLOR_SWATCHES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditBuf((b) => ({ ...b, color: c }))}
                            style={{ backgroundColor: c }}
                            className={`w-5 h-5 rounded-full border-2 transition-all ${editBuf.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={editBuf.order}
                        onChange={(e) => setEditBuf((b) => ({ ...b, order: Number(e.target.value) }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-14 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                      />
                    </td>
                    <td className="px-4 py-2"><Badge color="Active">Active</Badge></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <IconButton icon={Check} onClick={() => saveEdit(lv.id)} title="Save" />
                        <IconButton icon={X} onClick={() => setEditingId(null)} title="Cancel" />
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 font-semibold text-gray-900">{lv.name}</td>
                    <td className="px-4 py-2">
                      <span className="inline-block w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: lv.color }} />
                    </td>
                    <td className="px-4 py-2 text-gray-700">{lv.order}</td>
                    <td className="px-4 py-2"><Badge color={lv.status}>{lv.status}</Badge></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 items-center">
                        <IconButton icon={Edit2} onClick={() => startEdit(lv)} title="Edit" />
                        {deleteConfirmId === lv.id ? (
                          <div className="flex gap-1 items-center text-xs">
                            <span className="text-red-600">Delete?</span>
                            <IconButton icon={Check} onClick={() => deleteLevel(lv.id)} danger title="Confirm" />
                            <IconButton icon={X} onClick={() => setDeleteConfirmId(null)} title="Cancel" />
                          </div>
                        ) : (
                          <IconButton icon={Trash2} onClick={() => setDeleteConfirmId(lv.id)} danger title="Delete" />
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {addingLevel && (
              <tr className="bg-blue-50/40">
                <td className="px-4 py-2">
                  <input
                    value={newLevel.name}
                    onChange={(e) => setNewLevel((n) => ({ ...n, name: e.target.value }))}
                    placeholder="Name"
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    {COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewLevel((n) => ({ ...n, color: c }))}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${newLevel.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={newLevel.order}
                    onChange={(e) => setNewLevel((n) => ({ ...n, order: Number(e.target.value) }))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-14 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  />
                </td>
                <td className="px-4 py-2"><Badge color="Active">Active</Badge></td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <IconButton icon={Check} onClick={addLevel} title="Add" />
                    <IconButton icon={X} onClick={() => setAddingLevel(false)} title="Cancel" />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Live Preview */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Live Preview</p>
        <div className="flex flex-wrap gap-2">
          {levels.map((lv) => (
            <button
              key={lv.id}
              type="button"
              style={{ backgroundColor: lv.color }}
              className="px-4 py-2 text-white text-sm font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            >
              {lv.name}
            </button>
          ))}
        </div>
      </div>

      {/* Trial Stream Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Trial Stream Layout</h3>
          <div className="flex flex-col gap-2">
            {(['Horizontal', 'Vertical', 'Card Grid'] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="layout"
                  value={opt}
                  checked={layout === opt}
                  onChange={() => setLayout(opt)}
                  className="accent-[#38BDF8]"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Trial Stream Count (3–20)</label>
            <input
              type="number"
              min={3}
              max={20}
              value={streamCount}
              onChange={(e) => setStreamCount(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>
        </div>

        {/* Mastery Criteria */}
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Mastery Criteria</h3>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Consecutive Trials</label>
            <input
              type="number"
              value={consecutive}
              onChange={(e) => setConsecutive(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Independence % Threshold</label>
            <input
              type="number"
              min={0}
              max={100}
              value={independence}
              onChange={(e) => setIndependence(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">Auto-Suggestion</span>
            <Toggle enabled={autoSuggest} onChange={() => setAutoSuggest((v) => !v)} />
            <span className="text-xs text-gray-500">{autoSuggest ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>

      <YellowButton>
        <span className="flex items-center gap-2"><Save size={15} /> Save Configuration</span>
      </YellowButton>
    </div>
  );
}

// ─── Section: ABC Dropdowns ────────────────────────────────────────────────────

function ABCDropdowns() {
  const [activeTab, setActiveTab] = useState<'Behaviors' | 'Antecedents' | 'Consequences' | 'Locations'>('Behaviors');
  const [behaviors, setBehaviors] = useState(mockBehaviors);
  const [antecedents, setAntecedents] = useState(mockAntecedents);
  const [consequences, setConsequences] = useState(mockConsequences);
  const [locations, setLocations] = useState(mockLocations);
  const [addingBehavior, setAddingBehavior] = useState(false);
  const [newBehavior, setNewBehavior] = useState({ name: '', definition: '', category: 'Physical' });

  const TABS = ['Behaviors', 'Antecedents', 'Consequences', 'Locations'] as const;

  return (
    <div className="space-y-6">
      <SectionHeader title="ABC Dropdown Lists" description="SCR-ADMIN-003 · Manage behavior, antecedent, consequence, and location options" />

      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors focus:outline-none ${
              activeTab === tab
                ? 'border-[#38BDF8] text-[#0284C7]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Behaviors' && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  {['Behavior Name', 'Definition', 'Category', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {behaviors.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{b.definition}</td>
                    <td className="px-4 py-3"><Badge>{b.category}</Badge></td>
                    <td className="px-4 py-3"><Badge color={b.status}>{b.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <IconButton icon={Edit2} title="Edit" />
                        <IconButton icon={Trash2} danger title="Delete" />
                      </div>
                    </td>
                  </tr>
                ))}
                {addingBehavior && (
                  <tr className="bg-blue-50/30">
                    <td className="px-4 py-2">
                      <input
                        value={newBehavior.name}
                        onChange={(e) => setNewBehavior((n) => ({ ...n, name: e.target.value }))}
                        placeholder="Behavior name"
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={newBehavior.definition}
                        onChange={(e) => setNewBehavior((n) => ({ ...n, definition: e.target.value }))}
                        placeholder="Definition"
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={newBehavior.category}
                        onChange={(e) => setNewBehavior((n) => ({ ...n, category: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white"
                      >
                        {['Physical', 'Safety', 'Verbal', 'Social'].map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2"><Badge color="Active">Active</Badge></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <IconButton icon={Check} title="Add" onClick={() => {
                          if (!newBehavior.name.trim()) return;
                          setBehaviors((b) => [...b, { id: String(Date.now()), ...newBehavior, status: 'Active' }]);
                          setNewBehavior({ name: '', definition: '', category: 'Physical' });
                          setAddingBehavior(false);
                        }} />
                        <IconButton icon={X} title="Cancel" onClick={() => setAddingBehavior(false)} />
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!addingBehavior && (
            <button type="button" onClick={() => setAddingBehavior(true)} className="flex items-center gap-2 text-sm text-[#0284C7] hover:text-[#38BDF8] font-medium">
              <Plus size={14} /> Add Behavior
            </button>
          )}
        </div>
      )}

      {activeTab === 'Antecedents' && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {['Name', 'Type', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {antecedents.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3"><Badge>{a.type}</Badge></td>
                  <td className="px-4 py-3"><Badge color={a.status}>{a.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <IconButton icon={Edit2} title="Edit" />
                      <IconButton icon={Trash2} danger title="Delete" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Consequences' && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {['Name', 'Type', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {consequences.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3"><Badge>{c.type}</Badge></td>
                  <td className="px-4 py-3"><Badge color={c.status}>{c.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <IconButton icon={Edit2} title="Edit" />
                      <IconButton icon={Trash2} danger title="Delete" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Locations' && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {['Location Name', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {locations.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                  <td className="px-4 py-3"><Badge color={l.status}>{l.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <IconButton icon={Edit2} title="Edit" />
                      <IconButton icon={Trash2} danger title="Delete" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-3">
        <YellowButton>
          <span className="flex items-center gap-2"><Save size={15} /> Save Configuration</span>
        </YellowButton>
        <GhostButton danger>
          <span className="flex items-center gap-2"><RefreshCw size={15} /> Reset to Default</span>
        </GhostButton>
      </div>
    </div>
  );
}

// ─── Section: Session Schedule ─────────────────────────────────────────────────

function SessionSchedule() {
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [morningStart, setMorningStart] = useState('08:07');
  const [morningEnd, setMorningEnd] = useState('10:30');
  const [afternoonStart, setAfternoonStart] = useState('13:10');
  const [afternoonEnd, setAfternoonEnd] = useState('15:30');
  const [preTherapy, setPreTherapy] = useState(30);
  const [capacity, setCapacity] = useState(2);
  const [draftExpiry, setDraftExpiry] = useState(7);
  const [blocks, setBlocks] = useState([
    { id: '1', name: 'Morning Block', start: '08:07', end: '10:30' },
    { id: '2', name: 'Afternoon Block', start: '13:10', end: '15:30' },
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Session Schedule & Capacity" description="SCR-ADMIN-004 · Define therapy session rounds, capacity, and block definitions" />

      {/* Session Schedule Collapsible */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setScheduleOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
        >
          Session Schedule
          {scheduleOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {scheduleOpen && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Morning Round Start</label>
              <input
                type="time"
                value={morningStart}
                onChange={(e) => setMorningStart(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Morning Round End</label>
              <input
                type="time"
                value={morningEnd}
                onChange={(e) => setMorningEnd(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Afternoon Round Start</label>
              <input
                type="time"
                value={afternoonStart}
                onChange={(e) => setAfternoonStart(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Afternoon Round End</label>
              <input
                type="time"
                value={afternoonEnd}
                onChange={(e) => setAfternoonEnd(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pre-Therapy Duration (minutes)</label>
              <input
                type="number"
                min={0}
                value={preTherapy}
                onChange={(e) => setPreTherapy(Number(e.target.value))}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Capacity & Expiry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Staff-to-Student Capacity</h3>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Students per Staff Member</label>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Draft Expiry Period</h3>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Days until draft expires (1–30)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={draftExpiry}
              onChange={(e) => setDraftExpiry(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>
        </div>
      </div>

      {/* Session Block Definitions */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Session Block Definitions</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              {['Block Name', 'Start Time', 'End Time'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {blocks.map((block) => (
              <tr key={block.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{block.name}</td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={block.start}
                    onChange={(e) =>
                      setBlocks((bs) => bs.map((b) => (b.id === block.id ? { ...b, start: e.target.value } : b)))
                    }
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={block.end}
                    onChange={(e) =>
                      setBlocks((bs) => bs.map((b) => (b.id === block.id ? { ...b, end: e.target.value } : b)))
                    }
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <YellowButton>
        <span className="flex items-center gap-2"><Save size={15} /> Save Configuration</span>
      </YellowButton>
    </div>
  );
}

// ─── Section: Goal Domains ─────────────────────────────────────────────────────

function GoalDomains() {
  const [domains, setDomains] = useState(mockDomains);
  const [addingDomain, setAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState({ name: '', description: '' });

  const moveUp = (id: string) => {
    setDomains((ds) => {
      const idx = ds.findIndex((d) => d.id === id);
      if (idx === 0) return ds;
      const next = [...ds];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((d, i) => ({ ...d, order: i + 1 }));
    });
  };
  const moveDown = (id: string) => {
    setDomains((ds) => {
      const idx = ds.findIndex((d) => d.id === id);
      if (idx === ds.length - 1) return ds;
      const next = [...ds];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((d, i) => ({ ...d, order: i + 1 }));
    });
  };
  const toggleStatus = (id: string) =>
    setDomains((ds) =>
      ds.map((d) => (d.id === id ? { ...d, status: d.status === 'Active' ? 'Inactive' : 'Active' } : d))
    );
  const deleteDomain = (id: string) => setDomains((ds) => ds.filter((d) => d.id !== id));
  const addDomain = () => {
    if (!newDomain.name.trim()) return;
    setDomains((ds) => [
      ...ds,
      { id: String(Date.now()), ...newDomain, order: ds.length + 1, status: 'Active' },
    ]);
    setNewDomain({ name: '', description: '' });
    setAddingDomain(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Goal Domain Definitions" description="SCR-ADMIN-005 · Define and order therapy goal domains" />

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              {['Order', 'Name', 'Description', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {domains.map((d, idx) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <IconButton icon={ArrowUp} onClick={() => moveUp(d.id)} title="Move up" />
                    <span className="text-xs text-center text-gray-600 font-mono">{d.order}</span>
                    <IconButton icon={ArrowDown} onClick={() => moveDown(d.id)} title="Move down" />
                  </div>
                </td>
                {editingId === d.id ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        value={editBuf.name}
                        onChange={(e) => setEditBuf((b) => ({ ...b, name: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={editBuf.description}
                        onChange={(e) => setEditBuf((b) => ({ ...b, description: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                      />
                    </td>
                    <td className="px-4 py-3"><Badge color={d.status}>{d.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <IconButton icon={Check} title="Save" onClick={() => {
                          setDomains((ds) => ds.map((x) => (x.id === d.id ? { ...x, ...editBuf } : x)));
                          setEditingId(null);
                        }} />
                        <IconButton icon={X} title="Cancel" onClick={() => setEditingId(null)} />
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                    <td className="px-4 py-3 text-gray-600">{d.description}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleStatus(d.id)}
                        className="focus:outline-none"
                      >
                        <Badge color={d.status}>{d.status}</Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <IconButton icon={Edit2} title="Edit" onClick={() => {
                          setEditingId(d.id);
                          setEditBuf({ name: d.name, description: d.description });
                        }} />
                        <IconButton icon={Trash2} danger title="Delete" onClick={() => deleteDomain(d.id)} />
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addingDomain ? (
        <div className="flex flex-wrap gap-3 items-end border border-[#38BDF8]/40 rounded-xl p-4 bg-blue-50/30">
          <div className="flex-1 min-w-[150px]">
            <InputField label="Domain Name" value={newDomain.name} onChange={(v) => setNewDomain((n) => ({ ...n, name: v }))} placeholder="e.g. Self-Help Skills" />
          </div>
          <div className="flex-[2] min-w-[200px]">
            <InputField label="Description" value={newDomain.description} onChange={(v) => setNewDomain((n) => ({ ...n, description: v }))} placeholder="Brief description..." />
          </div>
          <div className="flex gap-2">
            <YellowButton onClick={addDomain} small>Add Domain</YellowButton>
            <GhostButton onClick={() => setAddingDomain(false)}>Cancel</GhostButton>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAddingDomain(true)} className="flex items-center gap-2 text-sm text-[#0284C7] hover:text-[#38BDF8] font-medium">
          <Plus size={14} /> Add Domain
        </button>
      )}

      <YellowButton>
        <span className="flex items-center gap-2"><Save size={15} /> Save Configuration</span>
      </YellowButton>
    </div>
  );
}

// ─── Section: Task Analysis Templates ─────────────────────────────────────────

function TaskAnalysisTemplates() {
  const [templates, setTemplates] = useState(mockTemplates);
  const [addingTemplate, setAddingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '' });
  const [steps, setSteps] = useState<string[]>(['']);
  const [stepMastery, setStepMastery] = useState(80);
  const [overallMastery, setOverallMastery] = useState(80);

  const addStep = () => setSteps((s) => [...s, '']);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const moveStepUp = (i: number) => {
    if (i === 0) return;
    setSteps((s) => { const n = [...s]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; });
  };
  const moveStepDown = (i: number) => {
    setSteps((s) => {
      if (i === s.length - 1) return s;
      const n = [...s]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n;
    });
  };

  const saveTemplate = () => {
    if (!newTemplate.name.trim()) return;
    setTemplates((ts) => [...ts, { id: String(Date.now()), name: newTemplate.name, steps: steps.filter(Boolean).length, status: 'Active' }]);
    setAddingTemplate(false);
    setNewTemplate({ name: '', description: '' });
    setSteps(['']);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Task Analysis Templates" description="SCR-ADMIN-006 · Manage step-by-step task analysis templates" />

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Templates</h3>
          <button
            type="button"
            onClick={() => setAddingTemplate(true)}
            className="flex items-center gap-1.5 text-sm text-[#0284C7] hover:text-[#38BDF8] font-medium"
          >
            <Plus size={14} /> Add Template
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              {['Template Name', 'Steps', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {templates.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-gray-700">{t.steps} steps</td>
                <td className="px-4 py-3"><Badge color={t.status}>{t.status}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <IconButton icon={Edit2} title="View/Edit" />
                    <IconButton icon={Trash2} danger title="Delete" onClick={() => setTemplates((ts) => ts.filter((x) => x.id !== t.id))} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addingTemplate && (
        <div className="border border-[#38BDF8]/40 rounded-xl p-5 bg-blue-50/20 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">New Template</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Template Name" value={newTemplate.name} onChange={(v) => setNewTemplate((n) => ({ ...n, name: v }))} placeholder="e.g. Shoe Tying" />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate((n) => ({ ...n, description: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] resize-none"
                placeholder="Brief description..."
              />
            </div>
          </div>

          {/* Steps Manager */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Steps</p>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500 w-5 shrink-0">{i + 1}.</span>
                  <input
                    value={step}
                    onChange={(e) => setSteps((s) => s.map((x, idx) => (idx === i ? e.target.value : x)))}
                    placeholder={`Step ${i + 1}...`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  />
                  <IconButton icon={ArrowUp} onClick={() => moveStepUp(i)} title="Move up" />
                  <IconButton icon={ArrowDown} onClick={() => moveStepDown(i)} title="Move down" />
                  <IconButton icon={Trash2} danger onClick={() => removeStep(i)} title="Remove step" />
                </div>
              ))}
            </div>
            <button type="button" onClick={addStep} className="flex items-center gap-1.5 text-sm text-[#0284C7] hover:text-[#38BDF8] font-medium mt-2">
              <Plus size={13} /> Add Step
            </button>
          </div>

          {/* Mastery Criteria */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Per-Step Mastery %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={stepMastery}
                onChange={(e) => setStepMastery(Number(e.target.value))}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Overall Mastery %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={overallMastery}
                onChange={(e) => setOverallMastery(Number(e.target.value))}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <YellowButton onClick={saveTemplate}>
              <span className="flex items-center gap-2"><Save size={15} /> Save Template</span>
            </YellowButton>
            <GhostButton onClick={() => setAddingTemplate(false)}>Cancel</GhostButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Staff Account Management ────────────────────────────────────────

function StaffAccounts() {
  const [staff, setStaff] = useState(mockStaff);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [addingStaff, setAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'teacher', phone: '' });
  const [selectedStaff, setSelectedStaff] = useState<(typeof mockStaff)[0] | null>(null);
  const [bulkAction, setBulkAction] = useState('');

  const filtered = staff.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || s.role === roleFilter;
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const toggleSelect = (id: string) =>
    setStaff((ss) => ss.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)));
  const toggleAll = () => {
    const allSelected = filtered.every((s) => s.selected);
    const ids = new Set(filtered.map((s) => s.id));
    setStaff((ss) => ss.map((s) => (ids.has(s.id) ? { ...s, selected: !allSelected } : s)));
  };
  const toggleStatus = (id: string) =>
    setStaff((ss) =>
      ss.map((s) => (s.id === id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s))
    );
  const addStaffMember = () => {
    if (!newStaff.name.trim() || !newStaff.email.trim()) return;
    setStaff((ss) => [...ss, { id: String(Date.now()), ...newStaff, status: 'Active', selected: false }]);
    setNewStaff({ name: '', email: '', role: 'teacher', phone: '' });
    setAddingStaff(false);
  };

  const selectedCount = filtered.filter((s) => s.selected).length;

  const applyBulkAction = () => {
    if (!bulkAction) return;
    const selectedIds = new Set(filtered.filter((s) => s.selected).map((s) => s.id));
    if (bulkAction === 'Reset Password') {
      toast.success(`Password reset email sent for ${selectedIds.size} account(s)`);
    } else {
      const nextStatus = bulkAction === 'Activate' ? 'Active' : 'Inactive';
      setStaff((ss) => ss.map((s) => (selectedIds.has(s.id) ? { ...s, status: nextStatus, selected: false } : s)));
      toast.success(`${bulkAction} applied to ${selectedIds.size} account(s)`);
    }
    setBulkAction('');
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Staff Account Management" description="SCR-SYS-001 · Manage staff accounts, roles, and access status" />

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[340px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
          />
        </div>
        <SelectDropdown
          value={roleFilter}
          options={['All', 'teacher', 'coordinator', 'director', 'institutional_admin', 'sysadmin']}
          onChange={setRoleFilter}
          displayValue={(v) => (v === 'All' ? 'All Roles' : v.replace(/_/g, ' '))}
        />
        <PillChips options={['All', 'Active', 'Inactive']} value={statusFilter} onSelect={setStatusFilter} />
        <YellowButton onClick={() => setAddingStaff(true)}>
          <span className="flex items-center gap-2"><Plus size={15} /> Add Staff</span>
        </YellowButton>
      </div>

      {/* Add Staff Inline Form */}
      {addingStaff && (
        <div className="border border-[#38BDF8]/40 rounded-xl p-4 bg-blue-50/20">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">New Staff Member</h3>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Full Name" value={newStaff.name} onChange={(v) => setNewStaff((n) => ({ ...n, name: v }))} placeholder="Jane Smith" />
            <InputField label="Email" value={newStaff.email} onChange={(v) => setNewStaff((n) => ({ ...n, email: v }))} placeholder="jane@melue.org" type="email" />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff((n) => ({ ...n, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white"
              >
                {['teacher', 'coordinator', 'director', 'institutional_admin', 'sysadmin'].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <InputField label="Phone" value={newStaff.phone} onChange={(v) => setNewStaff((n) => ({ ...n, phone: v }))} placeholder="555-0100" />
          </div>
          <div className="flex gap-2 mt-3">
            <YellowButton onClick={addStaffMember} small>Add Staff Member</YellowButton>
            <GhostButton onClick={() => setAddingStaff(false)}>Cancel</GhostButton>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium text-[#0284C7]">{selectedCount} selected</span>
          <SelectDropdown
            value={bulkAction}
            options={['Activate', 'Deactivate', 'Reset Password']}
            onChange={setBulkAction}
            placeholder="Bulk Action..."
            displayValue={(v) => v || 'Bulk Action...'}
          />
          <YellowButton small onClick={applyBulkAction}>Apply</YellowButton>
        </div>
      )}

      {/* Staff Table + Details Side Panel */}
      <div className="flex gap-4">
        <div className={`border border-gray-200 rounded-xl overflow-hidden ${selectedStaff ? 'flex-1' : 'w-full'}`}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">
                  <button type="button" onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                    {filtered.every((s) => s.selected) ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                </th>
                {['Name', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedStaff?.id === s.id ? 'bg-blue-50/50' : ''}`}
                  onClick={() => setSelectedStaff(s)}
                >
                  <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleSelect(s.id); }}>
                    <button type="button" className="text-gray-400 hover:text-gray-600">
                      {s.selected ? <CheckSquare size={14} className="text-[#38BDF8]" /> : <Square size={14} />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email}</td>
                  <td className="px-4 py-3"><Badge color={s.role}>{s.role}</Badge></td>
                  <td className="px-4 py-3"><Badge color={s.status}>{s.status}</Badge></td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1 items-center">
                      <IconButton icon={Edit2} title="Edit" />
                      <IconButton icon={Shield} title="Reset Password" />
                      <button
                        type="button"
                        onClick={() => toggleStatus(s.id)}
                        title={s.status === 'Active' ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${
                          s.status === 'Active'
                            ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {s.status === 'Active' ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Details Panel */}
        {selectedStaff && (
          <div className="w-64 shrink-0 border border-gray-200 rounded-xl p-4 space-y-3 bg-white self-start">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Staff Details</h3>
              <IconButton icon={X} onClick={() => setSelectedStaff(null)} title="Close" />
            </div>
            <div className="space-y-2.5">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-900">{selectedStaff.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-800">{selectedStaff.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-gray-800">{selectedStaff.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <Badge color={selectedStaff.role}>{selectedStaff.role}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <Badge color={selectedStaff.status}>{selectedStaff.status}</Badge>
              </div>
            </div>
            <YellowButton small>Edit Profile</YellowButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section: Role Management ──────────────────────────────────────────────────

function RoleManagement() {
  const [roles, setRoles] = useState(mockRoles);
  const [addingRole, setAddingRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });

  const addRole = () => {
    if (!newRole.name.trim()) return;
    setRoles((rs) => [...rs, { id: String(Date.now()), ...newRole, count: 0, system: false }]);
    setNewRole({ name: '', description: '' });
    setAddingRole(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Role Management" description="SCR-SYS-002 · Configure staff roles and their descriptions" />

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Roles</h3>
          <button
            type="button"
            onClick={() => setAddingRole(true)}
            className="flex items-center gap-1.5 text-sm text-[#0284C7] hover:text-[#38BDF8] font-medium"
          >
            <Plus size={14} /> Add Role
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              {['Role Name', 'Description', 'Staff Count', 'Type', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">{role.name}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs">{role.description}</td>
                <td className="px-4 py-3 text-gray-700">{role.count}</td>
                <td className="px-4 py-3">
                  {role.system ? <Badge color="System">System</Badge> : <Badge>Custom</Badge>}
                </td>
                <td className="px-4 py-3">
                  {!role.system && (
                    <IconButton icon={Trash2} danger title="Delete role" onClick={() => setRoles((rs) => rs.filter((r) => r.id !== role.id))} />
                  )}
                </td>
              </tr>
            ))}
            {addingRole && (
              <tr className="bg-blue-50/30">
                <td className="px-4 py-2">
                  <input
                    value={newRole.name}
                    onChange={(e) => setNewRole((n) => ({ ...n, name: e.target.value }))}
                    placeholder="Role name"
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    value={newRole.description}
                    onChange={(e) => setNewRole((n) => ({ ...n, description: e.target.value }))}
                    placeholder="Description"
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  />
                </td>
                <td className="px-4 py-2 text-gray-500">0</td>
                <td className="px-4 py-2"><Badge>Custom</Badge></td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <IconButton icon={Check} title="Add" onClick={addRole} />
                    <IconButton icon={X} title="Cancel" onClick={() => setAddingRole(false)} />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <YellowButton>
        <span className="flex items-center gap-2"><Save size={15} /> Save Changes</span>
      </YellowButton>
    </div>
  );
}

// ─── Section: Permission Configuration ────────────────────────────────────────

function PermissionConfiguration() {
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [permMatrix, setPermMatrix] = useState<Record<string, Record<string, boolean>>>(defaultPermMatrix);

  const roleKey = selectedRole;
  const currentPerms = permMatrix[roleKey] ?? {};

  const togglePerm = (module: string, action: string) => {
    const key = `${module}-${action}`;
    setPermMatrix((m) => ({
      ...m,
      [roleKey]: { ...m[roleKey], [key]: !m[roleKey]?.[key] },
    }));
  };

  const setAllForModule = (module: string, val: boolean) => {
    setPermMatrix((m) => {
      const updated = { ...(m[roleKey] ?? {}) };
      ACTIONS.forEach((a) => { updated[`${module}-${a}`] = val; });
      return { ...m, [roleKey]: updated };
    });
  };

  const setAllForAction = (action: string, val: boolean) => {
    setPermMatrix((m) => {
      const updated = { ...(m[roleKey] ?? {}) };
      MODULES.forEach((mod) => { updated[`${mod}-${action}`] = val; });
      return { ...m, [roleKey]: updated };
    });
  };

  const setPreset = (preset: 'full' | 'readonly') => {
    setPermMatrix((m) => {
      const updated: Record<string, boolean> = {};
      MODULES.forEach((mod) =>
        ACTIONS.forEach((act) => {
          updated[`${mod}-${act}`] = preset === 'full' || act === 'View';
        })
      );
      return { ...m, [roleKey]: updated };
    });
  };

  const permSummary = MODULES.map((mod) => {
    const allowed = ACTIONS.filter((a) => currentPerms[`${mod}-${a}`]);
    if (!allowed.length) return null;
    return `Can ${allowed.join(', ').toLowerCase()} ${mod}`;
  }).filter(Boolean);

  return (
    <div className="space-y-6">
      <SectionHeader title="Permission Configuration" description="SCR-SYS-003 · Define module access permissions per role" />

      {/* Role Selector + Presets */}
      <div className="flex flex-wrap items-center gap-4">
        <PillChips options={Object.keys(defaultPermMatrix)} value={selectedRole} onSelect={setSelectedRole} />
        <div className="flex gap-2">
          <GhostButton onClick={() => setPreset('full')}>Full Access</GhostButton>
          <GhostButton onClick={() => setPreset('readonly')}>Read Only</GhostButton>
          <GhostButton>
            <span className="flex items-center gap-1"><Copy size={13} /> Copy from Role...</span>
          </GhostButton>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Module</th>
              {ACTIONS.map((action) => (
                <th key={action} className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  <div className="flex flex-col items-center gap-1">
                    {action}
                    <button
                      type="button"
                      title={`Select all ${action}`}
                      onClick={() => {
                        const allOn = MODULES.every((mod) => currentPerms[`${mod}-${action}`]);
                        setAllForAction(action, !allOn);
                      }}
                      className="text-[#38BDF8] hover:text-[#0284C7]"
                    >
                      <CheckSquare size={12} />
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">All</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {MODULES.map((module) => {
              const allOn = ACTIONS.every((a) => currentPerms[`${module}-${a}`]);
              return (
                <tr key={module} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{module}</td>
                  {ACTIONS.map((action) => {
                    const key = `${module}-${action}`;
                    return (
                      <td key={action} className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!currentPerms[key]}
                          onChange={() => togglePerm(module, action)}
                          className="w-4 h-4 rounded accent-[#38BDF8] cursor-pointer"
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setAllForModule(module, !allOn)}
                      title={allOn ? 'Deselect all' : 'Select all'}
                      className={`transition-colors ${allOn ? 'text-[#38BDF8] hover:text-[#0284C7]' : 'text-gray-300 hover:text-gray-500'}`}
                    >
                      <CheckSquare size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Live Preview */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Permission Summary — {selectedRole}</p>
        {permSummary.length > 0 ? (
          <ul className="space-y-1">
            {permSummary.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No permissions configured for this role.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <YellowButton>
          <span className="flex items-center gap-2"><Save size={15} /> Save Configuration</span>
        </YellowButton>
        <button type="button" className="text-sm text-[#0284C7] hover:text-[#38BDF8] font-medium underline">
          View Audit Trail
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar Navigation ────────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  section: Section;
  active: boolean;
  onClick: (s: Section) => void;
}

function NavItem({ icon: Icon, label, section, active, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(section)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FCD34D]/60 ${
        active
          ? 'bg-[#FCD34D] text-gray-900 font-semibold'
          : 'text-gray-300 hover:text-white hover:bg-white/10 font-medium'
      }`}
    >
      <Icon size={15} className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

// ─── Main AdminPanel ───────────────────────────────────────────────────────────

export function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const defaultSection: Section =
    user?.role === 'sysadmin' ? 'staff-accounts' : 'form-builder';

  const [activeSection, setActiveSection] = useState<Section>(defaultSection);

  const sectionMeta: Record<Section, { label: string; breadcrumb: string }> = {
    'form-builder': { label: 'Form Builder', breadcrumb: 'Clinical Configuration / Form Builder' },
    'trial-logging': { label: 'Trial Logging Format', breadcrumb: 'Clinical Configuration / Trial Logging Format' },
    'abc-dropdowns': { label: 'ABC Dropdown Lists', breadcrumb: 'Clinical Configuration / ABC Dropdown Lists' },
    'session-schedule': { label: 'Session Schedule & Capacity', breadcrumb: 'Clinical Configuration / Session Schedule & Capacity' },
    'goal-domains': { label: 'Goal Domain Definitions', breadcrumb: 'Clinical Configuration / Goal Domain Definitions' },
    'task-analysis': { label: 'Task Analysis Templates', breadcrumb: 'Clinical Configuration / Task Analysis Templates' },
    'staff-accounts': { label: 'Staff Account Management', breadcrumb: 'System Configuration / Staff Account Management' },
    'role-management': { label: 'Role Management', breadcrumb: 'System Configuration / Role Management' },
    'permissions': { label: 'Permission Configuration', breadcrumb: 'System Configuration / Permission Configuration' },
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'form-builder': return <FormBuilder />;
      case 'trial-logging': return <TrialLogging />;
      case 'abc-dropdowns': return <ABCDropdowns />;
      case 'session-schedule': return <SessionSchedule />;
      case 'goal-domains': return <GoalDomains />;
      case 'task-analysis': return <TaskAnalysisTemplates />;
      case 'staff-accounts': return <StaffAccounts />;
      case 'role-management': return <RoleManagement />;
      case 'permissions': return <PermissionConfiguration />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-[220px] shrink-0 bg-[#1F2937] text-white flex flex-col overflow-y-auto">
        {/* Logo + Title */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-white/10">
          <img
            src="/src/imports/image-2.png"
            alt="Melu'e Foundation"
            className="h-10 w-10 object-contain rounded-lg shrink-0 bg-white/10"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div>
            <p className="text-xs font-bold text-[#FCD34D] leading-tight tracking-wide uppercase">Melu'e</p>
            <p className="text-xs text-gray-400 leading-tight">Administration</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5">
          {user?.role === 'institutional_admin' && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">
                Clinical Configuration
              </p>
              <div className="space-y-0.5">
                <NavItem icon={ClipboardList} label="Form Builder" section="form-builder" active={activeSection === 'form-builder'} onClick={setActiveSection} />
                <NavItem icon={BarChart2} label="Trial Logging" section="trial-logging" active={activeSection === 'trial-logging'} onClick={setActiveSection} />
                <NavItem icon={ListChecks} label="ABC Dropdowns" section="abc-dropdowns" active={activeSection === 'abc-dropdowns'} onClick={setActiveSection} />
                <NavItem icon={Calendar} label="Session Schedule" section="session-schedule" active={activeSection === 'session-schedule'} onClick={setActiveSection} />
                <NavItem icon={Target} label="Goal Domains" section="goal-domains" active={activeSection === 'goal-domains'} onClick={setActiveSection} />
                <NavItem icon={Layers} label="Task Analysis" section="task-analysis" active={activeSection === 'task-analysis'} onClick={setActiveSection} />
              </div>
            </div>
          )}

          {user?.role === 'sysadmin' && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">
                System Configuration
              </p>
              <div className="space-y-0.5">
                <NavItem icon={Users} label="Staff Accounts" section="staff-accounts" active={activeSection === 'staff-accounts'} onClick={setActiveSection} />
                <NavItem icon={Shield} label="Role Management" section="role-management" active={activeSection === 'role-management'} onClick={setActiveSection} />
                <NavItem icon={Lock} label="Permissions" section="permissions" active={activeSection === 'permissions'} onClick={setActiveSection} />
              </div>
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-white truncate">{user?.name ?? 'Administrator'}</p>
            <p className="text-[11px] text-gray-400 truncate">{user?.email ?? ''}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold text-[#FCD34D] uppercase tracking-wide">
              {user?.role ?? 'admin'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900">{sectionMeta[activeSection].label}</h1>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Settings size={11} />
              {sectionMeta[activeSection].breadcrumb}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-mono">
              {activeSection === 'form-builder' && 'SCR-ADMIN-001'}
              {activeSection === 'trial-logging' && 'SCR-ADMIN-002'}
              {activeSection === 'abc-dropdowns' && 'SCR-ADMIN-003'}
              {activeSection === 'session-schedule' && 'SCR-ADMIN-004'}
              {activeSection === 'goal-domains' && 'SCR-ADMIN-005'}
              {activeSection === 'task-analysis' && 'SCR-ADMIN-006'}
              {activeSection === 'staff-accounts' && 'SCR-SYS-001'}
              {activeSection === 'role-management' && 'SCR-SYS-002'}
              {activeSection === 'permissions' && 'SCR-SYS-003'}
            </span>
            <div className="flex items-center gap-1.5 ml-1">
              <User size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-900">{user?.name ?? 'Administrator'}</span>
            </div>
            <button
              type="button"
              title="Log out"
              onClick={() => { logout(); navigate('/login'); }}
              className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
          <p className="text-center text-xs text-gray-400 mt-8">© 2026 Melu'e Foundation. All rights reserved.</p>
        </main>
      </div>
    </div>
  );
}
