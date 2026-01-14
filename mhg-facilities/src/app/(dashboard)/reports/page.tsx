'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import {
  exportTicketsToPDF,
  exportAssetsToPDF,
  exportComplianceToPDF,
  exportPMSchedulesToPDF,
  exportTicketsToExcel,
  exportAssetsToExcel,
  exportComplianceToExcel,
  exportPMSchedulesToExcel,
} from '@/lib/export';

// Helper to get array data from report response
function getReportDataArray(report: Record<string, unknown>): Record<string, unknown>[] {
  // Report data is typically in a property like 'tickets', 'assets', or similar
  if (Array.isArray(report.tickets)) return report.tickets as Record<string, unknown>[];
  if (Array.isArray(report.assets)) return report.assets as Record<string, unknown>[];
  if (Array.isArray(report.documents)) return report.documents as Record<string, unknown>[];
  if (Array.isArray(report.schedules)) return report.schedules as Record<string, unknown>[];
  if (Array.isArray(report.data)) return report.data as Record<string, unknown>[];
  // If it's already an array at root level
  if (Array.isArray(report)) return report as unknown as Record<string, unknown>[];
  return [];
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>('tickets');
  const [generatedReport, setGeneratedReport] = useState<Record<string, unknown> | null>(null);

  const handleGenerate = async () => {
    try {
      const response = await fetch(`/api/reports/${reportType}`);
      const data = await response.json();
      setGeneratedReport(data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const handleExportCSV = async () => {
    if (!generatedReport) return;

    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: generatedReport,
          filename: `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`,
          format: 'csv',
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const handleExportPDF = () => {
    if (!generatedReport) return;

    const data = getReportDataArray(generatedReport);

    switch (reportType) {
      case 'tickets':
        exportTicketsToPDF(data);
        break;
      case 'assets':
        exportAssetsToPDF(data);
        break;
      case 'compliance':
        exportComplianceToPDF(data);
        break;
      case 'pm':
        exportPMSchedulesToPDF(data);
        break;
      default:
        console.error('Unknown report type for PDF export');
    }
  };

  const handleExportExcel = () => {
    if (!generatedReport) return;

    const data = getReportDataArray(generatedReport);

    switch (reportType) {
      case 'tickets':
        exportTicketsToExcel(data);
        break;
      case 'assets':
        exportAssetsToExcel(data);
        break;
      case 'compliance':
        exportComplianceToExcel(data);
        break;
      case 'pm':
        exportPMSchedulesToExcel(data);
        break;
      default:
        console.error('Unknown report type for Excel export');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Generate and export reports for tickets, assets, compliance, and more
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tickets">Tickets Report</SelectItem>
                <SelectItem value="assets">Assets Report</SelectItem>
                <SelectItem value="compliance">Compliance Report</SelectItem>
                <SelectItem value="pm">PM Report</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleGenerate}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>

            {generatedReport && (
              <>
                <Button onClick={handleExportCSV} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button onClick={handleExportPDF} variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button onClick={handleExportExcel} variant="outline">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </>
            )}
          </div>

          {!generatedReport && (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No Report Generated"
              description="Select a report type and click Generate Report to view the data"
            />
          )}

          {generatedReport && (
            <div className="rounded-lg border p-4">
              <pre className="text-xs overflow-auto max-h-[400px]">
                {JSON.stringify(generatedReport, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
