import type { StudentProfileData } from '../screens/coordinator/StudentProfileScreen';

const SOCIAL_SKILLS_PROMPTS = [
  '1. Initiates verbal greeting or wave to familiar teachers upon arrival',
  '2. Responds to peer approach with positive affect or shared attention',
  '3. Respects personal body boundary when sitting alongside peers',
  '4. Uses vocal mand or communicative picture to ask adult for help',
  '5. Maintains eye contact during 1-to-1 conversational interactions (>2 secs)',
  '6. Answers simple social identity questions (What is your name? How old are you?)',
  '7. Yields preferred toy to peer when prompt timer rings without tantrum',
  '8. Participates in simple turn-taking interactive play (Rolling ball, stacking)',
  '9. Discriminates happy vs. angry facial expressions on picture cards',
  '10. Stops and freezes immediately upon hearing safety "STOP" verbal cue',
];

/**
 * Generates and triggers a print/save-as-PDF dialog for the student's clinical intake profile.
 */
export function exportStudentProfileToPdf(profile: StudentProfileData): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const custom = { ...(profile.customFields || {}), ...(profile.formValues || {}) };

  const questionsHtml = SOCIAL_SKILLS_PROMPTS.map((prompt, idx) => {
    const key = `soc_q${idx + 1}`;
    const score = custom[key] || 'Not Assessed';
    return `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #334155;">${prompt}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; font-size: 13px; font-weight: 600; color: #0284C7;">${score}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${profile.fullName} — Student Clinical Intake Profile</title>
        <style>
          @media print {
            @page { margin: 12mm 15mm; size: portrait; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            background: #FFFFFF;
            margin: 0;
            padding: 24px 32px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0284C7;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .title-area h1 {
            font-size: 22px;
            font-weight: 700;
            color: #0F172A;
            margin: 0 0 4px 0;
          }
          .title-area p {
            font-size: 13px;
            color: #64748B;
            margin: 0;
          }
          .badge-area {
            text-align: right;
          }
          .status-badge {
            display: inline-block;
            background: #ECFDF5;
            color: #065F46;
            border: 1px solid #A7F3D0;
            padding: 4px 10px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
          }
          .status-badge.draft {
            background: #FEF3C7;
            color: #92400E;
            border-color: #FDE68A;
          }
          .meta-info {
            font-size: 12px;
            color: #64748B;
            margin-top: 6px;
          }
          .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0284C7;
            border-bottom: 1px solid #CBD5E1;
            padding-bottom: 6px;
            margin-bottom: 12px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px 24px;
          }
          .full-width {
            grid-column: 1 / -1;
          }
          .field-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: #64748B;
            margin-bottom: 2px;
          }
          .field-value {
            font-size: 13px;
            color: #1E293B;
            font-weight: 500;
          }
          .field-value.empty {
            color: #94A3B8;
            font-style: italic;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          th {
            background: #F8FAFC;
            padding: 8px 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #475569;
            border-bottom: 2px solid #E2E8F0;
          }
          .footer {
            margin-top: 32px;
            border-top: 1px solid #E2E8F0;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #94A3B8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-area">
            <h1>${profile.fullName || 'Student Intake Profile'}</h1>
            <p>Melu'e Foundation — Clinical & Educational Comprehensive Profile</p>
          </div>
          <div class="badge-area">
            <span class="status-badge ${profile.isDraft ? 'draft' : ''}">${profile.isDraft ? 'Draft Record' : profile.status || 'Active'}</span>
            <div class="meta-info">Student ID: <strong>${profile.id}</strong></div>
            <div class="meta-info">Printed: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <!-- 1. Student Demographics -->
        <div class="section">
          <div class="section-title">1. Student Information</div>
          <div class="grid">
            <div>
              <div class="field-label">Full Name</div>
              <div class="field-value">${profile.fullName || '—'}</div>
            </div>
            <div>
              <div class="field-label">Date of Birth & Age</div>
              <div class="field-value">${profile.dateOfBirth || '—'} (${profile.age ?? '0'} yrs)</div>
            </div>
            <div>
              <div class="field-label">Gender</div>
              <div class="field-value">${profile.gender || 'Not Provided'}</div>
            </div>
            <div>
              <div class="field-label">Recommended Placement Program</div>
              <div class="field-value">${profile.programType || 'Not Provided'}</div>
            </div>
            <div>
              <div class="field-label">Therapy Group Track</div>
              <div class="field-value">${profile.therapyGroup || 'Not Provided'}</div>
            </div>
            <div>
              <div class="field-label">Assigned Therapist</div>
              <div class="field-value">${profile.therapist || 'Unassigned'}</div>
            </div>
          </div>
        </div>

        <!-- 2. Family & Household Contacts -->
        <div class="section">
          <div class="section-title">2. Family & Household Information</div>
          <div class="grid">
            <div>
              <div class="field-label">Primary Guardian Name</div>
              <div class="field-value">${profile.guardianName || 'Not Provided'}</div>
            </div>
            <div>
              <div class="field-label">Relationship to Child</div>
              <div class="field-value">${profile.guardianRelationship || 'Not Provided'}</div>
            </div>
            <div>
              <div class="field-label">Contact Phone</div>
              <div class="field-value">${profile.guardianPhone || 'Not Provided'}</div>
            </div>
            <div>
              <div class="field-label">Email Address</div>
              <div class="field-value">${profile.guardianEmail || 'Not Provided'}</div>
            </div>
            <div>
              <div class="field-label">Emergency Secondary Contact</div>
              <div class="field-value">${profile.emergencyContact || 'Not Provided'}</div>
            </div>
            <div>
              <div class="field-label">Household Structure</div>
              <div class="field-value">${profile.householdStructure || 'Not Provided'}</div>
            </div>
          </div>
        </div>

        <!-- 3. Medical & Clinical Background -->
        <div class="section">
          <div class="section-title">3. Medical & Clinical Profile</div>
          <div class="grid">
            <div>
              <div class="field-label">Primary Diagnosis</div>
              <div class="field-value">${profile.diagnosis || 'Not Provided'}</div>
            </div>
            <div>
              <div class="field-label">Date of Diagnosis</div>
              <div class="field-value">${profile.diagnosisDate || 'Not Provided'}</div>
            </div>
            <div class="full-width">
              <div class="field-label">Developmental History</div>
              <div class="field-value ${!profile.developmentalHistory ? 'empty' : ''}">${profile.developmentalHistory || 'Not Provided'}</div>
            </div>
            <div class="full-width">
              <div class="field-label">Medical Notes & Dietary Restrictions</div>
              <div class="field-value ${!profile.medicalNotes ? 'empty' : ''}">${profile.medicalNotes || 'Not Provided'}</div>
            </div>
            <div>
              <div class="field-label">Transportation Required</div>
              <div class="field-value">${profile.transportation || 'No'}</div>
            </div>
          </div>
        </div>

        <!-- 4. Sensory & Behavioral Reinforcers -->
        <div class="section">
          <div class="section-title">4. Sensory & Behavioral Reinforcers</div>
          <div class="grid">
            <div>
              <div class="field-label">Visual Reinforcers</div>
              <div class="field-value ${!profile.reinforcerVisual ? 'empty' : ''}">${profile.reinforcerVisual || 'Not Specified'}</div>
            </div>
            <div>
              <div class="field-label">Auditory Reinforcers</div>
              <div class="field-value ${!profile.reinforcerAuditory ? 'empty' : ''}">${profile.reinforcerAuditory || 'Not Specified'}</div>
            </div>
            <div>
              <div class="field-label">Tactile Preferences</div>
              <div class="field-value ${!profile.reinforcerTactile ? 'empty' : ''}">${profile.reinforcerTactile || 'Not Specified'}</div>
            </div>
            <div>
              <div class="field-label">Kinetic & Movement Preferences</div>
              <div class="field-value ${!profile.reinforcerKinetic ? 'empty' : ''}">${profile.reinforcerKinetic || 'Not Specified'}</div>
            </div>
          </div>
        </div>

        <!-- 5. Social Skills Assessment Results -->
        <div class="section">
          <div class="section-title">5. Social Skills Questionnaire Results</div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Skill Indicator / Prompt</th>
                <th style="text-align: center; width: 140px;">Observed Rating</th>
              </tr>
            </thead>
            <tbody>
              ${questionsHtml}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div>Confidential Patient Record • Melu'e Foundation Special Education System</div>
          <div>HIPAA / FERPA Compliant Storage</div>
        </div>
      </body>
    </html>
  `;

  try {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
      return true;
    } else {
      // If popup blocker intervened, print current window as fallback
      window.print();
      return true;
    }
  } catch {
    window.print();
    return true;
  }
}
