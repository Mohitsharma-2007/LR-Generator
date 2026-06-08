interface AIExtraction {
  route: string | null;
  consignmentNo: string | null;
  invoiceNos: string[];
}

export async function extractFromImage(
  base64Image: string,
  apiKey: string
): Promise<AIExtraction> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lr-generator.app",
        "X-Title": "LR Generator",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
              {
                type: "text",
                text: `You are analyzing a Lorry Receipt (LR) document image. Extract the following:
1. Route: Based on pickup and drop locations, determine if it is "Chennai → Manesar" or "Manesar → Chennai"
2. Consignment Note Number (look for text like "Consignment Note Number" or "Consignment No")
3. Invoice Numbers (look for alphanumeric codes like TN2026XXXXXX-XX)

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{"route": "Chennai → Manesar" or "Manesar → Chennai" or null, "consignmentNo": "XXXXXX" or null, "invoiceNos": ["INV1", "INV2"] or []}`,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";

  try {
    const cleaned = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      route: parsed.route ?? null,
      consignmentNo: parsed.consignmentNo ?? null,
      invoiceNos: Array.isArray(parsed.invoiceNos) ? parsed.invoiceNos : [],
    };
  } catch {
    return { route: null, consignmentNo: null, invoiceNos: [] };
  }
}
