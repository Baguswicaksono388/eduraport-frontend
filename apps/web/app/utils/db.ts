import Dexie from 'dexie';

export type ScanActivityType = 'school' | 'shalat' | 'extracurricular';
export type ScanDirection = 'in' | 'out';

export interface ScanQueueItem {
  id?: number;
  client_scan_id: string; // UUID v4
  payload?: string;
  student_id?: string;
  student_name?: string;
  class_name?: string;
  method: 'qr' | 'manual_search' | 'rfid';
  activity_type: ScanActivityType;
  direction: ScanDirection;
  reference_id?: string | null;
  mood?: string | null;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
}

export interface CachedStudent {
  student_id: string;
  student_name: string;
  nis: string;
  class_id?: string;
  class_name?: string;
  token?: string;
  rfid_uid?: string;
}

export interface CachedActivityItem {
  id: string;
  name: string;
  meta?: string;
}

export interface CachedAttendanceSettings {
  school_id: string;
  mood_mode: 'gate' | 'classroom' | 'off';
}

export class EduScannerDB extends Dexie {
  scanQueue!: Dexie.Table<ScanQueueItem, number>;
  studentsCache!: Dexie.Table<CachedStudent, string>;
  extracurricularsCache!: Dexie.Table<CachedActivityItem, string>;
  shalatItemsCache!: Dexie.Table<CachedActivityItem, string>;
  settingsCache!: Dexie.Table<CachedAttendanceSettings, string>;

  constructor() {
    super('EduScannerDB');
    this.version(1).stores({
      scanQueue: '++id, payload, timestamp, status'
    });
    this.version(2).stores({
      scanQueue: '++id, client_scan_id, student_id, method, timestamp, status',
      studentsCache: 'student_id, student_name, nis, token'
    });
    this.version(3).stores({
      scanQueue: '++id, client_scan_id, student_id, method, timestamp, status',
      studentsCache: 'student_id, student_name, nis, token, rfid_uid'
    });
    this.version(4).stores({
      scanQueue: '++id, client_scan_id, student_id, method, activity_type, direction, timestamp, status',
      studentsCache: 'student_id, student_name, nis, token, rfid_uid',
      extracurricularsCache: 'id, name',
      shalatItemsCache: 'id, name'
    });
    this.version(5).stores({
      scanQueue: '++id, client_scan_id, student_id, method, activity_type, direction, timestamp, status',
      studentsCache: 'student_id, student_name, nis, token, rfid_uid',
      extracurricularsCache: 'id, name',
      shalatItemsCache: 'id, name',
      settingsCache: 'school_id'
    });
  }
}

export const db = new EduScannerDB();
