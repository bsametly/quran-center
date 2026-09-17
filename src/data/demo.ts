import type { DB, Profile } from '../types';

export function buildDemoDB(): DB {
  const adminProfile: Profile = {
    id: 'admin-1',
    role: 'admin',
    full_name: 'أنس خميس العدولي',
    username: 'أنس خميس العدولي',
    password: '6129',
    email: null,
    phone: null,
    linked_id: null,
    created_at: new Date().toISOString(),
  };

  return {
    profiles: [adminProfile],
    teachers: [],
    parents: [],
    halaqat: [],
    students: [],
    recitations: [],
    mistakes: [],
    attendance: [],
    exams: [],
    exam_results: [],
    assignments: [],
    notes: [],
    recommendations: [],
    notifications: [],
    audit_logs: [],
    device_tokens: [],
  };
}
