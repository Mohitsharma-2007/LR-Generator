import { Capacitor } from "@capacitor/core";

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
  let apiBaseUrl = "";
  
  if (Capacitor.isNativePlatform()) {
    apiBaseUrl = localStorage.getItem("@mltc_api_url") || "http://10.0.2.2:5000";
  } else {
    apiBaseUrl = localStorage.getItem("@mltc_api_url") || "";
  }

  const targetUrl = apiBaseUrl 
    ? `${apiBaseUrl.replace(/\/$/, "")}/api/email/send`
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
