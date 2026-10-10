// screens/programdirector/GoalBankManagementScreen.tsx
// SCR-PD-006: Clinical Quality Monitoring (Goal Bank management)

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenLoader from '../../components/ScreenLoader';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getGoalBank, createGoal, updateGoal } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';
import { colors, spacing } from '../../theme/colors';

import { type ExtendedGoal, type FormData, filterGoals } from './goalbank/types';
import { GoalBankHeader } from './goalbank/components/GoalBankHeader';
import { GoalSearchFilterBar } from './goalbank/components/GoalSearchFilterBar';
import { GoalBankTable } from './goalbank/components/GoalBankTable';
import { GoalFormModal } from './goalbank/components/GoalFormModal';
import { GoalPreviewModal } from './goalbank/components/GoalPreviewModal';

type Props = NativeStackScreenProps<ProgramDirectorStackParamList, 'GoalBankManagement'>;

export default function GoalBankManagementScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [goals, setGoals] = useState<ExtendedGoal[] | null>(null);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [formTarget, setFormTarget] = useState<ExtendedGoal | null | undefined>(undefined);
  const [previewGoal, setPreviewGoal] = useState<ExtendedGoal | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getGoalBank({});
      const rows = Array.isArray(res) ? res : [];
      setGoals(
        rows.map((g: any) => ({
          id: g.id,
          name: g.name,
          domain: g.domain,
          description: g.description,
          masteryCriteria: g.masteryCriteria ?? '',
          usageCount: typeof g.usageCount === 'number' ? g.usageCount : 0,
          status: g.active === false || g.status === 'inactive' ? 'inactive' : 'active',
        })),
      );
    } catch {
      setGoals([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => filterGoals(goals, search, domainFilter),
    [goals, search, domainFilter],
  );

  const handleSave = useCallback(
    async (payload: FormData) => {
      const apiPayload = {
        name: payload.name.trim(),
        domain: payload.domain,
        description: payload.description.trim(),
        masteryCriteria: payload.masteryCriteria.trim(),
        status: payload.status,
      };
      try {
        if (formTarget) {
          await updateGoal(formTarget.id, apiPayload);
        } else {
          await createGoal(apiPayload);
        }
        await load();
      } catch {
        // Handled silently
      }
      setFormTarget(undefined);
    },
    [formTarget, load],
  );

  const handleOpenAddModal = useCallback(() => {
    setFormTarget(null);
  }, []);

  const handleEdit = useCallback((goal: ExtendedGoal) => {
    setFormTarget(goal);
  }, []);

  const handlePreview = useCallback((goal: ExtendedGoal) => {
    setPreviewGoal(goal);
  }, []);

  if (!goals) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Clinical Quality"
        onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])}
      />

      <ScrollView
        contentContainerStyle={[styles.content, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        <GoalBankHeader onAddGoal={handleOpenAddModal} />

        <GoalSearchFilterBar
          search={search}
          onSearchChange={setSearch}
          domainFilter={domainFilter}
          onDomainFilterChange={setDomainFilter}
        />

        <GoalBankTable
          goals={filtered}
          totalGoalsCount={goals.length}
          onEdit={handleEdit}
          onPreview={handlePreview}
        />
      </ScrollView>

      <GoalFormModal
        visible={formTarget !== undefined}
        initial={
          formTarget === null || formTarget === undefined
            ? null
            : {
                name: formTarget.name,
                domain: formTarget.domain,
                description: formTarget.description,
                masteryCriteria: formTarget.masteryCriteria,
                suggestedAgeRange: '',
                status: formTarget.status,
              }
        }
        onClose={() => setFormTarget(undefined)}
        onSave={handleSave}
      />

      <GoalPreviewModal goal={previewGoal} onClose={() => setPreviewGoal(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  tabletContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
});
