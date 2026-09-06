import { serverTimestamp } from 'firebase/firestore';

export const DEFAULT_STUDENT_PREFERENCES = {
  educationLevel: 'College / Undergraduate',
  fieldOfStudy: 'Engineering & Computer Science',
  targetGoal: 'Semester Exams & Concept Mastery',
  explanationStyle: 'Intuitive with Real-World Analogies',
  mentorTone: 'Warm Brotherly Dost (Supportive & Encouraging)',
};

export const EDUCATION_LEVELS = [
  { id: 'High School (9th - 10th)', label: 'High School (9th - 10th)', desc: 'Foundational concepts & board prep' },
  { id: 'Senior Secondary (11th - 12th)', label: 'Senior Secondary (11th - 12th)', desc: 'Board exams & entrance foundations' },
  { id: 'College / Undergraduate', label: 'College / Undergraduate', desc: 'Degree coursework & specialized topics' },
  { id: 'Postgraduate / Masters', label: 'Postgraduate / Masters', desc: 'Advanced academic & research focus' },
  { id: 'Self-Taught / Professional', label: 'Self-Taught / Professional', desc: 'Practical skills & career upskilling' },
];

export const FIELDS_OF_STUDY = [
  { id: 'Engineering & Computer Science', label: 'Engineering & CS', icon: '💻' },
  { id: 'Medical & Life Sciences', label: 'Medical & Bio', icon: '🔬' },
  { id: 'Physics, Chemistry & Mathematics', label: 'Math & Physical Sciences', icon: '📐' },
  { id: 'Commerce, Business & Economics', label: 'Commerce & Finance', icon: '📊' },
  { id: 'Arts, Law & Humanities', label: 'Humanities & Law', icon: '⚖️' },
  { id: 'General Academics', label: 'General / Multi-Disciplinary', icon: '📚' },
];

export const TARGET_GOALS = [
  { id: 'Semester Exams & Concept Mastery', label: 'Semester Exams & High Grades', desc: 'Ace university or school curriculums' },
  { id: 'Competitive Exams (JEE, NEET, GATE, UPSC)', label: 'Competitive Exams (JEE, NEET, GATE, UPSC)', desc: 'Rigorous problem-solving and rankings' },
  { id: 'Placement Prep & Technical Interviews', label: 'Placements & Job Interviews', desc: 'Core fundamentals, code, and viva questions' },
  { id: 'Quick Revisions & Summary Notes', label: 'Quick Revisions & Last-Minute Prep', desc: 'Fast turnaround, formulas, and key summaries' },
];

export const EXPLANATION_STYLES = [
  { id: 'Intuitive with Real-World Analogies', label: 'Intuitive Real-World Analogies', desc: 'Breaks complex concepts down into everyday examples' },
  { id: 'Step-by-Step Mathematical & Technical Rigor', label: 'Deep Technical & Mathematical Rigor', desc: 'Focuses on proofs, formulas, and deep mechanisms' },
  { id: 'Concise Bullet Points & Key Formulas', label: 'Concise Bullet Points & Formulas', desc: 'Direct, minimal fluff, high information density' },
  { id: 'Exam-Oriented High-Yield Focus', label: 'Exam-Oriented & Common Pitfalls', desc: 'Highlights what questions appear in exams and common mistakes' },
];

export const MENTOR_TONES = [
  { id: 'Warm Brotherly Dost (Supportive & Encouraging)', label: 'Warm Brotherly "Dost"', desc: 'Supportive, friendly, caring and empathetic mentor' },
  { id: 'High-Standard Academic Coach (Challenging & Focused)', label: 'High-Standard Academic Coach', desc: 'Disciplined, pushes you to excel and stay consistent' },
  { id: 'Calm & Structured Guide (Patient & Clear)', label: 'Calm & Structured Guide', desc: 'Patient, methodical explanations without rushing' },
];

export class UserModel {
  constructor({
    uid = '',
    displayName = '',
    phoneNumber = '',
    email = null,
    preferences = null,
    hasCompletedOnboarding = false,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.uid = uid;
    this.id = uid;
    this.displayName = displayName || '';
    this.phoneNumber = phoneNumber || '';
    this.email = email || null;
    this.preferences = UserModel.normalizePreferences(preferences);
    this.hasCompletedOnboarding = Boolean(hasCompletedOnboarding);
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Constructs a UserModel instance from a Firestore DocumentSnapshot
   * @param {import('firebase/firestore').DocumentSnapshot} docSnap
   * @returns {UserModel|null}
   */
  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new UserModel({
      uid: docSnap.id,
      displayName: data.displayName || '',
      phoneNumber: data.phoneNumber || '',
      email: data.email || null,
      preferences: data.preferences || null,
      hasCompletedOnboarding: data.hasCompletedOnboarding ?? false,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || null,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt || null,
    });
  }

  /**
   * Validates core model properties
   * @returns {string[]} Validation errors array
   */
  validate() {
    const errors = [];
    if (!this.uid?.trim()) errors.push('uid is required.');
    return errors;
  }

  /**
   * Serializes the model for Firestore writes
   * @param {Object} options
   * @param {boolean} [options.isNew=false]
   * @returns {Object}
   */
  toFirestore({ isNew = false } = {}) {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`UserModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      uid: this.uid,
      displayName: (this.displayName || '').trim(),
      phoneNumber: (this.phoneNumber || '').trim(),
      email: this.email ? this.email.trim().toLowerCase() : null,
      preferences: UserModel.normalizePreferences(this.preferences),
      hasCompletedOnboarding: Boolean(this.hasCompletedOnboarding),
      updatedAt: serverTimestamp(),
    };

    if (isNew || !this.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    return payload;
  }

  /**
   * Converts instance into a plain serializable JavaScript object for React state
   * @returns {Object}
   */
  toPlainObject() {
    return {
      uid: this.uid,
      id: this.uid,
      displayName: this.displayName,
      phoneNumber: this.phoneNumber,
      email: this.email,
      preferences: { ...this.preferences },
      hasCompletedOnboarding: this.hasCompletedOnboarding,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Merges and sanitizes student preferences with safe defaults
   * @param {Object} [prefs]
   * @returns {Object}
   */
  static normalizePreferences(prefs) {
    return {
      educationLevel: prefs?.educationLevel || DEFAULT_STUDENT_PREFERENCES.educationLevel,
      fieldOfStudy: prefs?.fieldOfStudy || DEFAULT_STUDENT_PREFERENCES.fieldOfStudy,
      targetGoal: prefs?.targetGoal || DEFAULT_STUDENT_PREFERENCES.targetGoal,
      explanationStyle: prefs?.explanationStyle || DEFAULT_STUDENT_PREFERENCES.explanationStyle,
      mentorTone: prefs?.mentorTone || DEFAULT_STUDENT_PREFERENCES.mentorTone,
    };
  }

  /**
   * Helper to format a combined target goal and custom specifier
   * @param {string} targetGoal
   * @param {string} [customGoal]
   * @returns {string}
   */
  static formatTargetGoal(targetGoal, customGoal) {
    const cleanGoal = targetGoal || DEFAULT_STUDENT_PREFERENCES.targetGoal;
    if (customGoal && customGoal.trim()) {
      return `${cleanGoal} (${customGoal.trim()})`;
    }
    return cleanGoal;
  }
}
