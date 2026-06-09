import { COMPANY, ROUTES, type LRRecord } from "../context/LRContext";

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function generateLRHtml(lr: LRRecord, logoDataUri?: string): string {
  const route = ROUTES[lr.routeId];
  const total = lr.frightCharge;
  const advance = Math.round(total * 0.9);
  const balance = total - advance;

  let partnerName = "NISSIN ABC LOGISTICS PVT. LTD.";
  let partnerAddress =
    "Unit No. 222, 244, 246 &amp; 247, 2nd Floor,<br>Centrum Plaza, Golf Course Road, Sector - 53,<br>Gurugram - 122 002, Haryana";
  let partnerGst = "06AABCN0379D1ZS";
  let partnerDetails = `${partnerAddress}<br>GSTIN: ${partnerGst}`;

  try {
    const raw = localStorage.getItem("@app_settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.partnerName) partnerName = parsed.partnerName;

      if (parsed.partnerAddress || parsed.partnerGst) {
        if (parsed.partnerAddress)
          partnerAddress = parsed.partnerAddress.replace(/\n/g, "<br>");
        if (parsed.partnerGst) partnerGst = parsed.partnerGst;
        partnerDetails = `${partnerAddress}<br>GSTIN: ${partnerGst}`;
      } else if (parsed.partnerDetails) {
        partnerDetails = parsed.partnerDetails.replace(/\n/g, "<br>");
      }
    }
  } catch (e) {
    // Ignore and fallback
  }

  const invoiceRows = lr.invoices
    .map(
      (inv) => `
    <tr>
      <td class="td-center">${inv.dropLocation}</td>
      <td class="td-center">${inv.invoiceNo}</td>
      <td class="td-center">${inv.noOfPackages}</td>
      <td class="td-center">${inv.description}</td>
      <td class="td-center">${inv.goodsWeight}</td>
      <td class="td-right">&#8377;${formatCurrency(inv.freightCharge)}</td>
    </tr>`,
    )
    .join("");

  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" style="width:48px;height:48px;object-fit:contain;vertical-align:middle;margin-right:10px;" />`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #000; background: #fff; padding: 20px; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
  .company-name { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
  .company-info { font-size: 9px; line-height: 1.5; }
  .doc-title { font-size: 13px; font-weight: bold; text-align: center; margin: 8px 0; border: 1px solid #000; padding: 4px; }
  .lr-no { font-size: 13px; font-weight: bold; }
  .label { font-weight: bold; font-size: 9px; }
  .value { font-size: 9px; line-height: 1.5; }
  .consignee-title { font-weight: bold; font-size: 9px; border-bottom: 1px solid #000; margin-bottom: 4px; padding-bottom: 2px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th { background: #e8e0c8; border: 1px solid #000; padding: 4px; font-size: 9px; text-align: center; }
  td { border: 1px solid #000; padding: 4px; font-size: 9px; }
  .td-center { text-align: center; }
  .td-right { text-align: right; }
  .bank-row { display: flex; justify-content: space-between; font-size: 9px; margin: 2px 0; }
  .total-row { font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
  .main-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; }
  .left-col { width: 40%; }
  .right-col { width: 60%; }
  .info-row { display: flex; margin-bottom: 2px; }
  .info-label { font-weight: bold; width: 160px; font-size: 9px; }
  .info-value { font-size: 9px; }
  .pickup-drop-box { border: 1px solid #000; padding: 6px; margin-top: 4px; }
  .logo-container { display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo-container">
      ${logoHtml}
      <span class="company-name">${COMPANY.name}</span>
    </div>
    <div class="company-info">${COMPANY.address}</div>
    <div class="company-info">Email: ${COMPANY.email}, Phone: ${COMPANY.phone}</div>
    <div class="company-info">GST Number: ${COMPANY.gst}, PAN Number: ${COMPANY.pan}</div>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
    <div class="doc-title" style="flex:1; margin-right:8px;">Loading Invoice</div>
    <div class="lr-no">LR No: ${lr.lrNo}</div>
  </div>

  <div class="main-row">
    <div class="left-col">
      <div class="label" style="font-size:10px; margin-bottom:4px;">${partnerName}</div>
      <div class="value">${partnerDetails}</div>
    </div>
    <div class="right-col">
      <div class="info-row"><span class="info-label">Consignment Note Number:</span><span class="info-value">${lr.consignmentNo}</span></div>
      <div class="info-row"><span class="info-label">Reference LR Number:</span><span class="info-value">${lr.lrNo}</span></div>
      <div class="info-row"><span class="info-label">Pickup Date:</span><span class="info-value">${lr.date}</span></div>
      <div class="info-row"><span class="info-label">Vehicle Number:</span><span class="info-value">${lr.vehicleNo}</span></div>
      <div class="info-row"><span class="info-label">Vehicle Size:</span><span class="info-value">32 Feet Multi Axel</span></div>
      <div class="pickup-drop-box">
        <div class="info-row"><span class="info-label">Pickup Location:</span><span class="info-value">${route.pickupLocation}</span></div>
        <div class="info-row"><span class="info-label">Drop Location:</span><span class="info-value">${route.dropLocation}</span></div>
      </div>
    </div>
  </div>

  <div style="display:flex; gap:8px; margin-bottom:8px;">
    <div style="flex:1; border:1px solid #000; padding:6px;">
      <div class="consignee-title">Details of Consignee</div>
      <div class="value" style="white-space:pre-line;">${route.consignee}</div>
    </div>
    <div style="flex:1; border:1px solid #000; padding:6px;">
      <div class="consignee-title">Details of Consignor</div>
      <div class="value" style="white-space:pre-line;">${route.consignor}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Drop Location</th><th>Invoice Nos</th><th>No. of Package</th>
        <th>Description of Goods</th><th>Goods Weight</th><th>Freight Charge</th>
      </tr>
    </thead>
    <tbody>${invoiceRows}</tbody>
  </table>

  <div style="display:flex; justify-content:flex-end; margin-top:8px;">
    <div style="width:60%; border:1px solid #000; padding:8px;">
      <div style="font-weight:bold; font-size:9px; margin-bottom:4px;">Detail of Bank:</div>
      <div class="bank-row"><span>Beneficiary Name:</span><span>${COMPANY.bank.beneficiary}</span></div>
      <div class="bank-row"><span>Beneficiary Account Number:</span><span>${COMPANY.bank.accountNo}</span></div>
      <div class="bank-row"><span>Bank Name &amp; Address:</span><span>${COMPANY.bank.bank}</span></div>
      <div class="bank-row"><span>IFSC Code:</span><span>${COMPANY.bank.ifsc}</span></div>
      <div style="border-top:1px solid #000; margin-top:6px; padding-top:4px;">
        <div class="bank-row"><span>Amount</span><span style="font-weight:bold;">&#8377;${formatCurrency(total)}</span></div>
        <div class="bank-row"><span>Advance 90%</span><span>&#8377;${formatCurrency(advance)}</span></div>
        <div class="bank-row total-row"><span>Balance</span><span>&#8377;${formatCurrency(balance)}</span></div>
      </div>
    </div>
  </div>

  <div style="margin-top:16px; border-top:1px solid #000; padding-top:8px; text-align:center; font-size:8px; color:#666;">
    Generated by LR Generator App | Maha Laxmi Transport Co. | ${new Date().toLocaleDateString("en-IN")}
  </div>
</body>
</html>`;
}
