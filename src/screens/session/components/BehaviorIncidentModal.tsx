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
import { getAbcLists } from '../../../api/institutionalAdminApi';

export interface IncidentPayload {
  antecedent: string;
  behavior: string;
  consequence: string;
  additionalNotes: string;
}

interface BehaviorIncidentModalProps {
  visible: boolean;
  studentName?: string;
  goalName?: string;
  recordedBy?: string;
  onCancel: (hadChanges: boolean) => void;
  onSave: (data: IncidentPayload) => void;
}

const DEFAULT_ANTECEDENT_OPTIONS = [
  'Task demand',
  'Transition',
  'Peer interaction',
  'Denied access to preferred item',
  'Change in routine',
  'Loud noise',
  'Waiting',
  'Other',
];

const DEFAULT_CONSEQUENCE_OPTIONS = [
  'Redirected to task',
  'Offered break',
  'Ignored behavior',
  'Provided replacement behavior',
  'Removed from situation',
  'Discussed with student',
  'Other',
];

export default function BehaviorIncidentModal({
  visible,
  studentName = 'Student A',
  goalName = 'Identify Colors',
  onCancel,
  onSave,
}: BehaviorIncidentModalProps) {
  const [antecedent, setAntecedent] = useState('');
  const [otherAntecedent, setOtherAntecedent] = useState('');

  const [behavior, setBehavior] = useState('');

  const [consequence, setConsequence] = useState('');
  const [otherConsequence, setOtherConsequence] = useState('');

  const [additionalNotes, setAdditionalNotes] = useState('');

  const [showAntecedentDropdown, setShowAntecedentDropdown] = useState(false);
  const [showConsequenceDropdown, setShowConsequenceDropdown] = useState(false);

  // State to trigger "Discard Changes?" alert prompt
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);

  // Antecedent/Consequence options from Institutional Admin
  const [antecedentOptions, setAntecedentOptions] = useState<string[]>(DEFAULT_ANTECEDENT_OPTIONS);
  const [consequenceOptions, setConsequenceOptions] = useState<string[]>(DEFAULT_CONSEQUENCE_OPTIONS);

  const loadAbcOptions = useCallback(async () => {
    try {
      const { data } = await getAbcLists();
      if (Array.isArray(data.Antecedents)) {
        const opts = data.Antecedents.map((a: { name: string }) => a.name).filter(Boolean);
        if (opts.length > 0) setAntecedentOptions(['Other', ...opts]);
      }
      if (Array.isArray(data.Consequences)) {
        const opts = data.Consequences.map((c: { name: string }) => c.name).filter(Boolean);
        if (opts.length > 0) setConsequenceOptions(['Other', ...opts]);
      }
    } catch (err) {
      // Use defaults if API fails
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadAbcOptions();
    }
  }, [visible, loadAbcOptions]);

  const isFormDirty =
    antecedent !== '' ||
    otherAntecedent !== '' ||
    behavior !== '' ||
    consequence !== '' ||
    otherConsequence !== '' ||
    additionalNotes !== '';

  const finalAntecedent = antecedent === 'Other' ? otherAntecedent.trim() : antecedent.trim();
  const finalConsequence = consequence === 'Other' ? otherConsequence.trim() : consequence.trim();

  const isValid =
    finalAntecedent !== '' &&
    behavior.trim() !== '' &&
    finalConsequence !== '';

  const resetForm = () => {
    setAntecedent('');
    setOtherAntecedent('');
    setBehavior('');
    setConsequence('');
    setOtherConsequence('');
    setAdditionalNotes('');
    setShowAntecedentDropdown(false);
    setShowConsequenceDropdown(false);
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
    if (!isValid) return;

    onSave({
      antecedent: finalAntecedent,
      behavior: behavior.trim(),
      consequence: finalConsequence,
      additionalNotes: additionalNotes.trim(),
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
            {/* Antecedent Field */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Antecedent <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectBox,
                  showAntecedentDropdown && styles.selectBoxActive,
                ]}
                onPress={() => {
                  setShowConsequenceDropdown(false);
                  setShowAntecedentDropdown(!showAntecedentDropdown);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.selectText,
                    !antecedent && styles.placeholderText,
                  ]}
                >
                  {antecedent || 'Select antecedent...'}
                </Text>
                <Feather
                  name={showAntecedentDropdown ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#64748B"
                />
              </TouchableOpacity>

              {showAntecedentDropdown && (
                <View style={styles.inlineDropdownMenu}>
                  {antecedentOptions.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.dropdownItem,
                        antecedent === item && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setAntecedent(item);
                        if (item !== 'Other') setOtherAntecedent('');
                        setShowAntecedentDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {antecedent === 'Other' && (
                <TextInput
                  style={styles.specifyInput}
                  placeholder="Please specify..."
                  placeholderTextColor="#94A3B8"
                  value={otherAntecedent}
                  onChangeText={setOtherAntecedent}
                />
              )}
            </View>

            {/* Behavior Input */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Behavior <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe the behavior observed..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={behavior}
                onChangeText={setBehavior}
              />
            </View>

            {/* Consequence Field */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Consequence <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectBox,
                  showConsequenceDropdown && styles.selectBoxActive,
                ]}
                onPress={() => {
                  setShowAntecedentDropdown(false);
                  setShowConsequenceDropdown(!showConsequenceDropdown);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.selectText,
                    !consequence && styles.placeholderText,
                  ]}
                >
                  {consequence || 'Select consequence...'}
                </Text>
                <Feather
                  name={showConsequenceDropdown ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#64748B"
                />
              </TouchableOpacity>

              {showConsequenceDropdown && (
                <View style={styles.inlineDropdownMenu}>
                  {consequenceOptions.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.dropdownItem,
                        consequence === item && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setConsequence(item);
                        if (item !== 'Other') setOtherConsequence('');
                        setShowConsequenceDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {consequence === 'Other' && (
                <TextInput
                  style={styles.specifyInput}
                  placeholder="Please specify..."
                  placeholderTextColor="#94A3B8"
                  value={otherConsequence}
                  onChangeText={setOtherConsequence}
                />
              )}
            </View>

            {/* Additional Notes Input */}
            <View style={styles.field}>
              <Text style={styles.label}>Additional Notes</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Any additional context or observations..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
              />
            </View>
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
    maxWidth: 560,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
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
    gap: 16,
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
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  selectBoxActive: {
    borderColor: '#38BDF8',
  },
  selectText: {
    fontSize: 13,
    color: '#0F172A',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  inlineDropdownMenu: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemSelected: {
    backgroundColor: '#E0F2FE',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#0F172A',
  },
  specifyInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
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
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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