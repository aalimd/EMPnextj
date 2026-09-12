/**
 * Verbatim library metadata from legacy `assets/app.js` (GROUPS, RELATED,
 * PATIENT_CONTEXTS, CP_COLOR_SVG). No content edits — typed exports only.
 */
// @ts-nocheck — verbatim legacy literals (documented exception).
/* eslint-disable */

function colorSvg(inner: string): string {
  return '<svg class="color-ico" viewBox="0 0 32 32" aria-hidden="true" focusable="false">' + inner + '</svg>';
}

export interface TopicGroup { title: string; ids: string[] }

export const GROUPS: TopicGroup[] = [
        { title: 'Cardiorespiratory & vascular', ids: ['chest-pain', 'dyspnea', 'hemoptysis', 'cyanosis', 'shock', 'palpitations', 'edema', 'limb-ischemia'] },
        { title: 'Neurologic', ids: ['headache', 'dizziness', 'ams', 'coma', 'seizures', 'weakness', 'syncope', 'diplopia', 'focal-neurologic-deficit'] },
        { title: 'Abdomen, pelvis & GU', ids: ['abdominal-pain', 'gib', 'nausea-vomiting', 'diarrhea', 'constipation', 'jaundice', 'pelvic-pain', 'vaginal-bleeding', 'scrotal-pain', 'flank-pain', 'urinary-retention', 'back-pain'] },
        { title: 'Airway, allergy, skin & pediatrics', ids: ['airway-stridor', 'anaphylaxis', 'rash', 'fever', 'pediatric-fever', 'pediatric-respiratory-distress', 'sore-throat', 'red-eye', 'joint-pain'] },
        { title: 'Toxic, metabolic & environmental', ids: ['overdose', 'suicidal', 'hyperglycemia', 'heat-cold'] },
        { title: 'Trauma, pregnancy & older adults', ids: ['multiple-trauma', 'pregnancy-emergency', 'falls-geriatric-trauma'] }
    ];

export const RELATED: Record<string, string[]> = {
        'chest-pain': ['dyspnea', 'syncope', 'shock', 'nausea-vomiting', 'limb-ischemia'],
        'dyspnea': ['chest-pain', 'shock', 'cyanosis', 'hemoptysis'],
        'limb-ischemia': ['chest-pain', 'shock', 'back-pain', 'fever'],
        'abdominal-pain': ['pelvic-pain', 'scrotal-pain', 'nausea-vomiting', 'gib', 'diarrhea'],
        'headache': ['dizziness', 'red-eye', 'seizures', 'ams', 'diplopia'],
        'ams': ['coma', 'seizures', 'overdose', 'syncope', 'fever', 'heat-cold', 'hyperglycemia'],
        'syncope': ['chest-pain', 'seizures', 'gib', 'shock'],
        'weakness': ['back-pain', 'seizures', 'ams', 'diplopia'],
        'gib': ['shock', 'abdominal-pain', 'syncope'],
        'fever': ['pediatric-fever', 'shock', 'sore-throat', 'ams', 'heat-cold', 'limb-ischemia'],
        'dizziness': ['headache', 'syncope', 'diplopia'],
        'back-pain': ['weakness', 'abdominal-pain', 'constipation'],
        'red-eye': ['headache', 'diplopia', 'sore-throat'],
        'joint-pain': ['fever', 'back-pain'],
        'coma': ['ams', 'seizures', 'overdose', 'shock'],
        'pelvic-pain': ['vaginal-bleeding', 'abdominal-pain', 'scrotal-pain'],
        'vaginal-bleeding': ['pelvic-pain', 'shock', 'abdominal-pain'],
        'scrotal-pain': ['abdominal-pain', 'pelvic-pain'],
        'seizures': ['ams', 'coma', 'overdose', 'headache'],
        'sore-throat': ['fever', 'dyspnea', 'chest-pain'],
        'hemoptysis': ['dyspnea', 'chest-pain', 'shock'],
        'shock': ['chest-pain', 'dyspnea', 'gib', 'fever', 'overdose', 'limb-ischemia', 'hyperglycemia'],
        'nausea-vomiting': ['abdominal-pain', 'diarrhea', 'chest-pain', 'headache', 'constipation', 'hyperglycemia'],
        'diarrhea': ['nausea-vomiting', 'abdominal-pain', 'constipation'],
        'constipation': ['abdominal-pain', 'diarrhea', 'back-pain', 'nausea-vomiting'],
        'jaundice': ['abdominal-pain', 'fever', 'overdose'],
        'cyanosis': ['dyspnea', 'shock', 'overdose'],
        'overdose': ['ams', 'coma', 'seizures', 'suicidal', 'heat-cold'],
        'pediatric-fever': ['fever', 'seizures', 'sore-throat'],
        'suicidal': ['overdose', 'ams', 'heat-cold'],
        'hyperglycemia': ['ams', 'nausea-vomiting', 'shock', 'abdominal-pain'],
        'heat-cold': ['ams', 'coma', 'fever', 'overdose'],
        'diplopia': ['headache', 'red-eye', 'weakness', 'dizziness'],
        'palpitations': ['chest-pain', 'syncope', 'dyspnea', 'shock'],
        'focal-neurologic-deficit': ['headache', 'dizziness', 'weakness', 'diplopia', 'ams'],
        'airway-stridor': ['dyspnea', 'sore-throat', 'anaphylaxis', 'pediatric-respiratory-distress'],
        'rash': ['fever', 'anaphylaxis', 'joint-pain', 'overdose'],
        'flank-pain': ['abdominal-pain', 'pelvic-pain', 'scrotal-pain', 'fever'],
        'urinary-retention': ['back-pain', 'weakness', 'fever', 'flank-pain'],
        'edema': ['dyspnea', 'chest-pain', 'shock', 'limb-ischemia'],
        'anaphylaxis': ['airway-stridor', 'dyspnea', 'rash', 'overdose'],
        'multiple-trauma': ['shock', 'coma', 'back-pain', 'limb-ischemia'],
        'falls-geriatric-trauma': ['syncope', 'weakness', 'coma', 'multiple-trauma'],
        'pregnancy-emergency': ['pelvic-pain', 'vaginal-bleeding', 'dyspnea', 'abdominal-pain'],
        'pediatric-respiratory-distress': ['dyspnea', 'airway-stridor', 'pediatric-fever', 'anaphylaxis']
    };

