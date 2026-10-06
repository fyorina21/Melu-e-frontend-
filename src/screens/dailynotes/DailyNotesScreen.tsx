import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SessionStackParamList } from '../../types';
import DailyNotesContainer from './DailyNotesContainer';

type Props = NativeStackScreenProps<SessionStackParamList, 'DailyNotes'>;

export default function DailyNotesScreen(props: Props) {
  return <DailyNotesContainer {...props} />;
}
