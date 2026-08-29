// screens/institutionaladmin/TaskAnalysisTemplatesScreen.tsx
// SCR-ADMIN-006: Unified Task Analysis Templates & Goal Domains screen

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InstitutionalAdminStackParamList } from '../../types';
import GoalDomainDefinitionsScreen from './GoalDomainDefinitionsScreen';

export default function TaskAnalysisTemplatesScreen(
  props: NativeStackScreenProps<InstitutionalAdminStackParamList, 'TaskAnalysisTemplates'>
) {
  // Renders the combined Goal Domains & Task Analysis Workbench
  return <GoalDomainDefinitionsScreen navigation={props.navigation as any} route={props.route as any} />;
}