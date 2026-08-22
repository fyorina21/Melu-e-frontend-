export interface Student {
  id: string;
  fullName: string;
  dob: string;
  age: number;
  parentName: string;
  phone: string;
  programType: 'regular' | 'pooled-out';
  therapyGroup: 'basic' | 'functional';
  station: string;
  photoUrl?: string;
  goals: {
    station1: string[];
    station2: string[];
  };
}

export interface Goal {
  id: string;
  name: string;
  domain: string;
  description: string;
}

export interface TrialData {
  id: string;
  timestamp: Date;
  prompt: 'FP' | 'PP' | 'G' | '+';
  goalId: string;
}

export interface BehaviorIncident {
  id: string;
  studentId: string;
  goalId: string;
  timestamp: Date;
  antecedent: string;
  behavior: string;
  consequence: string;
  notes?: string;
}

export interface Session {
  id: string;
  station: string;
  room: string;
  teacherId: string;
  teacherName: string;
  startTime: Date;
  duration: number;
  studentAId: string;
  studentBId: string;
  trials: TrialData[];
  incidents: BehaviorIncident[];
  notes?: string;
  status: 'active' | 'completed' | 'draft';
}

export const mockStudents: Student[] = [
  {
    id: 's1',
    fullName: 'Student A',
    dob: '2020-03-15',
    age: 6,
    parentName: 'Parent A',
    phone: '555-1001',
    programType: 'regular',
    therapyGroup: 'basic',
    station: 'Station A',
    goals: {
      station1: ['g1', 'g2'],
      station2: ['g3', 'g4'],
    },
  },
  {
    id: 's2',
    fullName: 'Student B',
    dob: '2019-07-22',
    age: 7,
    parentName: 'Parent B',
    phone: '555-1002',
    programType: 'regular',
    therapyGroup: 'functional',
    station: 'Station B',
    goals: {
      station1: ['g5', 'g6'],
      station2: ['g7', 'g8'],
    },
  },
  {
    id: 's3',
    fullName: 'Student C',
    dob: '2021-01-10',
    age: 5,
    parentName: 'Parent C',
    phone: '555-1003',
    programType: 'pooled-out',
    therapyGroup: 'basic',
    station: 'Station A',
    goals: {
      station1: ['g9', 'g10'],
      station2: ['g11', 'g12'],
    },
  },
  {
    id: 's4',
    fullName: 'Student D',
    dob: '2019-11-05',
    age: 6,
    parentName: 'Parent D',
    phone: '555-1004',
    programType: 'regular',
    therapyGroup: 'functional',
    station: 'Station C',
    goals: {
      station1: ['g13', 'g14'],
      station2: ['g15', 'g16'],
    },
  },
];

export const mockGoals: Goal[] = [
  { id: 'g1', name: 'Identify Colors', domain: 'Cognitive', description: 'Student will identify 5 basic colors with 80% accuracy' },
  { id: 'g2', name: 'Follow 2-Step Commands', domain: 'Receptive Language', description: 'Student will follow 2-step commands independently' },
  { id: 'g3', name: 'Count to 10', domain: 'Cognitive', description: 'Student will count from 1-10 with minimal prompting' },
  { id: 'g4', name: 'Match Shapes', domain: 'Cognitive', description: 'Student will match 4 basic shapes' },
  { id: 'g5', name: 'Request Items', domain: 'Expressive Language', description: 'Student will verbally request preferred items' },
  { id: 'g6', name: 'Eye Contact', domain: 'Social Skills', description: 'Maintain eye contact for 3 seconds during interactions' },
  { id: 'g7', name: 'Turn Taking', domain: 'Social Skills', description: 'Student will take turns during play activities' },
  { id: 'g8', name: 'Label Objects', domain: 'Expressive Language', description: 'Label 10 common objects independently' },
  { id: 'g9', name: 'Sort by Category', domain: 'Cognitive', description: 'Sort items into 2 categories' },
  { id: 'g10', name: 'Answer Questions', domain: 'Receptive Language', description: 'Answer "what" and "who" questions' },
  { id: 'g11', name: 'Imitation Skills', domain: 'Motor Skills', description: 'Imitate 5 gross motor actions' },
  { id: 'g12', name: 'Greetings', domain: 'Social Skills', description: 'Greet familiar people appropriately' },
  { id: 'g13', name: 'Transition Skills', domain: 'Adaptive', description: 'Transition between activities with 1 verbal cue' },
  { id: 'g14', name: 'Functional Play', domain: 'Play Skills', description: 'Engage in functional play with toys for 5 minutes' },
  { id: 'g15', name: 'Letter Recognition', domain: 'Academic', description: 'Identify 10 uppercase letters' },
  { id: 'g16', name: 'Self-Regulation', domain: 'Adaptive', description: 'Use calm-down strategies when prompted' },
];

export const antecedentOptions = [
  'Task demand',
  'Transition',
  'Peer interaction',
  'Denied access to preferred item',
  'Change in routine',
  'Loud noise',
  'Waiting',
  'Other',
];

export const consequenceOptions = [
  'Redirected to task',
  'Offered break',
  'Ignored behavior',
  'Provided replacement behavior',
  'Removed from situation',
  'Discussed with student',
  'Other',
];