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
  const url = params.apiUrl || "/api/email/send";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorMsg = "Failed to send email";
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMsg = errorData.error;
      }
    } catch (e) {
      // Ignore JSON parse error if response is not JSON
    }
    throw new Error(errorMsg);
  }
}
