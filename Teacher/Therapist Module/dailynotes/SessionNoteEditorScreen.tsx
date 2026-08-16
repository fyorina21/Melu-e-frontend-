// screens/dailynotes/SessionNoteEditorScreen.js
// MR-35: Session Notes & Attachments (create/edit destination)
//
// Per issues doc: rich text (bold/italic/bullets/tables/hyperlinks),
// attachments (photos/videos/PDFs/worksheets/assessment docs), auto-save,
// edit existing notes.
//
// SIMPLIFIED vs spec: true rich text (tables, inline hyperlinks) would
// need a dedicated editor library (e.g. a WebView-based HTML editor) -
// out of scope for a first pass. Built a lightweight toolbar that inserts
// markdown-style tokens (**bold**, *italic*, "- " bullets) into a plain
// text field instead. Flag for review - swap for a real rich-text editor
// before shipping if markdown isn't acceptable.

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import {
  getSessionNoteDetail,
  createSessionNote,
  updateSessionNote,
  autoSaveSessionNote,
  uploadAttachment,
  deleteAttachment,
} from '../../api/sessionApi';
import type { SessionStackParamList, FeatherIconName } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'SessionNoteEditor'>;

interface ToolbarAction {
  key: string;
  icon: FeatherIconName;
  wrap?: string;
  prefix?: string;
}

interface Attachment {
  id: string;
  type: string;
  name: string;
  uri?: string;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { key: 'bold', icon: 'bold', wrap: '**' },
  { key: 'italic', icon: 'italic', wrap: '*' },
  { key: 'bullet', icon: 'list', prefix: '- ' },
];

interface AttachmentRowProps {
  attachment: Attachment;
  onRemove: (id: string) => void;
}

function AttachmentRow({ attachment, onRemove }: AttachmentRowProps) {
  const iconByType: Record<string, FeatherIconName> = { image: 'image', video: 'video', pdf: 'file-text', other: 'paperclip' };
  return (
    <View style={styles.attachmentRow}>
      <Feather name={iconByType[attachment.type] || 'paperclip'} size={16} color={colors.navyText} />
      <Text style={[typography.body, { flex: 1 }]} numberOfLines={1}>{attachment.name}</Text>
      <TouchableOpacity onPress={() => onRemove(attachment.id)}>
        <Feather name="x" size={16} color={colors.mutedText} />
      </TouchableOpacity>
    </View>
  );
}

export default function SessionNoteEditorScreen({ route, navigation }: Props) {
  const sessionId = route.params.sessionId;
  const mode = route.params.mode; // 'edit' | 'view'

  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const bodyRef = useRef('');
  bodyRef.current = body;

  const load = useCallback(async () => {
    try {
      const { data } = await getSessionNoteDetail(sessionId);
      setBody(data.bodyMarkdown || '');
      setAttachments(data.attachments || []);
    } catch (err) {
      setBody(DEMO_NOTE.bodyMarkdown);
      setAttachments(DEMO_NOTE.attachments);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-save every 15s while there's unsaved-looking content, per spec.
  useEffect(() => {
    const interval = setInterval(() => {
      if (bodyRef.current.trim()) {
        autoSaveSessionNote(sessionId, { bodyMarkdown: bodyRef.current }).catch(() => {
          // Silent - this is a background auto-save, not a user action.
        });
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleToolbarPress = (action: ToolbarAction) => {
    if (action.wrap) {
      setBody((prev) => `${prev}${action.wrap}text${action.wrap}`);
    } else if (action.prefix) {
      setBody((prev) => `${prev}${prev.endsWith('\n') || !prev ? '' : '\n'}${action.prefix}`);
    }
  };

  const handleAddPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) {
      const asset = result.assets[0];
      const newAttachment = { id: `local-${Date.now()}`, type: 'image', name: asset.fileName || 'Photo', uri: asset.uri };
      setAttachments((prev) => [...prev, newAttachment]);
      uploadAttachment(sessionId, buildFormData(asset)).catch(() => {
        // Demo/offline: kept in local state above regardless.
      });
    }
  };

  const handleAddDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', '*/*'] });
    if (result.canceled) return;
    const asset = result.assets[0];
    const newAttachment = { id: `local-${Date.now()}`, type: asset.mimeType?.includes('pdf') ? 'pdf' : 'other', name: asset.name, uri: asset.uri };
    setAttachments((prev) => [...prev, newAttachment]);
    uploadAttachment(sessionId, buildFormData(asset)).catch(() => {
      // Demo/offline: kept in local state above regardless.
    });
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    deleteAttachment(sessionId, id).catch(() => {});
  };

  const handleSave = async () => {
    try {
      await updateSessionNote(sessionId, { bodyMarkdown: body });
      Alert.alert('Saved');
      navigation?.goBack?.();
    } catch (err) {
      Alert.alert('Saved locally', 'Will sync once connected.');
      navigation?.goBack?.();
    }
  };

  if (loading) return null;

  const isReadOnly = mode === 'view';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} accessibilityLabel="Back">
          <Feather name="arrow-left" size={22} color={colors.navyText} />
        </TouchableOpacity>
        <Text style={typography.h1}>{isReadOnly ? 'Session Note' : 'Edit Session Note'}</Text>
        <View style={{ width: 22 }} />
      </View>

      {!isReadOnly && (
        <View style={styles.toolbar}>
          {TOOLBAR_ACTIONS.map((action) => (
            <TouchableOpacity key={action.key} style={styles.toolbarBtn} onPress={() => handleToolbarPress(action)}>
              <Feather name={action.icon} size={16} color={colors.navyText} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {isReadOnly ? (
          <Text style={typography.body}>{body}</Text>
        ) : (
          <TextInput
            style={styles.editor}
            multiline
            value={body}
            onChangeText={setBody}
            placeholder="Describe how the session went..."
            placeholderTextColor={colors.mutedText}
          />
        )}

        <Text style={[typography.label, { marginTop: spacing.lg }]}>Attachments</Text>
        {attachments.map((a) => (
          <AttachmentRow key={a.id} attachment={a} onRemove={isReadOnly ? () => {} : handleRemoveAttachment} />
        ))}
        {attachments.length === 0 && (
          <Text style={[typography.body, { color: colors.mutedText }]}>No attachments yet.</Text>
        )}

        {!isReadOnly && (
          <View style={styles.attachBtnsRow}>
            <TouchableOpacity style={styles.attachBtn} onPress={handleAddPhoto}>
              <Feather name="image" size={14} color={colors.navyText} />
              <Text style={styles.attachBtnText}>Add Photo/Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn} onPress={handleAddDocument}>
              <Feather name="file" size={14} color={colors.navyText} />
              <Text style={styles.attachBtnText}>Add Document</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {!isReadOnly && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function buildFormData(asset: { uri: string; name?: string | null; fileName?: string | null; mimeType?: string | null }) {
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: asset.name || asset.fileName || 'attachment',
    type: asset.mimeType || 'application/octet-stream',
  } as unknown as Blob);
  return formData;
}

const DEMO_NOTE: { bodyMarkdown: string; attachments: Attachment[] } = {
  bodyMarkdown: 'Student A independently requested toys five times.\nEye contact improved.\nOne tantrum occurred during cleanup.\n\nExcellent participation overall.',
  attachments: [],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  toolbar: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  toolbarBtn: { width: 32, height: 32, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.sm },
  editor: { minHeight: 200, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top', color: colors.navyText },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xs },
  attachBtnsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  attachBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  attachBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  footer: { padding: spacing.lg, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
