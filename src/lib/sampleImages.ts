/**
 * Programmatically generated realistic sample images for immediate testing:
 * 1. Tilted Dark Invoice / Receipt with table & logo (Testing cadre alignment & darkness)
 * 2. Skewed Official Certificate / Diploma with stamp and cursive typography
 * 3. Low-light ID Badge with photo & barcode
 */

export interface SampleImage {
  id: string;
  titleMg: string;
  titleFr: string;
  descriptionMg: string;
  category: "tilted_document" | "dark_photo" | "skewed_receipt";
  getDataUrl: () => string;
}

export function createTiltedDarkInvoice(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1100;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Darkened ambient lighting (dim room background)
  ctx.fillStyle = "#1c2128";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Rotate canvas slightly to simulate client shooting at an angle (~ -6.5 degrees)
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((-6.5 * Math.PI) / 180);
  ctx.translate(-350, -480);

  // Paper shadow
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 10;
  ctx.shadowOffsetY = 15;

  // Underexposed, yellowish ambient paper (#c5ba9d instead of clean #ffffff)
  ctx.fillStyle = "#b8ad92";
  ctx.fillRect(0, 0, 700, 960);
  ctx.shadowColor = "transparent";

  // Simulate dark shadow gradient falling across the sheet (e.g. shadow from phone/hand)
  const shadowGrad = ctx.createLinearGradient(0, 0, 700, 960);
  shadowGrad.addColorStop(0, "rgba(20, 20, 30, 0.45)");
  shadowGrad.addColorStop(0.6, "rgba(50, 40, 30, 0.2)");
  shadowGrad.addColorStop(1, "rgba(10, 15, 20, 0.55)");
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(0, 0, 700, 960);

  // Logo (Corporate badge)
  ctx.fillStyle = "#1e3a5f";
  ctx.beginPath();
  ctx.roundRect(50, 50, 60, 60, 12);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText("M", 67, 94);

  // Company Name
  ctx.fillStyle = "#1a2530";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("MADAGASIKARA COMMERCE S.A.", 130, 75);
  ctx.font = "normal 14px sans-serif";
  ctx.fillStyle = "#333e48";
  ctx.fillText("NIF: 4001293847 • STAT: 51201 11 2019 0 00123 • Antananarivo 101", 130, 98);

  // Invoice Title & Info
  ctx.strokeStyle = "#4a5568";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 135);
  ctx.lineTo(650, 135);
  ctx.stroke();

  ctx.fillStyle = "#111827";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("FAKTIORA N° F-2026-089", 50, 175);
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#2d3748";
  ctx.fillText("Daty: 07 Novambra 2026", 50, 200);
  ctx.fillText("Mpanjifa: Societe Malagasy Logistics SARL", 50, 222);

  // Table Header
  ctx.fillStyle = "#2d3748";
  ctx.fillRect(50, 260, 600, 35);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("Famaritana (Désignation)", 65, 283);
  ctx.fillText("Isa (Qté)", 370, 283);
  ctx.fillText("Vidiny (PU)", 450, 283);
  ctx.fillText("Total (MGA)", 550, 283);

  // Table Rows
  const items = [
    ["Fanamboarana & Fanadiovana Sary IA", "1", "150 000", "150 000"],
    ["Fanitsiana Cadre & Zoro Mirirana", "3", "45 000", "135 000"],
    ["Fampitomboana Kalitao Tabilao & Logo", "2", "60 000", "120 000"],
    ["Fiarovana Soratra & Fanamarinana 100%", "1", "95 000", "95 000"],
  ];

  let currentY = 320;
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#1a202c";

  items.forEach((row, idx) => {
    if (idx % 2 === 1) {
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      ctx.fillRect(50, currentY - 22, 600, 32);
    }
    ctx.fillStyle = "#1a202c";
    ctx.fillText(row[0], 65, currentY);
    ctx.fillText(row[1], 385, currentY);
    ctx.fillText(row[2], 450, currentY);
    ctx.fillText(row[3], 550, currentY);

    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, currentY + 10);
    ctx.lineTo(650, currentY + 10);
    ctx.stroke();

    currentY += 40;
  });

  // Total
  ctx.fillStyle = "#1a202c";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("TOTAL TSY MISY HETRA:", 350, currentY + 30);
  ctx.fillText("500 000 MGA", 530, currentY + 30);
  ctx.fillText("TVA (20%):", 350, currentY + 60);
  ctx.fillText("100 000 MGA", 530, currentY + 60);

  ctx.fillStyle = "#1e3a5f";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("TOTAL VOALOHA:", 350, currentY + 100);
  ctx.fillText("600 000 MGA", 530, currentY + 100);

  // Official Stamp & Signature
  ctx.save();
  ctx.translate(180, currentY + 80);
  ctx.rotate(-0.15);
  ctx.strokeStyle = "#8b0000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = "bold 11px sans-serif";
  ctx.fillStyle = "#8b0000";
  ctx.textAlign = "center";
  ctx.fillText("MADAGASIKARA", 0, -28);
  ctx.fillText("★ VAKY SY NANKATOAVINA ★", 0, 0);
  ctx.fillText("COMMERCE", 0, 28);
  ctx.restore();

  // Fine print
  ctx.fillStyle = "#4a5568";
  ctx.font = "italic 11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Ity taratasy ity dia porofo ara-dalàna. Tsy azo ovaina ny soratra sy ny laharana.", 50, 930);

  ctx.restore();

  // Add realistic digital camera noise
  addSimulatedNoise(ctx, canvas.width, canvas.height, 0.08);

  return canvas.toDataURL("image/jpeg", 0.9);
}

