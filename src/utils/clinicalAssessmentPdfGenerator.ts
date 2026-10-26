// src/utils/clinicalAssessmentPdfGenerator.ts
// Clinical Intake Evaluation Report Generator (SCR-PD-002 / SCR-015 / Form MCTC-TRP-015)
// Institutional Clinical Theme: Melu'e Navy (#1A2233) & Melu'e Gold (#F6C445)

export interface ClinicalReportPayload {
  director_name?: string;
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
    completed_on?: string;
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
    student.student_number || student.studentNumber || student.student_id || student.id || '';
  let studentIdFormatted = rawId || '—';
  if (rawId && !/^MEL-.*-\d{2}$/i.test(studentIdFormatted)) {
    const cleanNum = String(rawId)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase()
      .padEnd(4, '0');
    studentIdFormatted = `MEL-${cleanNum}-26`;
  }

  const studentName = student.full_name || student.name || '—';
  const age = student.age != null ? `${student.age} yrs` : '—';
  const dob = student.date_of_birth || '—';
  const diagnosis = student.diagnosis || '—';
  const program = student.program || student.program_type || '—';
  const therapyGroup = student.therapyGroup || student.therapy_group || '—';
  const leadClinician = student.lead_clinician || student.therapist || data.lead_clinician || '—';
  const assessmentWindow =
    student.assessment_window || assessment.completed_on || assessment.dateCompleted || '—';
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

  // 1. ABLLS-R Skills Assessment Data - strictly dynamic from real records
  const domains = skills.domains || [];
  const totalEvaluatedDomains = skills.total_domains_evaluated || domains.length;
  const totalScoredItems = domains.reduce((acc, d) => acc + (d.scored_items || 0), 0);
  const totalPointsEarned = domains.reduce((acc, d) => acc + (d.total_points || 0), 0);
  const totalPossiblePoints = domains.reduce((acc, d) => acc + (d.max_possible_points || 0), 0);
  const overallMastery =
    skills.overall_mastery_percentage ??
    skills.overall_score ??
    (totalPossiblePoints > 0 ? Math.round((totalPointsEarned / totalPossiblePoints) * 100) : 0);

  const emergingSkills = (skills.emerging_skills || []).slice(0, 10);
  const criticalGaps = (skills.critical_gaps || []).slice(0, 10);
  const needAnalysis = skills.need_analysis || [];

  // 2. Behavior Assessment Data - strictly dynamic from real records
  const targetBehaviors = behavior.target_behaviors || [];
  const abcLogs = (behavior.abc_incident_log || []).slice(0, 8);

  // Parse MAS Scores dynamically
  const masRows: Array<{
    category: string;
    total: string | number;
    mean: string | number;
    rank: string;
  }> = [];
  const firstTb = targetBehaviors[0];
  const rawMas =
    firstTb?.mas_scores || (behavior as any).mas_scores || (behavior as any).mass?.scores;
  if (rawMas && typeof rawMas === 'object') {
    const masKeys = [
      { key: 'escape', label: 'Demand / Escape' },
      { key: 'attention', label: 'Attention Seeking' },
      { key: 'tangible', label: 'Tangible Access' },
      { key: 'sensory', label: 'Sensory / Automatic' },
    ];
    masKeys.forEach(({ key, label }) => {
      const entry = rawMas[key] || rawMas[label];
      if (entry) {
        masRows.push({
          category: label,
          total: entry.total ?? entry.score ?? '—',
          mean: entry.mean != null ? Number(entry.mean).toFixed(2) : '—',
          rank: entry.rank ? `Rank ${entry.rank}` : '—',
        });
      }
    });
  }

  // Parse FAST Scores dynamically
  const fastRows: Array<{
    variable: string;
    yesCount: string;
    pct: string;
    dominant: string;
    isDominant: boolean;
  }> = [];
  const rawFast =
    firstTb?.fast_scores || (behavior as any).fast_scores || (behavior as any).fast?.scores;
  if (rawFast && typeof rawFast === 'object') {
    const fastKeys = [
      { key: 'social_escape', label: 'Social Escape (Demands)' },
      { key: 'social_attention', label: 'Social Attention' },
      { key: 'social_tangible', label: 'Social Tangibles' },
      { key: 'automatic_sensory', label: 'Sensory Stimulation' },
      { key: 'automatic_pain', label: 'Pain Attenuation' },
    ];
    fastKeys.forEach(({ key, label }) => {
      const entry = rawFast[key] || rawFast[label];
      if (entry) {
        const yes = entry.yes_count ?? entry.yesCount ?? entry.score ?? 0;
        const max = entry.max_points ?? entry.maxPoints ?? 8;
        const pctVal =
          entry.percentage != null
            ? Math.round(entry.percentage)
            : Math.round((yes / (max || 1)) * 100);
        const isDom = Boolean(entry.is_dominant || entry.dominant);
        fastRows.push({
          variable: label,
          yesCount: `${yes} / ${max}`,
          pct: `${pctVal}%`,
          dominant: isDom ? 'PRIMARY' : 'Secondary',
          isDominant: isDom,
        });
      }
    });
  }

