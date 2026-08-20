import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import StatusPill from '../../components/StatusPill';
import { getRoomsResources, updateRoomStatus, updateResourceStatus } from '../../api/coordinatorApi';
import type { CoordinatorStackParamList } from '../../types';

type RoomStatus = 'Available' | 'In Session' | 'Maintenance';

interface Room {
  id: string;
  name: string;
  capacity: number;
  status: RoomStatus;
}

interface Resource {
  id: string;
  name: string;
  total: number;
  inUse: number;
}

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'RoomResourceScheduling'>;

const STATUS_PILL: Record<RoomStatus, 'approved' | 'inProgress' | 'revision'> = {
  Available: 'approved',
  'In Session': 'inProgress',
  Maintenance: 'revision',
};

export default function RoomResourceSchedulingScreen({ navigation }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [maintenance, setMaintenance] = useState<{ id: string; room: string; detail: string; date: string }[]>([]);

  const load = useCallback(async () => {
    try {
      const { data } = await getRoomsResources({});
      setRooms(data.rooms);
      setResources(data.resources);
      setMaintenance(data.maintenance || DEMO_MAINTENANCE);
    } catch (err) {
      setRooms(DEMO_ROOMS);
      setResources(DEMO_RESOURCES);
      setMaintenance(DEMO_MAINTENANCE);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cycleRoomStatus = async (room: Room) => {
    const next: RoomStatus = room.status === 'Available' ? 'In Session' : room.status === 'In Session' ? 'Maintenance' : 'Available';
    setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, status: next } : r)));
    try {
      await updateRoomStatus(room.id, { status: next });
    } catch (err) {}
  };

  const toggleResource = async (resource: Resource) => {
    const next = resource.inUse >= resource.total ? resource.inUse - 1 : resource.inUse + 1;
    setResources((prev) => prev.map((r) => (r.id === resource.id ? { ...r, inUse: next } : r)));
    try {
      await updateResourceStatus(resource.id, { inUse: next });
    } catch (err) {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Rooms" onTabPress={(t) => t !== 'Rooms' && navigation?.navigate?.(navRouteForTab(t) as never)} />

      <View style={styles.header}>
        <View>
          <Text style={typography.h1}>Rooms & Resources</Text>
          <Text style={typography.caption}>MR-41 — room availability, resource tracking, and maintenance</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.h3}>Rooms</Text>
        <View style={styles.card}>
          {rooms.map((room) => (
            <View key={room.id} style={styles.itemRow}>
              <View style={styles.itemIcon}><Feather name="home" size={16} color={colors.navyText} /></View>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{room.name}</Text>
                <Text style={typography.caption}>Capacity: {room.capacity}</Text>
              </View>
              <StatusPill status={STATUS_PILL[room.status]} label={room.status} />
              <TouchableOpacity style={styles.cycleBtn} onPress={() => cycleRoomStatus(room)}>
                <Text style={styles.cycleBtnText}>Toggle</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={typography.h3}>Resources</Text>
        <View style={styles.card}>
          {resources.map((resource) => (
            <View key={resource.id} style={styles.itemRow}>
              <View style={styles.itemIcon}><Feather name="package" size={16} color={colors.navyText} /></View>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{resource.name}</Text>
                <Text style={typography.caption}>{resource.inUse} of {resource.total} in use</Text>
              </View>
              <TouchableOpacity style={styles.cycleBtn} onPress={() => toggleResource(resource)}>
                <Text style={styles.cycleBtnText}>{resource.inUse >= resource.total ? 'Check In' : 'Check Out'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={typography.h3}>Maintenance Schedule</Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Add maintenance', 'Room and date fields are configurable here once a backend exists.')
              }
            >
              <Feather name="plus" size={18} color={colors.primaryYellowDark} />
            </TouchableOpacity>
          </View>
          {maintenance.map((m) => (
            <View key={m.id} style={styles.itemRow}>
              <View style={styles.itemIcon}><Feather name="tool" size={16} color={colors.statusRevisionText} /></View>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{m.room}</Text>
                <Text style={typography.caption}>{m.detail}</Text>
              </View>
              <StatusPill status="inProgress" label={m.date} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
  return ({
    Dashboard: 'CoordinatorDashboard',
    'Live Sessions': 'LiveSessionMonitoring',
    Review: 'SessionSummaryReview',
    Progress: 'CoordinatorStudentProgress',
    Schedule: 'CoordinatorSchedule',
    Parents: 'CoordinatorParentCommunication',
    Enrollment: 'StudentEnrollment',
    Workload: 'WorkloadDashboard',
    Rooms: 'RoomResourceScheduling',
    Notifications: 'Notifications',
  } as Record<string, keyof CoordinatorStackParamList>)[tab];
}

const DEMO_ROOMS: Room[] = [
  { id: 'r1', name: 'Therapy Room 1', capacity: 4, status: 'In Session' },
  { id: 'r2', name: 'Therapy Room 2', capacity: 4, status: 'Available' },
  { id: 'r3', name: 'Therapy Room 3', capacity: 2, status: 'Available' },
  { id: 'r4', name: 'Speech Room', capacity: 3, status: 'In Session' },
  { id: 'r5', name: 'Sensory Room', capacity: 2, status: 'Maintenance' },
  { id: 'r6', name: 'Assessment Room', capacity: 1, status: 'Available' },
];

const DEMO_RESOURCES: Resource[] = [
  { id: 'res1', name: 'Tablets', total: 8, inUse: 5 },
  { id: 'res2', name: 'Projectors', total: 3, inUse: 1 },
  { id: 'res3', name: 'Sensory Toys', total: 12, inUse: 6 },
  { id: 'res4', name: 'Therapy Kits', total: 10, inUse: 4 },
  { id: 'res5', name: 'Reinforcer Packs', total: 20, inUse: 8 },
];

const DEMO_MAINTENANCE = [
  { id: 'm1', room: 'Sensory Room', detail: 'Swing replacement', date: 'Aug 15, 2026' },
  { id: 'm2', room: 'Therapy Room 2', detail: 'Lighting repair', date: 'Aug 20, 2026' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.xs },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  itemIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.bgApp, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  cycleBtn: { borderWidth: 1, borderColor: colors.primaryYellow, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  cycleBtnText: { fontSize: 11, fontWeight: '700', color: colors.primaryYellowDark },
});
