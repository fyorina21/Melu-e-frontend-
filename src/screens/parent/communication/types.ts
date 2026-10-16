export type MessageSender = 'parent' | 'team';

export interface ParentMessage {
  from: MessageSender;
  senderName: string;
  senderRole: string;
  text: string;
  time: string;
}

export interface ParentConversation {
  id: string;
  recipient: string;
  role: string;
  avatarLetter: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: ParentMessage[];
}

export interface LogEntry {
  date: string;
  from: string;
  preview: string;
  status: string;
}

export interface TeacherConversation {
  id: string;
  studentName: string;
  parentName: string;
  lastMessagePreview: string;
  unreadCount: number;
  resolved: boolean;
}

export interface TeacherThreadMessage {
  id: string;
  sender: string;
  senderLabel: string;
  text: string;
  timestamp: string;
  attachments?: { id: string; name: string }[];
}

export const PARENT_TEMPLATES = [
  {
    label: 'Thank you message',
    text: 'Thank you so much for the update! We really appreciate the care your team puts in.',
  },
  {
    label: 'Question about progress',
    text: "Hi, I was wondering about my child's progress this week. Could you share an update?",
  },
  {
    label: 'Availability update',
    text: 'Just a heads up — my child will be absent on the following dates: [dates]. Please let me know if this affects anything.',
  },
];

export const TEACHER_COLOR = '#38BDF8';
export const DIRECTOR_COLOR = '#A855F7';
export const COORDINATOR_COLOR = '#FBBF24';
export const PARENT_YELLOW = '#FCD34D';

export function roleBadgeStyle(role: string) {
  if (role === 'Teacher') {
    return { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', color: '#0284C7' };
  }
  if (role === 'Director') {
    return { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF', color: '#7E22CE' };
  }
  return { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: '#B45309' };
}

export function avatarColor(role: string) {
  if (role === 'Teacher') return TEACHER_COLOR;
  if (role === 'Director') return DIRECTOR_COLOR;
  return COORDINATOR_COLOR;
}

export function filterTeacherConversations(
  conversations: TeacherConversation[],
  studentFilter: string,
  search: string,
): TeacherConversation[] {
  const term = search.trim().toLowerCase();
  return conversations.filter((c) => {
    const matchesStudent = studentFilter === 'All' || c.studentName === studentFilter;
    const matchesSearch =
      !term ||
      c.studentName.toLowerCase().includes(term) ||
      c.parentName.toLowerCase().includes(term) ||
      c.lastMessagePreview.toLowerCase().includes(term);
    return matchesStudent && matchesSearch;
  });
}

export function filterParentConversations(
  conversations: ParentConversation[],
  searchQuery: string,
): ParentConversation[] {
  const term = searchQuery.trim().toLowerCase();
  if (!term) return conversations;
  return conversations.filter(
    (c) =>
      c.recipient.toLowerCase().includes(term) ||
      c.lastMessage.toLowerCase().includes(term) ||
      c.role.toLowerCase().includes(term),
  );
}
