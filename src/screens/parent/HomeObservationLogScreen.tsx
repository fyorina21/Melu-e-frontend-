import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { PARENT_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { parentApi } from '../../api';
import type { ParentStackParamList } from '../../types';
import ScreenLoader from '../../components/ScreenLoader';
import {
  HomeObservationHeader,
  HomeObservationBanner,
  ObservationCard,
  HomeSupportCard,
  AddObservationModal,
  StrategyRequestModal,
} from './homeobservation/components';
import {
  toObservation,
  type Observation,
  type ObsPayload,
} from './homeobservation/homeObservationTypes';

export default function HomeObservationLogScreen({
  navigation,
}: NativeStackScreenProps<ParentStackParamList, 'HomeObservationLog'>) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [childName, setChildName] = useState<string>('');

  const load = useCallback(async () => {
    try {
      const rows = await parentApi.observations({});
      setObservations(Array.isArray(rows) ? rows.map(toObservation) : []);
    } catch {
      setObservations([]);
    } finally {
      setLoading(false);
    }
    try {
      const dash = await parentApi.dashboard();
      const rawChild = (dash as any)?.childSummary ?? (dash as any)?.data?.students?.[0];
      const name =
        rawChild?.fullName ??
        rawChild?.name ??
        (rawChild?.first_name ? `${rawChild.first_name} ${rawChild.last_name || ''}`.trim() : '');
      if (name) setChildName(name);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ScreenLoader />;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmitObservation = async (payload: ObsPayload) => {
    setShowAddModal(false);
    try {
      await parentApi.createObservation({
        behavior: payload.text,
        context: `${payload.location}${payload.duration ? ` · ${payload.duration}` : ''}`,
        notes: `Category: ${payload.category}`,
      });
      await load();
    } catch {
      // silent
    }
    Alert.alert('Observation submitted!');
  };

  const handleSubmitStrategy = () => {
    setShowStrategyModal(false);
    Alert.alert('Strategy request sent to the team!');
  };

  const handleScheduleMeeting = () => {
    Alert.alert('Meeting request sent!');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Observations"
        onTabPress={(t) => navigation?.navigate?.(PARENT_ROUTE_BY_TAB[t])}
      />
      <View style={[styles.headerContainer, isTablet && styles.headerContainerTablet]}>
        <HomeObservationHeader onAddObservation={() => setShowAddModal(true)} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.bodyWrapper, isTablet && styles.bodyWrapperTablet]}>
          <HomeObservationBanner childName={childName} />

          <View>
            <Text style={styles.sectionTitle}>Observation History</Text>
            <View style={styles.list}>
              {observations.map((obs) => (
                <ObservationCard
                  key={obs.id}
                  observation={obs}
                  isExpanded={expandedIds.has(obs.id)}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </View>
          </View>

          <HomeSupportCard
            onRequestStrategy={() => setShowStrategyModal(true)}
            onScheduleMeeting={handleScheduleMeeting}
          />
        </View>
      </ScrollView>

      <AddObservationModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSubmitObservation}
      />
      <StrategyRequestModal
        visible={showStrategyModal}
        onClose={() => setShowStrategyModal(false)}
        onSend={handleSubmitStrategy}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    width: '100%',
  },
  headerContainerTablet: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  bodyWrapper: {
    gap: spacing.lg,
    width: '100%',
  },
  bodyWrapperTablet: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
