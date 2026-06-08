interface SendEmailParams {
  to: string[];
  subject: string;
  body: string;
  pdfBase64?: string;
  pdfFilename?: string;
  senderEmail: string;
  appPassword: string;
  apiUrl?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  // Use custom API URL from settings if defined, otherwise fall back to relative `/api/email/send`
  const targetUrl = params.apiUrl 
    ? `${params.apiUrl.replace(/\/$/, "")}/api/email/send`
    : "/api/email/send";

  const payload = {
    to: params.to,
    subject: params.subject,
    body: params.body,
    pdfBase64: params.pdfBase64,
    pdfFilename: params.pdfFilename,
    senderEmail: params.senderEmail,
    appPassword: params.appPassword,
  };

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error || "Failed to send email"
    );
  }
}
