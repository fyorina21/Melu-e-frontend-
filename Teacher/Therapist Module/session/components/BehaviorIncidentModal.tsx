// screens/session/components/BehaviorIncidentModal.js
// SCR-003: Behavior Incident Modal
// Documents behaviors using the ABC (Antecedent-Behavior-Consequence)
// model without leaving the session dashboard.
//
// NOTE: "Location", "Behavior name", "Antecedent", and "Consequence"
// dropdown options are configurable via SCR-ADMIN-003 (an admin screen
// outside Daily Operations scope). The option lists below are reasonable
// defaults from the spec doc - swap for real config data once that admin
// screen/endpoint exists.

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

const LOCATION_OPTIONS = ['Therapy Room', 'Snack Place', 'Playground', 'Sensory Room', 'Circle Time', 'Other'];
const BEHAVIOR_OPTIONS = ['Unable to remain seated', 'Biting others', 'Flopping', 'Screaming', 'Other'];
const FREQUENCY_OPTIONS = ['Rarely', 'Occasionally', 'Frequently', 'Very Frequently', 'Constantly'];
const INTENSITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];
const CATEGORY_OPTIONS = [
  'Attention-seeking', 'Safety concerns', 'Not sitting still/Hyperactivity',
  'Making noises/interrupting conversation', 'Running away/climbing furniture/eating inedible items',
  'Flopping', 'Elopement', 'Difficulty with transitions', 'Obsessive', 'Inappropriate',
];
const ANTECEDENT_OPTIONS = ['Demand placed', 'Transition', 'Item removed', 'Denied access', 'Other'];
const CONSEQUENCE_OPTIONS = ['Redirected', 'Ignored', 'Item given', 'Removed from area', 'Other'];

// Behavior definitions auto-populate when a behavior is selected - stand-in
// text until the real config source exists.
const BEHAVIOR_DEFINITIONS: Record<string, string> = {
  'Unable to remain seated': 'Student leaves designated seat/area without permission during instruction.',
  'Biting others': 'Student makes contact with teeth against another person\u2019s skin.',
  Flopping: 'Student drops to the floor and refuses/resists standing or moving.',
  Screaming: 'Vocalization at a volume disruptive to the session or other students.',
};

export interface IncidentPayload {
  date: string;
  time: string;
  location: string | null;
  behavior: string | null;
  behaviorDefinition: string;
  frequency: string | null;
  intensity: string | null;
  category: string | null;
  antecedent: string | null;
  consequence: string | null;
  notes: string;
  recordedBy: string;
}

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <TouchableOpacity style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface ChipFieldProps {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
}

function ChipField({ label, options, value, onChange, otherValue, onOtherChange }: ChipFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={typography.label}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt) => (
          <Chip key={opt} label={opt} selected={value === opt} onPress={() => onChange(opt)} />
        ))}
      </View>
      {value === 'Other' && (
        <TextInput
          style={styles.textInput}
          placeholder={`Describe ${label.toLowerCase()}...`}
          placeholderTextColor={colors.mutedText}
          value={otherValue}
          onChangeText={onOtherChange}
        />
      )}
    </View>
  );
}

interface BehaviorIncidentModalProps {
  visible: boolean;
  studentName?: string;
  goalName?: string;
  recordedBy?: string;
  onCancel?: (hadChanges: boolean) => void;
  onSave?: (incident: IncidentPayload) => void;
}

export default function BehaviorIncidentModal({
  visible,
  studentName,
  goalName,
  recordedBy = 'Teacher A',
  onCancel,
  onSave,
}: BehaviorIncidentModalProps) {
  const now = new Date();
  const [date, setDate] = useState(now.toLocaleDateString());
  const [time, setTime] = useState(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [location, setLocation] = useState<string | null>(null);
  const [behavior, setBehavior] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [antecedent, setAntecedent] = useState<string | null>(null);
  const [antecedentOther, setAntecedentOther] = useState('');
  const [consequence, setConsequence] = useState<string | null>(null);
  const [consequenceOther, setConsequenceOther] = useState('');
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState(false);

  const behaviorDefinition = behavior ? BEHAVIOR_DEFINITIONS[behavior] || '' : '';

  const markTouched = (setter: (v: string) => void) => (val: string) => {
    setTouched(true);
    setter(val);
  };

  const handleCancel = () => {
    if (touched) {
      // TODO: swap window.confirm-style Alert for a proper confirm dialog
      // component once one exists in the shared UI kit.
      onCancel?.(true);
    } else {
      onCancel?.(false);
    }
  };

  const handleSave = () => {
    onSave?.({
      date,
      time,
      location,
      behavior,
      behaviorDefinition,
      frequency,
      intensity,
      category,
      antecedent: antecedent === 'Other' ? antecedentOther : antecedent,
      consequence: consequence === 'Other' ? consequenceOther : consequence,
      notes,
      recordedBy,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={typography.h2}>Behavior Incident</Text>
              <Text style={typography.caption}>{studentName} · {goalName}</Text>
            </View>
            <TouchableOpacity onPress={handleCancel} accessibilityLabel="Close">
              <Feather name="x" size={22} color={colors.navyText} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.row2}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={typography.label}>Date</Text>
                <TextInput style={styles.textInput} value={date} onChangeText={markTouched(setDate)} />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={typography.label}>Time</Text>
                <TextInput style={styles.textInput} value={time} onChangeText={markTouched(setTime)} />
              </View>
            </View>

            <ChipField label="Location" options={LOCATION_OPTIONS} value={location} onChange={markTouched(setLocation)} />
            <ChipField label="Behavior" options={BEHAVIOR_OPTIONS} value={behavior} onChange={markTouched(setBehavior)} />

            {!!behaviorDefinition && (
              <View style={styles.definitionBox}>
                <Text style={typography.caption}>{behaviorDefinition}</Text>
              </View>
            )}

            <ChipField label="Frequency" options={FREQUENCY_OPTIONS} value={frequency} onChange={markTouched(setFrequency)} />
            <ChipField label="Intensity" options={INTENSITY_OPTIONS} value={intensity} onChange={markTouched(setIntensity)} />
            <ChipField label="Category" options={CATEGORY_OPTIONS} value={category} onChange={markTouched(setCategory)} />
            <ChipField
              label="Antecedent"
              options={ANTECEDENT_OPTIONS}
              value={antecedent}
              onChange={markTouched(setAntecedent)}
              otherValue={antecedentOther}
              onOtherChange={markTouched(setAntecedentOther)}
            />
            <ChipField
              label="Consequence"
              options={CONSEQUENCE_OPTIONS}
              value={consequence}
              onChange={markTouched(setConsequence)}
              otherValue={consequenceOther}
              onOtherChange={markTouched(setConsequenceOther)}
            />

            <View style={styles.field}>
              <Text style={typography.label}>Additional Notes (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                multiline
                numberOfLines={4}
                placeholder="Any extra observations..."
                placeholderTextColor={colors.mutedText}
                value={notes}
                onChangeText={markTouched(setNotes)}
              />
            </View>

            <Text style={typography.caption}>Recorded by {recordedBy}</Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Incident</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  body: { padding: spacing.lg, gap: spacing.lg },
  row2: { flexDirection: 'row', gap: spacing.md },
  field: { gap: spacing.xs },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.navyText,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgApp,
  },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  definitionBox: { backgroundColor: colors.bgApp, borderRadius: radius.md, padding: spacing.md },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
