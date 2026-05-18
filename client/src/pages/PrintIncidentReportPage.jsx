import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { ErrorState } from '../components/ErrorState';
import { Loader } from '../components/Loader';
import { formatDateTime, IncidentReportSection, ReportActions, ReportShell } from '../components/report/PrintableReport';

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

export default function PrintIncidentReportPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [incident, setIncident] = useState(null);
  const [error, setError] = useState('');
  const printedRef = useRef(false);
  const autoPrint = searchParams.get('autoPrint') === '0';

  useEffect(() => {
    api
      .get(`/incidents/${id}`)
      .then(({ data }) => setIncident(data.incident))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load incident report'));
  }, [id]);

  useEffect(() => {
    if (!autoPrint || !incident || printedRef.current) return;
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
  }, [autoPrint, incident]);

  const handlePrint = async () => {
    await waitForPrintableAssets();
    window.print();
  };

  if (error) return <ErrorState message={error} />;
  if (!incident) return <Loader />;

  return (
    <ReportShell
      title={`${incident.incidentId} - ${incident.title}`}
      subtitle="Single incident printable report with comments, activity logs, and attachments."
      meta={[
        { label: 'Created', value: formatDateTime(incident.createdAt) },
        { label: 'Status', value: incident.status },
        { label: 'Priority', value: incident.priority }
      ]}
      actions={<ReportActions backTo={`/incidents/${id}`} backLabel="Back to Incident" onPrint={handlePrint} />}
    >
      <IncidentReportSection incident={incident} />
    </ReportShell>
  );
}
