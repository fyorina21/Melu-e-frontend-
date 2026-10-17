import { describe, it, expect, vi } from 'vitest';
import { getWorkloadDashboard, getWorkloadTrend } from '../../api/coordinatorApi';
import { recordDeletedStaff } from '../../utils/deletedStaffHelper';

describe('Workload Trend and Dashboard fallback', () => {
  it('returns workload rows and derived trend without hitting missing endpoints', async () => {
    const dashRes = await getWorkloadDashboard();
    expect(dashRes).toBeDefined();
    expect(Array.isArray(dashRes.data)).toBe(true);

    const trendRes = await getWorkloadTrend();
    expect(trendRes).toBeDefined();
    expect(Array.isArray(trendRes.data)).toBe(true);

    if (dashRes.data.length > 0) {
      expect(trendRes.data.length).toBe(dashRes.data.length);
      expect(trendRes.data[0]).toHaveProperty('label');
      expect(trendRes.data[0]).toHaveProperty('sessions');
    }
  }, 30000);

  it('filters deleted staff from workload dashboard and trend', async () => {
    recordDeletedStaff({
      id: 'del-teacher-1',
      name: 'Deleted Therapist',
      email: 'del@melue.org',
    });

    const trendRes = await getWorkloadTrend();
    expect(trendRes.data.some((t: any) => t.label === 'Deleted Therapist')).toBe(false);
  }, 20000);
});
