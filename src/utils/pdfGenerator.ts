import { jsPDF } from 'jspdf';
import { Order, StoreSettings } from '../types/store';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDateTimeFr,
  formatXof,
} from './formatters';

export function downloadCustomerReceiptPdf(order: Order, settings: StoreSettings): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 18;

  // Header band
  doc.setFillColor(84, 11, 59); // #540B3B Prune Chez LouLou
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('CHEZ LOULOU', 15, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Abidjan, Côte d'Ivoire · Tél : ${settings.storePhone}`, 15, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('REÇU DE COMMANDE', 195, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(order.orderNumber, 195, 23, { align: 'right' });

  y = 44;
  doc.setTextColor(35, 18, 30);

  // Order & Customer Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Client & Livraison', 15, y);
  doc.text('Détails de commande', 115, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(order.customerName, 15, y);
  doc.text(`Date : ${formatDateTimeFr(order.createdAt)}`, 115, y);
  y += 5;
  doc.text(`Tél : ${order.customerPhone}`, 15, y);
  doc.text(`Statut : ${ORDER_STATUS_LABELS[order.status]}`, 115, y);
  y += 5;
  doc.text(`${order.city}, ${order.commune}`, 15, y);
  doc.text(`Paiement : ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`, 115, y);
  y += 5;
  const addrLines = doc.splitTextToSize(order.addressDetails || '-', 85);
  doc.text(addrLines, 15, y);
  doc.text(
    `État paiement : ${PAYMENT_STATUS_LABELS[order.paymentStatus || 'unpaid']}`,
    115,
    y
  );
  y += Math.max(addrLines.length * 4.5, 6) + 6;

  // Table header
  doc.setFillColor(247, 236, 242);
  doc.rect(15, y, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Article', 18, y + 5.5);
  doc.text('Qté', 125, y + 5.5, { align: 'right' });
  doc.text('P.U.', 158, y + 5.5, { align: 'right' });
  doc.text('Total', 192, y + 5.5, { align: 'right' });
  y += 12;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const item of order.items) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    const variantLabel = [item.size, item.color].filter(Boolean).join(' · ');
    const titleLine = `${item.title} (${variantLabel})`;
    const splitTitle = doc.splitTextToSize(titleLine, 98);
    doc.text(splitTitle, 18, y);
    doc.text(String(item.quantity), 125, y, { align: 'right' });
    doc.text(formatXof(item.priceXof), 158, y, { align: 'right' });
    doc.text(formatXof(item.priceXof * item.quantity), 192, y, { align: 'right' });
    y += splitTitle.length * 4.5;

    if (item.customGiftDetails) {
      doc.setFontSize(8);
      doc.setTextColor(98, 76, 90);
      const giftDesc = `Coffret : ${item.customGiftDetails.boxName} (${item.customGiftDetails.tissueColor}) · Pour ${item.customGiftDetails.recipientName}`;
      doc.text(doc.splitTextToSize(giftDesc, 160), 20, y);
      y += 4.5;
      doc.setFontSize(9);
      doc.setTextColor(35, 18, 30);
    }

    doc.setDrawColor(235, 225, 232);
    doc.line(15, y + 1, 195, y + 1);
    y += 6;
  }

  // Totals block
  y += 4;
  const drawTotalRow = (label: string, val: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 9.5);
    doc.text(label, 120, y);
    doc.text(val, 192, y, { align: 'right' });
    y += bold ? 7 : 5.5;
  };

  drawTotalRow('Sous-total articles', formatXof(order.subtotalXof));
  if (order.discountXof > 0) {
    drawTotalRow('Remise saisonnière', `-${formatXof(order.discountXof)}`);
  }
  if ((order.promoDiscountXof || 0) > 0) {
    drawTotalRow(
      `Code promo (${order.promoCode || ''})`,
      `-${formatXof(order.promoDiscountXof || 0)}`
    );
  }
  if ((order.pointsDiscountXof || 0) > 0) {
    drawTotalRow(
      `Points LouLou (${order.pointsRedeemed} pts)`,
      `-${formatXof(order.pointsDiscountXof)}`
    );
  }
  drawTotalRow(
    'Livraison',
    order.deliveryFeeXof === 0 ? 'Offerte' : formatXof(order.deliveryFeeXof)
  );
  doc.setDrawColor(84, 11, 59);
  doc.line(120, y - 2, 195, y - 2);
  drawTotalRow('TOTAL COMMANDE', formatXof(order.totalXof), true);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(98, 76, 90);
  doc.text(
    `Fidélité Chez LouLou : +${order.pointsEarned || 0} pts (${
      order.pointsCredited ? 'crédités' : 'crédités à la confirmation'
    }).`,
    15,
    y
  );
  if (order.paymentReference) {
    y += 4.5;
    doc.text(`Référence transaction : ${order.paymentReference}`, 15, y);
  }

  doc.save(`Recu-${order.orderNumber}-ChezLouLou.pdf`);
}

