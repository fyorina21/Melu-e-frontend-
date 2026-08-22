import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppNavbar from '../../components/AppNavbar';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { savePreferenceAssessment } from '../../api/teacherExtrasApi';
import { openPrintWindow } from '../../utils/webExport';
import type { SessionStackParamList } from '../../types';

interface StimulusItem {
  id: string;
  name: string;
  category: string;
  timerSeconds: number;
  isRunning: boolean;
  frequency: number;
  durationSeconds: number;
  notes: string;
}

const CATEGORIES = ['Visual', 'Auditory', 'Tactile', 'Toys', 'Movement'];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Visual: { bg: '#F3E8FF', text: '#9333EA' },
  Auditory: { bg: '#DCFCE7', text: '#16A34A' },
  Tactile: { bg: '#FFEDD5', text: '#EA580C' },
  Toys: { bg: '#FCE7F3', text: '#DB2777' },
  Movement: { bg: '#DBEAFE', text: '#2563EB' },
};

const INITIAL_ITEMS: StimulusItem[] = [
  { id: '1', name: 'Light-up toys', category: 'Visual', timerSeconds: 0, isRunning: false, frequency: 0, durationSeconds: 0, notes: '' },
  { id: '2', name: 'Bubbles', category: 'Visual', timerSeconds: 0, isRunning: false, frequency: 0, durationSeconds: 0, notes: '' },
  { id: '3', name: 'Mirror', category: 'Visual', timerSeconds: 0, isRunning: false, frequency: 0, durationSeconds: 0, notes: '' },
  { id: '4', name: 'Kaleidoscope', category: 'Visual', timerSeconds: 0, isRunning: false, frequency: 0, durationSeconds: 0, notes: '' },
];

type Props = NativeStackScreenProps<SessionStackParamList, 'PreferenceAssessment'>;