export function createSkewedDarkCertificate(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 750;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Dim dark wooden desk background
  ctx.fillStyle = "#191512";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((5.2 * Math.PI) / 180); // Tilted +5.2 degrees
  ctx.translate(-420, -310);

  // Certificate paper with shadow
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 12;
  ctx.shadowOffsetY = 16;

  // Darkened antique parchment
  ctx.fillStyle = "#a89b80";
  ctx.fillRect(0, 0, 840, 620);
  ctx.shadowColor = "transparent";

  // Dim lighting shadow
  const grad = ctx.createRadialGradient(420, 310, 100, 420, 310, 600);
  grad.addColorStop(0, "rgba(255,240,200,0.05)");
  grad.addColorStop(1, "rgba(10,10,15,0.65)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 840, 620);

  // Ornate Borders
  ctx.strokeStyle = "#2c2214";
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 780, 560);
  ctx.strokeStyle = "#5a452a";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, 760, 540);

  // Seal / Crest
  ctx.fillStyle = "#5a452a";
  ctx.beginPath();
  ctx.arc(420, 100, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a89b80";
  ctx.font = "bold 24px serif";
  ctx.textAlign = "center";
  ctx.fillText("IA", 420, 108);

  // Certificate Headers
  ctx.fillStyle = "#1e160e";
  ctx.font = "bold 32px serif";
  ctx.fillText("FANAMARINANA FAHAHAIZANA", 420, 175);
  ctx.font = "italic 16px serif";
  ctx.fillStyle = "#3a2d1e";
  ctx.fillText("Certificat d'Excellence Professionnelle", 420, 205);

  ctx.font = "18px serif";
  ctx.fillStyle = "#221910";
  ctx.fillText("Omena ho fankasitrahana an'i:", 420, 260);

  // Recipient Name
  ctx.font = "bold 34px cursive, serif";
  ctx.fillStyle = "#110b06";
  ctx.fillText("RABEARISOA Jean-Luc Andry", 420, 315);

  // Certificate Text
  ctx.font = "16px serif";
  ctx.fillStyle = "#221910";
  ctx.fillText("Noho ny fahaizana sy fitantanana matihanina amin'ny fanadiovana", 420, 365);
  ctx.fillText("sy fandaminana sary tamin'ny taona 2026.", 420, 395);

  // Signatures
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("Ny Filohan'ny Fikambanana", 220, 490);
  ctx.font = "italic 22px cursive";
  ctx.fillText("J.L. Rabe", 220, 525);

  ctx.font = "bold 15px sans-serif";
  ctx.fillText("Ny Talen'ny Fampianarana", 620, 490);
  ctx.font = "italic 22px cursive";
  ctx.fillText("Prof. H. Razafy", 620, 525);

  // Golden Stamp Seal
  ctx.save();
  ctx.translate(420, 510);
  ctx.fillStyle = "#7c5e28";
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8;
    const r = i % 2 === 0 ? 40 : 34;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#dfc89e";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("OFISIALY", 0, 4);
  ctx.restore();

  ctx.restore();

  addSimulatedNoise(ctx, canvas.width, canvas.height, 0.09);

  return canvas.toDataURL("image/jpeg", 0.9);
}

function addSimulatedNoise(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < 0.6) {
      const noise = (Math.random() - 0.5) * 255 * amount;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "malagasy_passport_glare",
    titleMg: "🇲🇬 Pasipaoro (Taratra Flash)",
    titleFr: "Passeport (Reflet Flash)",
    descriptionMg: "Pasipaoro misy taratra jiro mahery manarona ny lohateny sy ny laharana, somary mirirana",
    category: "tilted_document",
    getDataUrl: () => "/assets/aistudio/MazavaPro_1794050708114_9e0e48bd.png",
  },
  {
    id: "tilted_invoice",
    titleMg: "Faktiora mirirana sady maizina",
    titleFr: "Facture inclinée & sombre",
    descriptionMg: "Taratasy misy tabilao, logo, soratra madinika sy fitomboka, somary mivilana sy maizina",
    category: "tilted_document",
    getDataUrl: createTiltedDarkInvoice,
  },
  {
    id: "skewed_certificate",
    titleMg: "Diplôme / Certificat mirirana",
    titleFr: "Certificat incliné & sous-exposé",
    descriptionMg: "Antontan-taratasy ofisialy misy soratra cursive, fitomboka volamena sy cadre haingon-trano",
    category: "dark_photo",
    getDataUrl: createSkewedDarkCertificate,
  },
];
