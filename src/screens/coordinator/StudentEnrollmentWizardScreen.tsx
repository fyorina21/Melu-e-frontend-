// import React, { useState } from 'react';
// import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
// import { Feather } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import * as DocumentPicker from 'expo-document-picker';
// import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// import { colors, radius, spacing } from '../../theme/colors';
// import { typography } from '../../theme/typography';
// import CoordinatorNav from './components/CoordinatorNav';
// import ProgramDirectorNav from '../programdirector/components/ProgramDirectorNav';
// import { PD_ROUTE_BY_TAB } from '../programdirector/components/pdNavRoutes';
// import { useAuth, ROLES } from '../../context/AuthContext';
// import { createStudentEnrollment } from '../../api/coordinatorApi';
// import type { CoordinatorStackParamList, ProgramDirectorStackParamList } from '../../types';

// const STEPS = ['Student Info', 'Parent Info', 'Medical Info', 'Documents', 'Assign Therapist', 'Review'];

// const PROGRAMS = ['ABA', 'Speech Therapy', 'Occupational Therapy'];
// const GENDERS = ['Female', 'Male', 'Other'];
// const THERAPISTS = ['Teacher A', 'Teacher B', 'Teacher C'];
// const DOC_TYPES = ['Birth Certificate', 'Medical Reports', 'Assessment Reports', 'Referral Letter', 'Insurance Documents'];
// const EXISTING_STUDENTS = ['Emily Johnson', 'Michael Brown', 'Sophia Davis', 'Liam Wilson', 'Olivia Martinez'];
// const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
// const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// const DOB_RE = /^\d{2}\/\d{2}\/\d{4}$/;

// interface UploadedFile {
//   id: string;
//   docType: string;
//   name: string;
// }

// interface WizardState {
//   name: string;
//   dob: string;
//   gender: string;
//   program: string;
//   parentName: string;
//   parentPhone: string;
//   parentEmail: string;
//   diagnosis: string;
//   medicalNotes: string;
//   therapist: string;
//   documents: string[];
//   files: UploadedFile[];
// }

// const INITIAL_STATE: WizardState = {
//   name: '',
//   dob: '',
//   gender: 'Female',
//   program: PROGRAMS[0],
//   parentName: '',
//   parentPhone: '',
//   parentEmail: '',
//   diagnosis: '',
//   medicalNotes: '',
//   therapist: THERAPISTS[0],
//   documents: [],
//   files: [],
// };

// type Props = NativeStackScreenProps<CoordinatorStackParamList | ProgramDirectorStackParamList, 'StudentEnrollmentWizard'>;

// export default function StudentEnrollmentWizardScreen({ navigation }: Props) {
//   const { session } = useAuth();
//   const isProgramDirector = session?.role === ROLES.PROGRAM_DIRECTOR;
//   const [step, setStep] = useState(0);
//   const [form, setForm] = useState<WizardState>(INITIAL_STATE);

//   const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

//   const next = () => {
//     if (step === 0) {
//       if (!form.name.trim()) { Alert.alert('Student name is required'); return; }
//       if (form.dob.trim() && !DOB_RE.test(form.dob.trim())) {
//         Alert.alert('Invalid date', 'Enter the date of birth as MM/DD/YYYY, or leave it blank.');
//         return;
//       }
//     }
//     if (step === 1) {
//       if (!form.parentName.trim()) { Alert.alert('Parent name is required'); return; }
//       if (!form.parentPhone.trim()) { Alert.alert('Parent phone is required'); return; }
//       if (!PHONE_RE.test(form.parentPhone.trim())) {
//         Alert.alert('Invalid phone', 'Enter a valid phone number (7-20 digits, digits/spaces/()/+-).');
//         return;
//       }
//       if (form.parentEmail.trim() && !EMAIL_RE.test(form.parentEmail.trim())) {
//         Alert.alert('Invalid email', 'Enter a valid parent email address or leave it blank.');
//         return;
//       }
//     }
//     if (step < STEPS.length - 1) setStep(step + 1);
//   };

