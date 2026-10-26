import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
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

export interface TrialRecord {
  id: string;
  durationSeconds: number;
  timestamp: string;
}

export interface StimulusItem {
  id: string;
  name: string;
  category: string;
  approached?: 'Approached' | 'Did Not Approach';
  engaged?: 'Yes' | 'No';
  frequency: number;
  durationSeconds: number;
  timerSeconds: number;
  isRunning: boolean;
  notes: string;
  trials: TrialRecord[];
}

export const CANONICAL_PREFERENCE_ITEMS: Omit<
  StimulusItem,
  'timerSeconds' | 'isRunning' | 'frequency' | 'durationSeconds' | 'notes' | 'trials'
>[] = [
  { id: 'pref-1', name: 'Tube car', category: 'Visual' },
  { id: 'pref-2', name: 'Frog toy', category: 'Toys' },
  { id: 'pref-3', name: 'Calming tube', category: 'Tactile' },
  { id: 'pref-4', name: 'Red plastic toy', category: 'Visual' },
  { id: 'pref-5', name: 'Stress ball', category: 'Tactile' },
  { id: 'pref-6', name: 'Flexy red', category: 'Tactile' },
  { id: 'pref-7', name: 'Piano', category: 'Auditory' },
  { id: 'pref-8', name: 'Calming glitter', category: 'Visual' },
  { id: 'pref-9', name: 'Body part puzzle', category: 'Cognitive' },
  { id: 'pref-10', name: 'Letter mat', category: 'Cognitive' },
  { id: 'pref-11', name: 'Gross motor ladder', category: 'Movement' },
  { id: 'pref-12', name: 'See saw', category: 'Movement' },
  { id: 'pref-13', name: 'Magnetic Apple', category: 'Toys' },
  { id: 'pref-14', name: 'Mobile art', category: 'Visual' },
  { id: 'pref-15', name: 'Watch', category: 'Toys' },
  { id: 'pref-16', name: 'Large & small toys', category: 'Toys' },
  { id: 'pref-17', name: 'Harmonica', category: 'Auditory' },
  { id: 'pref-18', name: 'Stretch spring', category: 'Tactile' },
  { id: 'pref-19', name: 'Bicycle', category: 'Movement' },
  { id: 'pref-20', name: 'Number book', category: 'Cognitive' },
  { id: 'pref-21', name: 'Spinner', category: 'Visual' },
  { id: 'pref-22', name: 'Crayons', category: 'Toys' },
  { id: 'pref-23', name: 'Pouring liquids', category: 'Tactile' },
  { id: 'pref-24', name: 'Shadow', category: 'Visual' },
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Visual: { bg: '#F3E8FF', text: '#9333EA' },
  Auditory: { bg: '#DCFCE7', text: '#16A34A' },
  Tactile: { bg: '#FFEDD5', text: '#EA580C' },
  Toys: { bg: '#FCE7F3', text: '#DB2777' },
  Movement: { bg: '#DBEAFE', text: '#2563EB' },
  Cognitive: { bg: '#E0E7FF', text: '#4338CA' },
};

export function createInitialCanonicalItems(): StimulusItem[] {
  return CANONICAL_PREFERENCE_ITEMS.map((item) => ({
    ...item,
    timerSeconds: 0,
    isRunning: false,
    frequency: 0,
    durationSeconds: 0,
    notes: '',
    trials: [],
  }));
}

