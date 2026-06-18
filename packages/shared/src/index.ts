export const USER_ROLES = [
  'super_admin',
  'principal',
  'teacher',
  'treasurer',
  'tu',
  'parent',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const STUDENT_GENDERS = ['Laki-laki', 'Perempuan'] as const;
export type StudentGender = (typeof STUDENT_GENDERS)[number];

export const SCHOOL_LEVELS = ['TK', 'SD', 'SMP', 'SMA'] as const;
export type SchoolLevel = (typeof SCHOOL_LEVELS)[number];
