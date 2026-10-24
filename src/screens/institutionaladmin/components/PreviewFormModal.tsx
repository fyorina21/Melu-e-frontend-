import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import DynamicFormFields from '../../../components/DynamicFormFields';
import type { FormField } from '../../../types';

interface PreviewFormModalProps {
  visible: boolean;
  selectedForm: string;
  fields: FormField[];
  values: Record<string, any>;
  customSections?: string[];
  deletedSections?: string[];
  onChangeValue: (key: string, val: any) => void;
  onClose: () => void;
}

export const PreviewFormModal: React.FC<PreviewFormModalProps> = React.memo(
  ({
    visible,
    selectedForm,
    fields,
    values,
    customSections = [],
    deletedSections = [],
    onChangeValue,
    onClose,
  }) => {
    // View mode: 'step' (wizard stepper) or 'all' (all pages stacked together)
    const [viewMode, setViewMode] = useState<'step' | 'all'>('step');
    // Current step index within the preview
    const [step, setStep] = useState<number>(0);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Reset step whenever modal opens or form changes
    useEffect(() => {
      if (visible) {
        setStep(0);
        setToastMessage(null);
      }
    }, [visible, selectedForm]);

    const showPreviewToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
    };

    const setValue = (key: string, val: any) => {
      onChangeValue(key, val);
    };

    // Derive active sections dynamically from fields and custom sections, filtering out deleted ones
    const activeSections = useMemo(() => {
      const secSet = new Set<string>();
      fields.forEach((f) => {
        if (f.section && f.visible !== false) {
          secSet.add(f.section.trim());
        }
      });
      customSections.forEach((s) => {
        if (s && !deletedSections.includes(s)) {
          secSet.add(s.trim());
        }
      });

      if (selectedForm === 'Enrollment Wizard') {
        const canonical = ['Student Info', 'Parent Info', 'Medical Info', 'Program Placement'];
        const ordered: string[] = [];
        canonical.forEach((c) => {
          if (
            (secSet.has(c) || fields.some((f) => f.section?.toLowerCase() === c.toLowerCase())) &&
            !deletedSections.includes(c)
          ) {
            ordered.push(c);
            secSet.delete(c);
          }
        });
        secSet.forEach((s) => {
          if (
            !deletedSections.includes(s) &&
            !['Assign Therapist', 'Review', 'Review & Complete'].includes(s)
          ) {
            ordered.push(s);
          }
        });
        if (!deletedSections.includes('Assign Therapist')) ordered.push('Assign Therapist');
        if (!deletedSections.includes('Review')) ordered.push('Review');
        return ordered.length > 0 ? ordered : ['General'];
      }

      // Assessment / other forms
      const norm = selectedForm.toLowerCase();
      let preferred: string[] = [];
      if (norm.includes('ablls')) {
        preferred = [
          'Visual Performance',
          'Motor Imitation',
          'Vocal Imitation',
          'Receptive Language',
          'Requesting (Mands)',
          'Play and Leisure',
          'Social Interaction',
          'Writing',
          'Dressing',
          'General',
        ];
      } else if (norm.includes('behavioral')) {
        preferred = ['Incident Details', 'ABC Tracking', 'MASS', 'FAST', 'General'];
      } else if (norm.includes('sensory')) {
        preferred = ['Tactile', 'Visual & Auditory', 'Proprioception & Vestibular', 'General'];
      } else if (norm.includes('preference')) {
        preferred = ['Visual', 'Auditory', 'Tactile', 'Toys', 'Movement', 'General'];
      } else if (norm.includes('social')) {
        preferred = ['Social Interaction', 'Communication', 'Play & Leisure', 'General'];
      } else if (norm.includes('incident')) {
        preferred = ['ABC Incident Log', 'Summary & Actions'];
      } else if (norm.includes('iup')) {
        preferred = [
          'Student & Assessment Summary',
          'Reinforcement & Behavioral Strategies',
          'Target Goals & Milestones',
          'Review & Approvals',
        ];
      }

      if (preferred.length > 0) {
        const ordered: string[] = [];
        preferred.forEach((p) => {
          if (
            (secSet.has(p) || fields.some((f) => f.section?.toLowerCase() === p.toLowerCase())) &&
            !deletedSections.includes(p)
          ) {
            ordered.push(p);
            secSet.delete(p);
          }
        });
        secSet.forEach((s) => {
          if (!deletedSections.includes(s)) ordered.push(s);
        });
        return ordered.length > 0 ? ordered : ['General'];
      }

      const list = Array.from(secSet).filter((s) => !deletedSections.includes(s));
      return list.length > 0 ? list : ['General'];
    }, [selectedForm, fields, customSections, deletedSections]);

    const currentStepName = activeSections[step] || activeSections[0] || 'General';

    // Get active fields strictly matching the specified section
    const getFieldsForSection = (sectionName: string) => {
      const target = sectionName.toLowerCase().trim();
      return fields.filter((f) => {
        if (f.visible === false) return false;
        const fSec = (f.section || '').toLowerCase().trim();
        if (fSec === target) return true;
        if (!f.section && (sectionName === 'General' || sectionName === activeSections[0])) {
          return true;
        }
        return false;
      });
    };

    const currentStepFields = useMemo(() => {
      return getFieldsForSection(currentStepName);
    }, [fields, currentStepName, activeSections]);

    // Handle next step
    const handleNext = () => {
      if (step < activeSections.length - 1) {
        setStep(step + 1);
      } else {
        showPreviewToast(`Form verification complete! Preview verified successfully.`);
      }
    };

    const handleBack = () => {
      if (step > 0) {
        setStep(step - 1);
      }
    };

    // Render section content dynamically (strictly using configured fields)
    const renderSectionContent = (sectionName: string, secIdx: number) => {
      // Step: Review & Complete (Summary view of all configured fields and entered values)
      if (sectionName === 'Review' || sectionName === 'Review & Complete') {
        const activeFormFields = fields.filter((f) => f.visible !== false);
        return (
          <View style={styles.sectionWrap}>
            <View style={styles.reviewBanner}>
              <Feather name="check-circle" size={20} color="#0284C7" />
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewBannerTitle}>Review Form Entries</Text>
                <Text style={styles.reviewBannerSub}>
                  Confirm all {activeFormFields.length} configured fields below before submitting.
                </Text>
              </View>
            </View>

            <View style={styles.reviewTable}>
              {activeFormFields.map((f, idx) => {
                const val = values[f.id] !== undefined ? values[f.id] : values[f.label];
                let displayVal = '—';
                if (val !== undefined && val !== null && val !== '') {
                  displayVal = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val);
                }
                return (
                  <View
                    key={f.id || `f-${idx}`}
                    style={[styles.reviewRow, idx % 2 === 1 && styles.reviewRowAlt]}
                  >
                    <View style={styles.reviewColLabel}>
                      <Text style={styles.reviewFieldLabel}>{f.label}</Text>
                      <Text style={styles.reviewFieldMeta}>
                        {f.section || 'General'} · {f.type} {f.required ? '· Required' : ''}
                      </Text>
                    </View>
                    <View style={styles.reviewColValue}>
                      <Text style={styles.reviewFieldValue}>{displayVal}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      }

      // Standard / Custom Form Section: Render ONLY active configured fields
      const secFields = getFieldsForSection(sectionName);
      if (secFields.length === 0) {
        return (
          <View style={styles.emptyDomainBox}>
            <Feather name="info" size={18} color="#94A3B8" />
            <Text style={styles.emptyDomainText}>
              No items in &quot;{sectionName}&quot;. You can add fields to this section in Form
              Builder.
            </Text>
          </View>
        );
      }

      return (
        <DynamicFormFields
          formName={selectedForm}
          section={sectionName}
          initialFields={secFields}
          values={values}
          onChange={setValue}
          showSectionHeader={false}
        />
      );
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Top Modal Header */}
            <View style={styles.topHeader}>
              <View style={styles.topHeaderTitleRow}>
                <View style={styles.previewBadge}>
                  <Feather name="eye" size={13} color="#0284C7" />
                  <Text style={styles.previewBadgeText}>LIVE USER VIEW</Text>
                </View>
                <Text style={styles.modalMainTitle}>{selectedForm}</Text>
              </View>

              {/* View Mode Toggle: Step-by-Step vs All Pages Together */}
              <View style={styles.viewModeSwitcher}>
                <TouchableOpacity
                  style={[styles.viewModeBtn, viewMode === 'step' && styles.viewModeBtnActive]}
                  onPress={() => setViewMode('step')}
                  accessibilityRole="button"
                  accessibilityLabel="Switch to step-by-step wizard view"
                >
                  <Feather
                    name="layers"
                    size={12}
                    color={viewMode === 'step' ? '#0284C7' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.viewModeBtnText,
                      viewMode === 'step' && styles.viewModeBtnTextActive,
                    ]}
                  >
                    Step-by-Step
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.viewModeBtn, viewMode === 'all' && styles.viewModeBtnActive]}
                  onPress={() => setViewMode('all')}
                  accessibilityRole="button"
                  accessibilityLabel="Switch to all pages stacked together view"
                >
                  <Feather
                    name="file-text"
                    size={12}
                    color={viewMode === 'all' ? '#0284C7' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.viewModeBtnText,
                      viewMode === 'all' && styles.viewModeBtnTextActive,
                    ]}
                  >
                    All Pages Together
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeHeaderBtn}
                accessibilityRole="button"
                accessibilityLabel="Close live preview"
              >
                <Feather name="x" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* In-Modal Toast Banner */}
            {Boolean(toastMessage) && (
              <View style={styles.toastBanner}>
                <Feather name="check-circle" size={14} color="#059669" />
                <Text style={styles.toastBannerText}>{toastMessage}</Text>
              </View>
            )}

            {/* Stepper Indicator (shown only in Step-by-Step mode) */}
            {viewMode === 'step' && (
              <View style={styles.stepperContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stepperScroll}
                >
                  {activeSections.map((st, idx) => {
                    const isDone = idx < step;
                    const isCurrent = idx === step;
                    return (
                      <TouchableOpacity
                        key={st + idx}
                        style={styles.stepItem}
                        onPress={() => setStep(idx)}
                        accessibilityRole="button"
                        accessibilityLabel={`Jump to step ${idx + 1}: ${st}`}
                      >
                        <View style={styles.stepCircleRow}>
                          <View
                            style={[
                              styles.stepCircle,
                              isDone && styles.stepCircleDone,
                              isCurrent && styles.stepCircleCurrent,
                            ]}
                          >
                            {isDone ? (
                              <Feather name="check" size={12} color="#FFFFFF" />
                            ) : (
                              <Text
                                style={[
                                  styles.stepCircleNum,
                                  isCurrent && styles.stepCircleNumCurrent,
                                ]}
                              >
                                {idx + 1}
                              </Text>
                            )}
                          </View>
                          {idx < activeSections.length - 1 && (
                            <View
                              style={[styles.stepConnector, isDone && styles.stepConnectorDone]}
                            />
                          )}
                        </View>
                        <Text
                          numberOfLines={1}
                          style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Main Content Body */}
            <ScrollView
              style={styles.modalScrollBody}
              contentContainerStyle={{ overflow: 'visible', paddingBottom: spacing.xl }}
              showsVerticalScrollIndicator={false}
            >
              {/* STEP-BY-STEP MODE */}
              {viewMode === 'step' && (
                <View style={styles.stepCard}>
                  <View style={styles.stepCardHeader}>
                    <View>
                      <Text style={styles.stepCardHeaderTitle}>
                        Step {step + 1}: {currentStepName}
                      </Text>
                      <Text style={styles.stepCardHeaderSubtitle}>
                        {selectedForm === 'Enrollment Wizard'
                          ? 'Melue Foundation Clinical Intake & Registration'
                          : `Evaluating ${selectedForm} items`}
                      </Text>
                    </View>
                    <View style={styles.fieldCountBadge}>
                      <Text style={styles.fieldCountBadgeText}>
                        {currentStepFields.length} fields
                      </Text>
                    </View>
                  </View>

                  <View style={styles.formContentContainer}>
                    {renderSectionContent(currentStepName, step)}
                  </View>
                </View>
              )}

              {/* ALL PAGES TOGETHER MODE */}
              {viewMode === 'all' && (
                <View style={{ gap: spacing.lg, paddingBottom: spacing.xl }}>
                  <View style={styles.allPagesSummaryCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={styles.docIconBox}>
                        <Feather name="file-text" size={20} color="#0284C7" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.allPagesTitle}>{selectedForm}</Text>
                        <Text style={styles.allPagesSubtitle}>
                          Full Sequential Document · {activeSections.length} Sections ·{' '}
                          {fields.filter((f) => f.visible !== false).length} Active Fields
                        </Text>
                      </View>
                    </View>
                  </View>

                  {activeSections.map((secName, sIdx) => {
                    const secFields = getFieldsForSection(secName);
                    return (
                      <View key={`all-sec-${secName}-${sIdx}`} style={styles.stepCard}>
                        <View style={styles.stepCardHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={styles.secNumberPill}>
                              <Text style={styles.secNumberPillText}>{sIdx + 1}</Text>
                            </View>
                            <Text style={styles.stepCardHeaderTitle}>{secName}</Text>
                          </View>
                          <Text style={styles.fieldCountBadgeText}>
                            {secFields.length} controls
                          </Text>
                        </View>

                        <View style={styles.formContentContainer}>
                          {renderSectionContent(secName, sIdx)}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Modal Bottom Actions Row */}
            <View style={styles.modalFooter}>
              <View style={styles.footerLeft}>
                {viewMode === 'step' && step > 0 && (
                  <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Feather name="arrow-left" size={14} color="#1E293B" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.footerRight}>
                <TouchableOpacity
                  style={styles.saveDraftBtn}
                  onPress={() => showPreviewToast('Draft saved in local session')}
                >
                  <Feather name="bookmark" size={13} color="#0284C7" />
                  <Text style={styles.saveDraftBtnText}>Save Progress</Text>
                </TouchableOpacity>

                {viewMode === 'step' ? (
                  <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <Text style={styles.nextBtnText}>
                      {step === activeSections.length - 1 ? 'Finish & Verify' : 'Next Step'}
                    </Text>
                    <Feather
                      name={step === activeSections.length - 1 ? 'check' : 'arrow-right'}
                      size={14}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => showPreviewToast('All pages verified successfully!')}
                  >
                    <Feather name="check" size={14} color="#FFFFFF" />
                    <Text style={styles.nextBtnText}>Verify Complete Form</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    width: '95%',
    maxWidth: 920,
    maxHeight: '94%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  topHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  modalMainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewModeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.sm,
    padding: 3,
    gap: 4,
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.xs || 4,
  },
  viewModeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  viewModeBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  viewModeBtnTextActive: {
    fontWeight: '600',
    color: '#0284C7',
  },
  closeHeaderBtn: {
    padding: 6,
    borderRadius: radius.sm,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },
  toastBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  stepperScroll: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepItem: {
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 90,
  },
  stepCircleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleDone: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  stepCircleCurrent: {
    backgroundColor: '#FCD34D',
    borderColor: '#D97706',
  },
  stepCircleNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  stepCircleNumCurrent: {
    color: '#78350F',
  },
  stepConnector: {
    width: 32,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  stepConnectorDone: {
    backgroundColor: '#0284C7',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    fontWeight: '700',
    color: '#0F172A',
  },
  modalScrollBody: {
    flex: 1,
    padding: spacing.lg,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'visible',
    marginBottom: spacing.md,
  },
  stepCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  stepCardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepCardHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  fieldCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  fieldCountBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  secNumberPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secNumberPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  allPagesSummaryCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  docIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allPagesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0369A1',
  },
  allPagesSubtitle: {
    fontSize: 12,
    color: '#0284C7',
    marginTop: 2,
  },
  formContentContainer: {
    padding: spacing.lg,
  },
  sectionWrap: {
    gap: spacing.md,
  },
  sectionInstructions: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  therapistGrid: {
    gap: 12,
  },
  therapistCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  therapistCardActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  therapistCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  therapistAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  therapistName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  therapistNameActive: {
    color: '#0284C7',
  },
  therapistSpecialty: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  caseloadBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs || 4,
    marginTop: 8,
  },
  caseloadText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reviewBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
  },
  reviewBannerSub: {
    fontSize: 12,
    color: '#0284C7',
    marginTop: 2,
  },
  reviewTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  reviewRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  reviewRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  reviewColLabel: {
    flex: 1,
  },
  reviewFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  reviewFieldMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  reviewColValue: {
    flex: 1,
    alignItems: 'flex-end',
  },
  reviewFieldValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  emptyDomainBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
  },
  emptyDomainText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  saveDraftBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: '#0284C7',
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
