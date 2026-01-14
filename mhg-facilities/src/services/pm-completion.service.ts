import { PMCompletionDAO } from '@/dao/pm-completion.dao';

interface PMCompletion {
  id: string;
  schedule_id: string | null;
  ticket_id: string | null;
  scheduled_date: string;
  completed_date: string | null;
  completed_by: string | null;
  checklist_results: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
}

export class PMCompletionService {
  constructor(
    private completionDAO = new PMCompletionDAO()
  ) {}

  async recordCompletion(
    scheduleId: string,
    ticketId: string,
    userId: string,
    checklistResults?: Record<string, unknown>
  ): Promise<PMCompletion> {
    const today = new Date().toISOString().split('T')[0];

    return await this.completionDAO.create({
      schedule_id: scheduleId,
      ticket_id: ticketId,
      scheduled_date: today,
      completed_date: today,
      completed_by: userId,
      checklist_results: checklistResults || null,
      notes: null,
    });
  }

  async getCompletionHistory(scheduleId: string): Promise<PMCompletion[]> {
    return await this.completionDAO.findBySchedule(scheduleId);
  }

  async getCompletionRate(scheduleId: string, months: number): Promise<number> {
    const completions = await this.completionDAO.findBySchedule(scheduleId);

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const recentCompletions = completions.filter(c => c.scheduled_date >= cutoffStr);
    const completedCount = recentCompletions.filter(c => c.completed_date !== null).length;

    if (recentCompletions.length === 0) return 100;

    return (completedCount / recentCompletions.length) * 100;
  }
}
