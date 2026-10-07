import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppNavbar from '../../components/AppNavbar';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import {
  savePreferenceAssessment,
  getPreferenceAssessment,
  getTeacherStudentProfile,
} from '../../api/teacherExtrasApi';
import { openPrintWindow } from '../../utils/webExport';
import { useToast } from '../../context/ToastContext';
import type { SessionStackParamList } from '../../types';
import { radius, spacing } from '../../theme/colors';

import { type StimulusItem, INITIAL_ITEMS, formatMMSS } from './preference/types';
import {
  PreferenceAssessmentHeader,
  type SessionTab,
} from './preference/components/PreferenceAssessmentHeader';
import { StimulusItemCard } from './preference/components/StimulusItemCard';
import { AddCustomItemModal } from './preference/components/AddCustomItemModal';

type Props = NativeStackScreenProps<SessionStackParamList, 'PreferenceAssessment'>;

interface StudentProfile {
  fullName?: string;
  age?: number | string;
  [key: string]: unknown;
}

export default function PreferenceAssessmentScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [activeTab, setActiveTab] = useState<SessionTab>('Sensory Time');
  const [items, setItems] = useState<StimulusItem[]>(INITIAL_ITEMS);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Visual');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const profileRes = await getTeacherStudentProfile(studentId).catch(() => null);
        if (isMounted && profileRes?.data) setProfile(profileRes.data);
        const res = await getPreferenceAssessment(studentId);
        const savedData = res?.data?.data;
        if (isMounted && savedData?.items && savedData.items.length > 0) {
          setItems(savedData.items);
        }
        if (isMounted && savedData?.sessionTab) {
          setActiveTab(savedData.sessionTab as SessionTab);
        }
      } catch {
        // Handled silently
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  // Interval re-render isolation: only ticks if at least one item is running
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prevItems) => {
        if (!prevItems.some((item) => item.isRunning)) {
          return prevItems;
        }
        return prevItems.map((item) =>
          item.isRunning
            ? {
                ...item,
                timerSeconds: item.timerSeconds + 1,
                durationSeconds: item.durationSeconds + 1,
              }
            : item,
        );
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTimer = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isRunning: !i.isRunning } : i)));
  }, []);

  const resetTimer = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, timerSeconds: 0, isRunning: false } : i)),
    );
  }, []);

  const updateFrequency = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, frequency: Math.max(0, i.frequency + delta) } : i)),
    );
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));
  }, []);

  const updateEngaged = useCallback((id: string, val: 'Engaged' | 'Did Not Engage') => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, engaged: val } : i)));
  }, []);

  const updateApproached = useCallback((id: string, val: 'Approached' | 'Did Not Approach') => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, approached: val } : i)));
  }, []);

  const handleExport = useCallback(() => {
    const title = 'Preference Assessment Report';
    const formattedHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1e293b; line-height: 1.6; }
            h1 { font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
            .meta { margin-bottom: 30px; font-size: 14px; color: #64748b; }
            .section-title { font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; color: #0f172a; border-left: 4px solid #0284c7; padding-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Preference Assessment Report</h1>
          <div class="meta">
            <strong>Student:</strong> ${profile?.fullName || studentId} &middot; 
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
                <th>Engagement</th>
                <th>Approach</th>
                <th>Observations / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (i) => `
                <tr>
                  <td><strong>${i.name}</strong></td>
                  <td>${i.category}</td>
                  <td>${i.frequency} times</td>
                  <td>${formatMMSS(i.durationSeconds)}</td>
                  <td>${i.engaged || '—'}</td>
                  <td>${i.approached || '—'}</td>
                  <td>${i.notes || '—'}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    openPrintWindow(formattedHtml, title);
  }, [profile?.fullName, studentId, activeTab, items]);

  const handleOpenModal = useCallback(() => {
    setNewItemName('');
    setNewItemCategory('Visual');
    setIsDropdownOpen(false);
    setIsModalVisible(true);
  }, []);

  const handleConfirmAddItem = useCallback(() => {
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
  }, [newItemName, newItemCategory]);

  const handleSave = useCallback(
    async (status: 'draft' | 'submitted') => {
      try {
        await savePreferenceAssessment(studentId, { items, sessionTab: activeTab, status });
        showToast(
          status === 'submitted' ? 'Assessment submitted successfully' : 'Draft saved',
          'success',
        );
        if (status === 'submitted') {
          navigation?.navigate?.('AssessmentSummaryReport' as any, { studentId } as any);
        }
      } catch {
        showToast('Failed to save assessment data', 'error');
      }
    },
    [studentId, items, activeTab, showToast, navigation],
  );

  const containerStyle = useMemo(
    () => [styles.innerContainer, isTablet && styles.tabletContainer],
    [isTablet],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Assessments"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
      />

      <View style={containerStyle}>
        <PreferenceAssessmentHeader
          onBack={() => navigation?.goBack?.()}
          studentName={profile?.fullName || 'Student'}
          studentAge={profile?.age || '?'}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <ScrollView contentContainerStyle={styles.content}>
          {items.map((item) => (
            <StimulusItemCard
              key={item.id}
              item={item}
              onToggleTimer={toggleTimer}
              onResetTimer={resetTimer}
              onUpdateFrequency={updateFrequency}
              onUpdateEngaged={updateEngaged}
              onUpdateApproached={updateApproached}
              onUpdateNotes={updateNotes}
            />
          ))}

          <TouchableOpacity
            style={styles.addCustomBtn}
            onPress={handleOpenModal}
            accessibilityRole="button"
            accessibilityLabel="Add custom stimulus item"
          >
            <Feather name="plus" size={16} color="#0284C7" />
            <Text style={styles.addCustomText}>Add Custom Item</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Persistent bottom action bar */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.draftBtn}
            onPress={() => handleSave('draft')}
            accessibilityRole="button"
            accessibilityLabel="Save draft"
          >
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => handleSave('submitted')}
            accessibilityRole="button"
            accessibilityLabel="Submit assessment"
          >
            <Text style={styles.submitBtnText}>Submit Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.printBtn}
            onPress={handleExport}
            accessibilityRole="button"
            accessibilityLabel="Print or export report"
          >
            <Feather name="printer" size={15} color="#475569" style={styles.exportIcon} />
            <Text style={styles.printBtnText}>Export Report</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AddCustomItemModal
        visible={isModalVisible}
        name={newItemName}
        category={newItemCategory}
        isDropdownOpen={isDropdownOpen}
        onNameChange={setNewItemName}
        onCategoryChange={setNewItemCategory}
        onToggleDropdown={() => setIsDropdownOpen((prev) => !prev)}
        onConfirm={handleConfirmAddItem}
        onClose={() => setIsModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
  },
  tabletContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
    borderRadius: radius.md,
  },
  addCustomText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284C7',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  draftBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  draftBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  submitBtn: {
    flex: 1.5,
    paddingVertical: 12,
    backgroundColor: '#0284C7',
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    backgroundColor: '#F8FAFC',
  },
  exportIcon: {
    marginRight: 6,
  },
  printBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
});
