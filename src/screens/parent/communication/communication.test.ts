import { describe, it, expect } from 'vitest';
import {
  roleBadgeStyle,
  avatarColor,
  filterTeacherConversations,
  filterParentConversations,
  PARENT_TEMPLATES,
  TEACHER_COLOR,
  DIRECTOR_COLOR,
  COORDINATOR_COLOR,
  type TeacherConversation,
  type ParentConversation,
} from './types';

describe('Parent Communication Helpers & Logic', () => {
  it('returns correct roleBadgeStyle for different roles', () => {
    const teacherStyle = roleBadgeStyle('Teacher');
    expect(teacherStyle.color).toBe('#0284C7');

    const directorStyle = roleBadgeStyle('Director');
    expect(directorStyle.color).toBe('#7E22CE');

    const coordinatorStyle = roleBadgeStyle('Coordinator');
    expect(coordinatorStyle.color).toBe('#B45309');
  });

  it('returns correct avatarColor for different roles', () => {
    expect(avatarColor('Teacher')).toBe(TEACHER_COLOR);
    expect(avatarColor('Director')).toBe(DIRECTOR_COLOR);
    expect(avatarColor('Coordinator')).toBe(COORDINATOR_COLOR);
  });

  it('filters teacher conversations by student and search term', () => {
    const mockList: TeacherConversation[] = [
      {
        id: '1',
        studentName: 'Alex Doe',
        parentName: 'Jane Doe',
        lastMessagePreview: 'Need progress update',
        unreadCount: 2,
        resolved: false,
      },
      {
        id: '2',
        studentName: 'Sam Smith',
        parentName: 'John Smith',
        lastMessagePreview: 'Observation confirmed',
        unreadCount: 0,
        resolved: false,
      },
    ];

    // Filter by student
    const alexOnly = filterTeacherConversations(mockList, 'Alex Doe', '');
    expect(alexOnly).toHaveLength(1);
    expect(alexOnly[0].id).toBe('1');

    // Filter by search query (parent name)
    const johnOnly = filterTeacherConversations(mockList, 'All', 'john');
    expect(johnOnly).toHaveLength(1);
    expect(johnOnly[0].id).toBe('2');

    // Filter by search query (message preview)
    const progressSearch = filterTeacherConversations(mockList, 'All', 'progress');
    expect(progressSearch).toHaveLength(1);
    expect(progressSearch[0].id).toBe('1');
  });

  it('filters parent conversations by search query', () => {
    const mockList: ParentConversation[] = [
      {
        id: 'c1',
        recipient: 'Ms. Rachel',
        role: 'Teacher',
        avatarLetter: 'M',
        lastMessage: 'Good morning',
        time: '9:00 AM',
        unread: 0,
        messages: [],
      },
      {
        id: 'c2',
        recipient: 'Dr. Emily',
        role: 'Director',
        avatarLetter: 'D',
        lastMessage: 'IEP review next Tuesday',
        time: 'Yesterday',
        unread: 1,
        messages: [],
      },
    ];

    expect(filterParentConversations(mockList, '')).toHaveLength(2);

    const rachel = filterParentConversations(mockList, 'rachel');
    expect(rachel).toHaveLength(1);
    expect(rachel[0].recipient).toBe('Ms. Rachel');

    const iep = filterParentConversations(mockList, 'iep');
    expect(iep).toHaveLength(1);
    expect(iep[0].id).toBe('c2');
  });

  it('provides predefined parent templates', () => {
    expect(PARENT_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    expect(PARENT_TEMPLATES[0].label).toBe('Thank you message');
    expect(PARENT_TEMPLATES[1].label).toBe('Question about progress');
  });
});