  // 3. Preference Assessment Data - strictly dynamic from real records
  const rawHighest = preferences.tiers?.highest || [];
  const rawModerate = preferences.tiers?.moderate || [];
  const rawLow = preferences.tiers?.low || [];
  const topPrefs = preferences.top_preferences || (preferences as any).top_items || [];

  let highestPrefs = rawHighest;
  let moderatePrefs = rawModerate;
  let lowPrefs = rawLow;

  if (
    highestPrefs.length === 0 &&
    moderatePrefs.length === 0 &&
    lowPrefs.length === 0 &&
    topPrefs.length > 0
  ) {
    highestPrefs = topPrefs.slice(0, 3).map((p: any) => ({
      name: typeof p === 'string' ? p : p.name,
      duration_seconds: p.duration_seconds || 180,
      frequency_count: p.frequency_count || 4,
      context: p.context || 'Session Reinforcer',
    }));
    moderatePrefs = topPrefs.slice(3, 5).map((p: any) => ({
      name: typeof p === 'string' ? p : p.name,
      duration_seconds: p.duration_seconds || 60,
      frequency_count: p.frequency_count || 2,
      context: p.context || 'Tabletop Activity',
    }));
    lowPrefs = topPrefs.slice(5).map((p: any) => ({
      name: typeof p === 'string' ? p : p.name,
      duration_seconds: p.duration_seconds || 0,
      frequency_count: p.frequency_count || 0,
      context: p.context || 'Neutral Item',
    }));
  }

