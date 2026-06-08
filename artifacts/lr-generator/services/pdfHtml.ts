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
    </tr>`
    )
    .join("");

  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" style="width:64px;height:64px;object-fit:contain;border-radius:8px;" />`
    : `<div style="width:64px;height:64px;background:#D4A843;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;color:#0A1628;">ML</div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #111; background: #fff; padding: 24px; }

  /* ── Header / Letterhead ── */
  .letterhead {
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 3px solid #D4A843;
    padding-bottom: 12px;
    margin-bottom: 12px;
  }
  .letterhead-text { flex: 1; }
  .company-name {
    font-size: 20px;
    font-weight: bold;
    letter-spacing: 2px;
    color: #0A1628;
    text-transform: uppercase;
  }
  .company-sub {
    font-size: 10px;
    font-weight: bold;
    color: #D4A843;
    letter-spacing: 1px;
    margin-bottom: 3px;
  }
  .company-info { font-size: 8.5px; line-height: 1.6; color: #444; }

  /* ── Title bar ── */
  .title-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #0A1628;
    color: #D4A843;
    padding: 7px 12px;
    border-radius: 4px;
    margin-bottom: 12px;
  }
  .title-bar-left { font-size: 13px; font-weight: bold; letter-spacing: 1px; }
  .title-bar-right { font-size: 13px; font-weight: bold; }

  /* ── Party info (consignee/consignor) ── */
  .party-grid { display: flex; gap: 10px; margin-bottom: 12px; }
  .party-box { flex: 1; border: 1px solid #ccc; border-radius: 4px; padding: 8px; }
  .party-title {
    font-weight: bold;
    font-size: 8px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #D4A843;
    border-bottom: 1px solid #e0d0a0;
    margin-bottom: 5px;
    padding-bottom: 3px;
  }
  .party-body { font-size: 8.5px; line-height: 1.7; color: #222; }

  /* ── Meta grid ── */
  .meta-grid { display: flex; gap: 10px; margin-bottom: 12px; }
  .meta-box { flex: 1; border: 1px solid #ccc; border-radius: 4px; padding: 8px; }
  .meta-label { font-size: 8px; font-weight: bold; color: #888; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px; }
  .meta-value { font-size: 9.5px; font-weight: bold; color: #111; }

  /* ── Table ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th {
    background: #0A1628;
    color: #D4A843;
    border: 1px solid #0A1628;
    padding: 6px 4px;
    font-size: 8.5px;
    text-align: center;
    font-weight: bold;
    letter-spacing: 0.3px;
  }
  td { border: 1px solid #ccc; padding: 5px 4px; font-size: 8.5px; color: #111; }
  tr:nth-child(even) td { background: #f8f5ed; }
  .td-center { text-align: center; }
  .td-right { text-align: right; font-weight: bold; }

  /* ── Payment summary ── */
  .payment-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
  }
  .payment-box {
    width: 55%;
    border: 1px solid #ccc;
    border-radius: 4px;
    overflow: hidden;
  }
  .payment-header {
    background: #0A1628;
    color: #D4A843;
    font-size: 9px;
    font-weight: bold;
    padding: 5px 10px;
    letter-spacing: 0.5px;
  }
  .payment-body { padding: 8px 10px; }
  .pay-line { display: flex; justify-content: space-between; font-size: 9px; padding: 2px 0; }
  .pay-total {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: bold;
    color: #0A1628;
    border-top: 2px solid #D4A843;
    padding-top: 5px;
    margin-top: 5px;
  }

  /* ── Bank details ── */
  .bank-box {
    border: 1px solid #e0d0a0;
    border-radius: 4px;
    background: #fdf8ec;
    padding: 8px 10px;
    margin-bottom: 12px;
  }
  .bank-title { font-size: 8px; font-weight: bold; color: #A8782E; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 5px; }
  .bank-line { display: flex; justify-content: space-between; font-size: 8.5px; padding: 1px 0; color: #333; }
  .bank-key { font-weight: bold; width: 48%; }

  /* ── Footer ── */
  .doc-footer {
    border-top: 1px solid #ccc;
    padding-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 4px;
  }
  .stamp-box {
    border: 1px dashed #ccc;
    border-radius: 4px;
    width: 120px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    color: #aaa;
    font-style: italic;
  }
  .sign-box { text-align: right; font-size: 8px; color: #666; }
  .generated-note { font-size: 7.5px; color: #999; margin-top: 3px; }
</style>
</head>
<body>

  <!-- LETTERHEAD -->
  <div class="letterhead">
    ${logoHtml}
    <div class="letterhead-text">
      <div class="company-name">${COMPANY.name}</div>
      <div class="company-sub">Transport Co.</div>
      <div class="company-info">
        ${COMPANY.address}<br>
        Email: ${COMPANY.email} &nbsp;|&nbsp; Phone: ${COMPANY.phone}<br>
        GST: ${COMPANY.gst} &nbsp;|&nbsp; PAN: ${COMPANY.pan}
      </div>
    </div>
  </div>

  <!-- TITLE BAR -->
  <div class="title-bar">
    <div class="title-bar-left">&#128196; LOADING INVOICE</div>
    <div class="title-bar-right">LR No: ${lr.lrNo}</div>
  </div>

  <!-- META FIELDS -->
  <div class="meta-grid">
    <div class="meta-box">
      <div class="meta-label">Consignment Note No.</div>
      <div class="meta-value">${lr.consignmentNo}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Pickup Date</div>
      <div class="meta-value">${lr.date}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Vehicle Number</div>
      <div class="meta-value">${lr.vehicleNo}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Vehicle Size</div>
      <div class="meta-value">32 Ft Multi Axel</div>
    </div>
  </div>

  <!-- ROUTE -->
  <div class="meta-grid">
    <div class="meta-box">
      <div class="meta-label">&#128205; Pickup Location</div>
      <div class="meta-value">${route.pickupLocation}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">&#127937; Drop Location</div>
      <div class="meta-value">${route.dropLocation}</div>
    </div>
  </div>

  <!-- CONSIGNEE / CONSIGNOR -->
  <div class="party-grid">
    <div class="party-box">
      <div class="party-title">&#128101; Consignee</div>
      <div class="party-body" style="white-space:pre-line;">${route.consignee}</div>
    </div>
    <div class="party-box">
      <div class="party-title">&#127970; Consignor / Shipper</div>
      <div class="party-body" style="white-space:pre-line;">${route.consignor}</div>
    </div>
  </div>

  <!-- INVOICES TABLE -->
  <table>
    <thead>
      <tr>
        <th>Drop Location</th>
        <th>Invoice No.</th>
        <th>Packages</th>
        <th>Description</th>
        <th>Weight</th>
        <th>Freight (&#8377;)</th>
      </tr>
    </thead>
    <tbody>${invoiceRows}</tbody>
  </table>

  <!-- PAYMENT SUMMARY -->
  <div class="payment-row">
    <div class="payment-box">
      <div class="payment-header">Payment Summary</div>
      <div class="payment-body">
        <div class="pay-line"><span>Total Freight</span><span>&#8377;${formatCurrency(total)}</span></div>
        <div class="pay-line"><span>Advance (90%)</span><span>&#8377;${formatCurrency(advance)}</span></div>
        <div class="pay-total"><span>Balance Due</span><span>&#8377;${formatCurrency(balance)}</span></div>
      </div>
    </div>
  </div>

  <!-- BANK DETAILS -->
  <div class="bank-box">
    <div class="bank-title">&#127981; Bank Details for Payment</div>
    <div class="bank-line"><span class="bank-key">Beneficiary Name:</span><span>${COMPANY.bank.beneficiary}</span></div>
    <div class="bank-line"><span class="bank-key">Account Number:</span><span>${COMPANY.bank.accountNo}</span></div>
    <div class="bank-line"><span class="bank-key">Bank &amp; Branch:</span><span>${COMPANY.bank.bank}</span></div>
    <div class="bank-line"><span class="bank-key">IFSC Code:</span><span>${COMPANY.bank.ifsc}</span></div>
  </div>

  <!-- FOOTER -->
  <div class="doc-footer">
    <div>
      <div class="stamp-box">Company Stamp</div>
    </div>
    <div class="sign-box">
      <div>For <strong>${COMPANY.name}</strong></div>
      <div style="height:30px;"></div>
      <div>Authorised Signatory</div>
      <div class="generated-note">Generated by MLTC LR Generator &nbsp;|&nbsp; ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
    </div>
  </div>

</body>
</html>`;
}