export default function PreferenceAssessmentScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const [activeTab, setActiveTab] = useState<'Sensory Time' | 'Circle Time' | 'Play Time'>('Sensory Time');
  const [items, setItems] = useState<StimulusItem[]>(INITIAL_ITEMS);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Visual');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.isRunning
            ? {
                ...item,
                timerSeconds: item.timerSeconds + 1,
                durationSeconds: item.durationSeconds + 1,
              }
            : item
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatMMSS = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isRunning: !i.isRunning } : i)));
  };

  const resetTimer = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, timerSeconds: 0, isRunning: false } : i)));
  };

  const updateFrequency = (id: string, delta: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, frequency: Math.max(0, i.frequency + delta) } : i)));
  };

  const updateNotes = (id: string, notes: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));
  };

  const handleExport = () => {
    const title = 'Preference Assessment Report';
    const formattedHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1e293b; line-height: 1.6; }
            h1 { font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
            .meta { margin-bottom: 30px; font-size: 14px; color: #64748b; }
            .section-title { font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; color: #0f172a; border-left: 4px solid #facc15; padding-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Preference Assessment Report</h1>
          <div class="meta">
            <strong>Student ID:</strong> ${studentId} &middot; 
            <strong>Assessment Window:</strong> ${activeTab} &middot; 
            <strong>Date:</strong> ${new Date().toLocaleDateString()}
          </div>

          <div class="section-title">Tested Stimulus Items</div>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Frequency of Choice</th>
                <th>Total Interaction Duration</th>
                <th>Observations / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((i) => `
                <tr>
                  <td><strong>${i.name}</strong></td>
                  <td>${i.category}</td>
                  <td>${i.frequency} times</td>
                  <td>${formatMMSS(i.durationSeconds)}</td>
                  <td>${i.notes || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    openPrintWindow(formattedHtml, title);
  };

  const handleOpenModal = () => {
    setNewItemName('');
    setNewItemCategory('Visual');
    setIsDropdownOpen(false);
    setIsModalVisible(true);
  };

  const handleConfirmAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Required', 'Please enter an item name.');
      return;
    }

    const newItem: StimulusItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: newItemCategory,
      timerSeconds: 0,
      isRunning: false,
      frequency: 0,
      durationSeconds: 0,
      notes: '',
    };

    setItems((prev) => [...prev, newItem]);
    setIsModalVisible(false);
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    try {
      await savePreferenceAssessment(studentId, { items, sessionTab: activeTab, status });
      Alert.alert(status === 'submitted' ? 'Submitted' : 'Saved', 'Assessment updated.');
    } catch {
      Alert.alert('Error', 'Failed to save assessment data.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>Preference Assessment</Text>
          <Text style={styles.headerSubtitle}>ABA Therapy Management</Text>
        </View>
        <View style={styles.studentBadge}>
          <Text style={styles.studentName}>Student A</Text>
          <Text style={styles.studentAge}>Age 6</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sessionTabRow}>
          {(['Sensory Time', 'Circle Time', 'Play Time'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.sessionTabBtn, activeTab === tab && styles.sessionTabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.sessionTabText, activeTab === tab && styles.sessionTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {items.map((item) => {
          const categoryStyle = CATEGORY_COLORS[item.category] || { bg: '#F1F5F9', text: '#475569' };
          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfoCol}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={[styles.categoryPill, { backgroundColor: categoryStyle.bg }]}>
                  <Text style={[styles.categoryText, { color: categoryStyle.text }]}>{item.category}</Text>
                </View>
              </View>

              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>TIMER</Text>
                <Text style={styles.timerVal}>{formatMMSS(item.timerSeconds)}</Text>
                <View style={styles.btnGroup}>
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.startBtn, item.isRunning && styles.pauseBtn]}
                    onPress={() => toggleTimer(item.id)}
                  >
                    <Text style={styles.startBtnText}>{item.isRunning ? 'Pause' : 'Start'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtn, styles.resetBtn]} onPress={() => resetTimer(item.id)}>
                    <Text style={styles.resetBtnText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>FREQUENCY</Text>
                <Text style={styles.freqVal}>{item.frequency}</Text>
                <View style={styles.btnGroup}>
                  <TouchableOpacity style={[styles.stepBtn, styles.stepBtnMinus]} onPress={() => updateFrequency(item.id, -1)}>
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.stepBtn, styles.stepBtnPlus]} onPress={() => updateFrequency(item.id, 1)}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.metricColCompact}>
                <Text style={styles.metricLabel}>DURATION</Text>
                <Text style={styles.displayVal}>{formatMMSS(item.durationSeconds)}</Text>
              </View>

              <View style={styles.metricColCompact}>
                <Text style={styles.metricLabel}>COUNT</Text>
                <Text style={styles.displayVal}>{item.frequency}</Text>
              </View>

              <View style={styles.notesCol}>
                <Text style={styles.metricLabel}>NOTES</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Optional notes..."
                  placeholderTextColor="#94A3B8"
                  value={item.notes}
                  onChangeText={(txt) => updateNotes(item.id, txt)}
                />
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.addCustomBtn} onPress={handleOpenModal}>
          <Feather name="plus" size={16} color="#64748B" />
          <Text style={styles.addCustomText}>Add Custom Item</Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.draftBtn} onPress={() => handleSave('draft')}>
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={() => handleSave('submitted')}>
            <Text style={styles.submitBtnText}>Submit Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.printBtn} onPress={handleExport}>
            <Text style={styles.printBtnText}>Print / Export</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Popup */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Custom Item</Text>

            {/* Input: Item Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Item Name</Text>
              <TextInput
                style={styles.textInputActive}
                placeholder="Enter item name..."
                placeholderTextColor="#94A3B8"
                value={newItemName}
                onChangeText={setNewItemName}
              />
            </View>

            {/* Dropdown: Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, isDropdownOpen && styles.dropdownTriggerActive]}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Text style={styles.dropdownValue}>{newItemCategory}</Text>
                <Feather name="chevron-down" size={16} color="#0F172A" />
              </TouchableOpacity>

              {/* Options Overlay */}
              {isDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.dropdownItem,
                        cat === newItemCategory && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setNewItemCategory(cat);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          cat === newItemCategory && styles.dropdownItemTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Buttons Row */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addModalBtn}
                onPress={handleConfirmAddItem}
              >
                <Text style={styles.addModalText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  studentBadge: { backgroundColor: '#FEF9C3', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  studentName: { fontSize: 13, fontWeight: '700', color: '#854D0E' },
  studentAge: { fontSize: 11, color: '#A16207' },
  content: { padding: 24, gap: 12 },
  sessionTabRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  sessionTabBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  sessionTabBtnActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  sessionTabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  sessionTabTextActive: { color: '#FFFFFF' },
  itemCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  itemInfoCol: { width: 140, gap: 6 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  categoryPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  categoryText: { fontSize: 11, fontWeight: '700' },
  metricCol: { alignItems: 'center', gap: 4, width: 90 },
  metricColCompact: { alignItems: 'center', gap: 4, width: 60 },
  metricLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  timerVal: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  freqVal: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  displayVal: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 4 },
  btnGroup: { flexDirection: 'row', gap: 4 },
  smallBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  startBtn: { backgroundColor: '#38BDF8' },
  pauseBtn: { backgroundColor: '#F59E0B' },
  startBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  resetBtn: { backgroundColor: '#F1F5F9' },
  resetBtnText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  stepBtn: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  stepBtnMinus: { backgroundColor: '#F1F5F9' },
  stepBtnPlus: { backgroundColor: '#FACC15' },
  stepBtnText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  notesCol: { flex: 1, minWidth: 200, gap: 4 },
  notesInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, color: '#0F172A', backgroundColor: '#FFFFFF' },
  addCustomBtn: { borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  addCustomText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  footerRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  draftBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  draftBtnText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  submitBtn: { backgroundColor: '#FACC15', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  printBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#38BDF8', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  printBtnText: { fontSize: 14, fontWeight: '600', color: '#0284C7' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldGroup: {
    gap: 6,
    position: 'relative',
    zIndex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  textInputActive: {
    borderWidth: 2,
    borderColor: '#38BDF8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownTriggerActive: {
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  dropdownValue: {
    fontSize: 14,
    color: '#0F172A',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 999,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: '#93C5FD',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#334155',
  },
  dropdownItemTextActive: {
    color: '#0F172A',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelModalBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  addModalBtn: {
    flex: 1,
    backgroundColor: '#FACC15',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addModalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});