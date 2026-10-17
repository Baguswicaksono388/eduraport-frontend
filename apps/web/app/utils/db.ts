import Dexie from 'dexie';

export interface ScanQueueItem {
  id?: number;
  client_scan_id: string; // UUID v4
  payload?: string;
  student_id?: string;
  student_name?: string;
  class_name?: string;
  method: 'qr' | 'manual_search';
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
}

export class EduScannerDB extends Dexie {
  scanQueue!: Dexie.Table<ScanQueueItem, number>;
  studentsCache!: Dexie.Table<CachedStudent, string>;

  constructor() {
    super('EduScannerDB');
    this.version(1).stores({
      scanQueue: '++id, payload, timestamp, status'
    });
    this.version(2).stores({
      scanQueue: '++id, client_scan_id, student_id, method, timestamp, status',
      studentsCache: 'student_id, student_name, nis, token'
    });
  }
}

export const db = new EduScannerDB();
