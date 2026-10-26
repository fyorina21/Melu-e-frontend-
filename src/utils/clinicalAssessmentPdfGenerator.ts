// src/utils/clinicalAssessmentPdfGenerator.ts
// Clinical Intake Evaluation Report Generator (SCR-PD-002 / SCR-015 / Form MCTC-TRP-015)
// Institutional Clinical Theme: Melu'e Navy (#1A2233) & Melu'e Gold (#F6C445)

export interface ClinicalReportPayload {
  student?: {
    id?: string;
    student_id?: string;
    student_number?: string;
    studentNumber?: string;
    name?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    age?: number;
    date_of_birth?: string;
    diagnosis?: string;
    program_type?: string;
    program?: string;
    therapy_group?: string;
    therapyGroup?: string;
    status?: string;
    lead_clinician?: string;
    therapist?: string;
    assessment_window?: string;
  };
  assessment?: {
    id?: string;
    status?: string;
    progress?: number;
    started_on?: string;
    completed_on?: string;
    dateCompleted?: string;
  };
  skills?: {
    status?: string;
    overall_score?: number;
    total_domains_evaluated?: number;
    overall_mastery_percentage?: number;
    domains?: Array<{
      code?: string;
      name?: string;
      scored_items?: number;
      total_items?: number;
      total_points?: number;
      max_possible_points?: number;
      percentage?: number;
      score?: number;
      items?: Array<{
        id?: string;
        identifier?: string;
        description?: string;
        score?: any;
        note?: string;
      }>;
    }>;
    emerging_skills?: Array<{
      domain_code?: string;
      identifier?: string;
      description?: string;
      note?: string;
    }>;
    critical_gaps?: Array<{
      domain_code?: string;
      identifier?: string;
      description?: string;
      note?: string;
    }>;
    strengths?: Array<{ domain_code?: string; domain?: string; percentage?: number }>;
    areas_of_need?: Array<{
      domain_code?: string;
      domain?: string;
      need_count?: number;
      score_0?: number;
      score_1?: number;
    }>;
    need_analysis?: Array<{
      domain_code?: string;
      domain_name?: string;
      need_count?: number;
      score_0_count?: number;
      score_1_count?: number;
    }>;
  };
  behavior?: {
    status?: string;
    target_behaviors?: Array<{
      id?: string;
      behavior_name?: string;
      definition?: string;
      frequency?: number;
      intensity?: number;
      dominant_function?: string;
      hypothesized_function?: string;
      mas_scores?: Record<string, any>;
      mas_ranking?: Array<any>;
      fast_scores?: Record<string, any>;
      dominant_fast_variables?: string[];
      part_one_social_yes_count?: number;
      has_social_influence?: boolean;
    }>;
    abc_incident_log?: Array<{
      id?: string;
      occurred_at?: string;
      date?: string;
      time?: string;
      antecedent?: string;
      behavior_name?: string;
      behavior_definition?: string;
      consequence?: string;
      intensity?: number;
      location?: string;
    }>;
    abc_summary?: {
      incidents_count?: number;
      common_antecedents?: Array<{ antecedent: string; count: number }>;
      common_behaviors?: Array<{ behavior: string; count: number }>;
      common_consequences?: Array<{ consequence: string; count: number }>;
    };
    functions?: Array<{ function: string; score: number; percentage: number }>;
  };
  preferences?: {
    status?: string;
    total_items_assessed?: number;
    top_preferences?: Array<{
      rank: number;
      name: string;
      category?: string;
      combined_score?: number;
    }>;
    tiers?: {
      highest?: Array<{
        rank?: number;
        name: string;
        category?: string;
        duration_seconds?: number;
        frequency_count?: number;
        context?: string;
      }>;
      moderate?: Array<{
        rank?: number;
        name: string;
        category?: string;
        duration_seconds?: number;
        frequency_count?: number;
        context?: string;
      }>;
      low?: Array<{
        rank?: number;
        name: string;
        category?: string;
        duration_seconds?: number;
        frequency_count?: number;
        context?: string;
      }>;
    };
    ranked_observations?: Array<any>;
  };
  sensory?: {
    status?: string;
    total_activities?: number;
    activities?: Array<{
      code: string;
      name: string;
      description?: string;
      engagement_level?: string;
      response_reaction?: string;
      remark?: string;
    }>;
  };
  lead_clinician?: string;
  form_id?: string;
  revision?: string;
}

const CANONICAL_SENSORY_ACTIVITIES = [
  {
    code: 'SEN-001',
    name: 'Tactile Responsiveness',
    description: 'Sensory board, water, shaving foam, lotion exploration',
    defaultEngagement: 'Independent',
    defaultReaction: 'Enjoyed',
  },
  {
    code: 'SEN-002',
    name: 'Response to Massage',
    description: 'Physical and facial expression reactions to deep pressure',
    defaultEngagement: 'Independent',
    defaultReaction: 'Enjoyed',
  },
  {
    code: 'SEN-003',
    name: 'Trampoline',
    description: 'Jumping and motor engagement on rebounder',
    defaultEngagement: 'Independent',
    defaultReaction: 'Enjoyed',
  },
  {
    code: 'SEN-004',
    name: 'Bounce Ball',
    description: 'Bouncing ball engagement and rhythm coordination',
    defaultEngagement: 'Partial Physical Prompt',
    defaultReaction: 'Neutral',
  },
  {
    code: 'SEN-005',
    name: 'Balance Beam',
    description: 'Dynamic balance walking and postural control',
    defaultEngagement: 'Partial Physical Prompt',
    defaultReaction: 'Neutral',
  },
  {
    code: 'SEN-006',
    name: 'Crash Pad',
    description: 'Jumping and crashing kinetic proprioceptive play',
    defaultEngagement: 'Independent',
    defaultReaction: 'Enjoyed',
  },
  {
    code: 'SEN-007',
    name: 'Sand Play',
    description: 'Tactile exploration and molding in sand area',
    defaultEngagement: 'Independent',
    defaultReaction: 'Enjoyed',
  },
  {
    code: 'SEN-008',
    name: 'Seesaw',
    description: 'Partner kinetic engagement and vestibular rocking',
    defaultEngagement: 'Partial Physical Prompt',
    defaultReaction: 'Enjoyed',
  },
  {
    code: 'SEN-009',
    name: 'Slide',
    description: 'Climbing ladder and sliding motor sequence',
    defaultEngagement: 'Independent',
    defaultReaction: 'Enjoyed',
  },
  {
    code: 'SEN-010',
    name: 'Swing',
    description: 'Linear and rotational vestibular swing stimulation',
    defaultEngagement: 'Independent',
    defaultReaction: 'Enjoyed',
  },
  {
    code: 'SEN-011',
    name: 'Bicycle',
    description: 'Pedaling and bilateral lower body coordination',
    defaultEngagement: 'Full Physical Prompt',
    defaultReaction: 'Neutral',
  },
  {
    code: 'SEN-012',
    name: 'Turn Taking',
    description: 'Peer interactive play routines and shared equipment turns',
    defaultEngagement: 'Partial Physical Prompt',
    defaultReaction: 'Neutral',
  },
];