//   const saveProgress = () => {
//     Alert.alert('Progress saved', `Draft enrollment for "${form.name || 'new student'}" stored locally on this device.`);
//   };

//   const submitEnrollment = async () => {
//     try {
//       await createStudentEnrollment(form as unknown as Record<string, unknown>);
//     } catch (err) {}
//     Alert.alert('Enrollment submitted', `${form.name} has been enrolled in ${form.program}.`, [
//       { text: 'Done', onPress: () => navigation?.goBack?.() },
//     ]);
//   };

//   const handleSubmit = () => {
//     const normalized = form.name.trim().toLowerCase();
//     const dup = EXISTING_STUDENTS.find((n) => n.toLowerCase() === normalized);
//     if (dup) {
//       Alert.alert(
//         'Possible duplicate',
//         `${form.name.trim()} already appears in the student register. Enroll anyway?`,
//         [
//           { text: 'Cancel', style: 'cancel' },
//           { text: 'Enroll anyway', onPress: submitEnrollment },
//         ]
//       );
//       return;
//     }
//     submitEnrollment();
//   };

//   const toggleDoc = (doc: string) =>
//     set('documents', form.documents.includes(doc) ? form.documents.filter((d) => d !== doc) : [...form.documents, doc]);

//   const addFile = (file: UploadedFile) => set('files', [...form.files, file]);
//   const removeFile = (id: string) => set('files', form.files.filter((f) => f.id !== id));

//   const handleUploadImage = async (docType: string) => {
//     const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!perm.granted) {
//       Alert.alert('Permission needed', 'Allow photo library access to attach images.');
//       return;
//     }
//     const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
//     if (!result.canceled) {
//       const asset = result.assets[0];
//       addFile({ id: `local-${Date.now()}`, docType, name: asset.fileName || `${docType} (image)` });
//     }
//   };

//   const handleUploadDocument = async (docType: string) => {
//     const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', '*/*'], copyToCacheDirectory: true });
//     if (result.canceled) return;
//     const asset = result.assets[0];
//     addFile({ id: `local-${Date.now()}`, docType, name: asset.name || `${docType} (file)` });
//   };

//   const docFiles = (docType: string) => form.files.filter((f) => f.docType === docType);

//   const Chips = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
//     <View style={styles.chipRow}>
//       {options.map((opt) => (
//         <TouchableOpacity key={opt} style={[styles.chip, value === opt && styles.chipSelected]} onPress={() => onChange(opt)}>
//           <Text style={[styles.chipText, value === opt && styles.chipTextSelected]}>{opt}</Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );

//   const Field = ({ label, value, onChangeText, keyboardType, multiline }: { label: string; value: string; onChangeText: (t: string) => void; keyboardType?: 'phone-pad' | 'email-address'; multiline?: boolean }) => (
//     <View style={styles.field}>
//       <Text style={typography.label}>{label}</Text>
//       <TextInput
//         style={[styles.textInput, multiline && styles.textArea]}
//         value={value}
//         onChangeText={onChangeText}
//         keyboardType={keyboardType}
//         multiline={multiline}
//       />
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safe}>
//       {isProgramDirector ? (
//         <ProgramDirectorNav activeTab="Enrollment" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t] as never)} />
//       ) : (
//         <CoordinatorNav activeTab="Enrollment" onTabPress={(t) => t !== 'Enrollment' && navigation?.navigate?.(navRouteForTab(t) as never)} />
//       )}

//       <View style={styles.header}>
//         <Text style={typography.h1}>Enrollment Wizard</Text>
//         <Text style={typography.caption}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</Text>
//       </View>

//       <View style={styles.progressRow}>
//         {STEPS.map((s, i) => (
//           <View key={s} style={styles.stepWrap}>
//             <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
//               {i < step ? <Feather name="check" size={12} color={colors.navyText} /> : <Text style={styles.stepNum}>{i + 1}</Text>}
//             </View>
//             <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
//           </View>
//         ))}
//       </View>

