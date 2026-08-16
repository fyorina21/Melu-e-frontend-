// import React, { useEffect, useMemo, useState } from 'react';
// import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
// import { Feather } from '@expo/vector-icons';
// // import { colors, radius, spacing } from '../../../theme/colors';
// // import { typography } from '../../../theme/typography';

// const CAPACITY_PER_APPOINTMENT = 2;

// export interface ReassignOption {
//   id: string;
//   name: string;
// }

// interface AppointmentLike {
//   id: string;
//   therapistId?: string | null;
//   therapistName?: string;
//   studentIds?: string[];
//   studentNames?: string[];
// }

// interface Props {
//   visible: boolean;
//   therapistOptions?: ReassignOption[];
//   appointments?: AppointmentLike[]; // current day's appointments
//   onClose: () => void;
//   onSubmit: (payload: { fromTherapistId: string; toTherapistId: string; studentIds: string[] }) => void;
// }

// export default function ReassignStudentsModal({
//   visible,
//   therapistOptions = [],
//   appointments = [],
//   onClose,
//   onSubmit,
// }: Props) {
//   const [fromTherapistId, setFromTherapistId] = useState<string | null>(null);
//   const [toTherapistId, setToTherapistId] = useState<string | null>(null);
//   const [selected, setSelected] = useState<string[]>([]);

//   useEffect(() => {
//     if (visible) {
//       setFromTherapistId(null);
//       setToTherapistId(null);
//       setSelected([]);
//     }
//   }, [visible]);

//   const teachersWithAppointments = useMemo(
//     () =>
//       therapistOptions.filter((t) =>
//         appointments.some((a) => a.therapistId === t.id && (a.studentIds?.length || 0) > 0)
//       ),
//     [therapistOptions, appointments]
//   );

//   const sourceStudents = useMemo(() => {
//     if (!fromTherapistId) return [];
//     const seen = new Set<string>();
//     const list: { id: string; name: string }[] = [];
//     appointments
//       .filter((a) => a.therapistId === fromTherapistId)
//       .forEach((a) => {
//         (a.studentIds || []).forEach((id, i) => {
//           if (!seen.has(id)) {
//             seen.add(id);
//             list.push({ id, name: a.studentNames?.[i] || id });
//           }
//         });
//       });
//     return list;
//   }, [fromTherapistId, appointments]);

//   const capacityInfo = useMemo(() => {
//     if (!toTherapistId) return null;
//     const targetAppts = appointments.filter((a) => a.therapistId === toTherapistId);
//     const used = targetAppts.reduce((sum, a) => sum + (a.studentIds?.length || 0), 0);
//     const slots = targetAppts.length > 0 ? targetAppts.length * CAPACITY_PER_APPOINTMENT : CAPACITY_PER_APPOINTMENT;
//     return { used, slots, remaining: Math.max(0, slots - used) };
//   }, [toTherapistId, appointments]);

//   const overCapacity = capacityInfo ? selected.length > capacityInfo.remaining : false;

//   const toggleStudent = (id: string) => {
//     setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
//   };

//   const handleSubmit = () => {
//     if (!fromTherapistId || !toTherapistId) { Alert.alert('Missing info', 'Choose a source and target teacher.'); return; }
//     if (selected.length === 0) { Alert.alert('Missing info', 'Select at least one student to move.'); return; }
//     if (fromTherapistId === toTherapistId) { Alert.alert('Invalid move', 'Source and target must be different teachers.'); return; }
//     if (overCapacity) { Alert.alert('Over capacity', `Target teacher only has ${capacityInfo?.remaining} slot(s) available.`); return; }
//     onSubmit({ fromTherapistId, toTherapistId, studentIds: selected });
//   };

//   return (
//     <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
//       <View style={styles.overlay}>
//         <View style={styles.sheet}>
//           <View style={styles.header}>
//             <Text style={typography.h2}>Reassign Students</Text>
//             <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
//               <Feather name="x" size={22} color={colors.navyText} />
//             </TouchableOpacity>
//           </View>

