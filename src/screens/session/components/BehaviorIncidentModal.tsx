import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getFormConfig } from '../../../api/institutionalAdminApi';
import DynamicFormFields, { type DynamicFormField } from '../../../components/DynamicFormFields';
import { useAuth } from '../../../context/AuthContext';

export interface IncidentPayload {
  date: string;
  time: string;
  location: string;
  behavior: string;
  frequency: string;
  intensity: string;
  category: string;
  antecedent: string;
  consequence: string;
  teacher: string;
  additionalNotes?: string;
  notes?: string;
  customFields?: Record<string, any>;
  [key: string]: any;
}

interface BehaviorIncidentModalProps {
  visible: boolean;
  studentId?: string;
  studentGoalId?: string;
  studentName?: string;
  goalName?: string;
  recordedBy?: string;
  onCancel: (hadChanges: boolean) => void;
  onSave: (data: IncidentPayload) => void;
}

const getCurrentDate = () => new Date().toISOString().split('T')[0];
const getCurrentTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const DEFAULT_INCIDENT_FIELDS: DynamicFormField[] = [
  { id: 'b_loc', type: 'Text', label: 'Location', required: true, visible: true, placeholder: 'Enter location...' },
  { id: 'b_beh', type: 'TextArea', label: 'Behavior', required: true, visible: true, placeholder: 'Describe the behavior observed...' },
  { id: 'b_freq', type: 'Text', label: 'Frequency', required: true, visible: true, placeholder: 'Enter frequency...' },
  { id: 'b_int', type: 'Text', label: 'Intensity', required: true, visible: true, placeholder: 'Enter intensity...' },
  { id: 'b_cat', type: 'Text', label: 'Category', required: true, visible: true, placeholder: 'Enter category...' },
  { id: 'b_ant', type: 'Text', label: 'Antecedent', required: true, visible: true, placeholder: 'Enter antecedent...' },
  { id: 'b_con', type: 'Text', label: 'Consequence', required: true, visible: true, placeholder: 'Enter consequence...' },
  { id: 'b_notes', type: 'TextArea', label: 'Note', required: false, visible: true, placeholder: 'Enter any additional notes or relevant information...' },
];