export function downloadDeliverySlipPdf(order: Order, settings: StoreSettings): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 18;

  doc.setDrawColor(35, 18, 30);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, 186, 26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('BON DE LIVRAISON / FICHE TOURNÉE LIVREUR', 16, 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Chez LouLou Abidjan · Contact boutique : ${settings.storePhone}`, 16, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(order.orderNumber, 192, 22, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(formatDateTimeFr(order.createdAt), 192, 30, { align: 'right' });

  y = 48;

  // Recipient & Address box
  doc.setFillColor(248, 245, 247);
  doc.rect(12, y, 186, 36, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Destinataire : ${order.customerName}`, 16, y + 8);
  doc.text(`Téléphone : ${order.customerPhone}`, 120, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Zone : ${order.city} — ${order.commune}`, 16, y + 16);
  const addr = doc.splitTextToSize(`Adresse / Repère : ${order.addressDetails}`, 175);
  doc.text(addr, 16, y + 23);
  y += 44;

  // Cash Collection Box
  const alreadyPaid = order.paymentStatus === 'paid';
  const amountToCollect = alreadyPaid ? 0 : order.totalXof;
  doc.setFillColor(alreadyPaid ? 220 : 254, alreadyPaid ? 252 : 243, alreadyPaid ? 231 : 199);
  doc.rect(12, y, 186, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(
    alreadyPaid
      ? `COLIS DÉJÀ PAYÉ EN LIGNE (${PAYMENT_METHOD_LABELS[order.paymentMethod]}) — 0 FCFA À ENCAISSER`
      : `MONTANT À ENCAISSER À LA LIVRAISON : ${formatXof(amountToCollect)}`,
    16,
    y + 12
  );
  y += 28;

  // Package Checklist
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`Contenu du colis (${order.items.length} ligne(s))`, 12, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  for (const item of order.items) {
    const variant = [item.size, item.color].filter(Boolean).join(' · ');
    doc.rect(12, y - 3.5, 4, 4);
    doc.text(`${item.quantity}x  ${item.title} (${variant})`, 19, y);
    y += 7;
    if (item.customGiftDetails) {
      doc.setFontSize(8.5);
      doc.text(
        `   -> Coffret : ${item.customGiftDetails.boxName} | Mot pour ${item.customGiftDetails.recipientName}: "${item.customGiftDetails.giftMessage}"`,
        19,
        y
      );
      y += 6;
      doc.setFontSize(9.5);
    }
  }

  if (order.notes) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Instructions client :', 12, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(order.notes, 180), 12, y);
    y += 12;
  }

  y = Math.max(y + 14, 235);
  doc.setDrawColor(120, 110, 115);
  doc.line(12, y, 95, y);
  doc.line(112, y, 198, y);
  doc.setFontSize(9);
  doc.text('Signature du livreur / Date & heure', 12, y + 5);
  doc.text('Signature du client (Reçu conforme)', 112, y + 5);

  doc.save(`Bon-Livraison-${order.orderNumber}-ChezLouLou.pdf`);
}