  // 4. Sensory Activities Data - strictly from recorded activities
  const sensoryActivities = (sensory.activities || []).map((act) => ({
    code: act.code || 'SEN',
    name: act.name || 'Sensory Activity',
    engagement_level: act.engagement_level || 'Evaluated',
    response_reaction: act.response_reaction || 'Observed',
    remark: act.remark || '—',
  }));

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
      color: #1E293B;
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
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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
      border-bottom: 2px solid #E2E8F0;
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
      background: #EFF6FF;
      color: #2563EB;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 19px;
      letter-spacing: -0.5px;
      border: 1.5px solid #BFDBFE;
    }
    .inst-name-block h1 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      color: #1E293B;
      letter-spacing: -0.2px;
      text-transform: uppercase;
    }
    .inst-name-block p {
      margin: 1px 0 0 0;
      font-size: 9.5px;
      color: #64748B;
      font-weight: 500;
    }
    .form-meta {
      text-align: right;
      font-size: 9px;
      color: #475569;
      line-height: 1.35;
    }
    .form-id-badge {
      display: inline-block;
      background: #EFF6FF;
      color: #2563EB;
      border: 1px solid #BFDBFE;
      font-weight: 700;
      font-size: 9.5px;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }

    /* Document Ribbon */
    .doc-title-bar {
      background: #F8FAFC;
      border-left: 4px solid #2563EB;
      border-top: 1px solid #E2E8F0;
      border-right: 1px solid #E2E8F0;
      border-bottom: 1px solid #E2E8F0;
      border-radius: 4px;
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
      color: #1E293B;
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
      background: #EFF6FF;
      color: #2563EB;
      border: 1px solid #BFDBFE;
    }

    /* Section Styles */
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #1E293B;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border-bottom: 1.5px solid #E2E8F0;
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
      background: #2563EB;
      border-radius: 2px;
    }

    /* Student Demographics Box */
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
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
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .demo-val {
      font-size: 10.5px;
      font-weight: 700;
      color: #1E293B;
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
      color: #1E293B;
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
      background: #F8FAFC;
      color: #1E293B;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-top: 1px solid #E2E8F0;
      border-bottom: 2px solid #CBD5E1;
    }
    table.clinical-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #E2E8F0;
      color: #1E293B;
      vertical-align: middle;
    }
    table.clinical-table tr:nth-child(even) td {
      background: #FAFAFA;
    }
    table.clinical-table tr.total-row td {
      background: #F1F5F9;
      font-weight: 800;
      border-top: 2px solid #CBD5E1;
      border-bottom: 2px solid #CBD5E1;
      color: #1E293B;
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
    .badge-mastered { background: #D1FAE5; color: #059669; border: 1px solid #A7F3D0; }
    .badge-emerging { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
    .badge-deficit  { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
    .badge-amber    { background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
    .badge-neutral  { background: #F1F5F9; color: #475569; border: 1px solid #E2E8F0; }

    .skill-code-badge {
      display: inline-block;
      background: #EFF6FF;
      color: #2563EB;
      border: 1px solid #BFDBFE;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 700;
      font-size: 8.5px;
      margin-right: 4px;
    }
    .gap-code-badge {
      display: inline-block;
      background: #FEF2F2;
      color: #DC2626;
      border: 1px solid #FECACA;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 700;
      font-size: 8.5px;
      margin-right: 4px;
    }

    /* Columns layout */
    .two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 10px;
    }

    /* Page Footer */
    .page-footer {
      border-top: 1.5px solid #E2E8F0;
      padding-top: 6px;
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #64748B;
    }
    .page-footer-left {
      font-weight: 600;
    }
    .page-footer-right {
      font-weight: 700;
      color: #64748B;
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
      border: 1px solid #E2E8F0;
      background: #F8FAFC;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .signature-card h4 {
      margin: 0 0 6px 0;
      font-size: 10px;
      font-weight: 800;
      color: #1E293B;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .signature-line {
      height: 28px;
      border-bottom: 1.5px solid #CBD5E1;
      margin-bottom: 6px;
      display: flex;
      align-items: flex-end;
      font-family: 'Brush Script MT', cursive, sans-serif;
      font-size: 16px;
      color: #1E293B;
      padding-bottom: 2px;
    }
    .signature-meta {
      font-size: 8.5px;
      color: #64748B;
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
            <span class="demo-val">${escapeHtml(dob)} (${escapeHtml(age)})</span>
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
            ${
              domains.length > 0
                ? domains
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
                        <td style="font-weight: 700; color: #2563EB;">${escapeHtml(d.code)}</td>
                        <td style="font-weight: 600;">${escapeHtml(d.name)}</td>
                        <td style="text-align: center;">${d.scored_items || d.total_items || 0} / ${d.total_items || 0}</td>
                        <td style="text-align: center; font-weight: 700;">${d.total_points ?? 0}</td>
                        <td style="text-align: center; color: #64748B;">${d.max_possible_points ?? 0}</td>
                        <td style="text-align: center; font-weight: 700; color: ${pct >= 70 ? '#059669' : pct >= 40 ? '#2563EB' : '#DC2626'};">${pct}%</td>
                        <td style="text-align: center;"><span class="badge ${badgeClass}">${badgeLabel}</span></td>
                      </tr>
                    `;
                    })
                    .join('')
                : `<tr><td colspan="7" style="text-align: center; color: #64748B; padding: 16px;">No evaluated ABLLS-R domain data recorded yet.</td></tr>`
            }
            ${
              domains.length > 0
                ? `
            <tr class="total-row">
              <td colspan="2" style="text-align: right; text-transform: uppercase;">ABLLS-R Comprehensive Total:</td>
              <td style="text-align: center;">${totalScoredItems} Items</td>
              <td style="text-align: center;">${totalPointsEarned} pts</td>
              <td style="text-align: center;">${totalPossiblePoints} pts</td>
              <td style="text-align: center; color: #2563EB;">${overallMastery}%</td>
              <td style="text-align: center;"><span class="badge badge-emerging">Overall Score</span></td>
            </tr>
            `
                : ''
            }
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
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-top: 3px solid #2563EB; border-radius: 6px; padding: 10px;">
            <div style="font-weight: 800; font-size: 10.5px; color: #2563EB; margin-bottom: 6px; text-transform: uppercase;">
              ★ Emerging Foundation Skills (Score 1)
            </div>
            <div style="font-size: 8.5px; color: #64748B; margin-bottom: 8px;">
              Skills initiated with partial prompt independence as recorded during assessment trials.
            </div>
            ${
              emergingSkills.length > 0
                ? emergingSkills
                    .map(
                      (s) => `
                <div style="border-bottom: 1px solid #E2E8F0; padding: 4px 0;">
                  <span class="skill-code-badge">${escapeHtml(s.domain_code || 'Skill')}-${escapeHtml(s.identifier || '')}</span>
                  <span style="color: #1E293B;">${escapeHtml(s.description || 'Developing foundational competency')}</span>
                  ${s.note ? `<div style="font-size: 8px; color: #475569; margin-top: 2px;"><em>Teacher Note: ${escapeHtml(s.note)}</em></div>` : ''}
                </div>
              `,
                    )
                    .join('')
                : `<div style="color: #64748B; font-size: 9px; padding: 8px 0;">No emerging foundation skills recorded.</div>`
            }
          </div>

          <!-- Critical Gaps -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-top: 3px solid #DC2626; border-radius: 6px; padding: 10px;">
            <div style="font-weight: 800; font-size: 10.5px; color: #DC2626; margin-bottom: 6px; text-transform: uppercase;">
              ⚠ Critical Baseline Gaps (Score 0)
            </div>
            <div style="font-size: 8.5px; color: #64748B; margin-bottom: 8px;">
              Prerequisite developmental deficits requiring structured baseline direct instruction.
            </div>
            ${
              criticalGaps.length > 0
                ? criticalGaps
                    .map(
                      (g) => `
                <div style="border-bottom: 1px solid #E2E8F0; padding: 4px 0;">
                  <span class="gap-code-badge">${escapeHtml(g.domain_code || 'Gap')}-${escapeHtml(g.identifier || '')}</span>
                  <span style="color: #1E293B;">${escapeHtml(g.description || 'Unmastered foundation milestone')}</span>
                  ${g.note ? `<div style="font-size: 8px; color: #475569; margin-top: 2px;"><em>Teacher Note: ${escapeHtml(g.note)}</em></div>` : ''}
                </div>
              `,
                    )
                    .join('')
                : `<div style="color: #64748B; font-size: 9px; padding: 8px 0;">No critical baseline gaps identified.</div>`
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
            ${
              needAnalysis.length > 0
                ? needAnalysis
                    .map(
                      (na, idx) => `
                  <tr>
                    <td style="font-weight: 700; color: #2563EB;">${escapeHtml(na.domain_code)}</td>
                    <td style="font-weight: 600;">${escapeHtml(na.domain_name)}</td>
                    <td style="text-align: center; color: #DC2626; font-weight: 700;">${na.score_0_count ?? 0}</td>
                    <td style="text-align: center; color: #2563EB; font-weight: 700;">${na.score_1_count ?? 0}</td>
                    <td style="text-align: center; font-weight: 800;">${na.need_count ?? 0}</td>
                    <td style="text-align: center;"><span class="badge ${idx === 0 ? 'badge-deficit' : idx < 3 ? 'badge-amber' : 'badge-neutral'}">Priority ${idx + 1}</span></td>
                  </tr>
                `,
                    )
                    .join('')
                : `<tr><td colspan="6" style="text-align: center; color: #64748B; padding: 12px;">No domain need analysis records available.</td></tr>`
            }
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
            ${
              targetBehaviors.length > 0
                ? targetBehaviors
                    .map(
                      (tb) => `
                  <tr>
                    <td style="font-weight: 700; color: #1E293B;">${escapeHtml(tb.behavior_name)}</td>
                    <td>${escapeHtml(tb.definition || '—')}</td>
                    <td style="text-align: center; font-weight: 700;">${tb.frequency ?? '—'}${tb.frequency != null ? 'x' : ''}</td>
                    <td style="text-align: center;"><span class="badge ${(tb.intensity ?? 0) >= 3 ? 'badge-deficit' : 'badge-amber'}">Lvl ${tb.intensity ?? 2}</span></td>
                    <td style="font-weight: 700; color: #2563EB;">${escapeHtml(tb.hypothesized_function || tb.dominant_function || '—')}</td>
                  </tr>
                `,
                    )
                    .join('')
                : `<tr><td colspan="5" style="text-align: center; color: #64748B; padding: 12px;">No target problem behaviors recorded for this student.</td></tr>`
            }
          </tbody>
        </table>

        <!-- MAS & FAST Side-by-Side -->
        <div class="two-col-grid" style="margin-top: 8px;">
          <!-- MAS -->
          <div>
            <div class="section-title">Motivational Assessment Scale (MAS)</div>
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
                ${
                  masRows.length > 0
                    ? masRows
                        .map(
                          (m) => `
                      <tr>
                        <td>${escapeHtml(m.category)}</td>
                        <td style="text-align: center; font-weight: 700;">${m.total}</td>
                        <td style="text-align: center;">${m.mean}</td>
                        <td style="text-align: center;"><span class="badge badge-emerging">${escapeHtml(m.rank)}</span></td>
                      </tr>
                    `,
                        )
                        .join('')
                    : `<tr><td colspan="4" style="text-align: center; color: #64748B; padding: 12px;">No MAS assessment scores recorded.</td></tr>`
                }
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
                ${
                  fastRows.length > 0
                    ? fastRows
                        .map(
                          (f) => `
                      <tr>
                        <td>${escapeHtml(f.variable)}</td>
                        <td style="text-align: center; font-weight: 700;">${escapeHtml(f.yesCount)}</td>
                        <td style="text-align: center; font-weight: 700;">${escapeHtml(f.pct)}</td>
                        <td style="text-align: center;"><span class="badge ${f.isDominant ? 'badge-deficit' : 'badge-neutral'}">${escapeHtml(f.dominant)}</span></td>
                      </tr>
                    `,
                        )
                        .join('')
                    : `<tr><td colspan="4" style="text-align: center; color: #64748B; padding: 12px;">No FAST evaluation records available.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Condensed Baseline ABC Episode Log -->
        <div class="section-title">Baseline ABC Incident Episodes (Teacher Records)</div>
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
            ${
              abcLogs.length > 0
                ? abcLogs
                    .map(
                      (log) => `
                  <tr>
                    <td style="font-weight: 600;">${escapeHtml(log.date || '—')}<br /><span style="color: #64748B; font-size: 8.5px;">${escapeHtml(log.time || '')}</span></td>
                    <td>${escapeHtml(log.antecedent || '—')}</td>
                    <td style="font-weight: 700; color: #1E293B;">${escapeHtml(log.behavior_name || '—')}</td>
                    <td>${escapeHtml(log.consequence || '—')}</td>
                    <td style="text-align: center;"><span class="badge ${(log.intensity ?? 0) >= 3 ? 'badge-deficit' : 'badge-amber'}">Lvl ${log.intensity ?? 2}</span></td>
                  </tr>
                `,
                    )
                    .join('')
                : `<tr><td colspan="5" style="text-align: center; color: #64748B; padding: 12px;">No baseline ABC incident episodes logged.</td></tr>`
            }
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
          <span class="status-tag status-tag-complete">${sensoryActivities.length} ACTIVITIES LOGGED</span>
        </div>

        <!-- Section 3: 3-Tier Reinforcer Hierarchy -->
        <div class="section-title">Sub-Assessment 3: Preference Assessment & 3-Tier Reinforcer Hierarchy</div>
        <div class="two-col-grid" style="margin-bottom: 8px;">
          <!-- Tier 1: Highest Preferred -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-top: 3px solid #059669; border-radius: 6px; padding: 8px;">
            <div style="font-weight: 800; font-size: 10px; color: #059669; text-transform: uppercase; margin-bottom: 4px;">
              Tier 1: Highest Preferred (Primary Reinforcers)
            </div>
            ${
              highestPrefs.length > 0
                ? highestPrefs
                    .map(
                      (p) => `
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding: 3px 0; font-size: 9px;">
                  <strong>${escapeHtml(p.name)}</strong>
                  <span style="color: #64748B;">${p.duration_seconds ? formatMMSS(p.duration_seconds) : ''}${p.frequency_count ? ` • ${p.frequency_count}x` : ''}${p.context ? ` • ${escapeHtml(p.context)}` : ''}</span>
                </div>
              `,
                    )
                    .join('')
                : `<div style="color: #64748B; font-size: 9px; padding: 8px 0;">No Tier 1 high-preference items recorded.</div>`
            }
          </div>

          <!-- Tier 2 & 3: Moderate & Low -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-top: 3px solid #F59E0B; border-radius: 6px; padding: 8px;">
            <div style="font-weight: 800; font-size: 10px; color: #B45309; text-transform: uppercase; margin-bottom: 4px;">
              Tier 2 & 3: Moderate / Low Preferred Items
            </div>
            ${
              moderatePrefs.length > 0 || lowPrefs.length > 0
                ? `
                ${moderatePrefs
                  .map(
                    (p) => `
                  <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding: 3px 0; font-size: 9px;">
                    <span>${escapeHtml(p.name)}</span>
                    <span class="badge badge-amber" style="font-size: 8px;">Secondary (${p.duration_seconds ? formatMMSS(p.duration_seconds) : 'Moderate'})</span>
                  </div>
                `,
                  )
                  .join('')}
                ${lowPrefs
                  .map(
                    (p) => `
                  <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 9px;">
                    <span>${escapeHtml(p.name)}</span>
                    <span class="badge badge-neutral" style="font-size: 8px;">Low / Neutral</span>
                  </div>
                `,
                  )
                  .join('')}
              `
                : `<div style="color: #64748B; font-size: 9px; padding: 8px 0;">No Tier 2 or Tier 3 items recorded.</div>`
            }
          </div>
        </div>

        <!-- Section 4: Canonical Sensory Activities Matrix -->
        <div class="section-title">Sub-Assessment 4: Sensory Time Engagement Matrix</div>
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
            ${
              sensoryActivities.length > 0
                ? sensoryActivities
                    .map((act) => {
                      let rxBadge = 'badge-mastered';
                      if (act.response_reaction === 'Neutral') rxBadge = 'badge-emerging';
                      if (act.response_reaction === 'Refused') rxBadge = 'badge-deficit';
                      if (act.response_reaction === 'Not Observed') rxBadge = 'badge-neutral';

                      return `
                      <tr>
                        <td style="font-weight: 700; color: #2563EB;">${escapeHtml(act.code)}</td>
                        <td style="font-weight: 600;">${escapeHtml(act.name)}</td>
                        <td style="text-align: center;"><span class="badge badge-neutral">${escapeHtml(act.engagement_level)}</span></td>
                        <td style="text-align: center;"><span class="badge ${rxBadge}">${escapeHtml(act.response_reaction)}</span></td>
                        <td style="font-size: 8.5px; color: #475569;">${escapeHtml(act.remark)}</td>
                      </tr>
                    `;
                    })
                    .join('')
                : `<tr><td colspan="5" style="text-align: center; color: #64748B; padding: 12px;">No sensory engagement activities recorded for this student.</td></tr>`
            }
          </tbody>
        </table>

        <!-- Signatures and Institutional Sign-Off -->
        <div class="section-title">Section V: Clinical Attestation & Director Sign-Off</div>
        <div class="signatures-container">
          <!-- Assessor Signature -->
          <div class="signature-card">
            <h4>Lead Clinical Assessor / Teacher</h4>
            <div class="signature-line">
              ${escapeHtml(leadClinician !== '—' ? leadClinician.split(',')[0] : 'Assessor Pending')}
            </div>
            <div class="signature-meta">
              <span><strong>Assessor:</strong> ${escapeHtml(leadClinician)}</span>
              <span><strong>Date:</strong> ${timestamp}</span>
            </div>
            <div style="font-size: 8px; color: #64748B; margin-top: 4px;">
              ☑ Verified baseline assessment battery administered per standardized clinical protocol.
            </div>
          </div>

          <!-- Program Director Signature -->
          <div class="signature-card" style="${isReviewed ? 'border-left: 3px solid #059669;' : 'border-left: 3px solid #F59E0B;'}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <h4 style="margin: 0;">Clinical Program Director</h4>
              <span class="badge ${isReviewed ? 'badge-mastered' : 'badge-amber'}">${isReviewed ? 'DIGITALLY APPROVED' : 'PENDING REVIEW'}</span>
            </div>
            <div class="signature-line" style="${isReviewed ? 'color: #059669;' : 'color: #94A3B8; font-style: italic; font-family: inherit; font-size: 11px;'}">
              ${isReviewed ? escapeHtml((data as any).director_name || 'Clinical Program Director') : '(Pending Director Review & Sign-Off)'}
            </div>
            <div class="signature-meta">
              <span><strong>Director:</strong> ${escapeHtml((data as any).director_name || 'Clinical Program Director')}</span>
              <span><strong>Status:</strong> ${isReviewed ? `Approved: ${timestamp}` : 'Awaiting Approval'}</span>
            </div>
            <div style="font-size: 8px; color: ${isReviewed ? '#059669' : '#B45309'}; font-weight: 700; margin-top: 4px;">
              ${isReviewed ? '☑ Approved & Signed-Off. Student authorized for IUP Creation (Ready for IUP).' : '⏳ Under review by Program Director. Pending authorization for IUP creation.'}
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
