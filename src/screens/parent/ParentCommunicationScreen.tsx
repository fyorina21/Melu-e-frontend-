import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { TeacherCommunicationPanel, ParentCommunicationPanel } from './communication/components';

export default function ParentCommunicationScreen(props: any) {
  const { session } = useAuth();
  const role = session?.role;

  if (role === 'teacher' || role === 'program_director') {
    return <TeacherCommunicationPanel {...props} />;
  }
  return <ParentCommunicationPanel {...props} />;
}
