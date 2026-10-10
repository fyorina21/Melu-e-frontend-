// screens/programdirector/IupGenerationScreen.tsx
// SCR-PD-003: IUP Generation & Management

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProgramDirectorStackParamList, CoordinatorStackParamList } from '../../types';
import IupGenerationContainer from './iup/IupGenerationContainer';

export default function IupGenerationScreen(
  props: NativeStackScreenProps<
    ProgramDirectorStackParamList | CoordinatorStackParamList,
    'IupGeneration'
  >,
) {
  return <IupGenerationContainer {...props} />;
}