export const PATIENT_CONTEXTS: Record<string, string[]> = {
        pediatric: ['pediatric-fever', 'pediatric-respiratory-distress', 'airway-stridor', 'fever', 'rash', 'seizures', 'abdominal-pain', 'headache'],
        pregnancy: ['pregnancy-emergency', 'pelvic-pain', 'vaginal-bleeding', 'abdominal-pain', 'dyspnea', 'chest-pain', 'headache', 'overdose'],
        geriatric: ['falls-geriatric-trauma', 'ams', 'syncope', 'abdominal-pain', 'chest-pain', 'dyspnea', 'headache', 'weakness', 'back-pain'],
        immunocompromised: ['fever', 'pediatric-fever', 'dyspnea', 'abdominal-pain', 'headache', 'rash', 'sore-throat'],
        trauma: ['multiple-trauma', 'falls-geriatric-trauma', 'back-pain', 'headache', 'weakness', 'limb-ischemia', 'chest-pain']
    };

export const CP_COLOR_SVG: Record<string, string> = {
        'chest-pain': colorSvg('<path d="M13 4c0-1.5 1-2.5 2.5-2.5h1C18 1.5 19 2.5 19 4v3h-6V4Z" fill="#3b82f6"/><path d="M19 5c1.5-.5 3 .5 3.5 2s-.5 3-2 3.5l-1.5.5V5Z" fill="#06b6d4"/><path d="M16 29S5 21 5 12.5C5 7.8 8.8 4 13.5 4c2.2 0 4.2.8 5.7 2.2A7.5 7.5 0 0 1 25 4c4.7 0 8.5 3.8 8.5 8.5 0 8.5-11 16.5-17.5 16.5Z" fill="#dc2626"/><path d="M16 29S9 20 9 12.5C9 8.5 11.5 6 13.5 6c2.5 0 2.5 4 2.5 4s0-4 2.5-4c2 0 4.5 2.5 4.5 6.5 0 7.5-7 16.5-7 16.5Z" fill="#ef4444"/><path d="M7 14h5l1.8-3.5 2.4 7 1.8-5.5 1.5 2H24" stroke="#fef08a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'),
        'dyspnea': colorSvg('<path d="M14 2h4v7h-4V2Z" fill="#93c5fd"/><path d="M13 4h6M13 6h6M13 8h6" stroke="#1e40af" stroke-width="1.2" stroke-linecap="round"/><path d="M14 9c-2 2-6 3-8 6s-2 8 0 11 7 3 9 0V11c0-1-.5-2-1-2Z" fill="#0ea5e9"/><path d="M18 9c2 2 6 3 8 6s2 8 0 11-7 3-9 0V11c0-1 .5-2 1-2Z" fill="#0284c7"/><path d="M14 13c-2 2-4 4-6 5M12 18c-2 1-3 3-4 3" stroke="#e0f2fe" stroke-width="1.6" stroke-linecap="round"/><path d="M18 13c2 2 4 4 6 5M20 18c2 1 3 3 4 3" stroke="#e0f2fe" stroke-width="1.6" stroke-linecap="round"/>'),
        'hemoptysis': colorSvg('<path d="M14 2h4v7h-4V2Z" fill="#93c5fd"/><path d="M14 9c-2 2-6 3-8 6s-2 8 0 11 7 3 9 0V11c0-1-.5-2-1-2Z" fill="#38bdf8"/><path d="M18 9c2 2 6 3 8 6s2 8 0 11-7 3-9 0V11c0-1 .5-2 1-2Z" fill="#0284c7"/><path d="M16 11c-1.5 2-3 4-3 6a3 3 0 0 0 6 0c0-2-1.5-4-3-6Z" fill="#e11d48"/><circle cx="12" cy="22" r="2" fill="#e11d48"/><circle cx="20" cy="23" r="1.5" fill="#f43f5e"/>'),
        'cyanosis': colorSvg('<circle cx="16" cy="16" r="13" fill="#1e3a8a"/><path d="M16 5a11 11 0 0 1 11 11c0 6-5 11-11 11S5 22 5 16 10 5 16 5Z" fill="#2563eb"/><circle cx="11.5" cy="13.5" r="2.2" fill="#93c5fd"/><circle cx="20.5" cy="13.5" r="2.2" fill="#93c5fd"/><path d="M11 20c1.5 2 3.5 2.5 5 2.5s3.5-.5 5-2.5" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/><path d="M16 7v3M7 16h3M22 16h3" stroke="#60a5fa" stroke-width="2" stroke-linecap="round"/>'),
        'shock': colorSvg('<circle cx="16" cy="16" r="14" fill="#fee2e2"/><path d="M16 3a13 13 0 1 0 13 13A13 13 0 0 0 16 3Z" fill="#ef4444"/><path d="M16 7l3 6h-6l3-6Z" fill="#fef08a"/><path d="M16 14v6M16 23h.01" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/><path d="M8 24l3-3M24 24l-3-3" stroke="#fca5a5" stroke-width="2.5" stroke-linecap="round"/>'),
        'palpitations': colorSvg('<path d="M16 27S6 19 6 12a6 6 0 0 1 10-4.5A6 6 0 0 1 26 12c0 7-10 15-10 15Z" fill="#f43f5e"/><path d="M16 24S9 17 9 12a4 4 0 0 1 7-2.6A4 4 0 0 1 23 12c0 5-7 12-7 12Z" fill="#fb7185"/><path d="M4 14c-1.5-3 0-6.5 3-8M28 14c1.5-3 0-6.5-3-8" stroke="#fb7185" stroke-width="2" stroke-linecap="round"/><path d="M10 14h2.5l1.5-4 2 8 1.5-5 1.5 2H21" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'),
        'edema': colorSvg('<path d="M11 3h7l-1 10c0 3 2 5 3 7 1.5 2.5 3 4 3 6.5 0 2-1.5 3.5-3.5 3.5H9a4 4 0 0 1-4-4c0-2 1.5-4 3-6.5 1-2 3-4 3-7V3Z" fill="#bae6fd"/><path d="M16 13c1 2 2.5 4 3 6 1.5 2.5 3 4 3 6.5 0 2-1.5 3.5-3.5 3.5H9c-2 0-3-1-3-2.5 0-2 1.5-4 3-6.5 1-2 2-4 3-6" fill="#38bdf8"/><path d="M7 21c2 0 4 1 6 1s4-1 6-1M7 24c2 0 4 1 6 1s4-1 6-1" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/>'),
        'limb-ischemia': colorSvg('<path d="M9 3h8l1 9-2 7 1 7c0 2-2 4-4 4H9c-2 0-3-1.5-3-3.5l1-6.5-2-8 4-9Z" fill="#e0e7ff"/><path d="M9 3h8l-1 8h-6l-1-8Z" fill="#fca5a5"/><path d="M10 11h6l-1 8h-4l-1-8Z" fill="#cbd5e1"/><path d="M10 19h5l1 6c0 2-2 4-4 4H9c-2 0-3-1.5-3-3.5l1-6.5h3Z" fill="#93c5fd"/><path d="M13 4v6M13 10l-1.5 3M13 10l1.5 3" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/><path d="M19 18l3 3M22 18l-3 3" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>'),
        'headache': colorSvg('<circle cx="16" cy="16" r="14" fill="#f3e8ff"/><path d="M16 6a9.5 9.5 0 0 0-9.5 9.5c0 3.5 2 6.5 5 8v3.5h9V23.5c3-1.5 5-4.5 5-8A9.5 9.5 0 0 0 16 6Z" fill="#a855f7"/><path d="M16 6c-3 0-5.5 2-6.5 4.5 1.5 1 3.5.5 4.5 2s0 3.5-1 4.5c2 1 4 0 5-1.5 1 1.5 3 2.5 5 1.5-1-1-2-3-1-4.5s3-1 4.5-2C21.5 8 19 6 16 6Z" fill="#c084fc"/><path d="M7 6l2.5 2.5M25 6l-2.5 2.5M16 2v3M4 14h3M25 14h3" stroke="#eab308" stroke-width="2.5" stroke-linecap="round"/>'),
        'dizziness': colorSvg('<circle cx="16" cy="16" r="14" fill="#e0f2fe"/><path d="M24 12a8 8 0 1 0-4 7" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M21 7l4 4-4 4" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="16" cy="16" r="4" fill="#0284c7"/><circle cx="16" cy="16" r="1.8" fill="#ffffff"/>'),
        'ams': colorSvg('<circle cx="16" cy="16" r="14" fill="#ede9fe"/><path d="M16 7a8.5 8.5 0 1 0 8.5 8.5A8.5 8.5 0 0 0 16 7Z" fill="#6366f1"/><path d="M16 9a6.5 6.5 0 1 1-6.5 6.5A6.5 6.5 0 0 1 16 9Z" fill="#818cf8"/><circle cx="16" cy="15.5" r="3" fill="#fde047"/><path d="M16 7c2 0 4.5 1.5 5.5 3.5M16 24c-2 0-4.5-1.5-5.5-3.5" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>'),
        'coma': colorSvg('<circle cx="16" cy="16" r="14" fill="#1e1b4b"/><path d="M16 6a9.5 9.5 0 0 0-9.5 9.5c0 4 2.5 7 6 8.5v2.5h6v-2.5c3.5-1.5 6-4.5 6-8.5a9 9 0 0 0-9-9Z" fill="#4338ca"/><path d="M6 16h6c1.5-2 3-2 4 0s2.5 2 4 0h6" stroke="#a5b4fc" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M12 11h4M13 13h2" stroke="#818cf8" stroke-width="1.8" stroke-linecap="round"/>'),
        'seizures': colorSvg('<path d="M16 6a9.5 9.5 0 0 0-9.5 9.5c0 4 2.5 7.5 6.5 9v2.5h6v-2.5c4-1.5 6.5-5 6.5-9A9.5 9.5 0 0 0 16 6Z" fill="#7c3aed"/><path d="M18 2l-7 12h6l-3 14 11-15h-6l4-11Z" fill="#facc15" stroke="#ca8a04" stroke-width="1.2" stroke-linejoin="round"/>'),
        'weakness': colorSvg('<rect x="4" y="20" width="24" height="8" rx="3" fill="#fca5a5"/><path d="M16 3v10c-3 0-5 2-5 5h10c0-3-2-5-5-5V3Z" fill="#3b82f6"/><circle cx="13" cy="15" r="1.5" fill="#60a5fa"/><circle cx="16" cy="14" r="1.5" fill="#60a5fa"/><circle cx="19" cy="15" r="1.5" fill="#60a5fa"/><path d="M13 18v1M16 18v1M19 18v1" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>'),
        'syncope': colorSvg('<circle cx="16" cy="7" r="4" fill="#f97316"/><path d="M12 13h8c1 0 2 1 2 2v6h-3v8h-6v-8H9v-6c0-1 1-2 3-2Z" fill="#fb923c"/><path d="M4 16l4-4M4 12h5" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/><path d="M23 6l2 2-2 2-2-2Z" fill="#fde047"/><path d="M26 12l1.5 1.5-1.5 1.5-1.5-1.5Z" fill="#fde047"/>'),
        'diplopia': colorSvg('<path d="M4 14s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/><circle cx="14" cy="14" r="3.5" fill="#0284c7"/><circle cx="14" cy="14" r="1.5" fill="#ffffff"/><path d="M8 18s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="2 2"/><circle cx="18" cy="18" r="3" fill="#38bdf8"/>'),
        'focal-neurologic-deficit': colorSvg('<path d="M16 6a9.5 9.5 0 0 0-9.5 9.5c0 4 2.5 7.5 6.5 9v2.5h6v-2.5c4-1.5 6.5-5 6.5-9A9.5 9.5 0 0 0 16 6Z" fill="#ddd6fe"/><path d="M16 6c-3 0-5.5 2-6.5 4.5 1.5 1 3.5.5 4.5 2s0 3.5-1 4.5c2 1 4 0 5-1.5 1 1.5 3 2.5 5 1.5-1-1-2-3-1-4.5s3-1 4.5-2C21.5 8 19 6 16 6Z" fill="#c084fc"/><path d="M18 10c2 0 4 1 4.5 3s0 4-2 4.5-3-.5-4-2c-.5-1 .5-4.5 1.5-5.5Z" fill="#dc2626"/><circle cx="20" cy="14" r="1.5" fill="#ffffff"/>'),
        'abdominal-pain': colorSvg('<path d="M14 3c-1 0-2 1-2 2v4c0 1.5-.5 2.5-1.5 3.5C8.5 14.5 7 17 7 20c0 5 4 8 9 8s8.5-3 8.5-7.5c0-4-3-6.5-5-8.5V5c0-1-1-2-2-2h-3.5Z" fill="#fb923c"/><path d="M15 8c-2 3-5 5-5 8 0 3.5 2.5 6 6 6s5.5-2 5.5-5.5c0-3-2.5-5-4.5-6.5V8Z" fill="#ea580c"/><circle cx="15.5" cy="18.5" r="4.5" fill="#fef08a"/><circle cx="15.5" cy="18.5" r="2" fill="#ef4444"/>'),
        'gib': colorSvg('<path d="M11 4h5v5c2 1.5 4 3.5 4 6 0 4.5-3.5 7-7.5 7S5 19.5 5 15c0-3 1.5-5 3.5-6.5V4h2.5Z" fill="#fed7aa"/><path d="M19 16c0-3-3.5-7-3.5-7S12 13 12 16a3.5 3.5 0 0 0 7 0Z" fill="#e11d48"/><path d="M15 14.5a1.5 1.5 0 0 1 2 1" stroke="#fda4af" stroke-width="1.2" stroke-linecap="round"/>'),
        'nausea-vomiting': colorSvg('<circle cx="16" cy="16" r="14" fill="#dcfce7"/><path d="M14 5c-3 0-5 2.5-5 5.5 0 3 2 5 4 6.5s3 3 3 5-1.5 3.5-3.5 3.5-3.5-1-4-2.5" stroke="#16a34a" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="M10 7l4-2-2 4" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="21" cy="9" r="2.5" fill="#22c55e"/><circle cx="24" cy="14" r="1.8" fill="#4ade80"/>'),
        'diarrhea': colorSvg('<path d="M10 4c-3 0-5 2-5 4.5s2 4.5 4.5 4.5h13c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5H8" stroke="#0ea5e9" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M9 25c2 0 4 1.5 7 1.5s5-1.5 7-1.5" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/><circle cx="16" cy="28" r="1.5" fill="#0284c7"/>'),
        'constipation': colorSvg('<path d="M7 26V11a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v15" stroke="#d97706" stroke-width="4.5" stroke-linecap="round" fill="none"/><rect x="11" y="10" width="10" height="11" rx="3" fill="#92400e"/><path d="M13 13h6M13 16h6" stroke="#fcd34d" stroke-width="1.5" stroke-linecap="round"/>'),
        'jaundice': colorSvg('<path d="M6 9c5-3 15-3 20 2s1 11-4 13-13 1-16-5c-2-4-2-8 0-10Z" fill="#f59e0b"/><path d="M9 11c4-2 11-2 15 1s1 8-2 10-10 1-13-4c-2-3-2-5 0-7Z" fill="#d97706"/><circle cx="19" cy="18" r="3.5" fill="#10b981"/><path d="M19 14v4" stroke="#059669" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="19" r="2" fill="#fef08a"/>'),
        'pelvic-pain': colorSvg('<path d="M16 9c-3 0-5 2.5-5 5.5v7h10v-7c0-3-2-5.5-5-5.5Z" fill="#f472b6"/><path d="M11 11c-2.5 0-5-1.5-6-3.5s0-3.5 2-3.5 3.5 1.5 4 3.5" stroke="#db2777" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M21 11c2.5 0 5-1.5 6-3.5s0-3.5-2-3.5-3.5 1.5-4 3.5" stroke="#db2777" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="5" cy="8" r="2.5" fill="#f43f5e"/><circle cx="27" cy="8" r="2.5" fill="#f43f5e"/><circle cx="16" cy="16" r="2" fill="#ffffff"/>'),
        'vaginal-bleeding': colorSvg('<path d="M16 6c-4 0-7 3-7 7v9h14v-9c0-4-3-7-7-7Z" fill="#fbcfe8"/><path d="M16 11c-2 2-3.5 4.5-3.5 6.5a3.5 3.5 0 0 0 7 0c0-2-1.5-4.5-3.5-6.5Z" fill="#e11d48"/><path d="M15 15.5a1.2 1.2 0 0 1 1.8 1" stroke="#fda4af" stroke-width="1.2" stroke-linecap="round"/>'),
        'scrotal-pain': colorSvg('<path d="M16 3c-1 3 2 5 0 8s-3 3-3 7a6 6 0 0 0 12 0c0-4-2-4-2-7s2-5 0-8h-7Z" fill="#ddd6fe"/><circle cx="16" cy="18" r="5" fill="#8b5cf6"/><path d="M15 4c1 2-1 4 1 6" stroke="#6d28d9" stroke-width="2" stroke-linecap="round"/><path d="M13 14l3-3-1.5 5h3.5l-4 6 1-4H12l1-4Z" fill="#ef4444"/>'),
        'flank-pain': colorSvg('<path d="M19 4c-5 0-9 4-9 9 0 4 2 6.5 2 9.5 0 3.5-3 5.5-3 5.5s4.5.5 7.5-1.5 5.5-5 5.5-9c0-8-1-13.5-3-13.5Z" fill="#f87171"/><path d="M18 6c-4 0-7 3.5-7 7.5 0 3.5 1.5 5.5 1.5 8 0 3-2 4.5-2 4.5s3.5.5 6-1 4.5-4 4.5-7.5c0-6.5-1-11.5-3-11.5Z" fill="#dc2626"/><path d="M12 18c0 3-1 6-1 9" stroke="#fed7aa" stroke-width="3" stroke-linecap="round"/><circle cx="11" cy="22" r="2.8" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>'),
        'urinary-retention': colorSvg('<circle cx="16" cy="15" r="11" fill="#bae6fd"/><circle cx="16" cy="15" r="9" fill="#38bdf8"/><path d="M13 25l3 4 3-4" stroke="#1d4ed8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 13h8M14 17h4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>'),
        'back-pain': colorSvg('<rect x="10" y="4" width="12" height="5" rx="2" fill="#94a3b8"/><rect x="11" y="9" width="10" height="3" rx="1" fill="#38bdf8"/><rect x="10" y="12" width="12" height="5" rx="2" fill="#94a3b8"/><rect x="11" y="17" width="10" height="3" rx="1" fill="#ef4444"/><rect x="10" y="20" width="12" height="5" rx="2" fill="#94a3b8"/><path d="M21 18.5c2 0 4 .5 5 2" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>'),
        'joint-pain': colorSvg('<path d="M11 3h10v6c-2 1-3 3-3 5s1 4 3 5v7H11v-7c2-1 3-3 3-5s-1-4-3-5V3Z" fill="#cbd5e1"/><ellipse cx="16" cy="14" rx="8" ry="4" fill="#fecdd3" stroke="#f43f5e" stroke-width="2"/><path d="M13 14h6" stroke="#e11d48" stroke-width="2" stroke-linecap="round"/>'),
        'airway-stridor': colorSvg('<path d="M7 4h18v6c-3 1-5 4-5 8v10H12V18c0-4-2-7-5-8V4Z" fill="#fecaca"/><path d="M10 4h12v5c-2 1-3 3-3 6v13h-6V15c0-3-1-5-3-6V4Z" fill="#ef4444"/><path d="M16 6v14" stroke="#ffffff" stroke-width="2" stroke-dasharray="2 2" stroke-linecap="round"/>'),
        'anaphylaxis': colorSvg('<path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7l11-4Z" fill="#ef4444"/><path d="M16 5.5l8.5 3v6.5c0 5.5-4 9.5-8.5 11-4.5-1.5-8.5-5.5-8.5-11V8.5l8.5-3Z" fill="#dc2626"/><path d="M16 9v7M16 20h.01" stroke="#fef08a" stroke-width="3" stroke-linecap="round"/>'),
        'rash': colorSvg('<rect x="4" y="6" width="24" height="20" rx="4" fill="#fee2e2" stroke="#f43f5e" stroke-width="1.5"/><circle cx="10" cy="12" r="3" fill="#ef4444"/><circle cx="21" cy="13" r="2.5" fill="#f43f5e"/><circle cx="15" cy="18" r="3.5" fill="#e11d48"/><circle cx="10" cy="21" r="1.5" fill="#991b1b"/><circle cx="22" cy="20" r="1.8" fill="#be123c"/>'),
        'fever': colorSvg('<path d="M16 3a3 3 0 0 0-3 3v13.5a5.5 5.5 0 1 0 6 0V6a3 3 0 0 0-3-3Z" fill="#fed7aa" stroke="#ea580c" stroke-width="1.5"/><path d="M16 7v14" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="22.5" r="3.5" fill="#ef4444"/><path d="M6 10c-2 2-2 5 0 7M26 10c2 2 2 5 0 7" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"/>'),
        'pediatric-fever': colorSvg('<circle cx="16" cy="17" r="11" fill="#fbcfe8"/><circle cx="12" cy="15.5" r="1.8" fill="#475569"/><circle cx="20" cy="15.5" r="1.8" fill="#475569"/><circle cx="9" cy="18.5" r="2.2" fill="#f43f5e" opacity="0.6"/><circle cx="23" cy="18.5" r="2.2" fill="#f43f5e" opacity="0.6"/><path d="M13 22c1.5 1.5 4.5 1.5 6 0" stroke="#475569" stroke-width="1.8" stroke-linecap="round"/><rect x="8" y="5" width="16" height="5" rx="2" fill="#38bdf8"/>'),
        'pediatric-respiratory-distress': colorSvg('<circle cx="16" cy="16" r="11" fill="#e0f2fe"/><circle cx="12" cy="14" r="1.8" fill="#334155"/><circle cx="20" cy="14" r="1.8" fill="#334155"/><ellipse cx="16" cy="20" rx="2.5" ry="3" fill="#0284c7"/><path d="M6 17h6M20 17h6" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/><path d="M13 8l3-3 3 3" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/>'),
        'sore-throat': colorSvg('<path d="M8 5C5 12 5 21 8 27h16c3-6 3-15 0-22H8Z" fill="#fed7aa"/><path d="M10 8c2 4 3 9 3 13h6c0-4 1-9 3-13H10Z" fill="#991b1b"/><path d="M16 9v5" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/><circle cx="11" cy="16" r="3" fill="#ef4444"/><circle cx="21" cy="16" r="3" fill="#ef4444"/>'),
        'red-eye': colorSvg('<path d="M2 16s5.5-9 14-9 14 9 14 9-5.5 9-14 9-14-9-14-9Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/><path d="M5 13c3 1 5 0 7 2M5 19c3-1 5 0 7-1M27 13c-3 1-5 0-7 2M27 19c-3-1-5 0-7-1" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/><circle cx="16" cy="16" r="6" fill="#0284c7"/><circle cx="16" cy="16" r="3" fill="#0f172a"/><circle cx="14.5" cy="14.5" r="1.2" fill="#ffffff"/>'),
        'overdose': colorSvg('<g transform="rotate(-35 14 14)"><rect x="9" y="4" width="10" height="18" rx="5" fill="#10b981"/><path d="M9 13h10v4a5 5 0 0 1-10 0v-4Z" fill="#f43f5e"/><line x1="12" y1="6" x2="12" y2="18" stroke="#ffffff" stroke-width="1.2" opacity="0.6" stroke-linecap="round"/></g><circle cx="23" cy="22" r="5" fill="#a78bfa"/><line x1="20" y1="22" x2="26" y2="22" stroke="#6d28d9" stroke-width="1.2"/>'),
        'suicidal': colorSvg('<circle cx="16" cy="16" r="12" fill="#6366f1"/><circle cx="16" cy="16" r="6" fill="#ffffff"/><path d="M16 4v6M16 22v6M4 16h6M22 16h6" stroke="#ffffff" stroke-width="3.5"/><circle cx="16" cy="16" r="3.5" fill="#fde047"/>'),
        'hyperglycemia': colorSvg('<rect x="9" y="3" width="14" height="22" rx="3" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/><rect x="12" y="6" width="8" height="6" rx="1" fill="#1e293b"/><path d="M13 9h4" stroke="#4ade80" stroke-width="2" stroke-linecap="round"/><path d="M16 17v7" stroke="#d97706" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="27" r="2.5" fill="#dc2626"/>'),
        'heat-cold': colorSvg('<path d="M16 3v26" stroke="#94a3b8" stroke-width="1.5"/><path d="M16 4a3 3 0 0 0-3 3v13a5 5 0 0 0 3 4.5V4Z" fill="#38bdf8"/><path d="M16 4a3 3 0 0 1 3 3v13a5 5 0 0 1-3 4.5V4Z" fill="#f97316"/><path d="M7 8l4 4M7 16l4-4" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/><circle cx="23" cy="10" r="3" fill="#facc15"/>'),
        'multiple-trauma': colorSvg('<rect x="4" y="4" width="24" height="24" rx="7" fill="#dc2626"/><path d="M13 9h6v4h4v6h-4v4h-6v-4h-4v-6h4V9Z" fill="#ffffff"/><path d="M16 11v10M11 16h10" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>'),
        'falls-geriatric-trauma': colorSvg('<path d="M22 6a4 4 0 0 0-8 0v21h3V6a1 1 0 0 1 2 0v2h3V6Z" fill="#b45309"/><circle cx="9" cy="12" r="3" fill="#cbd5e1"/><path d="M9 15v8" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><path d="M7 18l4 2" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>'),
        'pregnancy-emergency': colorSvg('<circle cx="14" cy="7" r="4" fill="#f43f5e"/><path d="M14 12c-4 0-6 3-6 7v10h5v-6c0-1 .5-2 1.5-2 4 0 7.5 2.5 7.5 7v1h4v-2c0-6-4.5-11-10-11l-2-4Z" fill="#fb7185"/><path d="M18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="#fef08a"/>'),
        'ecg': colorSvg('<rect x="3" y="4" width="26" height="24" rx="5" fill="#052e16" stroke="#15803d" stroke-width="1.5"/><path d="M3 16h6l2.5-6 3.5 14 2.5-9 2 4h6.5" stroke="#4ade80" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="15" cy="10" r="1.5" fill="#86efac"/>'),
        'learn': colorSvg('<path d="M4 6a3 3 0 0 1 3-3h18v22H7a3 3 0 0 1-3-3V6Z" fill="#0284c7"/><path d="M7 4h16v18H7a2 2 0 0 0-2 2V6a2 2 0 0 1 2-2Z" fill="#38bdf8"/><path d="M14 3v10l3-2 3 2V3h-6Z" fill="#fde047"/>')
    };
