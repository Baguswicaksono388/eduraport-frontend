import Dexie from 'dexie';

export class EduScannerDB extends Dexie {
  scanQueue!: Dexie.Table<ScanQueueItem, number>;

  constructor() {
    super('EduScannerDB');
    this.version(1).stores({
      scanQueue: '++id, payload, timestamp, status' // status: 'pending', 'syncing', 'failed'
    });
  }
}

export const db = new EduScannerDB();

export interface ScanQueueItem {
  id?: number;
  payload: string;
  mood?: string;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
}
