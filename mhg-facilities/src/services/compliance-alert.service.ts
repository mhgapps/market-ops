import { ComplianceAlertDAO } from '@/dao/compliance-alert.dao';

type AlertType = '90_day' | '60_day' | '30_day' | '14_day' | '7_day' | 'expired' | 'failed_inspection';

interface ComplianceAlert {
  id: string;
  document_id: string | null;
  alert_type: string | null;
  sent_at: string;
  sent_to: string[] | null;
  delivery_method: string | null;
}

interface UpcomingAlert {
  document_id: string;
  document_name: string;
  alert_type: AlertType;
  scheduled_for: string;
}

export class ComplianceAlertService {
  constructor(
    private alertDAO = new ComplianceAlertDAO()
  ) {}

  async sendExpirationAlert(
    documentId: string,
    alertType: AlertType,
    recipients: string[]
  ): Promise<void> {
    if (!recipients || recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    await this.alertDAO.create({
      document_id: documentId,
      alert_type: alertType,
      sent_to: recipients,
      delivery_method: 'email',
    });

    console.log(`Alert sent for document ${documentId} to ${recipients.join(', ')}`);
  }

  async getAlertHistory(documentId: string): Promise<ComplianceAlert[]> {
    return await this.alertDAO.findByDocument(documentId);
  }

  async getUpcomingAlerts(): Promise<UpcomingAlert[]> {
    return [];
  }
}
