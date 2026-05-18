import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { ErrorState } from '../components/ErrorState';
import { Loader } from '../components/Loader';
import {
  IncidentReportSection,
  MetricGrid,
  ReportActions,
  ReportShell,
  formatDateTime
} from '../components/report/PrintableReport';

const waitForPrintableAssets = async () => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const pendingImages = Array.from(document.images || []).filter((image) => !image.complete);
  await Promise.allSettled(
    pendingImages.map(
      (image) =>
        new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        })
    )
  );
};

export default function PrintReportsPage() {
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState(null);
  const [error, setError] = useState('');
  const printedRef = useRef(false);
  const autoPrint = searchParams.get('autoPrint') === '1';

  useEffect(() => {
    Promise.all([api.get('/dashboard/summary'), api.get('/incidents/report')])
      .then(([summaryResponse, reportResponse]) => {
        setSummary(summaryResponse.data.summary);
        setIncidents(reportResponse.data.incidents || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load printable report'));
  }, []);

  useEffect(() => {
    if (!autoPrint || !summary || !incidents || printedRef.current) return;
    let cancelled = false;

    const triggerPrint = async () => {
      await waitForPrintableAssets();
      if (!cancelled) {
        printedRef.current = true;
        window.print();
      }
    };

    const timer = window.setTimeout(triggerPrint, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [autoPrint, summary, incidents]);

  const handlePrint = async () => {
    await waitForPrintableAssets();
    window.print();
  };

  const downloadCsv = async () => {
    try {
      const response = await api.get('/incidents/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'all-incidents.csv';
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV download failed');
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!summary || !incidents) return <Loader />;

  return (
    <ReportShell
      title="ICT Incident Tracker Report"
      subtitle="Browser-rendered report optimized for Chrome and Edge print-to-PDF with Myanmar Unicode support."
      meta={[
        { label: 'Generated', value: formatDateTime(new Date()) },
        { label: 'Total incidents', value: summary.total },
        { label: 'Open incidents', value: summary.open }
      ]}
      actions={
        <ReportActions
          backTo="/reports"
          backLabel="Back to Reports"
          onPrint={handlePrint}
          extra={
            <button className="btn-secondary" onClick={downloadCsv}>
              Download CSV
            </button>
          }
        />
      }
    >
      <MetricGrid
        items={[
          { label: 'Total Incidents', value: summary.total },
          { label: 'Open Incidents', value: summary.open },
          { label: 'Critical Incidents', value: summary.critical },
          { label: 'SLA Breached', value: summary.breached }
        ]}
      />

      <div className="panel report-card">
        <div className="panel-header">Report Notes</div>
        <div className="panel-body space-y-2 text-sm text-slate-700">
          <div>Every incident section is laid out in HTML, so browser font rendering handles Myanmar Unicode correctly.</div>
          <div>Long comments and activity logs flow across pages naturally, and the browser adds page breaks when needed.</div>
          <div>Image attachments are rendered inline so they appear in the saved PDF.</div>
        </div>
      </div>

      {incidents.map((incident, index) => (
        <IncidentReportSection key={incident._id || incident.incidentId} incident={incident} pageBreak={index > 0} />
      ))}
    </ReportShell>
  );
}
