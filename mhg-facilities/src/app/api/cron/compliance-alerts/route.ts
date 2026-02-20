import { NextRequest, NextResponse } from 'next/server';
import { ComplianceDocumentService } from '@/services/compliance-document.service';
import { NotificationService } from '@/services/notification.service';

/**
 * Cron job to send compliance document expiration alerts
 * Runs daily to check for documents expiring within warning thresholds
 *
 * Alert thresholds:
 * - 30 days before expiration
 * - 14 days before expiration
 * - 7 days before expiration
 * - 1 day before expiration
 * - On expiration day
 *
 * Vercel Cron Schedule: 0 8 * * * (Daily at 8 AM UTC)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET is configured
    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const complianceService = new ComplianceDocumentService();
    const notificationService = new NotificationService();

    // Get documents expiring at various thresholds (parallel fetch)
    const [expiringIn30Days, expiringIn14Days, expiringIn7Days, expiringIn1Day, expiredToday] =
      await Promise.all([
        complianceService.getExpiringDocuments(30),
        complianceService.getExpiringDocuments(14),
        complianceService.getExpiringDocuments(7),
        complianceService.getExpiringDocuments(1),
        complianceService.getExpiringDocuments(0),
      ]);

    // Type for expiring document
    type ExpiringDoc = Awaited<ReturnType<ComplianceDocumentService['getExpiringDocuments']>>[number];

    // Combine all documents that need alerts
    const allExpiringDocs = [
      ...expiringIn30Days.map((doc: ExpiringDoc) => ({ doc, days: 30 })),
      ...expiringIn14Days.map((doc: ExpiringDoc) => ({ doc, days: 14 })),
      ...expiringIn7Days.map((doc: ExpiringDoc) => ({ doc, days: 7 })),
      ...expiringIn1Day.map((doc: ExpiringDoc) => ({ doc, days: 1 })),
      ...expiredToday.map((doc: ExpiringDoc) => ({ doc, days: 0 })),
    ];

    // Deduplicate by document ID (a document might appear in multiple threshold lists)
    const uniqueDocs = new Map<string, { doc: ExpiringDoc; days: number }>();
    for (const item of allExpiringDocs) {
      // Keep the smallest days value (most urgent)
      if (!uniqueDocs.has(item.doc.id) || uniqueDocs.get(item.doc.id)!.days > item.days) {
        uniqueDocs.set(item.doc.id, item);
      }
    }

    const alertsSent = [];
    const errors = [];

    // Get managers and admins who should be notified (parallel fetch)
    const [managers, admins] = await Promise.all([
      notificationService.getManagers(),
      notificationService.getAdminUsers(),
    ]);
    const recipients = [...new Set([...managers, ...admins])]; // Dedupe

    // Send alerts for each expiring document
    for (const { doc, days } of uniqueDocs.values()) {
      try {
        if (recipients.length > 0) {
          await notificationService.notifyComplianceExpiring({
            document: doc,
            recipients,
            daysUntilExpiration: days,
          });

          alertsSent.push({
            documentId: doc.id,
            documentName: doc.name,
            daysUntilExpiration: days,
            recipientCount: recipients.length,
          });

          console.log(
            `Sent compliance alert for document ${doc.id} (${doc.name}): expires in ${days} days`
          );
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ documentId: doc.id, error: errorMsg });
        console.error(`Failed to send alert for document ${doc.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      alertsSent: alertsSent.length,
      alerts: alertsSent.slice(0, 10), // Return first 10 for visibility
      errors: errors.length > 0 ? errors : undefined,
      breakdown: {
        expiring30Days: expiringIn30Days.length,
        expiring14Days: expiringIn14Days.length,
        expiring7Days: expiringIn7Days.length,
        expiring1Day: expiringIn1Day.length,
        expiredToday: expiredToday.length,
      },
      message: `Sent ${alertsSent.length} compliance alerts from ${uniqueDocs.size} expiring documents`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Compliance alerts cron job error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