export default function BehaviorIncidentModal({
  visible,
  studentId,
  studentGoalId,
  studentName = 'Student A',
  goalName = 'Identify Colors',
  recordedBy,
  onCancel,
  onSave,
}: BehaviorIncidentModalProps) {
  const { session: authSession } = useAuth();
  const defaultTeacher = recordedBy || authSession?.userName || 'Rosa Delgado';

  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());
  const [teacher, setTeacher] = useState(defaultTeacher);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [fields, setFields] = useState<DynamicFormField[]>(DEFAULT_INCIDENT_FIELDS);
  const [isValid, setIsValid] = useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const { data } = await getFormConfig('Behavior Incident Form');
      if (Array.isArray(data?.fields) && data.fields.length > 0) {
        const loaded = data.fields.filter((f: DynamicFormField) => f.visible !== false);
        const nonStandard = loaded.filter((f: DynamicFormField) => !['date', 'time', 'teacher'].includes((f.label || '').toLowerCase()));
        if (nonStandard.length === 0) {
          setFields(DEFAULT_INCIDENT_FIELDS);
        } else {
          setFields(loaded);
        }
      } else {
        setFields(DEFAULT_INCIDENT_FIELDS);
      }
    } catch {
      setFields(DEFAULT_INCIDENT_FIELDS);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadConfig();
      setDate(getCurrentDate());
      setTime(getCurrentTime());
      const initialTeacher = recordedBy || authSession?.userName || 'Rosa Delgado';
      setTeacher(initialTeacher);
      setFormValues({});
      setShowDiscardConfirmation(false);
    }
  }, [visible, recordedBy, authSession?.userName, loadConfig]);

  const isFormDirty =
    Object.values(formValues).some(
      (v) => v !== '' && v !== undefined && v !== null && (!Array.isArray(v) || v.length > 0)
    );

  const resetForm = () => {
    setDate(getCurrentDate());
    setTime(getCurrentTime());
    setTeacher(recordedBy || authSession?.userName || 'Rosa Delgado');
    setFormValues({});
    setShowDiscardConfirmation(false);
  };

  const handleCloseAttempt = () => {
    if (isFormDirty) {
      setShowDiscardConfirmation(true);
    } else {
      resetForm();
      onCancel(false);
    }
  };

  const handleConfirmDiscard = () => {
    resetForm();
    onCancel(true);
  };

  const handleSave = () => {
    const findFieldValue = (keys: string[]) => {
      for (const k of keys) {
        if (formValues[k] !== undefined && formValues[k] !== null && String(formValues[k]).trim() !== '') {
          return String(formValues[k]).trim();
        }
      }
      return '';
    };

    const location = findFieldValue(['Location', 'location', 'b_loc', 'b1']);
    const category = findFieldValue(['Category', 'category', 'b_cat', 'b2']);
    const behavior = findFieldValue(['Behavior', 'Observed Behavior', 'behavior', 'b_beh', 'b3']);
    const frequency = findFieldValue(['Frequency', 'frequency', 'b_freq', 'b4']);
    const intensity = findFieldValue(['Intensity', 'intensity', 'b_int', 'b5']);
    const antecedent = findFieldValue(['Antecedent', 'antecedent', 'b_ant', 'b6', 'Trigger', 'Trigger / Antecedent']);
    const consequence = findFieldValue(['Consequence', 'consequence', 'b_con', 'b7', 'Action Taken']);
    const note = findFieldValue(['Note', 'note', 'Additional Notes', 'Incident Notes', 'Notes', 'notes', 'additionalNotes', 'b_notes', 'b8']);

    onSave({
      student_id: studentId || (formValues['student_id'] ?? formValues['studentId'] ?? ''),
      studentId: studentId || (formValues['student_id'] ?? formValues['studentId'] ?? ''),
      student_goal_id: studentGoalId || (formValues['student_goal_id'] ?? formValues['studentGoalId'] ?? ''),
      studentGoalId: studentGoalId || (formValues['student_goal_id'] ?? formValues['studentGoalId'] ?? ''),
      date: date.trim() || getCurrentDate(),
      time: time.trim() || getCurrentTime(),
      teacher: teacher.trim() || recordedBy || authSession?.userName || 'Rosa Delgado',
      recordedBy: teacher.trim() || recordedBy || authSession?.userName || 'Rosa Delgado',
      location: location || (formValues['Location'] ?? ''),
      category: category || (formValues['Category'] ?? ''),
      behavior: behavior || (formValues['Behavior'] ?? formValues['Observed Behavior'] ?? ''),
      frequency: frequency || (formValues['Frequency'] ?? ''),
      intensity: intensity || (formValues['Intensity'] ?? ''),
      antecedent: antecedent || (formValues['Antecedent'] ?? ''),
      consequence: consequence || (formValues['Consequence'] ?? ''),
      note: note || (formValues['Note'] ?? formValues['Incident Notes'] ?? formValues['Additional Notes'] ?? ''),
      notes: note || (formValues['Note'] ?? formValues['Incident Notes'] ?? formValues['Additional Notes'] ?? ''),
      additionalNotes: note || (formValues['Note'] ?? formValues['Incident Notes'] ?? formValues['Additional Notes'] ?? ''),
      customFields: formValues,
      ...formValues,
    });
    resetForm();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleCloseAttempt}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Record Behavior Incident</Text>
              <Text style={styles.headerSubtitle}>
                {studentName} • {goalName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCloseAttempt}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Form Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Inputs: Date & Time */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.field, styles.colHalf]}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  onChangeText={setDate}
                />
              </View>

              <View style={[styles.field, styles.colHalf]}>
                <Text style={styles.label}>Time</Text>
                <TextInput
                  style={styles.input}
                  value={time}
                  placeholder="HH:MM AM/PM"
                  placeholderTextColor="#94A3B8"
                  onChangeText={setTime}
                />
              </View>
            </View>

            {/* Header Input: Teacher */}
            <View style={styles.field}>
              <Text style={styles.label}>Teacher</Text>
              <TextInput
                style={styles.input}
                value={teacher}
                placeholder="Teacher Name"
                placeholderTextColor="#94A3B8"
                onChangeText={setTeacher}
              />
            </View>

            {/* Dynamic FormBuilder Questions */}
            <DynamicFormFields
              key={visible ? 'open' : 'closed'}
              formName="Behavior Incident Form"
              initialFields={fields.length > 0 ? fields : undefined}
              values={formValues}
              onChange={(key, val) => setFormValues((prev) => ({ ...prev, [key]: val }))}
              onValidationChange={(valid) => setIsValid(valid)}
              excludeStandardLabels={['Date', 'Time', 'Teacher']}
            />
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseAttempt}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isValid && styles.saveBtnActive]}
              disabled={!isValid}
              onPress={handleSave}
              activeOpacity={isValid ? 0.8 : 1}
            >
              <Text
                style={[
                  styles.saveBtnText,
                  isValid && styles.saveBtnTextActive,
                ]}
              >
                Save Incident
              </Text>
            </TouchableOpacity>
          </View>

          {/* Discard Confirmation Alert Dialog */}
          {showDiscardConfirmation && (
            <View style={styles.confirmationOverlay}>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>Discard Changes?</Text>
                <Text style={styles.confirmMessage}>
                  You have unsaved changes. Are you sure you want to close?
                </Text>
                <View style={styles.confirmActionRow}>
                  <TouchableOpacity
                    style={styles.keepEditingBtn}
                    onPress={() => setShowDiscardConfirmation(false)}
                  >
                    <Text style={styles.keepEditingBtnText}>Keep Editing</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.discardBtn}
                    onPress={handleConfirmDiscard}
                  >
                    <Text style={styles.discardBtnText}>Discard</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 10,
        }),
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  scrollBody: {
    flexGrow: 1,
  },
  bodyContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 14,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  colHalf: {
    flex: 1,
  },
  field: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FDE047',
    opacity: 0.5,
  },
  saveBtnActive: {
    backgroundColor: '#FACC15',
    opacity: 1,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtnTextActive: {
    color: '#0F172A',
  },
  /* Discard Confirmation Overlay Styles */
  confirmationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    zIndex: 1000,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }),
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  keepEditingBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  keepEditingBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  discardBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#E11D48',
  },
  discardBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});