export function formatMMSS(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculatePreferenceTiers(items: StimulusItem[]) {
  const assessed = items.filter((i) => i.approached !== undefined);
  const low: StimulusItem[] = [];
  const engagedItems: StimulusItem[] = [];

  assessed.forEach((item) => {
    if (
      item.approached === 'Did Not Approach' ||
      item.engaged === 'No' ||
      (item.durationSeconds === 0 && item.frequency === 0)
    ) {
      low.push(item);
    } else {
      engagedItems.push(item);
    }
  });

  // Sort engaged items by cumulative duration descending, then frequency descending
  engagedItems.sort((a, b) => {
    if (b.durationSeconds !== a.durationSeconds) return b.durationSeconds - a.durationSeconds;
    return b.frequency - a.frequency;
  });

  // Split engaged items into Highest and Moderately preferred
  // Items with substantial engagement time and frequency make Highest
  const midPoint = Math.max(1, Math.ceil(engagedItems.length / 2));
  const highest = engagedItems.slice(0, midPoint);
  const moderate = engagedItems.slice(midPoint);

  return { highest, moderate, low, totalAssessed: assessed.length };
}

type Props = NativeStackScreenProps<SessionStackParamList, 'PreferenceAssessment'>;

export default function PreferenceAssessmentScreen({ navigation, route }: Props) {
  const urlSid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('studentId')
      : null;
  const localSid =
    typeof localStorage !== 'undefined' ? localStorage.getItem('last_assessment_student_id') : null;
  const rawId = route?.params?.studentId || urlSid || localSid || 'student-a';
  const studentId = rawId === 'stu-1' ? 'student-a' : rawId;

  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<StimulusItem[]>(() => createInitialCanonicalItems());
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');

  useEffect(() => {
    if (typeof localStorage !== 'undefined' && studentId) {
      try {
        localStorage.setItem('last_assessment_student_id', studentId);
      } catch {}
    }
  }, [studentId]);

  // Load canonical items & saved observations
  const loadData = useCallback(async () => {
    try {
      const profileRes = await getTeacherStudentProfile(studentId).catch(() => null);
      if (profileRes?.data) setProfile(profileRes.data);

      const res = await getPreferenceAssessment(studentId).catch(() => null);
      const savedData = res?.data?.data || res?.data;

      let savedItems: any[] | null = null;
      let savedStatus: 'draft' | 'submitted' = 'draft';

      if (Array.isArray(savedData?.items) && savedData.items.length > 0) {
        savedItems = savedData.items;
        savedStatus = savedData.status === 'submitted' ? 'submitted' : 'draft';
      } else if (
        Array.isArray(savedData?.allObservations) &&
        savedData.allObservations.length > 0
      ) {
        savedItems = savedData.allObservations;
        savedStatus = savedData.status === 'submitted' ? 'submitted' : 'draft';
      } else if (typeof localStorage !== 'undefined') {
        try {
          const alias =
            studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
          const raw =
            localStorage.getItem(`melue_preference_assessment_${studentId}`) ||
            (alias ? localStorage.getItem(`melue_preference_assessment_${alias}`) : null);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
              savedItems = parsed.items;
              savedStatus = parsed.status === 'submitted' ? 'submitted' : 'draft';
            } else if (
              Array.isArray(parsed?.allObservations) &&
              parsed.allObservations.length > 0
            ) {
              savedItems = parsed.allObservations;
              savedStatus = parsed.status === 'submitted' ? 'submitted' : 'draft';
            }
          }
        } catch {}
      }

      setStatus(savedStatus);

      // Merge saved data strictly with canonical 24 items
      const base = createInitialCanonicalItems();
      if (savedItems && savedItems.length > 0) {
        const savedMap = new Map<string, any>();
        savedItems.forEach((it) => {
          if (it.name) savedMap.set(String(it.name).toLowerCase().trim(), it);
          if (it.id) savedMap.set(String(it.id), it);
          if (it.itemId) savedMap.set(String(it.itemId), it);
        });

        const merged = base.map((canon) => {
          const saved = savedMap.get(canon.id) || savedMap.get(canon.name.toLowerCase().trim());

          if (saved) {
            const approached =
              saved.approached === 'Approached' || saved.approached === 'Did Not Approach'
                ? saved.approached
                : saved.approached === 'Initiated'
                  ? 'Approached'
                  : undefined;

            const engaged =
              saved.engaged === 'Yes' || saved.engaged === 'No'
                ? saved.engaged
                : saved.engaged === 'Engaged' || saved.engaged === 'High'
                  ? 'Yes'
                  : saved.engaged === 'Did Not Engage'
                    ? 'No'
                    : undefined;

            const dur = Number(saved.durationSeconds ?? saved.duration_seconds ?? 0);
            const freq = Number(saved.frequency ?? saved.frequency_count ?? 0);
            const trials = Array.isArray(saved.trials) ? saved.trials : [];

            return {
              ...canon,
              approached,
              engaged: approached === 'Did Not Approach' ? undefined : engaged,
              frequency: approached === 'Did Not Approach' ? 0 : freq,
              durationSeconds: approached === 'Did Not Approach' ? 0 : dur,
              timerSeconds: 0,
              isRunning: false,
              notes: saved.notes || '',
              trials,
            };
          }
          return canon;
        });
        setItems(merged);
      } else {
        setItems(base);
      }
    } catch {}
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Active Timer Tick Handler
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => {
        if (!prev.some((i) => i.isRunning)) return prev;
        return prev.map((item) => {
          if (item.isRunning) {
            return {
              ...item,
              timerSeconds: item.timerSeconds + 1,
              durationSeconds: item.durationSeconds + 1,
            };
          }
          return item;
        });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Approach Status Handler (Logic Tree)
  const handleSetApproach = (id: string, value: 'Approached' | 'Did Not Approach') => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (value === 'Did Not Approach') {
          // If Did Not Approach: Mark assessed, auto-rank as low preference, disable/clear duration and engagement
          return {
            ...item,
            approached: 'Did Not Approach',
            engaged: undefined,
            frequency: 0,
            durationSeconds: 0,
            timerSeconds: 0,
            isRunning: false,
            trials: [],
          };
        } else {
          // If Approached: Enable Engaged With, Frequency counter (default 1), and Duration
          return {
            ...item,
            approached: 'Approached',
            engaged: item.engaged || 'Yes',
            frequency: Math.max(1, item.frequency),
          };
        }
      }),
    );
  };

  // Engagement Handler
  const handleSetEngaged = (id: string, value: 'Yes' | 'No') => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.approached !== 'Approached') return item;
        return { ...item, engaged: value };
      }),
    );
  };

  // Frequency Counter Handler
  const handleUpdateFrequency = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.approached !== 'Approached') return item;
        return {
          ...item,
          frequency: Math.max(0, item.frequency + delta),
        };
      }),
    );
  };

  // Timer Control & Multi-Trial Interval Persistence
  const handleToggleTimer = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.approached !== 'Approached') return item;

        if (item.isRunning) {
          // Pausing timer -> log interval trial
          const trialSec = item.timerSeconds;
          const newTrials =
            trialSec > 0
              ? [
                  ...item.trials,
                  {
                    id: Date.now().toString(),
                    durationSeconds: trialSec,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ]
              : item.trials;

          return {
            ...item,
            isRunning: false,
            timerSeconds: 0,
            trials: newTrials,
          };
        } else {
          // Starting timer
          return {
            ...item,
            isRunning: true,
            timerSeconds: 0,
          };
        }
      }),
    );
  };

  // Reset Timer Handler
  const handleResetTimer = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          isRunning: false,
          timerSeconds: 0,
          durationSeconds: 0,
          trials: [],
        };
      }),
    );
  };

  // Manual Quick Duration Add (+30s / +1m)
  const handleAddManualDuration = (id: string, seconds: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.approached !== 'Approached') return item;
        const newTrials = [
          ...item.trials,
          {
            id: Date.now().toString(),
            durationSeconds: seconds,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
        return {
          ...item,
          durationSeconds: item.durationSeconds + seconds,
          trials: newTrials,
        };
      }),
    );
  };

  // Notes Handler
  const handleUpdateNotes = (id: string, notes: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, notes } : item)));
  };

  // Dynamic Tiering Calculation
  const tiers = useMemo(() => calculatePreferenceTiers(items), [items]);

  // Progress metrics: ratio of assessed items relative to canonical 24 items
  const progressRatio = items.length > 0 ? tiers.totalAssessed / items.length : 0;
  const progressPercent = Math.round(progressRatio * 100);

  // Save / Submit Assessment Handler
  const handleSave = async (targetStatus: 'draft' | 'submitted') => {
    await performSave(targetStatus);
  };

  const performSave = async (saveStatus: 'draft' | 'submitted') => {
    try {
      // Build ranked observations
      const assessed = items.filter((i) => i.approached !== undefined);
      const sorted = [...assessed].sort((a, b) => {
        if (a.approached === 'Did Not Approach' && b.approached !== 'Did Not Approach') return 1;
        if (b.approached === 'Did Not Approach' && a.approached !== 'Did Not Approach') return -1;
        if (b.durationSeconds !== a.durationSeconds) return b.durationSeconds - a.durationSeconds;
        return b.frequency - a.frequency;
      });

      const allObservations = sorted.map((item, idx) => {
        const sec = item.durationSeconds;
        const durStr = sec > 0 ? (sec >= 60 ? `${Math.round(sec / 60)} min` : `${sec}s`) : '0s';
        return {
          id: `pref-obs-${item.id}`,
          itemId: item.id,
          rank: idx + 1,
          item: item.name,
          name: item.name,
          duration: durStr,
          duration_seconds: sec,
          durationSeconds: sec,
          frequency: item.frequency,
          frequency_count: item.frequency,
          context: 'General Unified Inventory',
          engaged: item.engaged || (item.approached === 'Did Not Approach' ? 'No' : 'N/A'),
          approached: item.approached || 'Did Not Approach',
          notes: item.notes,
          category: item.category,
          trials: item.trials,
        };
      });

      const isSubmitting = saveStatus === 'submitted';
      const progress = isSubmitting ? 100 : progressPercent;

      const payload = {
        studentId,
        status: saveStatus,
        progress,
        items,
        allObservations,
        ranked_observations: allObservations,
        tiers: {
          highest: tiers.highest.map((i) => ({
            id: i.id,
            name: i.name,
            durationSeconds: i.durationSeconds,
            frequency: i.frequency,
          })),
          moderate: tiers.moderate.map((i) => ({
            id: i.id,
            name: i.name,
            durationSeconds: i.durationSeconds,
            frequency: i.frequency,
          })),
          low: tiers.low.map((i) => ({ id: i.id, name: i.name, approached: i.approached })),
        },
        preferences: {
          items: allObservations,
          ranked_observations: allObservations,
        },
      };

      if (typeof localStorage !== 'undefined') {
        try {
          const enriched = {
            ...payload,
            progress,
            status: saveStatus,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(
            `melue_preference_assessment_${studentId}`,
            JSON.stringify(enriched),
          );
          const alias =
            studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
          if (alias) {
            localStorage.setItem(`melue_preference_assessment_${alias}`, JSON.stringify(enriched));
          }
        } catch {}
      }

      await savePreferenceAssessment(studentId, payload);
      const aliasSid =
        studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
      if (aliasSid) {
        await savePreferenceAssessment(aliasSid, payload);
      }

      setStatus(saveStatus);
      showToast(
        saveStatus === 'submitted'
          ? 'Preference assessment submitted successfully!'
          : 'Draft saved successfully',
        'success',
      );
      if (isSubmitting) {
        navigation?.navigate?.('AssessmentDashboard' as never);
      }
    } catch {
      showToast('Failed to save preference assessment data', 'error');
    }
  };

  // PDF / Print Export Handler strictly matching MCTC-TRP-013 layout
  const handleExport = () => {
    const title = 'MCTC-TRP-013 Preference Assessment Data Sheet';
    const studentName = profile?.fullName || 'Student';
    const studentAge = profile?.age || '?';
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const formattedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 20px; color: #0F172A; line-height: 1.4; background: #FFF; }
            .header-block { border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
            .form-code { font-size: 11px; font-weight: 800; color: #475569; letter-spacing: 1px; }
            .form-title { font-size: 20px; font-weight: 800; color: #0F172A; margin: 4px 0 0; }
            .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; }
            .meta-value { font-size: 13px; font-weight: 700; color: #0F172A; margin-top: 2px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
            th, td { border: 1px solid #CBD5E1; padding: 6px 8px; text-align: left; vertical-align: middle; }
            th { background-color: #F1F5F9; font-weight: 800; color: #1E293B; font-size: 10px; text-transform: uppercase; }
            .center { text-align: center; }
            .bold { font-weight: 700; }
            .category-tag { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #E2E8F0; color: #334155; display: inline-block; }
            .status-approached { color: #16A34A; font-weight: 700; }
            .status-didnot { color: #DC2626; font-weight: 700; }

            .summary-title { font-size: 14px; font-weight: 800; color: #0F172A; margin: 20px 0 10px; border-left: 4px solid #0284C7; padding-left: 8px; text-transform: uppercase; }
            .tier-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
            .tier-card { border: 1px solid #CBD5E1; border-radius: 8px; padding: 12px; background: #FAFAFA; }
            .tier-highest { border-top: 4px solid #16A34A; }
            .tier-moderate { border-top: 4px solid #D97706; }
            .tier-low { border-top: 4px solid #DC2626; }
            .tier-header { font-size: 12px; font-weight: 800; margin-bottom: 8px; display: flex; justify-content: space-between; }
            .tier-list { margin: 0; padding-left: 16px; font-size: 11px; }
            .tier-list li { margin-bottom: 4px; }

            .footer-sig { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; border-top: 1px solid #E2E8F0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header-block">
            <div>
              <div class="form-code">MELUE FOUNDATION &middot; 6-WEEK BASELINE ASSESSMENT &middot; FORM MCTC-TRP-013</div>
              <h1 class="form-title">Preference Assessment Data Sheet</h1>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 12px; font-weight: 800; color: ${status === 'submitted' ? '#16A34A' : '#D97706'};">
                ${status === 'submitted' ? 'CLINICALLY SUBMITTED' : 'DRAFT INVENTORY'}
              </span>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Student Name</span>
              <span class="meta-value">${studentName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Age / ID</span>
              <span class="meta-value">Age ${studentAge} &middot; ${studentId}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Assessment Date</span>
              <span class="meta-value">${dateStr}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Inventory Completion</span>
              <span class="meta-value">${tiers.totalAssessed} / ${items.length} Items (${progressPercent}%)</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px;" class="center">#</th>
                <th style="width: 140px;">Stimulus Item</th>
                <th style="width: 80px;">Category</th>
                <th style="width: 95px;" class="center">Approach Status</th>
                <th style="width: 75px;" class="center">Engaged With</th>
                <th style="width: 65px;" class="center">Frequency</th>
                <th style="width: 80px;" class="center">Total Duration</th>
                <th style="width: 60px;" class="center">Trials</th>
                <th>Observational Notes</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map((item, idx) => {
                  const approachedText =
                    item.approached === 'Approached'
                      ? '<span class="status-approached">&#10003; Approached</span>'
                      : item.approached === 'Did Not Approach'
                        ? '<span class="status-didnot">&#10005; Did Not</span>'
                        : '<span style="color: #94A3B8;">Unassessed</span>';

                  const engagedText =
                    item.approached === 'Did Not Approach'
                      ? '&mdash;'
                      : item.engaged === 'Yes'
                        ? '<strong>Yes</strong>'
                        : item.engaged === 'No'
                          ? 'No'
                          : '&mdash;';

                  const freqText =
                    item.approached === 'Did Not Approach' ? '&mdash;' : `${item.frequency}`;
                  const durText =
                    item.approached === 'Did Not Approach'
                      ? '&mdash;'
                      : formatMMSS(item.durationSeconds);
                  const trialsCount =
                    item.approached === 'Did Not Approach' ? '&mdash;' : item.trials.length;

                  return `
                    <tr>
                      <td class="center bold">${idx + 1}</td>
                      <td class="bold">${item.name}</td>
                      <td><span class="category-tag">${item.category}</span></td>
                      <td class="center">${approachedText}</td>
                      <td class="center">${engagedText}</td>
                      <td class="center bold">${freqText}</td>
                      <td class="center bold">${durText}</td>
                      <td class="center">${trialsCount}</td>
                      <td style="color: #475569;">${item.notes || '&mdash;'}</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>

          <div class="summary-title">Dynamic 3-Tier Preference Categorization</div>
          <div class="tier-container">
            <div class="tier-card tier-highest">
              <div class="tier-header" style="color: #16A34A;">
                <span>Highest Preferred</span>
                <span>(${tiers.highest.length})</span>
              </div>
              <ul class="tier-list">
                ${
                  tiers.highest.length > 0
                    ? tiers.highest
                        .map(
                          (i) =>
                            `<li><strong>${i.name}</strong> &mdash; ${formatMMSS(i.durationSeconds)} (${i.frequency}x)</li>`,
                        )
                        .join('')
                    : '<li style="color: #94A3B8; font-style: italic;">No items in tier</li>'
                }
              </ul>
            </div>

            <div class="tier-card tier-moderate">
              <div class="tier-header" style="color: #D97706;">
                <span>Moderately Preferred</span>
                <span>(${tiers.moderate.length})</span>
              </div>
              <ul class="tier-list">
                ${
                  tiers.moderate.length > 0
                    ? tiers.moderate
                        .map(
                          (i) =>
                            `<li><strong>${i.name}</strong> &mdash; ${formatMMSS(i.durationSeconds)} (${i.frequency}x)</li>`,
                        )
                        .join('')
                    : '<li style="color: #94A3B8; font-style: italic;">No items in tier</li>'
                }
              </ul>
            </div>

            <div class="tier-card tier-low">
              <div class="tier-header" style="color: #DC2626;">
                <span>Low Preferred</span>
                <span>(${tiers.low.length})</span>
              </div>
              <ul class="tier-list">
                ${
                  tiers.low.length > 0
                    ? tiers.low
                        .map(
                          (i) =>
                            `<li><strong>${i.name}</strong> &mdash; ${i.approached === 'Did Not Approach' ? 'Did Not Approach' : 'Zero Engagement'}</li>`,
                        )
                        .join('')
                    : '<li style="color: #94A3B8; font-style: italic;">No items in tier</li>'
                }
              </ul>
            </div>
          </div>

          <div class="footer-sig">
            <div>
              <strong>Assessing Clinical Therapist:</strong> _____________________________
            </div>
            <div>
              <strong>Date:</strong> ____________________
            </div>
            <div>
              <strong>Lead BCBA Verification:</strong> _____________________________
            </div>
          </div>
        </body>
      </html>
    `;

    openPrintWindow(formattedHtml, title);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Assessments"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
      />

      <View style={styles.backRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
          <Feather name="arrow-left" size={16} color="#334155" />
          <Text style={styles.backText}>Back to Assessments</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.codeRow}>
            <Text style={styles.codeBadge}>FORM MCTC-TRP-013</Text>
            {status === 'submitted' ? (
              <View style={styles.submittedBadge}>
                <Feather name="check" size={12} color="#FFFFFF" />
                <Text style={styles.submittedText}>Clinically Submitted</Text>
              </View>
            ) : (
              <View style={styles.draftBadge}>
                <Feather name="edit-3" size={12} color="#854D0E" />
                <Text style={styles.draftText}>Draft In Progress</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerTitle}>Preference Assessment Data Sheet</Text>
          <Text style={styles.headerSubtitle}>
            Unified 24-Item Catalog &middot; Multi-Trial Cumulative Duration &middot; 3-Tier Dynamic
            Hierarchy
          </Text>
        </View>

        <View style={styles.studentBadge}>
          <Text style={styles.studentName}>{profile?.fullName || 'Student'}</Text>
          <Text style={styles.studentAge}>Age {profile?.age || '?'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Progress & Compliance Bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather
                name={tiers.totalAssessed === items.length ? 'check-circle' : 'activity'}
                size={18}
                color={tiers.totalAssessed === items.length ? '#16A34A' : '#0284C7'}
              />
              <Text style={styles.progressTitle}>Assessment Completion Progress</Text>
            </View>
            <Text style={styles.progressCountText}>
              {tiers.totalAssessed} / {items.length} Assessed ({progressPercent}%)
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
                progressPercent === 100 && { backgroundColor: '#16A34A' },
              ]}
            />
          </View>
        </View>

        {/* Unified 24-Item Inventory Table Header */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderBar}>
            <Text style={styles.tableTitle}>
              Canonical Preference Inventory (24 Authentic Items)
            </Text>
            <Text style={styles.tableSubtitle}>
              MCTC-TRP-013 &middot; Choose Approach Status, Engagement, Timing & Approach Counter
            </Text>
          </View>

          {items.map((item, index) => {
            const categoryStyle = CATEGORY_COLORS[item.category] || {
              bg: '#F1F5F9',
              text: '#475569',
            };
            const isApproached = item.approached === 'Approached';
            const isDidNotApproach = item.approached === 'Did Not Approach';
            const isDisabled = isDidNotApproach;

            return (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  isDidNotApproach && styles.itemCardDidNotApproach,
                  isApproached && styles.itemCardApproached,
                ]}
              >
                {/* 1. Item Identity & Category */}
                <View style={styles.itemInfoCol}>
                  <View style={styles.indexPill}>
                    <Text style={styles.indexText}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={[styles.categoryPill, { backgroundColor: categoryStyle.bg }]}>
                      <Text style={[styles.categoryText, { color: categoryStyle.text }]}>
                        {item.category}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 2. Approach Status Toggle (Required Binary) */}
                <View style={styles.approachCol}>
                  <Text style={styles.fieldLabel}>APPROACH STATUS</Text>
                  <View style={styles.toggleRow}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, isApproached && styles.approachActiveBtn]}
                      onPress={() => handleSetApproach(item.id, 'Approached')}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isApproached }}
                    >
                      <Feather
                        name="check"
                        size={13}
                        color={isApproached ? '#FFFFFF' : '#475569'}
                      />
                      <Text
                        style={[styles.toggleBtnText, isApproached && styles.approachActiveText]}
                      >
                        Approached
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.toggleBtn, isDidNotApproach && styles.didNotActiveBtn]}
                      onPress={() => handleSetApproach(item.id, 'Did Not Approach')}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isDidNotApproach }}
                    >
                      <Feather
                        name="x"
                        size={13}
                        color={isDidNotApproach ? '#FFFFFF' : '#475569'}
                      />
                      <Text
                        style={[styles.toggleBtnText, isDidNotApproach && styles.didNotActiveText]}
                      >
                        Did Not
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 3. Engaged With (Yes / No) */}
                <View style={[styles.engagedCol, isDisabled && styles.disabledCol]}>
                  <Text style={styles.fieldLabel}>ENGAGED WITH</Text>
                  <View style={styles.toggleRow}>
                    <TouchableOpacity
                      disabled={isDisabled}
                      style={[
                        styles.toggleBtnSmall,
                        item.engaged === 'Yes' && !isDisabled && styles.engagedYesBtn,
                      ]}
                      onPress={() => handleSetEngaged(item.id, 'Yes')}
                    >
                      <Text
                        style={[
                          styles.toggleBtnSmallText,
                          item.engaged === 'Yes' && !isDisabled && styles.engagedYesText,
                        ]}
                      >
                        Yes
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={isDisabled}
                      style={[
                        styles.toggleBtnSmall,
                        item.engaged === 'No' && !isDisabled && styles.engagedNoBtn,
                      ]}
                      onPress={() => handleSetEngaged(item.id, 'No')}
                    >
                      <Text
                        style={[
                          styles.toggleBtnSmallText,
                          item.engaged === 'No' && !isDisabled && styles.engagedNoText,
                        ]}
                      >
                        No
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4. Frequency Counter (+ / -) */}
                <View style={[styles.freqCol, isDisabled && styles.disabledCol]}>
                  <Text style={styles.fieldLabel}>FREQUENCY</Text>
                  <View style={styles.freqCounterRow}>
                    <TouchableOpacity
                      disabled={isDisabled}
                      style={[styles.freqStepBtn, isDisabled && styles.btnDisabled]}
                      onPress={() => handleUpdateFrequency(item.id, -1)}
                    >
                      <Text style={styles.freqStepBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.freqValText}>{isDisabled ? '0' : item.frequency}</Text>
                    <TouchableOpacity
                      disabled={isDisabled}
                      style={[
                        styles.freqStepBtn,
                        styles.freqStepBtnPlus,
                        isDisabled && styles.btnDisabled,
                      ]}
                      onPress={() => handleUpdateFrequency(item.id, 1)}
                    >
                      <Text style={[styles.freqStepBtnText, styles.freqStepBtnPlusText]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 5. Cumulative Duration & Multi-Trial Timer */}
                <View style={[styles.durationCol, isDisabled && styles.disabledCol]}>
                  <Text style={styles.fieldLabel}>CUMULATIVE DURATION</Text>
                  <View style={styles.timerDisplayRow}>
                    <Text
                      style={[
                        styles.durationText,
                        item.durationSeconds > 0 && { color: '#0284C7' },
                      ]}
                    >
                      {isDisabled ? '00:00' : formatMMSS(item.durationSeconds)}
                    </Text>
                    {item.trials.length > 0 && !isDisabled && (
                      <View style={styles.trialsBadge}>
                        <Text style={styles.trialsBadgeText}>
                          {item.trials.length} {item.trials.length === 1 ? 'Trial' : 'Trials'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Timer Controls */}
                  {!isDisabled && (
                    <View style={styles.timerControlsRow}>
                      <TouchableOpacity
                        style={[
                          styles.timerActionBtn,
                          item.isRunning ? styles.timerPauseBtn : styles.timerStartBtn,
                        ]}
                        onPress={() => handleToggleTimer(item.id)}
                      >
                        <Feather
                          name={item.isRunning ? 'pause' : 'play'}
                          size={11}
                          color="#FFFFFF"
                        />
                        <Text style={styles.timerActionBtnText}>
                          {item.isRunning
                            ? `Pause (${formatMMSS(item.timerSeconds)})`
                            : 'Run Timer'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.quickAddBtn}
                        onPress={() => handleAddManualDuration(item.id, 60)}
                      >
                        <Text style={styles.quickAddText}>+1m</Text>
                      </TouchableOpacity>

                      {item.durationSeconds > 0 && (
                        <TouchableOpacity
                          style={styles.timerResetBtn}
                          onPress={() => handleResetTimer(item.id)}
                        >
                          <Feather name="rotate-ccw" size={11} color="#64748B" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {/* 6. Observational Notes */}
                <View style={styles.notesCol}>
                  <Text style={styles.fieldLabel}>OBSERVATIONS / CLINICAL NOTES</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Context, latency, engagement quality..."
                    placeholderTextColor="#94A3B8"
                    value={item.notes}
                    onChangeText={(txt) => handleUpdateNotes(item.id, txt)}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Dynamic 3-Tier Summary Hierarchy */}
        <View style={styles.tierSummaryCard}>
          <View style={styles.tierSummaryHeader}>
            <Feather name="bar-chart-2" size={18} color="#0F172A" />
            <Text style={styles.tierSummaryTitle}>
              Dynamic Preference Tiering Hierarchy (SRS &sect;3.3.4)
            </Text>
          </View>
          <Text style={styles.tierSummarySubtitle}>
            Dynamically categorized based on approach decisions, engagement, and multi-trial
            cumulative durations.
          </Text>

          <View style={styles.tiersGrid}>
            {/* Tier 1: Highest Preferred */}
            <View style={[styles.tierCard, styles.tierCardHighest]}>
              <View style={styles.tierCardHeader}>
                <View style={styles.tierBadgeGreen}>
                  <Feather name="star" size={12} color="#16A34A" />
                  <Text style={styles.tierBadgeTextGreen}>Highest Preferred Items</Text>
                </View>
                <Text style={styles.tierCountText}>{tiers.highest.length}</Text>
              </View>
              <Text style={styles.tierDescription}>
                Approached frequently and engaged with for the longest total duration.
              </Text>
              <View style={styles.tierItemList}>
                {tiers.highest.length > 0 ? (
                  tiers.highest.map((item) => (
                    <View key={item.id} style={styles.tierItemRow}>
                      <Text style={styles.tierItemName}>{item.name}</Text>
                      <View style={styles.tierItemStats}>
                        <Text style={styles.tierDurationText}>
                          {formatMMSS(item.durationSeconds)}
                        </Text>
                        <Text style={styles.tierFreqText}>({item.frequency}x)</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.tierEmptyText}>No items assessed in this tier yet.</Text>
                )}
              </View>
            </View>

            {/* Tier 2: Moderately Preferred */}
            <View style={[styles.tierCard, styles.tierCardModerate]}>
              <View style={styles.tierCardHeader}>
                <View style={styles.tierBadgeAmber}>
                  <Feather name="trending-up" size={12} color="#D97706" />
                  <Text style={styles.tierBadgeTextAmber}>Moderately Preferred Items</Text>
                </View>
                <Text style={styles.tierCountText}>{tiers.moderate.length}</Text>
              </View>
              <Text style={styles.tierDescription}>
                Approached and engaged with, but for shorter duration or inconsistent engagement.
              </Text>
              <View style={styles.tierItemList}>
                {tiers.moderate.length > 0 ? (
                  tiers.moderate.map((item) => (
                    <View key={item.id} style={styles.tierItemRow}>
                      <Text style={styles.tierItemName}>{item.name}</Text>
                      <View style={styles.tierItemStats}>
                        <Text style={styles.tierDurationText}>
                          {formatMMSS(item.durationSeconds)}
                        </Text>
                        <Text style={styles.tierFreqText}>({item.frequency}x)</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.tierEmptyText}>No items assessed in this tier yet.</Text>
                )}
              </View>
            </View>

            {/* Tier 3: Low Preferred */}
            <View style={[styles.tierCard, styles.tierCardLow]}>
              <View style={styles.tierCardHeader}>
                <View style={styles.tierBadgeRed}>
                  <Feather name="minus-circle" size={12} color="#DC2626" />
                  <Text style={styles.tierBadgeTextRed}>Low Preferred Items</Text>
                </View>
                <Text style={styles.tierCountText}>{tiers.low.length}</Text>
              </View>
              <Text style={styles.tierDescription}>
                Marked as Did Not Approach or approached with zero engagement.
              </Text>
              <View style={styles.tierItemList}>
                {tiers.low.length > 0 ? (
                  tiers.low.map((item) => (
                    <View key={item.id} style={styles.tierItemRow}>
                      <Text style={styles.tierItemName}>{item.name}</Text>
                      <Text style={styles.tierLowStatusText}>
                        {item.approached === 'Did Not Approach'
                          ? 'Did Not Approach'
                          : 'Zero Engagement'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.tierEmptyText}>No items marked as low preferred.</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Persistent Bottom Action Bar */}
      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.draftBtn} onPress={() => handleSave('draft')}>
          <Feather name="save" size={15} color="#334155" />
          <Text style={styles.draftBtnText}>Save Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={() => handleSave('submitted')}>
          <Feather name="check-circle" size={15} color="#0F172A" />
          <Text style={styles.submitBtnText}>Submit Assessment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.printBtn} onPress={handleExport}>
          <Feather name="printer" size={15} color="#0284C7" />
          <Text style={styles.printBtnText}>Print / Export (MCTC-TRP-013)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 12,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  codeBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  submittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  submittedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  draftText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  studentBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  studentAge: {
    fontSize: 11,
    color: '#3B82F6',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 4,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderBar: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  tableSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 14,
  },
  itemCardApproached: {
    backgroundColor: '#FAF5FF',
  },
  itemCardDidNotApproach: {
    backgroundColor: '#F8FAFC',
    opacity: 0.85,
  },
  itemInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 170,
  },
  indexPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 3,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  approachCol: {
    width: 175,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  approachActiveBtn: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  didNotActiveBtn: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  approachActiveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  didNotActiveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  engagedCol: {
    width: 100,
    gap: 4,
  },
  disabledCol: {
    opacity: 0.4,
  },
  toggleBtnSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  engagedYesBtn: {
    backgroundColor: '#0284C7',
    borderColor: '#0369A1',
  },
  engagedNoBtn: {
    backgroundColor: '#64748B',
    borderColor: '#475569',
  },
  toggleBtnSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  engagedYesText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  engagedNoText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  freqCol: {
    width: 105,
    gap: 4,
    alignItems: 'center',
  },
  freqCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freqStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqStepBtnPlus: {
    backgroundColor: '#FEF08A',
    borderColor: '#FACC15',
  },
  freqStepBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  freqStepBtnPlusText: {
    color: '#854D0E',
  },
  btnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  freqValText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    minWidth: 18,
    textAlign: 'center',
  },
  durationCol: {
    width: 190,
    gap: 4,
  },
  timerDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  trialsBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  trialsBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  timerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  timerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerStartBtn: {
    backgroundColor: '#0284C7',
  },
  timerPauseBtn: {
    backgroundColor: '#D97706',
  },
  timerActionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickAddBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quickAddText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  timerResetBtn: {
    padding: 4,
    borderRadius: 4,
  },
  notesCol: {
    flex: 1,
    minWidth: 180,
    gap: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  tierSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  tierSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierSummaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  tierSummarySubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  tiersGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  tierCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  tierCardHighest: {
    borderTopWidth: 4,
    borderTopColor: '#16A34A',
  },
  tierCardModerate: {
    borderTopWidth: 4,
    borderTopColor: '#D97706',
  },
  tierCardLow: {
    borderTopWidth: 4,
    borderTopColor: '#DC2626',
  },
  tierCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierBadgeTextGreen: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  tierBadgeAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierBadgeTextAmber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  tierBadgeRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierBadgeTextRed: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  tierCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  tierDescription: {
    fontSize: 11,
    color: '#64748B',
  },
  tierItemList: {
    gap: 6,
    marginTop: 4,
  },
  tierItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tierItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  tierItemStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierDurationText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  tierFreqText: {
    fontSize: 11,
    color: '#64748B',
  },
  tierLowStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  tierEmptyText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexWrap: 'wrap',
  },
  draftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  draftBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FACC15',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  printBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
});