//           <ScrollView contentContainerStyle={styles.body}>
//             <View style={styles.field}>
//               <Text style={typography.label}>From teacher (has students today)</Text>
//               <View style={styles.chipRow}>
//                 {teachersWithAppointments.map((t) => (
//                   <TouchableOpacity
//                     key={t.id}
//                     style={[styles.chip, fromTherapistId === t.id && styles.chipSelected]}
//                     onPress={() => { setFromTherapistId(t.id); setSelected([]); }}
//                   >
//                     <Text style={[styles.chipText, fromTherapistId === t.id && styles.chipTextSelected]}>{t.name}</Text>
//                   </TouchableOpacity>
//                 ))}
//                 {teachersWithAppointments.length === 0 && (
//                   <Text style={[typography.caption, { color: colors.mutedText }]}>No teachers with students today.</Text>
//                 )}
//               </View>
//             </View>

//             {fromTherapistId && (
//               <View style={styles.field}>
//                 <Text style={typography.label}>Students to move ({sourceStudents.length})</Text>
//                 <View style={styles.chipRow}>
//                   {sourceStudents.map((s) => (
//                     <TouchableOpacity
//                       key={s.id}
//                       style={[styles.chip, selected.includes(s.id) && styles.chipSelected]}
//                       onPress={() => toggleStudent(s.id)}
//                     >
//                       <Text style={[styles.chipText, selected.includes(s.id) && styles.chipTextSelected]}>{s.name}</Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               </View>
//             )}

//             <View style={styles.field}>
//               <Text style={typography.label}>To teacher</Text>
//               <View style={styles.chipRow}>
//                 {therapistOptions
//                   .filter((t) => t.id !== fromTherapistId)
//                   .map((t) => (
//                     <TouchableOpacity
//                       key={t.id}
//                       style={[styles.chip, toTherapistId === t.id && styles.chipSelected]}
//                       onPress={() => setToTherapistId(t.id)}
//                     >
//                       <Text style={[styles.chipText, toTherapistId === t.id && styles.chipTextSelected]}>{t.name}</Text>
//                     </TouchableOpacity>
//                   ))}
//               </View>
//             </View>

//             {capacityInfo && (
//               <View style={[styles.capacityBox, overCapacity && styles.capacityBoxWarn]}>
//                 <Feather name={overCapacity ? 'alert-triangle' : 'users'} size={14} color={overCapacity ? '#B45309' : colors.mutedText} />
//                 <Text style={[styles.capacityText, overCapacity && { color: '#B45309' }]}>
//                   {toTherapistId ? therapistOptions.find((t) => t.id === toTherapistId)?.name : ''} capacity: {capacityInfo.used}/{capacityInfo.slots} used, {capacityInfo.remaining} slot(s) free
//                   {overCapacity ? ' — selected exceeds available slots' : ''}.
//                 </Text>
//               </View>
//             )}
//           </ScrollView>

//           <View style={styles.footer}>
//             <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
//               <Text style={styles.cancelBtnText}>Cancel</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
//               <Text style={styles.saveBtnText}>Reassign ({selected.length})</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
//   sheet: { backgroundColor: colors.bgCard, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '92%' },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
//   body: { padding: spacing.lg, gap: spacing.lg },
//   field: { gap: spacing.xs },
//   chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
//   chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.bgApp },
//   chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
//   chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
//   chipTextSelected: { color: colors.navyText },
//   capacityBox: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start', backgroundColor: colors.bgApp, borderRadius: radius.md, padding: spacing.md },
//   capacityBoxWarn: { backgroundColor: colors.statusPendingBg },
//   capacityText: { fontSize: 12, color: colors.mutedText, flex: 1 },
//   footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
//   cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
//   cancelBtnText: { fontWeight: '600', color: colors.navyText },
//   saveBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
//   saveBtnText: { fontWeight: '700', color: colors.navyText },
// });
