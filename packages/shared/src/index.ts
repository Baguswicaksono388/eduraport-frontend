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

export const ASSET_CATEGORIES = [
  { value: 'land', label: 'Tanah (Land)' },
  { value: 'building', label: 'Bangunan (Building)' },
  { value: 'furniture', label: 'Mebel & Furnitur (Furniture)' },
  { value: 'electronic', label: 'Elektronik & IT (Electronic)' },
  { value: 'vehicle', label: 'Kendaraan (Vehicle)' },
  { value: 'other', label: 'Lainnya (Other)' }
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number]['value'];

export const DEPRECIATION_METHODS = [
  { value: 'straight_line', label: 'Garis Lurus (Straight Line)' },
  { value: 'double_declining', label: 'Saldo Menurun Ganda (Double Declining)' },
  { value: 'none', label: 'Tanpa Penyusutan (None)' }
] as const;

export type DepreciationMethod = (typeof DEPRECIATION_METHODS)[number]['value'];