//       <ScrollView contentContainerStyle={styles.content}>
//         {step === 0 && (
//           <View style={styles.card}>
//             <Text style={typography.h3}>Student Information</Text>
//             <Field label="Full Name" value={form.name} onChangeText={(t) => set('name', t)} />
//             <Field label="Date of Birth" value={form.dob} onChangeText={(t) => set('dob', t)} />
//             <View style={styles.field}><Text style={typography.label}>Gender</Text><Chips options={GENDERS} value={form.gender} onChange={(v) => set('gender', v)} /></View>
//             <View style={styles.field}><Text style={typography.label}>Program</Text><Chips options={PROGRAMS} value={form.program} onChange={(v) => set('program', v)} /></View>
//           </View>
//         )}

//         {step === 1 && (
//           <View style={styles.card}>
//             <Text style={typography.h3}>Parent Information</Text>
//             <Field label="Parent / Guardian Name" value={form.parentName} onChangeText={(t) => set('parentName', t)} />
//             <Field label="Phone" value={form.parentPhone} onChangeText={(t) => set('parentPhone', t)} keyboardType="phone-pad" />
//             <Field label="Email" value={form.parentEmail} onChangeText={(t) => set('parentEmail', t)} keyboardType="email-address" />
//           </View>
//         )}

//         {step === 2 && (
//           <View style={styles.card}>
//             <Text style={typography.h3}>Medical Information</Text>
//             <Field label="Diagnosis" value={form.diagnosis} onChangeText={(t) => set('diagnosis', t)} />
//             <Field label="Medical Notes" value={form.medicalNotes} onChangeText={(t) => set('medicalNotes', t)} multiline />
//           </View>
//         )}

//         {step === 3 && (
//           <View style={styles.card}>
//             <Text style={typography.h3}>Documents</Text>
//             <Text style={typography.caption}>Check the documents you have, then upload the actual files (image or PDF).</Text>
//             {DOC_TYPES.map((doc) => (
//               <View key={doc} style={styles.docBlock}>
//                 <TouchableOpacity style={styles.docRow} onPress={() => toggleDoc(doc)}>
//                   <View style={[styles.checkbox, form.documents.includes(doc) && styles.checkboxChecked]}>
//                     {form.documents.includes(doc) && <Feather name="check" size={12} color={colors.navyText} />}
//                   </View>
//                   <Text style={typography.body}>{doc}</Text>
//                 </TouchableOpacity>
//                 <View style={styles.uploadActions}>
//                   <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadImage(doc)}>
//                     <Feather name="image" size={13} color={colors.navyText} />
//                     <Text style={styles.uploadBtnText}>Photo</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadDocument(doc)}>
//                     <Feather name="file-text" size={13} color={colors.navyText} />
//                     <Text style={styles.uploadBtnText}>PDF</Text>
//                   </TouchableOpacity>
//                 </View>
//                 {docFiles(doc).map((f) => (
//                   <View key={f.id} style={styles.uploadedRow}>
//                     <Feather name="paperclip" size={13} color={colors.statusCompletedText} />
//                     <Text style={[typography.body, { flex: 1 }]} numberOfLines={1}>{f.name}</Text>
//                     <TouchableOpacity onPress={() => removeFile(f.id)}>
//                       <Feather name="x" size={14} color={colors.statusRevisionText} />
//                     </TouchableOpacity>
//                   </View>
//                 ))}
//               </View>
//             ))}
//           </View>
//         )}

//         {step === 4 && (
//           <View style={styles.card}>
//             <Text style={typography.h3}>Assign Therapist</Text>
//             <View style={styles.field}><Text style={typography.label}>Therapist</Text><Chips options={THERAPISTS} value={form.therapist} onChange={(v) => set('therapist', v)} /></View>
//           </View>
//         )}

