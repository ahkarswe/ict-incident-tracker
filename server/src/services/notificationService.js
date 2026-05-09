export const queueIncidentNotification = async (incident, reason) => {
  // Placeholder hook for SMTP, SendGrid, or MS Graph integration.
  console.log(`[notification] ${reason}: ${incident.incidentId}`);
};