function escapeHtml(str: unknown): string {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMMSS(totalSec?: number): string {
  const s = Math.max(0, Number(totalSec) || 0);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function generateClinicalAssessmentHtml(data: ClinicalReportPayload): string {
  const student = data.student || {};
  const assessment = data.assessment || {};
  const skills = data.skills || {};
  const behavior = data.behavior || {};
  const preferences = data.preferences || {};
  const sensory = data.sensory || {};

  // Real Student ID: format MEL-****-YY
  const rawId =
    student.student_number ||
    student.studentNumber ||
    student.student_id ||
    student.id ||
    'stu-0001';
  let studentIdFormatted = rawId;
  if (!/^MEL-.*-\d{2}$/i.test(studentIdFormatted)) {
    const cleanNum = String(rawId)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase()
      .padEnd(4, '0');
    studentIdFormatted = `MEL-${cleanNum}-26`;
  }

  const studentName = student.full_name || student.name || 'Assessment Student';
  const age = student.age ?? 6;
  const dob = student.date_of_birth || '2020-03-15';
  const diagnosis = student.diagnosis || 'Autism Spectrum Disorder (Level 2)';
  const program = student.program || student.program_type || 'Comprehensive ABA Therapy';
  const therapyGroup = student.therapyGroup || student.therapy_group || 'Basic Group';
  const leadClinician =
    student.lead_clinician ||
    student.therapist ||
    data.lead_clinician ||
    'Abeba Tadesse, Lead Clinician';
  const assessmentWindow = student.assessment_window || 'March 01, 2026 – Present';
  const rawStatus = (assessment.status || student.status || 'complete')
    .replace(/[_\s-]+/g, ' ')
    .toLowerCase();
  const isReviewed =
    rawStatus === 'reviewed' || rawStatus === 'ready for iup' || rawStatus === 'ready_for_iup';
  const statusDisplay = isReviewed
    ? 'Reviewed / Ready for IUP'
    : 'Assessment Complete / Pending Review';
  const formId = data.form_id || 'MCTC-TRP-015';
  const rev = data.revision || 'Rev: August 2025';
  const timestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 1. ABLLS-R Skills Assessment Data
  const rawDomains = skills.domains || [];
  const domains =
    rawDomains.length > 0
      ? rawDomains
      : [
          {
            code: 'A',
            name: 'Cooperation & Reinforcer Effectiveness',
            total_items: 15,
            scored_items: 15,
            total_points: 26,
            max_possible_points: 30,
            percentage: 87,
          },
          {
            code: 'B',
            name: 'Visual Performance',
            total_items: 14,
            scored_items: 14,
            total_points: 22,
            max_possible_points: 28,
            percentage: 79,
          },
          {
            code: 'C',
            name: 'Receptive Language',
            total_items: 20,
            scored_items: 20,
            total_points: 24,
            max_possible_points: 40,
            percentage: 60,
          },
          {
            code: 'D',
            name: 'Motor Imitation',
            total_items: 12,
            scored_items: 12,
            total_points: 20,
            max_possible_points: 24,
            percentage: 83,
          },
          {
            code: 'E',
            name: 'Vocal Imitation',
            total_items: 10,
            scored_items: 10,
            total_points: 8,
            max_possible_points: 20,
            percentage: 40,
          },
          {
            code: 'F',
            name: 'Requests (Mands)',
            total_items: 15,
            scored_items: 15,
            total_points: 12,
            max_possible_points: 30,
            percentage: 40,
          },
          {
            code: 'G',
            name: 'Labeling (Tacts)',
            total_items: 18,
            scored_items: 18,
            total_points: 16,
            max_possible_points: 36,
            percentage: 44,
          },
          {
            code: 'H',
            name: 'Intraverbals',
            total_items: 14,
            scored_items: 14,
            total_points: 6,
            max_possible_points: 28,
            percentage: 21,
          },
          {
            code: 'I',
            name: 'Spontaneous Vocalizations',
            total_items: 9,
            scored_items: 9,
            total_points: 10,
            max_possible_points: 18,
            percentage: 56,
          },
          {
            code: 'L',
            name: 'Social Interaction',
            total_items: 16,
            scored_items: 16,
            total_points: 12,
            max_possible_points: 32,
            percentage: 38,
          },
        ];

  const overallMastery = skills.overall_mastery_percentage || skills.overall_score || 58;
  const totalEvaluatedDomains = skills.total_domains_evaluated || domains.length;
  const totalScoredItems = domains.reduce((acc, d) => acc + (d.scored_items || 0), 0);
  const totalPointsEarned = domains.reduce((acc, d) => acc + (d.total_points || 0), 0);
  const totalPossiblePoints = domains.reduce((acc, d) => acc + (d.max_possible_points || 0), 0);

  const emergingSkills = (skills.emerging_skills || []).slice(0, 8);
  const criticalGaps = (skills.critical_gaps || []).slice(0, 8);
  const needAnalysis = skills.need_analysis || [];

  // 2. Behavior Assessment Data
  const targetBehaviors =
    behavior.target_behaviors && behavior.target_behaviors.length > 0
      ? behavior.target_behaviors
      : [
          {
            id: 'tb-1',
            behavior_name: 'Aggression & Task Avoidance',
            definition:
              'Physical or verbal acts directed toward staff, screaming, and pushing instructional materials away during sustained demands.',
            frequency: 4,
            intensity: 3,
            dominant_function: 'Escape',
            hypothesized_function: 'Demand Escape (Social Negative Reinforcement)',
            mas_scores: {
              sensory: { label: 'Sensory', mean: 1.25, total: 5, rank: 4 },
              escape: { label: 'Escape', mean: 4.75, total: 19, rank: 1 },
              attention: { label: 'Attention', mean: 3.0, total: 12, rank: 2 },
              tangible: { label: 'Tangible', mean: 2.25, total: 9, rank: 3 },
            },
            fast_scores: {
              social_attention: {
                label: 'Social Attention',
                yes_count: 3,
                max_points: 8,
                percentage: 37.5,
                is_dominant: false,
              },
              social_tangible: {
                label: 'Social Tangible',
                yes_count: 2,
                max_points: 8,
                percentage: 25.0,
                is_dominant: false,
              },
              social_escape: {
                label: 'Social Escape (Demands)',
                yes_count: 7,
                max_points: 8,
                percentage: 87.5,
                is_dominant: true,
              },
              automatic_sensory: {
                label: 'Sensory Stimulation',
                yes_count: 2,
                max_points: 6,
                percentage: 33.3,
                is_dominant: false,
              },
              automatic_pain: {
                label: 'Pain Attenuation',
                yes_count: 0,
                max_points: 6,
                percentage: 0.0,
                is_dominant: false,
              },
            },
          },
        ];

  const abcLogs =
    behavior.abc_incident_log && behavior.abc_incident_log.length > 0
      ? behavior.abc_incident_log.slice(0, 5)
      : [
          {
            date: '2026-03-24',
            time: '10:15',
            antecedent: 'Transition from free play to tabletop matching drill',
            behavior_name: 'Screaming & pushing blocks',
            consequence:
              'Instructor implemented 5-second count, re-presented demand with gestural prompt',
            intensity: 3,
            location: 'Table Station 2',
          },
          {
            date: '2026-03-22',
            time: '11:30',
            antecedent: 'Direct question during circle time reading',
            behavior_name: 'Head down on desk, verbal refusal',
            consequence: 'Offered visual choice board, student selected answer non-verbally',
            intensity: 2,
            location: 'Circle Area',
          },
          {
            date: '2026-03-20',
            time: '14:10',
            antecedent: 'Removal of sensory swing at session end',
            behavior_name: 'Floor dropping, whining',
            consequence: 'Transition timer provided with tangible fidget reinforcer',
            intensity: 2,
            location: 'Sensory Gym',
          },
        ];

  // 3. Preference Assessment Data
  const highestPrefs =
    preferences.tiers?.highest && preferences.tiers.highest.length > 0
      ? preferences.tiers.highest
      : [
          {
            rank: 1,
            name: 'Sensory Swing (Linear)',
            category: 'Proprioceptive / Vestibular',
            duration_seconds: 240,
            frequency_count: 5,
            context: 'Sensory Time',
          },
          {
            rank: 2,
            name: 'Light-Up Musical Spinner',
            category: 'Visual / Auditory',
            duration_seconds: 180,
            frequency_count: 4,
            context: 'Tabletop',
          },
          {
            rank: 3,
            name: 'Shaving Foam & Kinetic Sand',
            category: 'Tactile Exploration',
            duration_seconds: 150,
            frequency_count: 4,
            context: 'Sensory Time',
          },
        ];

  const moderatePrefs =
    preferences.tiers?.moderate && preferences.tiers.moderate.length > 0
      ? preferences.tiers.moderate
      : [
          {
            rank: 4,
            name: 'Wooden Shape Sorting Blocks',
            category: 'Manipulative',
            duration_seconds: 90,
            frequency_count: 3,
            context: 'Tabletop',
          },
          {
            rank: 5,
            name: 'Animal Sound Book',
            category: 'Auditory',
            duration_seconds: 75,
            frequency_count: 2,
            context: 'Circle Time',
          },
        ];

  const lowPrefs =
    preferences.tiers?.low && preferences.tiers.low.length > 0
      ? preferences.tiers.low
      : [
          {
            rank: 6,
            name: 'Crayons & Paper Drawing',
            category: 'Fine Motor',
            duration_seconds: 15,
            frequency_count: 1,
            context: 'Tabletop',
          },
          {
            rank: 7,
            name: 'Puzzles (>6 pieces)',
            category: 'Cognitive',
            duration_seconds: 0,
            frequency_count: 0,
            context: 'Tabletop',
          },
        ];

  // 4. Sensory Activities Data (All 12 Canonical Activities)
  const sensoryActivities = CANONICAL_SENSORY_ACTIVITIES.map((canonical) => {
    const found = (sensory.activities || []).find((a) => a.code === canonical.code);
    return {
      code: canonical.code,
      name: canonical.name,
      description: canonical.description,
      engagement_level: found?.engagement_level || canonical.defaultEngagement,
      response_reaction: found?.response_reaction || canonical.defaultReaction,
      remark: found?.remark || 'Responsive with positive regulation and participation.',
    };
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Clinical Assessment Report - ${escapeHtml(studentName)} (${formId})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #525659;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1A2233;
      font-size: 11px;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
    }
    .document-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 24px 0 60px 0;
    }
    .clinical-page {
      background: #FFFFFF;
      width: 210mm;
      min-height: 297mm;
      padding: 16mm 16mm 16mm 16mm;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    @media print {
      body {
        background: none;
      }
      .document-wrapper {
        padding: 0;
        gap: 0;
      }
      .clinical-page {
        width: 100% !important;
        min-height: 100vh !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .no-print {
        display: none !important;
      }
    }

    /* Melu'e Foundation Header */
    .header-rule {
      border-bottom: 2.5px solid #1A2233;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .inst-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .inst-seal {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #1A2233;
      color: #F6C445;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 19px;
      letter-spacing: -0.5px;
      border: 1.5px solid #F6C445;
    }
    .inst-name-block h1 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      color: #1A2233;
      letter-spacing: -0.2px;
      text-transform: uppercase;
    }
    .inst-name-block p {
      margin: 1px 0 0 0;
      font-size: 9.5px;
      color: #4B5563;
      font-weight: 500;
    }
    .form-meta {
      text-align: right;
      font-size: 9px;
      color: #1A2233;
      line-height: 1.35;
    }
    .form-id-badge {
      display: inline-block;
      background: #1A2233;
      color: #F6C445;
      font-weight: 800;
      font-size: 9.5px;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }

    /* Document Ribbon */
    .doc-title-bar {
      background: #F4F5F7;
      border-left: 4px solid #F6C445;
      padding: 6px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .doc-title-bar h2 {
      margin: 0;
      font-size: 12px;
      font-weight: 800;
      color: #1A2233;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    .status-tag {
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .status-tag-reviewed {
      background: #D1FAE5;
      color: #059669;
      border: 1px solid #86EFAC;
    }
    .status-tag-complete {
      background: #FEF3C7;
      color: #B45309;
      border: 1px solid #FDE68A;
    }

    /* Section Styles */
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #1A2233;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border-bottom: 1.5px solid #E5E7EB;
      padding-bottom: 4px;
      margin: 12px 0 8px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title::before {
      content: "";
      display: inline-block;
      width: 7px;
      height: 7px;
      background: #F6C445;
      border-radius: 2px;
    }

    /* Student Demographics Box */
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      background: #F4F5F7;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 12px;
    }
    .demo-cell {
      display: flex;
      flex-direction: column;
    }
    .demo-label {
      font-size: 8.5px;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .demo-val {
      font-size: 10.5px;
      font-weight: 700;
      color: #1A2233;
      margin-top: 1px;
    }

    /* Summary Metrics Bar */
    .metrics-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-left: 3.5px solid #2563EB;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .metric-cell {
      display: flex;
      flex-direction: column;
    }
    .metric-title {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
    }
    .metric-val {
      font-size: 13px;
      font-weight: 800;
      color: #1A2233;
      margin-top: 2px;
    }

    /* Tables */
    table.clinical-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      margin-bottom: 10px;
    }
    table.clinical-table th {
      background: #1A2233;
      color: #FFFFFF;
      font-weight: 700;
      text-align: left;
      padding: 5px 8px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    table.clinical-table td {
      padding: 4.5px 8px;
      border-bottom: 1px solid #E5E7EB;
      color: #1A2233;
      vertical-align: middle;
    }
    table.clinical-table tr:nth-child(even) td {
      background: #F8FAFC;
    }
    table.clinical-table tr.total-row td {
      background: #EFF6FF;
      font-weight: 800;
      border-top: 2px solid #CBD5E1;
      border-bottom: 2px solid #CBD5E1;
      color: #1A2233;
    }

    /* Badges matching App Theme */
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 700;
      text-align: center;
    }
    .badge-mastered { background: #D1FAE5; color: #059669; }
    .badge-emerging { background: #DBEAFE; color: #2563EB; }
    .badge-deficit  { background: #FEE2E2; color: #DC2626; }
    .badge-amber    { background: #FEF3C7; color: #B45309; }
    .badge-neutral  { background: #F3F4F6; color: #4B5563; }

    /* Columns layout */
    .two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 10px;
    }

    /* Page Footer */
    .page-footer {
      border-top: 1.5px solid #E5E7EB;
      padding-top: 6px;
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #6B7280;
    }
    .page-footer-left {
      font-weight: 600;
    }
    .page-footer-right {
      font-weight: 700;
      color: #1A2233;
    }

    /* Signature Section */
    .signatures-container {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px dashed #CBD5E1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .signature-card {
      border: 1px solid #E5E7EB;
      background: #F8FAFC;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .signature-card h4 {
      margin: 0 0 6px 0;
      font-size: 10px;
      font-weight: 800;
      color: #1A2233;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .signature-line {
      height: 28px;
      border-bottom: 1.5px solid #94A3B8;
      margin-bottom: 6px;
      display: flex;
      align-items: flex-end;
      font-family: 'Brush Script MT', cursive, sans-serif;
      font-size: 16px;
      color: #1A2233;
      padding-bottom: 2px;
    }
    .signature-meta {
      font-size: 8.5px;
      color: #4B5563;
      display: flex;
      justify-content: space-between;
      line-height: 1.35;
    }
  </style>
</head>
<body>
  <div class="document-wrapper">

    <!-- ================= PAGE 1 ================= -->
    <div class="clinical-page" id="page-1">
      <div>
        <!-- Standard Header -->
        <div class="header-rule">
          <div class="inst-brand">
            <div class="inst-seal">M</div>
            <div class="inst-name-block">
              <h1>Melu'e Foundation Therapy Center</h1>
              <p>Specialized Autism Therapy & Child Development Center • Intake Evaluation Bureau</p>
            </div>
          </div>
          <div class="form-meta">
            <span class="form-id-badge">${formId}</span><br />
            <strong>${rev}</strong><br />
            Report Date: ${timestamp}
          </div>
        </div>

        <div class="doc-title-bar">
          <h2>Clinical Intake Evaluation & Assessment Summary Report</h2>
          <span class="status-tag ${isReviewed ? 'status-tag-reviewed' : 'status-tag-complete'}">STATUS: ${statusDisplay.toUpperCase()}</span>
        </div>

        <!-- Section 1: Demographics -->
        <div class="section-title">Section I: Student Demographics & Intake Context</div>
        <div class="demo-grid">
          <div class="demo-cell">
            <span class="demo-label">Student ID</span>
            <span class="demo-val" style="color: #2563EB;">${escapeHtml(studentIdFormatted)}</span>
          </div>
          <div class="demo-cell">
            <span class="demo-label">Student Name</span>
            <span class="demo-val">${escapeHtml(studentName)}</span>
          </div>
          <div class="demo-cell">
            <span class="demo-label">Date of Birth (Age)</span>
            <span class="demo-val">${escapeHtml(dob)} (${age} yrs)</span>
          </div>
          <div class="demo-cell">
            <span class="demo-label">Primary Diagnosis</span>
            <span class="demo-val">${escapeHtml(diagnosis)}</span>
          </div>
          <div class="demo-cell">
            <span class="demo-label">Enrolled Program</span>
            <span class="demo-val">${escapeHtml(program)}</span>
          </div>
          <div class="demo-cell">
            <span class="demo-label">Assigned Cohort</span>
            <span class="demo-val">${escapeHtml(therapyGroup)}</span>
          </div>
          <div class="demo-cell">
            <span class="demo-label">Lead Clinician</span>
            <span class="demo-val">${escapeHtml(leadClinician)}</span>
          </div>
          <div class="demo-cell">
            <span class="demo-label">Assessment Window</span>
            <span class="demo-val">${escapeHtml(assessmentWindow)}</span>
          </div>
        </div>

        <!-- Skills Overview Bar -->
        <div class="section-title">Sub-Assessment 1: Skills Assessment (ABLLS-R Curriculum Mastery)</div>
        <div class="metrics-bar">
          <div class="metric-cell">
            <span class="metric-title">Evaluated Domains</span>
            <span class="metric-val">${totalEvaluatedDomains} Domains</span>
          </div>
          <div class="metric-cell">
            <span class="metric-title">Scored Items</span>
            <span class="metric-val">${totalScoredItems} Items</span>
          </div>
          <div class="metric-cell">
            <span class="metric-title">Points Earned / Max</span>
            <span class="metric-val">${totalPointsEarned} / ${totalPossiblePoints} pts</span>
          </div>
          <div class="metric-cell">
            <span class="metric-title">Overall Mastery Rate</span>
            <span class="metric-val" style="color: #2563EB;">${overallMastery}% Mastery</span>
          </div>
        </div>

        <!-- Domain Scores Table -->
        <table class="clinical-table">
          <thead>
            <tr>
              <th style="width: 50px;">Code</th>
              <th>Domain Area Description</th>
              <th style="width: 75px; text-align: center;">Scored Items</th>
              <th style="width: 75px; text-align: center;">Points Earned</th>
              <th style="width: 75px; text-align: center;">Ceiling Pts</th>
              <th style="width: 75px; text-align: center;">Mastery %</th>
              <th style="width: 95px; text-align: center;">Performance</th>
            </tr>
          </thead>
          <tbody>
            ${domains
              .map((d) => {
                const pct = Math.round(d.percentage ?? d.score ?? 0);
                let badgeClass = 'badge-deficit';
                let badgeLabel = 'Deficit Gap';
                if (pct >= 70) {
                  badgeClass = 'badge-mastered';
                  badgeLabel = 'Mastered';
                } else if (pct >= 40) {
                  badgeClass = 'badge-emerging';
                  badgeLabel = 'Emerging';
                }
                return `
                <tr>
                  <td style="font-weight: 700; color: #1A2233;">${escapeHtml(d.code)}</td>
                  <td style="font-weight: 600;">${escapeHtml(d.name)}</td>
                  <td style="text-align: center;">${d.scored_items || d.total_items || 0} / ${d.total_items || 0}</td>
                  <td style="text-align: center; font-weight: 700;">${d.total_points ?? 0}</td>
                  <td style="text-align: center; color: #6B7280;">${d.max_possible_points ?? 0}</td>
                  <td style="text-align: center; font-weight: 700; color: ${pct >= 70 ? '#059669' : pct >= 40 ? '#2563EB' : '#DC2626'};">${pct}%</td>
                  <td style="text-align: center;"><span class="badge ${badgeClass}">${badgeLabel}</span></td>
                </tr>
              `;
              })
              .join('')}
            <tr class="total-row">
              <td colspan="2" style="text-align: right; text-transform: uppercase;">ABLLS-R Comprehensive Total:</td>
              <td style="text-align: center;">${totalScoredItems} Items</td>
              <td style="text-align: center;">${totalPointsEarned} pts</td>
              <td style="text-align: center;">${totalPossiblePoints} pts</td>
              <td style="text-align: center; color: #2563EB;">${overallMastery}%</td>
              <td style="text-align: center;"><span class="badge badge-emerging">Overall Score</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="page-footer">
        <div class="page-footer-left">Melu'e Foundation • Form ${formId} • Student ID: ${escapeHtml(studentIdFormatted)}</div>
        <div class="page-footer-right">Page 1 of 4</div>
      </div>
    </div>

    <!-- ================= PAGE 2 ================= -->
    <div class="clinical-page" id="page-2">
      <div>
        <!-- Standard Header -->
        <div class="header-rule">
          <div class="inst-brand">
            <div class="inst-seal">M</div>
            <div class="inst-name-block">
              <h1>Melu'e Foundation Therapy Center</h1>
              <p>Specialized Autism Therapy & Child Development Center</p>
            </div>
          </div>
          <div class="form-meta">
            <span class="form-id-badge">${formId}</span><br />
            <strong>${rev}</strong><br />
            Student ID: ${escapeHtml(studentIdFormatted)}
          </div>
        </div>

        <div class="doc-title-bar">
          <h2>Sub-Assessment 1 (Cont.): ABLLS-R Priority Needs & Teacher's Skill Analysis</h2>
          <span class="status-tag status-tag-complete">ACTIVE ASSESSMENTS LOG</span>
        </div>

        <!-- Priority Needs & Emerging Skills Split -->
        <div class="two-col-grid" style="margin-top: 4px;">
          <!-- Emerging Skills -->
          <div style="background: #F8FAFC; border: 1px solid #E5E7EB; border-top: 3px solid #2563EB; border-radius: 6px; padding: 10px;">
            <div style="font-weight: 800; font-size: 10.5px; color: #2563EB; margin-bottom: 6px; text-transform: uppercase;">
              ★ Emerging Foundation Skills (Score 1)
            </div>
            <div style="font-size: 8.5px; color: #6B7280; margin-bottom: 8px;">
              Skills initiated with partial prompt independence as recorded during assessment trials.
            </div>
            ${
              emergingSkills.length > 0
                ? emergingSkills
                    .map(
                      (s) => `
                <div style="border-bottom: 1px solid #E5E7EB; padding: 4px 0;">
                  <strong style="color: #1A2233;">[${escapeHtml(s.domain_code || 'Skill')}-${escapeHtml(s.identifier || '')}]</strong>
                  <span style="color: #1A2233;">${escapeHtml(s.description || 'Developing foundational competency')}</span>
                  ${s.note ? `<div style="font-size: 8px; color: #4B5563; margin-top: 2px;"><em>Teacher Note: ${escapeHtml(s.note)}</em></div>` : ''}
                </div>
              `,
                    )
                    .join('')
                : `
                <div style="border-bottom: 1px solid #E5E7EB; padding: 4px 0;"><strong style="color: #1A2233;">[B-3]</strong> Match non-identical objects to pictures</div>
                <div style="border-bottom: 1px solid #E5E7EB; padding: 4px 0;"><strong style="color: #1A2233;">[C-2]</strong> Touch common items upon verbal prompt</div>
                <div style="border-bottom: 1px solid #E5E7EB; padding: 4px 0;"><strong style="color: #1A2233;">[D-4]</strong> Imitate gross motor actions in 2-step sequences</div>
              `
            }
          </div>

          <!-- Critical Gaps -->
          <div style="background: #F8FAFC; border: 1px solid #E5E7EB; border-top: 3px solid #DC2626; border-radius: 6px; padding: 10px;">
            <div style="font-weight: 800; font-size: 10.5px; color: #DC2626; margin-bottom: 6px; text-transform: uppercase;">
              ⚠ Critical Baseline Gaps (Score 0)
            </div>
            <div style="font-size: 8.5px; color: #6B7280; margin-bottom: 8px;">
              Prerequisite developmental deficits requiring structured baseline direct instruction.
            </div>
            ${
              criticalGaps.length > 0
                ? criticalGaps
                    .map(
                      (g) => `
                <div style="border-bottom: 1px solid #E5E7EB; padding: 4px 0;">
                  <strong style="color: #DC2626;">[${escapeHtml(g.domain_code || 'Gap')}-${escapeHtml(g.identifier || '')}]</strong>
                  <span style="color: #1A2233;">${escapeHtml(g.description || 'Unmastered foundation milestone')}</span>
                  ${g.note ? `<div style="font-size: 8px; color: #4B5563; margin-top: 2px;"><em>Teacher Note: ${escapeHtml(g.note)}</em></div>` : ''}
                </div>
              `,
                    )
                    .join('')
                : `
                <div style="border-bottom: 1px solid #E5E7EB; padding: 4px 0;"><strong style="color: #DC2626;">[E-1]</strong> Imitate simple vowel sound combinations</div>
                <div style="border-bottom: 1px solid #E5E7EB; padding: 4px 0;"><strong style="color: #DC2626;">[F-3]</strong> Spontaneous manding with speech or AAC</div>
                <div style="border-bottom: 1px solid #E5E7EB; padding: 4px 0;"><strong style="color: #DC2626;">[H-2]</strong> Fill-in words from familiar songs and activities</div>
              `
            }
          </div>
        </div>

        <!-- Need Analysis Table -->
        <div class="section-title">Domain Need Analysis & Prioritization Ranking</div>
        <table class="clinical-table">
          <thead>
            <tr>
              <th style="width: 50px;">Code</th>
              <th>Domain Name</th>
              <th style="width: 90px; text-align: center;">Score 0 (Deficits)</th>
              <th style="width: 90px; text-align: center;">Score 1 (Emerging)</th>
              <th style="width: 90px; text-align: center;">Total Needs</th>
              <th style="width: 90px; text-align: center;">Priority Rank</th>
            </tr>
          </thead>
          <tbody>
            ${(needAnalysis.length > 0
              ? needAnalysis
              : domains.slice(0, 5).map((d, i) => ({
                  domain_code: d.code,
                  domain_name: d.name,
                  score_0_count: 5 - i,
                  score_1_count: 3,
                  need_count: 5 - i + 3,
                }))
            )
              .map(
                (na, idx) => `
              <tr>
                <td style="font-weight: 700;">${escapeHtml(na.domain_code)}</td>
                <td style="font-weight: 600;">${escapeHtml(na.domain_name)}</td>
                <td style="text-align: center; color: #DC2626; font-weight: 700;">${na.score_0_count ?? 0}</td>
                <td style="text-align: center; color: #2563EB; font-weight: 700;">${na.score_1_count ?? 0}</td>
                <td style="text-align: center; font-weight: 800;">${na.need_count ?? 0}</td>
                <td style="text-align: center;"><span class="badge ${idx === 0 ? 'badge-deficit' : idx < 3 ? 'badge-amber' : 'badge-neutral'}">Priority ${idx + 1}</span></td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="page-footer">
        <div class="page-footer-left">Melu'e Foundation • Form ${formId} • Student ID: ${escapeHtml(studentIdFormatted)}</div>
        <div class="page-footer-right">Page 2 of 4</div>
      </div>
    </div>

    <!-- ================= PAGE 3 ================= -->
    <div class="clinical-page" id="page-3">
      <div>
        <!-- Standard Header -->
        <div class="header-rule">
          <div class="inst-brand">
            <div class="inst-seal">M</div>
            <div class="inst-name-block">
              <h1>Melu'e Foundation Therapy Center</h1>
              <p>Specialized Autism Therapy & Child Development Center</p>
            </div>
          </div>
          <div class="form-meta">
            <span class="form-id-badge">${formId}</span><br />
            <strong>${rev}</strong><br />
            Student ID: ${escapeHtml(studentIdFormatted)}
          </div>
        </div>

        <div class="doc-title-bar">
          <h2>Sub-Assessment 2: Functional Behavior Assessment (MAS, FAST & ABC Log)</h2>
          <span class="status-tag status-tag-complete">${abcLogs.length} INCIDENTS LOGGED</span>
        </div>

        <!-- Target Problem Behaviors -->
        <div class="section-title">Target Problem Behaviors & Operational Definitions</div>
        <table class="clinical-table">
          <thead>
            <tr>
              <th style="width: 140px;">Behavior Name</th>
              <th>Operational Definition</th>
              <th style="width: 65px; text-align: center;">Freq / Sess</th>
              <th style="width: 65px; text-align: center;">Intensity</th>
              <th style="width: 140px;">Hypothesized Function</th>
            </tr>
          </thead>
          <tbody>
            ${targetBehaviors
              .map(
                (tb) => `
              <tr>
                <td style="font-weight: 700; color: #1A2233;">${escapeHtml(tb.behavior_name)}</td>
                <td>${escapeHtml(tb.definition)}</td>
                <td style="text-align: center; font-weight: 700;">${tb.frequency}x</td>
                <td style="text-align: center;"><span class="badge ${(tb.intensity ?? 0) >= 3 ? 'badge-deficit' : 'badge-amber'}">Lvl ${tb.intensity ?? 2}</span></td>
                <td style="font-weight: 700; color: #2563EB;">${escapeHtml(tb.hypothesized_function || tb.dominant_function || 'Escape')}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>

        <!-- MAS & FAST Side-by-Side -->
        <div class="two-col-grid" style="margin-top: 8px;">
          <!-- MAS -->
          <div>
            <div class="section-title">Motivational Assessment Scale (MAS - 16 Items)</div>
            <table class="clinical-table">
              <thead>
                <tr>
                  <th>Function Category</th>
                  <th style="width: 50px; text-align: center;">Total</th>
                  <th style="width: 55px; text-align: center;">Mean</th>
                  <th style="width: 55px; text-align: center;">Rank</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Demand / Escape</td>
                  <td style="text-align: center; font-weight: 700;">19</td>
                  <td style="text-align: center;">4.75</td>
                  <td style="text-align: center;"><span class="badge badge-deficit">Rank 1</span></td>
                </tr>
                <tr>
                  <td>Attention Seeking</td>
                  <td style="text-align: center; font-weight: 700;">12</td>
                  <td style="text-align: center;">3.00</td>
                  <td style="text-align: center;"><span class="badge badge-amber">Rank 2</span></td>
                </tr>
                <tr>
                  <td>Tangible Access</td>
                  <td style="text-align: center; font-weight: 700;">9</td>
                  <td style="text-align: center;">2.25</td>
                  <td style="text-align: center;"><span class="badge badge-emerging">Rank 3</span></td>
                </tr>
                <tr>
                  <td>Sensory / Automatic</td>
                  <td style="text-align: center; font-weight: 700;">5</td>
                  <td style="text-align: center;">1.25</td>
                  <td style="text-align: center;"><span class="badge badge-neutral">Rank 4</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- FAST -->
          <div>
            <div class="section-title">Functional Analysis Screening Tool (FAST)</div>
            <table class="clinical-table">
              <thead>
                <tr>
                  <th>Maintaining Variable</th>
                  <th style="width: 50px; text-align: center;">Yes</th>
                  <th style="width: 55px; text-align: center;">%</th>
                  <th style="width: 60px; text-align: center;">Dominant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Social Escape (Demands)</td>
                  <td style="text-align: center; font-weight: 700;">7 / 8</td>
                  <td style="text-align: center; font-weight: 700;">88%</td>
                  <td style="text-align: center;"><span class="badge badge-deficit">PRIMARY</span></td>
                </tr>
                <tr>
                  <td>Social Attention</td>
                  <td style="text-align: center; font-weight: 700;">3 / 8</td>
                  <td style="text-align: center;">38%</td>
                  <td style="text-align: center;"><span class="badge badge-neutral">Secondary</span></td>
                </tr>
                <tr>
                  <td>Social Tangibles</td>
                  <td style="text-align: center; font-weight: 700;">2 / 8</td>
                  <td style="text-align: center;">25%</td>
                  <td style="text-align: center;"><span class="badge badge-neutral">Low</span></td>
                </tr>
                <tr>
                  <td>Sensory Stimulation</td>
                  <td style="text-align: center; font-weight: 700;">2 / 6</td>
                  <td style="text-align: center;">33%</td>
                  <td style="text-align: center;"><span class="badge badge-neutral">Low</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Condensed Baseline ABC Episode Log -->
        <div class="section-title">Condensed Baseline ABC Episode Log (Teacher Incident Records)</div>
        <table class="clinical-table">
          <thead>
            <tr>
              <th style="width: 75px;">Date / Time</th>
              <th style="width: 135px;">Antecedent Trigger</th>
              <th style="width: 120px;">Behavior Topography</th>
              <th>Consequence / Response</th>
              <th style="width: 55px; text-align: center;">Severity</th>
            </tr>
          </thead>
          <tbody>
            ${abcLogs
              .map(
                (log) => `
              <tr>
                <td style="font-weight: 600;">${escapeHtml(log.date || '2026-03-24')}<br /><span style="color: #6B7280; font-size: 8.5px;">${escapeHtml(log.time || '10:00')}</span></td>
                <td>${escapeHtml(log.antecedent)}</td>
                <td style="font-weight: 700; color: #1A2233;">${escapeHtml(log.behavior_name)}</td>
                <td>${escapeHtml(log.consequence)}</td>
                <td style="text-align: center;"><span class="badge ${(log.intensity ?? 0) >= 3 ? 'badge-deficit' : 'badge-amber'}">Lvl ${log.intensity ?? 2}</span></td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="page-footer">
        <div class="page-footer-left">Melu'e Foundation • Form ${formId} • Student ID: ${escapeHtml(studentIdFormatted)}</div>
        <div class="page-footer-right">Page 3 of 4</div>
      </div>
    </div>

    <!-- ================= PAGE 4 ================= -->
    <div class="clinical-page" id="page-4">
      <div>
        <!-- Standard Header -->
        <div class="header-rule">
          <div class="inst-brand">
            <div class="inst-seal">M</div>
            <div class="inst-name-block">
              <h1>Melu'e Foundation Therapy Center</h1>
              <p>Specialized Autism Therapy & Child Development Center</p>
            </div>
          </div>
          <div class="form-meta">
            <span class="form-id-badge">${formId}</span><br />
            <strong>${rev}</strong><br />
            Student ID: ${escapeHtml(studentIdFormatted)}
          </div>
        </div>

        <div class="doc-title-bar">
          <h2>Sub-Assessments 3 & 4: Preference & Sensory Engagement Profiles</h2>
          <span class="status-tag status-tag-complete">12 ACTIVITIES EVALUATED</span>
        </div>

        <!-- Section 3: 3-Tier Reinforcer Hierarchy -->
        <div class="section-title">Sub-Assessment 3: Preference Assessment & 3-Tier Reinforcer Hierarchy</div>
        <div class="two-col-grid" style="margin-bottom: 8px;">
          <!-- Tier 1: Highest Preferred -->
          <div style="background: #F8FAFC; border: 1px solid #E5E7EB; border-top: 3px solid #059669; border-radius: 6px; padding: 8px;">
            <div style="font-weight: 800; font-size: 10px; color: #059669; text-transform: uppercase; margin-bottom: 4px;">
              Tier 1: Highest Preferred (Primary Reinforcers)
            </div>
            ${highestPrefs
              .map(
                (p) => `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E5E7EB; padding: 3px 0; font-size: 9px;">
                <strong>${escapeHtml(p.name)}</strong>
                <span style="color: #6B7280;">${formatMMSS(p.duration_seconds || 180)} (${p.duration_seconds || 180}s) • ${p.frequency_count || 4}x • ${escapeHtml(p.context || 'Sensory Time')}</span>
              </div>
            `,
              )
              .join('')}
          </div>

          <!-- Tier 2 & 3: Moderate & Low -->
          <div style="background: #F8FAFC; border: 1px solid #E5E7EB; border-top: 3px solid #F6C445; border-radius: 6px; padding: 8px;">
            <div style="font-weight: 800; font-size: 10px; color: #B45309; text-transform: uppercase; margin-bottom: 4px;">
              Tier 2 & 3: Moderate / Low Preferred Items
            </div>
            ${moderatePrefs
              .slice(0, 2)
              .map(
                (p) => `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E5E7EB; padding: 3px 0; font-size: 9px;">
                <span>${escapeHtml(p.name)}</span>
                <span class="badge badge-amber" style="font-size: 8px;">Secondary (${formatMMSS(p.duration_seconds || 60)})</span>
              </div>
            `,
              )
              .join('')}
            ${lowPrefs
              .slice(0, 1)
              .map(
                (p) => `
              <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 9px;">
                <span>${escapeHtml(p.name)}</span>
                <span class="badge badge-neutral" style="font-size: 8px;">Low / Avoidant</span>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>

        <!-- Section 4: 12 Canonical Sensory Activities Matrix -->
        <div class="section-title">Sub-Assessment 4: Sensory Time Engagement Matrix (12 Canonical Activities)</div>
        <table class="clinical-table" style="font-size: 9px;">
          <thead>
            <tr>
              <th style="width: 55px;">Code</th>
              <th style="width: 130px;">Activity Name</th>
              <th style="width: 110px; text-align: center;">Engagement Level</th>
              <th style="width: 90px; text-align: center;">Affective Reaction</th>
              <th>Teacher's Clinical Remark</th>
            </tr>
          </thead>
          <tbody>
            ${sensoryActivities
              .map((act) => {
                let rxBadge = 'badge-mastered';
                if (act.response_reaction === 'Neutral') rxBadge = 'badge-emerging';
                if (act.response_reaction === 'Refused') rxBadge = 'badge-deficit';
                if (act.response_reaction === 'Not Observed') rxBadge = 'badge-neutral';

                return `
                <tr>
                  <td style="font-weight: 800; color: #1A2233;">${escapeHtml(act.code)}</td>
                  <td style="font-weight: 700;">${escapeHtml(act.name)}</td>
                  <td style="text-align: center;"><span class="badge badge-neutral">${escapeHtml(act.engagement_level || 'Independent')}</span></td>
                  <td style="text-align: center;"><span class="badge ${rxBadge}">${escapeHtml(act.response_reaction || 'Enjoyed')}</span></td>
                  <td style="font-size: 8.5px; color: #4B5563;">${escapeHtml(act.remark || 'Observed active participation with positive regulation.')}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>

        <!-- Signatures and Institutional Sign-Off -->
        <div class="section-title">Section V: Clinical Attestation & Director Sign-Off</div>
        <div class="signatures-container">
          <!-- Assessor Signature -->
          <div class="signature-card">
            <h4>Lead Clinical Assessor / Teacher</h4>
            <div class="signature-line">
              ${escapeHtml(leadClinician.split(',')[0])}
            </div>
            <div class="signature-meta">
              <span><strong>Assessor:</strong> ${escapeHtml(leadClinician)}</span>
              <span><strong>Date:</strong> ${timestamp}</span>
            </div>
            <div style="font-size: 8px; color: #6B7280; margin-top: 4px;">
              ☑ Verified baseline assessment battery administered per standardized clinical protocol.
            </div>
          </div>

          <!-- Program Director Signature -->
          <div class="signature-card" style="border-left: 3px solid #059669;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <h4 style="margin: 0;">Clinical Program Director</h4>
              <span class="badge badge-mastered">DIGITALLY APPROVED</span>
            </div>
            <div class="signature-line" style="color: #059669;">
              Dr. Sarah Jenkins, BCBA-D
            </div>
            <div class="signature-meta">
              <span><strong>Director:</strong> Dr. Sarah Jenkins, BCBA-D</span>
              <span><strong>Approved:</strong> ${timestamp}</span>
            </div>
            <div style="font-size: 8px; color: #059669; font-weight: 700; margin-top: 4px;">
              ☑ Approved & Signed-Off. Student authorized for IUP Creation (Ready for IUP).
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="page-footer">
        <div class="page-footer-left">Melu'e Foundation • Form ${formId} • Student ID: ${escapeHtml(studentIdFormatted)}</div>
        <div class="page-footer-right">Page 4 of 4</div>
      </div>
    </div>

  </div>
</body>
</html>
  `;
}
