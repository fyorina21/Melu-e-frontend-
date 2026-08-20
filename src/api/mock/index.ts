// src/api/mock/index.ts
//
// Demo database public surface. Import the singleton or the class for
// fresh isolated instances (useful in tests).

export { MockDatabase, mockDb } from './db';
export type { MockDatabaseShape } from './db';
export { seed } from './seed';
export type { SeededStudent, DemoUser, DemoRole } from './seed';
export { getMockStorage } from './storage';
export type { MockStorage } from './storage';
export { mockHttp } from './client';