//         {step === 5 && (
//           <View style={styles.card}>
//             <Text style={typography.h3}>Review & Submit</Text>
//             {[
//               ['Student', `${form.name} · ${form.gender} · ${form.dob || 'n/a'}`],
//               ['Program', form.program],
//               ['Parent', `${form.parentName} · ${form.parentPhone} · ${form.parentEmail}`],
//               ['Diagnosis', form.diagnosis || 'n/a'],
//               ['Therapist', form.therapist],
//               ['Documents', form.documents.length ? form.documents.join(', ') : 'None'],
//               ['Uploaded Files', form.files.length ? `${form.files.length} file(s)` : 'None'],
//             ].map(([label, value]) => (
//               <View key={label} style={styles.reviewRow}>
//                 <Text style={typography.label}>{label}</Text>
//                 <Text style={typography.body}>{value}</Text>
//               </View>
//             ))}
//           </View>
//         )}

//         <View style={styles.actionsRow}>
//           {step > 0 && (
//             <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
//               <Feather name="arrow-left" size={16} color={colors.navyText} />
//               <Text style={styles.backBtnText}>Back</Text>
//             </TouchableOpacity>
//           )}
//           <TouchableOpacity style={styles.secondaryBtn} onPress={saveProgress}>
//             <Text style={styles.secondaryBtnText}>Save Progress</Text>
//           </TouchableOpacity>
//           {step < STEPS.length - 1 ? (
//             <TouchableOpacity style={styles.nextBtn} onPress={next}>
//               <Text style={styles.nextBtnText}>Next</Text>
//               <Feather name="arrow-right" size={16} color={colors.navyText} />
//             </TouchableOpacity>
//           ) : (
//             <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
//               <Feather name="check" size={16} color={colors.navyText} />
//               <Text style={styles.nextBtnText}>Finish Enrollment</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
//   return ({
//     Dashboard: 'CoordinatorDashboard',
//     'Live Sessions': 'LiveSessionMonitoring',
//     Review: 'SessionSummaryReview',
//     Progress: 'CoordinatorStudentProgress',
//     Schedule: 'CoordinatorSchedule',
//     Parents: 'CoordinatorParentCommunication',
//     Enrollment: 'StudentEnrollment',
//     Workload: 'WorkloadDashboard',
//     Notifications: 'Notifications',
//     Rooms: 'RoomResourceScheduling',
//   } as Record<string, keyof CoordinatorStackParamList>)[tab];
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: colors.bgApp },
//   header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.xs },
//   progressRow: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
//   stepWrap: { flex: 1, alignItems: 'center', gap: spacing.xs },
//   stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bgApp, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
//   stepDotActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
//   stepNum: { fontSize: 11, fontWeight: '700', color: colors.mutedText },
//   stepLabel: { fontSize: 9, color: colors.mutedText, textAlign: 'center' },
//   stepLabelActive: { color: colors.navyText, fontWeight: '700' },
//   content: { padding: spacing.lg, gap: spacing.lg },
//   card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
//   field: { gap: spacing.xs },
//   textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText, backgroundColor: colors.bgApp },
//   textArea: { minHeight: 80, textAlignVertical: 'top' },
//   chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
//   chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.bgApp },
//   chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
//   chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
//   chipTextSelected: { color: colors.navyText },
//   docRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
//   docBlock: { borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs },
//   uploadActions: { flexDirection: 'row', gap: spacing.sm, paddingLeft: 32 },
//   uploadBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
//   uploadBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
//   uploadedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: 32, paddingVertical: 2 },
//   checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: colors.border, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgApp },
//   checkboxChecked: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
//   reviewRow: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs },
//   actionsRow: { flexDirection: 'row', gap: spacing.sm },
//   backBtn: { flexDirection: 'row', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md, alignItems: 'center' },
//   backBtnText: { fontWeight: '600', color: colors.navyText },
//   secondaryBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
//   secondaryBtnText: { fontWeight: '600', fontSize: 11, color: colors.navyText, textAlign: 'center' },
//   nextBtn: { flex: 1, flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
//   submitBtn: { flex: 2, flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
//   nextBtnText: { fontWeight: '700', color: colors.navyText },
// });
