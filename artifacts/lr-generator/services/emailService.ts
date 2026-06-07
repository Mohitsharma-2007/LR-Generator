const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

interface SendEmailParams {
  to: string[];
  subject: string;
  body: string;
  pdfBase64?: string;
  pdfFilename?: string;
  senderEmail: string;
  appPassword: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error || "Failed to send email"
    );
  }
}
