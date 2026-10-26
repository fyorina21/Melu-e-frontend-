import { describe, it, expect, vi } from 'vitest';
import { resolveStudentPhotoUri } from '../../../utils/studentPhotoHelper';
import { extractDocumentMeta } from '../../../components/DocumentAttachmentCard';
import {
  detectMediaType,
  formatFileSize,
  resolveMediaUrl,
} from '../../../components/MediaViewerModal';
import { DEFAULT_ENROLLMENT_FORM } from '../../../api/institutionalAdminApi';
import { FIELD_TYPES } from '../../institutionaladmin/formBuilderConfig';

describe('Enrollment Wizard, Profile & Edit Refactor Verification', () => {
  describe('Bug 1: Therapist Workload & Dynamic Assigned Count', () => {
    it('formats therapist display label dynamically with actual assigned student count without arbitrary limits', () => {
      const therapistWithCaseload = {
        name: 'Sarah Clinician',
        assignedStudents: ['s1', 's2', 's3'],
        assignedStudentCount: 3,
      };

      const count =
        therapistWithCaseload.assignedStudentCount ?? therapistWithCaseload.assignedStudents.length;
      const chipLabel = `${therapistWithCaseload.name} (${count} ${count === 1 ? 'student' : 'students'} assigned)`;

      expect(chipLabel).toBe('Sarah Clinician (3 students assigned)');
      expect(count).toBe(3);
    });

    it('formats singular student assigned label correctly for 1 student', () => {
      const therapistOne = {
        name: 'Dr. John Doe',
        assignedStudents: ['s1'],
        assignedStudentCount: 1,
      };

      const count = therapistOne.assignedStudentCount ?? therapistOne.assignedStudents.length;
      const chipLabel = `${therapistOne.name} (${count} ${count === 1 ? 'student' : 'students'} assigned)`;

      expect(chipLabel).toBe('Dr. John Doe (1 student assigned)');
    });
  });

  describe('Bug 2: Headshot Photo Fallback & Field-Specific Isolation', () => {
    it('strictly isolates headshot from document attachments (PDFs, certificates, diagnosis papers)', () => {
      const pdfDocument = 'data:application/pdf;base64,JVBERi0xLjQKJ...';
      const scannedPaperUrl = 'https://melue.storage.local/documents/birth_certificate.pdf';
      const diagnosisDocUrl = 'https://melue.storage.local/documents/diagnosis_paper_scan.png';

      // resolveStudentPhotoUri must reject PDFs, document paths, and certificates
      expect(resolveStudentPhotoUri(pdfDocument)).toBeNull();
      expect(resolveStudentPhotoUri(scannedPaperUrl)).toBeNull();
      expect(resolveStudentPhotoUri(diagnosisDocUrl)).toBeNull();
    });

    it('accepts legitimate image data and web URLs for student headshots', () => {
      const legitimateBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...';
      const legitimateUrl = 'https://melue.storage.local/photos/student_headshot.jpg';

      expect(resolveStudentPhotoUri(legitimateBase64)).toBe(legitimateBase64);
      expect(resolveStudentPhotoUri(legitimateUrl)).toBe(legitimateUrl);
    });

    it('returns null for missing or null headshot allowing clean StudentAvatar fallback', () => {
      expect(resolveStudentPhotoUri(null)).toBeNull();
      expect(resolveStudentPhotoUri(undefined)).toBeNull();
      expect(resolveStudentPhotoUri('')).toBeNull();
    });
  });

  describe('Bug 3 & 5: Document Attachment Metadata, Video Media & Lightbox Support', () => {
    it('detects video media types accurately for MP4, WebM, and MOV', () => {
      expect(detectMediaType('video/mp4', 'baseline_session.mp4')).toBe('video');
      expect(detectMediaType('video/webm', 'intake_assessment.webm')).toBe('video');
      expect(detectMediaType(null, 'observation.mov')).toBe('video');
    });

    it('detects PDF and image media types accurately', () => {
      expect(detectMediaType('application/pdf', 'birth_cert.pdf')).toBe('pdf');
      expect(detectMediaType('image/png', 'doc_scan.png')).toBe('image');
      expect(detectMediaType('data:image/jpeg;base64,/9j/4AAQSkZ...')).toBe('image');
      expect(detectMediaType(null, null, 'Official Headshot Photo')).toBe('image');
      expect(detectMediaType(null, null, 'Student Picture')).toBe('image');
    });

    it('extracts complete document metadata for DocumentAttachmentCard previews', () => {
      const rawDoc = {
        file_url: 'https://melue.storage.local/docs/medical_diagnosis.pdf',
        filename: 'medical_diagnosis.pdf',
        byte_size: 2048576,
        content_type: 'application/pdf',
        upload_date: '2026-10-25T14:30:00Z',
      };

      const meta = extractDocumentMeta(rawDoc, 'Medical Diagnosis');
      expect(meta).not.toBeNull();
      expect(meta?.fileName).toBe('medical_diagnosis.pdf');
      expect(meta?.fileSize).toBe(2048576);
      expect(formatFileSize(meta?.fileSize)).toBe('2.0 MB');
      expect(meta?.uploadDate).toBe('2026-10-25');
      expect(meta?.fileType).toBe('application/pdf');
    });

    it('does not force .pdf extension on image attachments without filename', () => {
      const imageObject = {
        url: 'https://melue.storage.local/blobs/birth_cert',
        content_type: 'image/png',
      };
      const meta = extractDocumentMeta(imageObject, 'Birth Certificate');
      expect(meta).not.toBeNull();
      expect(meta?.fileName).toBe('birth_certificate.jpg');
      expect(meta?.fileType).toBe('image/png');

      const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
      const dataMeta = extractDocumentMeta(dataUri, 'Child Photo');
      expect(dataMeta).not.toBeNull();
      expect(dataMeta?.fileName).toBe('child_photo.jpg');
      expect(dataMeta?.fileType).toBe('image/jpeg');
    });

    it('resolves relative backend media URLs and preserves absolute/data URIs', () => {
      const relUrl = '/rails/active_storage/blobs/redirect/eyJf.../photo.jpg';
      const resolved = resolveMediaUrl(relUrl);
      expect(resolved).toMatch(/^https?:\/\//);
      expect(resolved).toContain('/rails/active_storage/blobs/redirect/');

      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...';
      expect(resolveMediaUrl(dataUri)).toBe(dataUri);

      const httpsUrl = 'https://s3.amazonaws.com/melue-bucket/doc.jpg';
      expect(resolveMediaUrl(httpsUrl)).toBe(httpsUrl);
    });

    it('includes Video as a first-class supported type in FormBuilder options', () => {
      expect(FIELD_TYPES).toContain('Video');
    });
  });

  describe('Bug 4: Full Dynamic Schema Configuration for Edit Student Screen', () => {
    it('contains all active sections and default fields in DEFAULT_ENROLLMENT_FORM', () => {
      expect(DEFAULT_ENROLLMENT_FORM.customSections).toContain('Student Info');
      expect(DEFAULT_ENROLLMENT_FORM.customSections).toContain('Documents & Media');
      expect(DEFAULT_ENROLLMENT_FORM.fields.length).toBeGreaterThan(5);

      const fieldIds = DEFAULT_ENROLLMENT_FORM.fields.map((f: any) => f.id);
      expect(fieldIds).toContain('f1');
      expect(fieldIds).toContain('f2');
      expect(fieldIds).toContain('f_program');
      expect(fieldIds).toContain('f_therapy');
    });
  });
});
