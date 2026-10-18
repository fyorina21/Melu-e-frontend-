import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../../theme/colors';
import { getDefaultFormConfig } from '../../../api/institutionalAdminApi';
import type { FormField } from '../../../types';

export interface FormTemplateVersion {
  id: string;
  formNumber: string;
  title: string;
  versionNumber: string;
  updatedDate: string;
  author: string;
  fields: FormField[];
  isDefault?: boolean;
}

interface TemplateVersionModalProps {
  visible: boolean;
  selectedForm: string;
  currentFields: FormField[];
  history: Array<{ date: string; user: string; field: string; oldValue: string; newValue: string }>;
  formId?: string;
  formRevision?: string;
  formName?: string;
  onClose: () => void;
  onReuseTemplate: (templateName: string, fields: FormField[]) => void;
  onImportJson?: (importedFields: FormField[]) => void;
  onImportPdf?: (file: { name: string; size: number }) => void;
}

export const TemplateVersionModal: React.FC<TemplateVersionModalProps> = React.memo(
  ({
    visible,
    selectedForm,
    currentFields,
    history,
    formId = 'FORM-001',
    formRevision = '1.0.0',
    formName,
    onClose,
    onReuseTemplate,
    onImportPdf,
  }) => {
    const [activeTab, setActiveTab] = useState<'versions' | 'upload_pdf' | 'export_pdf'>(
      'versions',
    );

    // Inspected version state for the "View" button modal
    const [inspectingVersion, setInspectingVersion] = useState<FormTemplateVersion | null>(null);

    // PDF Upload State
    const [uploadedPdf, setUploadedPdf] = useState<{
      name: string;
      size: string;
      status: 'idle' | 'uploading' | 'ready';
    } | null>(null);

    const defaultCfg = getDefaultFormConfig(selectedForm);
    const defaultFields = (defaultCfg?.fields || []) as FormField[];

    const groupedSections = React.useMemo(() => {
      const groups: Record<string, FormField[]> = {};
      currentFields.forEach((f) => {
        if (f.visible === false) return;
        const sec = f.section?.trim() || 'General';
        if (!groups[sec]) groups[sec] = [];
        groups[sec].push(f);
      });
      return Object.entries(groups);
    }, [currentFields]);

    // Multi-version history state dynamically built from real form state
    const today = new Date().toISOString().split('T')[0];
    const [versionList, setVersionList] = useState<FormTemplateVersion[]>(() => {
      const list: FormTemplateVersion[] = [
        {
          id: 'ver-current',
          formNumber: formId || 'FORM-001',
          title: formName || selectedForm,
          versionNumber: formRevision.startsWith('v') ? formRevision : `v${formRevision}`,
          updatedDate: today,
          author: 'Institutional Admin',
          fields: currentFields,
          isDefault: false,
        },
      ];
      if (defaultFields && defaultFields.length > 0) {
        list.push({
          id: 'ver-default',
          formNumber: formId || 'FORM-001',
          title: `${formName || selectedForm} (System Template)`,
          versionNumber: 'v1.0.0',
          updatedDate: today,
          author: 'System Default',
          fields: defaultFields,
          isDefault: true,
        });
      }
      return list;
    });

    React.useEffect(() => {
      setVersionList((prev) =>
        prev.map((v) =>
          v.id === 'ver-current'
            ? {
                ...v,
                formNumber: formId || 'FORM-001',
                title: formName || selectedForm,
                versionNumber: formRevision.startsWith('v') ? formRevision : `v${formRevision}`,
                fields: currentFields,
              }
            : v,
        ),
      );
    }, [formId, formName, selectedForm, formRevision, currentFields]);

    const handleApplyVersion = (version: FormTemplateVersion) => {
      onReuseTemplate(`${version.title} (${version.versionNumber})`, version.fields);
      onClose();
    };

    const handleSimulatePdfUpload = () => {
      setUploadedPdf({
        name: `${selectedForm.toLowerCase().replace(/\s+/g, '_')}_spec.pdf`,
        size: '2.4 MB',
        status: 'uploading',
      });
      setTimeout(() => {
        setUploadedPdf({
          name: `${selectedForm.toLowerCase().replace(/\s+/g, '_')}_spec.pdf`,
          size: '2.4 MB',
          status: 'ready',
        });
        onImportPdf?.({ name: `${selectedForm}_spec.pdf`, size: 2400000 });
      }, 700);
    };

    const handleExportPdf = () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const renderHtmlControl = (f: FormField) => {
            const norm = (f.type || '').toLowerCase().replace(/[- ]/g, '_');
            const opts: string[] =
              Array.isArray(f.options) && f.options.length > 0
                ? f.options
                : ['Option 1', 'Option 2', 'Option 3'];

            if (norm === 'textarea') {
              return `<div style="border: 1px solid #CBD5E1; border-radius: 4px; background: #FFFFFF; height: 54px; padding: 6px 8px; font-size: 11px; color: #94A3B8;">${f.placeholder || 'Enter notes or detailed observations…'}</div>`;
            }
            if (norm === 'phone') {
              return `<div style="display: flex; align-items: center; border: 1px solid #CBD5E1; border-radius: 4px; background: #FFFFFF; overflow: hidden;"><span style="background: #F1F5F9; padding: 5px 8px; font-size: 11px; font-weight: bold; border-right: 1px solid #CBD5E1;">🇪🇹 +251</span><span style="padding: 5px 8px; font-size: 11px; color: #94A3B8;">${f.placeholder || '91 234 5678'}</span></div>`;
            }
            if (norm === 'date') {
              return `<div style="display: flex; justify-content: space-between; align-items: center; border: 1px solid #CBD5E1; border-radius: 4px; background: #FFFFFF; padding: 5px 8px; font-size: 11px;"><span style="color: #94A3B8;">${f.placeholder || 'YYYY-MM-DD'}</span><span style="color: #0284C7; font-size: 12px;">📅 Today</span></div>`;
            }
            if (norm === 'dropdown' || norm === 'select') {
              return `<div style="display: flex; justify-content: space-between; align-items: center; border: 1px solid #CBD5E1; border-radius: 4px; background: #FFFFFF; padding: 5px 8px; font-size: 11px;"><span style="color: #64748B;">Select ${f.label}…</span><span style="color: #64748B; font-size: 10px;">▼</span></div>`;
            }
            if (norm === 'radio') {
              return `<div style="display: flex; flex-wrap: wrap; gap: 6px;">${opts
                .slice(0, 4)
                .map(
                  (o: string) =>
                    `<span style="display: inline-flex; align-items: center; gap: 4px; border: 1px solid #CBD5E1; padding: 3px 8px; border-radius: 12px; font-size: 10px; background: #FFFFFF;"><span style="width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid #94A3B8; display: inline-block;"></span>${o}</span>`,
                )
                .join('')}</div>`;
            }
            if (norm === 'checkbox' || norm === 'checkbox_group') {
              return `<div style="display: flex; align-items: center; gap: 6px;"><span style="width: 14px; height: 14px; border: 1.5px solid #0284C7; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; color: #0284C7;">✓</span><span style="font-size: 11px; color: #475569;">${f.placeholder || f.label}</span></div>`;
            }
            if (norm === 'switch') {
              return `<div style="display: flex; justify-content: space-between; align-items: center; border: 1px solid #CBD5E1; border-radius: 4px; background: #FFFFFF; padding: 5px 8px; font-size: 11px;"><span style="color: #64748B;">Enabled / Disabled</span><span style="display: inline-block; width: 28px; height: 16px; background: #BAE6FD; border-radius: 8px; position: relative;"><span style="display: inline-block; width: 12px; height: 12px; background: #0284C7; border-radius: 50%; position: absolute; top: 2px; right: 2px;"></span></span></div>`;
            }
            if (norm === 'file' || norm === 'fileupload' || norm === 'file_upload') {
              return `<div style="display: flex; align-items: center; gap: 6px; border: 1px solid #CBD5E1; border-radius: 4px; background: #FFFFFF; padding: 4px 8px;"><span style="background: #E2E8F0; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;">Choose File</span><span style="font-size: 10px; color: #94A3B8;">${f.placeholder || 'No file chosen'}</span></div>`;
            }
            if (norm === 'image' || norm === 'image_picker' || norm === 'imagepicker') {
              return `<div style="display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px dashed #BAE6FD; background: #F0F9FF; border-radius: 4px; padding: 8px; color: #0284C7; font-size: 11px; font-weight: 600;">📷 Select / Capture Image</div>`;
            }
            if (norm === 'counter') {
              return `<div style="display: flex; align-items: center; gap: 8px;"><button style="width: 28px; height: 28px; border: 1px solid #CBD5E1; background: #F8FAFC; border-radius: 4px; font-weight: bold; color: #475569; font-size: 14px;">−</button><span style="min-width: 44px; text-align: center; font-weight: bold; font-size: 13px; color: #0F172A; border: 1px solid #E2E8F0; padding: 4px 8px; border-radius: 4px; background: #FFFFFF;">0</span><button style="width: 28px; height: 28px; border: 1px solid #CBD5E1; background: #F8FAFC; border-radius: 4px; font-weight: bold; color: #475569; font-size: 14px;">+</button></div>`;
            }
            if (norm === 'timer') {
              return `<div style="display: flex; align-items: center; gap: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px 10px; border-radius: 6px;"><span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #0284C7;">⏱ 00:00</span><span style="display: inline-flex; gap: 4px;"><span style="background: #E0F2FE; color: #0369A1; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">Start</span><span style="background: #FEF3C7; color: #B45309; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">Pause</span><span style="background: #FEE2E2; color: #DC2626; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">Reset</span></span></div>`;
            }
            return `<div style="border: 1px solid #CBD5E1; height: 26px; background: #FFFFFF; border-radius: 4px; padding: 4px 8px; font-size: 11px; color: #94A3B8;">${f.placeholder || `[ ${f.type} Input ]`}</div>`;
          };

          const sectionsHtml = groupedSections
            .map(
              ([secName, secFields], sIdx) => `
            <div style="margin-bottom: 24px; page-break-inside: avoid;">
              <div style="background: #F1F5F9; padding: 8px 12px; border-radius: 4px; border-left: 4px solid #0284C7; margin-bottom: 12px; font-weight: bold; font-size: 14px; color: #0F172A;">
                Section ${sIdx + 1}: ${secName} (${secFields.length} fields)
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                ${secFields
                  .map(
                    (f) => `
                  <div style="border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px; background: #FAFAFA;">
                    <div style="font-size: 12px; font-weight: 600; color: #1E293B; margin-bottom: 4px;">
                      ${f.label} ${f.required ? '<span style="color:#DC2626;">*</span>' : ''}
                    </div>
                    <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">Type: ${f.type}</div>
                    ${renderHtmlControl(f)}
                  </div>
                `,
                  )
                  .join('')}
              </div>
            </div>
          `,
            )
            .join('');

          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>${selectedForm} - Complete Form Layout Specification</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 36px; color: #0F172A; }
                  .header { border-bottom: 2px solid #0284C7; padding-bottom: 14px; margin-bottom: 20px; }
                  .header h1 { margin: 0; font-size: 22px; color: #0F172A; }
                  .header p { margin: 4px 0 0; color: #64748B; font-size: 13px; }
                  .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; background: #F8FAFC; padding: 12px; border-radius: 6px; }
                  .meta-item { font-size: 12px; }
                  .meta-label { color: #64748B; text-transform: uppercase; font-weight: bold; font-size: 10px; }
                  .meta-value { font-weight: 600; color: #0F172A; margin-top: 2px; }
                  @media print {
                    body { padding: 15px; }
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>${selectedForm}</h1>
                  <p>Official Institutional Form Specification & Live Multi-Page Layout</p>
                </div>
                <div class="meta-grid">
                  <div class="meta-item"><div class="meta-label">Form Number</div><div class="meta-value">${formId}</div></div>
                  <div class="meta-item"><div class="meta-label">Version</div><div class="meta-value">${formRevision.startsWith('v') ? formRevision : `v${formRevision}`}</div></div>
                  <div class="meta-item"><div class="meta-label">Export Date</div><div class="meta-value">${new Date().toISOString().split('T')[0]}</div></div>
                  <div class="meta-item"><div class="meta-label">Total Fields</div><div class="meta-value">${currentFields.length} Controls (${groupedSections.length} Sections)</div></div>
                </div>
                ${sectionsHtml}
              </body>
            </html>
          `;
          printWindow.document.write(html);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      }
    };

    const renderPreviewFieldMock = (f: FormField, key: string) => {
      const normType = (f.type || '').toLowerCase().replace(/[- ]/g, '_');
      const opts: string[] =
        Array.isArray(f.options) && f.options.length > 0
          ? f.options
          : ['Option 1', 'Option 2', 'Option 3'];

      return (
        <View key={key} style={styles.exportFieldCard}>
          <View style={styles.exportFieldHeaderRow}>
            <Text style={styles.exportFieldLabel} numberOfLines={1}>
              {f.label}
              {f.required && <Text style={{ color: '#EF4444' }}> *</Text>}
            </Text>
            <View style={styles.exportFieldTypeBadge}>
              <Text style={styles.exportFieldTypeBadgeText}>{f.type}</Text>
            </View>
          </View>

          {/* Authentic Control Mockup matching Live Preview */}
          {normType === 'textarea' ? (
            <View style={styles.exportTextareaMock}>
              <Text style={styles.exportMockPlaceholder} numberOfLines={2}>
                {f.placeholder || `Enter ${f.label.toLowerCase()}...`}
              </Text>
            </View>
          ) : normType === 'phone' ? (
            <View style={styles.exportPhoneMock}>
              <View style={styles.exportEthBadge}>
                <Text style={styles.exportEthBadgeText}>🇪🇹 +251</Text>
              </View>
              <Text style={styles.exportMockPlaceholder}>{f.placeholder || '91 234 5678'}</Text>
            </View>
          ) : normType === 'date' ? (
            <View style={styles.exportInputMock}>
              <Text style={styles.exportMockPlaceholder}>{f.placeholder || 'YYYY-MM-DD'}</Text>
              <View style={styles.exportDateIconBox}>
                <Feather name="calendar" size={13} color="#0284C7" />
              </View>
            </View>
          ) : normType === 'dropdown' || normType === 'select' ? (
            <View style={styles.exportInputMock}>
              <Text style={styles.exportMockPlaceholder} numberOfLines={1}>
                {f.placeholder || `Select ${f.label}...`}
              </Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </View>
          ) : normType === 'radio' ? (
            <View style={styles.exportOptionRow}>
              {opts.slice(0, 4).map((opt: string, oIdx: number) => (
                <View key={oIdx} style={styles.exportOptionPill}>
                  <View style={styles.exportRadioDot} />
                  <Text style={styles.exportOptionText} numberOfLines={1}>
                    {opt}
                  </Text>
                </View>
              ))}
            </View>
          ) : normType === 'checkbox' || normType === 'checkbox_group' ? (
            <View style={styles.exportCheckboxRow}>
              <View style={styles.exportCheckboxSquare}>
                <Feather name="check" size={10} color="#0284C7" />
              </View>
              <Text style={styles.exportMockPlaceholder}>{f.placeholder || f.label}</Text>
            </View>
          ) : normType === 'switch' ? (
            <View style={styles.exportSwitchRow}>
              <Text style={styles.exportMockPlaceholder}>Enabled / Disabled</Text>
              <View style={styles.exportSwitchTrack}>
                <View style={styles.exportSwitchThumb} />
              </View>
            </View>
          ) : normType === 'file' || normType === 'fileupload' || normType === 'file_upload' ? (
            <View style={styles.exportFileRow}>
              <View style={styles.exportFileBtn}>
                <Feather name="upload" size={11} color="#0F172A" />
                <Text style={styles.exportFileBtnText}>Choose File</Text>
              </View>
              <Text style={styles.exportMockPlaceholder} numberOfLines={1}>
                {f.placeholder || 'No file chosen'}
              </Text>
            </View>
          ) : normType === 'image' || normType === 'image_picker' || normType === 'imagepicker' ? (
            <View style={styles.exportImageMock}>
              <Feather name="camera" size={14} color="#0284C7" />
              <Text style={styles.exportImageMockText}>Select / Capture Image</Text>
            </View>
          ) : normType === 'counter' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: '#CBD5E1',
                  backgroundColor: '#F8FAFC',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#475569' }}>−</Text>
              </View>
              <View
                style={{
                  minWidth: 44,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: '#CBD5E1',
                  borderRadius: 4,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>0</Text>
              </View>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: '#CBD5E1',
                  backgroundColor: '#F8FAFC',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#475569' }}>+</Text>
              </View>
            </View>
          ) : normType === 'timer' ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  fontWeight: '700',
                  color: '#0284C7',
                }}
              >
                ⏱ 00:00
              </Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <View
                  style={{
                    backgroundColor: '#E0F2FE',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 3,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#0369A1' }}>Start</Text>
                </View>
                <View
                  style={{
                    backgroundColor: '#FEF3C7',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 3,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309' }}>Pause</Text>
                </View>
                <View
                  style={{
                    backgroundColor: '#FEE2E2',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 3,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>Reset</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.exportInputMock}>
              <Text style={styles.exportMockPlaceholder} numberOfLines={1}>
                {f.placeholder || `Enter ${f.label.toLowerCase()}...`}
              </Text>
            </View>
          )}
        </View>
      );
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Templates & Version Management</Text>
                <Text style={styles.modalSubtitle}>
                  Multi-version retention explorer, PDF document import, and PDF export
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close template modal"
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Architecture Storage Notice */}
            <View style={styles.storageNoticeBox}>
              <Feather name="database" size={14} color="#0284C7" />
              <Text style={styles.storageNoticeText}>
                <Text style={{ fontWeight: '700' }}>Persistence Architecture:</Text> Form JSON
                schemas and revision metadata are stored in PostgreSQL (
                <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  form_configurations
                </Text>
                ). PDF attachments and exports are managed via Object Storage.
              </Text>
            </View>

            {/* Navigation Tabs */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'versions' && styles.tabBtnActive]}
                onPress={() => setActiveTab('versions')}
                accessibilityRole="button"
                accessibilityLabel="Version History tab"
              >
                <Feather
                  name="clock"
                  size={14}
                  color={activeTab === 'versions' ? '#0F172A' : '#64748B'}
                />
                <Text style={[styles.tabText, activeTab === 'versions' && styles.tabTextActive]}>
                  Version History ({versionList.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'upload_pdf' && styles.tabBtnActive]}
                onPress={() => setActiveTab('upload_pdf')}
                accessibilityRole="button"
                accessibilityLabel="PDF Upload tab"
              >
                <Feather
                  name="file-plus"
                  size={14}
                  color={activeTab === 'upload_pdf' ? '#0F172A' : '#64748B'}
                />
                <Text style={[styles.tabText, activeTab === 'upload_pdf' && styles.tabTextActive]}>
                  PDF Upload
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'export_pdf' && styles.tabBtnActive]}
                onPress={() => setActiveTab('export_pdf')}
                accessibilityRole="button"
                accessibilityLabel="PDF Export tab"
              >
                <Feather
                  name="file-text"
                  size={14}
                  color={activeTab === 'export_pdf' ? '#0F172A' : '#64748B'}
                />
                <Text style={[styles.tabText, activeTab === 'export_pdf' && styles.tabTextActive]}>
                  PDF Export
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: VERSION HISTORY EXPLORER */}
            {activeTab === 'versions' && (
              <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                <View style={styles.versionTable}>
                  <View style={styles.tableHead}>
                    <Text style={[styles.tableColHeader, { flex: 2 }]}>FORM NUMBER</Text>
                    <Text style={[styles.tableColHeader, { flex: 3 }]}>TITLE</Text>
                    <Text style={[styles.tableColHeader, { flex: 2 }]}>VERSION</Text>
                    <Text style={[styles.tableColHeader, { flex: 2 }]}>UPDATED DATE</Text>
                    <Text style={[styles.tableColHeader, { flex: 2 }]}>AUTHOR</Text>
                    <Text style={[styles.tableColHeader, { flex: 3, textAlign: 'right' }]}>
                      ACTIONS
                    </Text>
                  </View>

                  {versionList.map((ver) => (
                    <View key={ver.id} style={styles.tableRow}>
                      <Text style={[styles.cellCode, { flex: 2 }]}>{ver.formNumber}</Text>
                      <View style={{ flex: 3 }}>
                        <Text style={styles.cellTitle} numberOfLines={1}>
                          {ver.title}
                        </Text>
                        {ver.isDefault && <Text style={styles.defaultTag}>Default Baseline</Text>}
                      </View>
                      <View style={{ flex: 2 }}>
                        <View style={styles.versionBadge}>
                          <Text style={styles.versionBadgeText}>{ver.versionNumber}</Text>
                        </View>
                      </View>
                      <Text style={[styles.cellDate, { flex: 2 }]}>{ver.updatedDate}</Text>
                      <Text style={[styles.cellAuthor, { flex: 2 }]} numberOfLines={1}>
                        {ver.author}
                      </Text>
                      <View style={styles.actionCol}>
                        <TouchableOpacity
                          style={styles.viewBtn}
                          onPress={() => setInspectingVersion(ver)}
                          accessibilityRole="button"
                          accessibilityLabel={`View version ${ver.versionNumber} of ${ver.title}`}
                        >
                          <Feather name="eye" size={12} color="#0284C7" />
                          <Text style={styles.viewBtnText}>View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.revertBtn}
                          onPress={() => handleApplyVersion(ver)}
                          accessibilityRole="button"
                          accessibilityLabel={`Revert to version ${ver.versionNumber}`}
                        >
                          <Feather name="rotate-ccw" size={12} color="#16A34A" />
                          <Text style={styles.revertBtnText}>Revert</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Audit Snapshots Section */}
                {history.length > 0 && (
                  <View
                    style={{
                      marginTop: spacing.md,
                      paddingTop: spacing.md,
                      borderTopWidth: 1,
                      borderTopColor: '#F1F5F9',
                    }}
                  >
                    <Text style={styles.sectionHeader}>Recent Field Audit Trail</Text>
                    {history.slice(0, 3).map((rev, idx) => (
                      <View key={`hist-${idx}`} style={styles.historyRevisionRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.revFieldText}>{rev.field}</Text>
                          <Text style={styles.revMetaText}>
                            {rev.date} · {rev.user} · Changed from &quot;{rev.oldValue}&quot; to
                            &quot;{rev.newValue}&quot;
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            {/* TAB 2: PDF UPLOAD */}
            {activeTab === 'upload_pdf' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionHeader}>Upload Form Template PDF</Text>
                <Text style={styles.helperText}>
                  Upload scanned or digital PDF form templates to attach to this configuration in
                  Object Storage.
                </Text>

                <TouchableOpacity
                  style={styles.dropZone}
                  onPress={handleSimulatePdfUpload}
                  accessibilityRole="button"
                  accessibilityLabel="Browse or drop PDF file to upload"
                >
                  <Feather
                    name="upload-cloud"
                    size={36}
                    color="#0284C7"
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={styles.dropZoneMain}>Click or drag PDF form here to upload</Text>
                  <Text style={styles.dropZoneSub}>Accepted formats: .pdf (Max size: 25MB)</Text>
                </TouchableOpacity>

                {uploadedPdf && (
                  <View style={styles.uploadedFileCard}>
                    <View style={styles.fileIconBox}>
                      <Feather name="file-text" size={20} color="#DC2626" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.uploadedFileName}>{uploadedPdf.name}</Text>
                      <Text style={styles.uploadedFileSize}>
                        {uploadedPdf.size} ·{' '}
                        {uploadedPdf.status === 'ready' ? 'Upload complete' : 'Uploading…'}
                      </Text>
                    </View>
                    <View style={styles.fileSuccessBadge}>
                      <Feather name="check-circle" size={14} color="#16A34A" />
                      <Text style={styles.fileSuccessText}>Ready</Text>
                    </View>
                  </View>
                )}

                <View style={styles.importFooter}>
                  <TouchableOpacity
                    style={[styles.importSubmitBtn, !uploadedPdf && styles.btnDisabled]}
                    disabled={!uploadedPdf}
                    onPress={() => {
                      onClose();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm PDF template upload"
                  >
                    <Feather name="check" size={15} color="#FFFFFF" />
                    <Text style={styles.importSubmitBtnText}>Attach to Form</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* TAB 3: PDF EXPORT */}
            {activeTab === 'export_pdf' && (
              <View style={styles.exportTabContainer}>
                <View style={styles.exportTopSection}>
                  <Text style={styles.sectionHeader}>Export Printable PDF Form Specification</Text>
                  <Text style={styles.helperText}>
                    Preview and download the complete multi-page form specification documenting all{' '}
                    {currentFields.length} controls across {groupedSections.length} sections.
                  </Text>
                </View>

                <View style={styles.exportPreviewBox}>
                  <View style={styles.pdfMockHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather name="file-text" size={16} color="#0284C7" />
                      <Text style={styles.pdfMockTitle}>{selectedForm}</Text>
                    </View>
                    <Text style={styles.pdfMockMeta}>
                      {formId} · {formRevision.startsWith('v') ? formRevision : `v${formRevision}`}
                    </Text>
                  </View>

                  <ScrollView
                    style={styles.exportDocumentScroll}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled
                  >
                    {groupedSections.map(([secName, secFields], sIdx) => (
                      <View key={`export-sec-${secName}-${sIdx}`} style={styles.exportSectionCard}>
                        <View style={styles.exportSectionHeader}>
                          <View style={styles.exportSecPill}>
                            <Text style={styles.exportSecPillText}>{sIdx + 1}</Text>
                          </View>
                          <Text style={styles.exportSectionTitle}>{secName}</Text>
                          <Text style={styles.exportSectionCount}>{secFields.length} controls</Text>
                        </View>

                        <View style={styles.exportFieldsGrid}>
                          {secFields.map((f, fIdx) =>
                            renderPreviewFieldMock(f, f.id || `f-${fIdx}`),
                          )}
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.exportStickyFooter}>
                  <TouchableOpacity
                    style={styles.importSubmitBtn}
                    onPress={handleExportPdf}
                    accessibilityRole="button"
                    accessibilityLabel="Download and export PDF specification"
                  >
                    <Feather name="download" size={15} color="#FFFFFF" />
                    <Text style={styles.importSubmitBtnText}>Export Printable PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Nested Snapshot Inspection Modal ("View" Action - Template View) */}
            {inspectingVersion && (
              <Modal
                visible
                transparent
                animationType="fade"
                onRequestClose={() => setInspectingVersion(null)}
              >
                <View style={styles.nestedOverlay}>
                  <View style={styles.nestedCard}>
                    <View style={styles.nestedHeader}>
                      <View>
                        <Text style={styles.nestedTitle}>
                          {inspectingVersion.title} ({inspectingVersion.versionNumber})
                        </Text>
                        <Text style={styles.nestedSubTitle}>
                          Snapshot from {inspectingVersion.updatedDate} by{' '}
                          {inspectingVersion.author}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setInspectingVersion(null)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Close inspection preview"
                      >
                        <Feather name="x" size={18} color="#64748B" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={true}>
                      {Object.entries(
                        inspectingVersion.fields.reduce<Record<string, FormField[]>>((acc, f) => {
                          const s = f.section?.trim() || 'General';
                          if (!acc[s]) acc[s] = [];
                          acc[s].push(f);
                          return acc;
                        }, {}),
                      ).map(([secName, secFields], sIdx) => (
                        <View key={`insp-sec-${secName}-${sIdx}`} style={styles.exportSectionCard}>
                          <View style={styles.exportSectionHeader}>
                            <View style={styles.exportSecPill}>
                              <Text style={styles.exportSecPillText}>{sIdx + 1}</Text>
                            </View>
                            <Text style={styles.exportSectionTitle}>{secName}</Text>
                            <Text style={styles.exportSectionCount}>
                              {secFields.length} controls
                            </Text>
                          </View>
                          <View style={styles.exportFieldsGrid}>
                            {secFields.map((f, fIdx) =>
                              renderPreviewFieldMock(f, `insp-${f.id || fIdx}`),
                            )}
                          </View>
                        </View>
                      ))}
                    </ScrollView>

                    <View style={styles.nestedFooter}>
                      <TouchableOpacity
                        style={styles.nestedCloseBtn}
                        onPress={() => setInspectingVersion(null)}
                      >
                        <Text style={styles.nestedCloseBtnText}>Close Preview</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.nestedApplyBtn}
                        onPress={() => {
                          const v = inspectingVersion;
                          setInspectingVersion(null);
                          handleApplyVersion(v);
                        }}
                      >
                        <Feather name="rotate-ccw" size={14} color="#FFFFFF" />
                        <Text style={styles.nestedApplyBtnText}>Revert to this Version</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
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
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 760,
    maxHeight: '92%',
    ...makeShadow(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  storageNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: spacing.md,
  },
  storageNoticeText: {
    fontSize: 11,
    color: '#0369A1',
    flex: 1,
    lineHeight: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#1E40AF',
  },
  tabContent: {
    maxHeight: 520,
    flex: 1,
  },
  exportTabContainer: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  exportTopSection: {
    flexShrink: 0,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: spacing.md,
  },

  /* Version Table */
  versionTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableColHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cellCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  cellTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  defaultTag: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '600',
  },
  versionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  cellDate: {
    fontSize: 11,
    color: '#64748B',
  },
  cellAuthor: {
    fontSize: 11,
    color: '#475569',
  },
  actionCol: {
    flex: 3,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  viewBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  revertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  revertBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },

  /* PDF Upload */
  dropZone: {
    borderWidth: 2,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dropZoneMain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropZoneSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  uploadedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
    gap: 12,
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedFileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  uploadedFileSize: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  fileSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: '#DCFCE7',
  },
  fileSuccessText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },

  /* PDF Export */
  exportPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    flex: 1,
    minHeight: 180,
    maxHeight: 340,
    marginBottom: spacing.xs,
  },
  pdfMockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  pdfMockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  pdfMockMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  pdfFieldSummaryText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  exportDocumentScroll: {
    flex: 1,
    marginTop: 6,
  },
  exportSectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  exportSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 10,
  },
  exportSecPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportSecPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exportSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  exportSectionCount: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  exportFieldsGrid: {
    gap: 8,
  },
  exportFieldCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.sm,
    padding: 8,
  },
  exportFieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exportFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  exportFieldTypeBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  exportFieldTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369A1',
  },
  exportInputMock: {
    height: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.xs || 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exportTextareaMock: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.xs || 4,
    padding: 6,
  },
  exportMockPlaceholder: {
    fontSize: 11,
    color: '#94A3B8',
  },
  exportPhoneMock: {
    height: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  exportEthBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    marginRight: 6,
  },
  exportEthBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  exportDateIconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 28,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
  },
  exportSwitchTrack: {
    width: 28,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 2,
  },
  exportSwitchThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0284C7',
  },
  exportFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
  },
  exportFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  exportFileBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F172A',
  },
  exportImageMock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 4,
  },
  exportImageMockText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  exportOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  exportOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  exportRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  exportOptionText: {
    fontSize: 10,
    color: '#475569',
  },
  exportCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  exportCheckboxSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportStickyFooter: {
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  importFooter: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  importSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  importSubmitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  historyRevisionRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  revFieldText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  revMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  /* Nested Inspection Modal */
  nestedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  nestedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
    ...makeShadow(6),
  },
  nestedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  nestedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  nestedSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  nestedFieldRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 8,
  },
  nestedFieldNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    width: 28,
  },
  nestedFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  nestedFieldMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  nestedFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginTop: 12,
  },
  nestedCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
  },
  nestedCloseBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  nestedApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: '#16A34A',
  },
  nestedApplyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
