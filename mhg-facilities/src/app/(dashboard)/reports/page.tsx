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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

// Helper to get default date range (last 30 days)
function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

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
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    try {
      // Build URL with query params for PM report
      let url = `/api/reports/${reportType}`;
      if (reportType === 'pm') {
        const params = new URLSearchParams({
          start_date: dateRange.start,
          end_date: dateRange.end,
        });
        url = `${url}?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate report');
        return;
      }

      setGeneratedReport(data);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate report');
    }
  };

  const handleExportCSV = async () => {
    if (!generatedReport) return;

    try {
      const rows = getReportDataArray(generatedReport);
      if (rows.length === 0) {
        setError('No rows available to export for this report');
        return;
      }

      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: rows,
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
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
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

            {/* Date range picker for PM report */}
            {reportType === 'pm' && (
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-auto">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, start: e.target.value }))
                    }
                    className="w-full md:w-[180px]"
                  />
                </div>
                <div className="w-full md:w-auto">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="w-full md:w-[180px]"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!generatedReport && !error && (
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
