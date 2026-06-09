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
  const cleanPassword = params.appPassword.replace(/\s+/g, "");

  // Prepare SMTP.js payload
  const payload: any = {
    nocache: Math.floor(1e6 * Math.random() + 1),
    Action: "Send",
    Host: "smtp.gmail.com",
    Port: 587,
    Username: params.senderEmail,
    Password: cleanPassword,
    To: params.to.join(","),
    From: params.senderEmail,
    Subject: params.subject,
    Body: params.body,
  };

  if (params.pdfBase64 && params.pdfFilename) {
    payload.Attachments = [
      {
        name: params.pdfFilename,
        data: `data:application/pdf;base64,${params.pdfBase64}`,
      },
    ];
  }

  // SMTP.js expects a stringified JSON payload sent with application/x-www-form-urlencoded content-type
  const response = await fetch("https://smtpjs.com/v3/smtpjs.aspx", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to connect to email relay: ${response.statusText}`);
  }

  const resultText = await response.text();
  if (resultText !== "OK") {
    throw new Error(resultText || "Failed to send email");
  }
}
