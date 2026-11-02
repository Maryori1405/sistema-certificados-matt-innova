// backend/src/services/pdf.service.js
const PDFDocument = require('pdfkit');

const generateCertificatePdfBuffer = (data, qrDataUrl) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 30, bottom: 30, left: 30, right: 30 },
    });

    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    const width = doc.page.width;
    const height = doc.page.height;

    // Borde exterior e interior
    doc.lineWidth(2).strokeColor('#0f172a').rect(25, 25, width - 50, height - 50).stroke();
    doc.lineWidth(0.8).strokeColor('#3b82f6').rect(30, 30, width - 60, height - 60).stroke();

    // Membrete
    doc.fontSize(16).fillColor('#0f172a').font('Helvetica-Bold')
       .text('MATT INNOVA SOLUTION', 50, 50, { align: 'left' });
    doc.fontSize(8).fillColor('#64748b').font('Helvetica')
       .text('E.I.R.L. • RUC: 20608934521', 50, 70);

    // Titular
    doc.moveDown(2);
    doc.fontSize(10).fillColor('#475569').font('Helvetica')
       .text('OTORGA EL PRESENTE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(22).fillColor('#0f172a').font('Helvetica-Bold')
       .text('CERTIFICADO DE RECONOCIMIENTO', { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(11).fillColor('#64748b').font('Helvetica')
       .text('A favor de:', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(18).fillColor('#1d4ed8').font('Helvetica-Bold')
       .text(data.nombreCompleto, { align: 'center' });
    doc.fontSize(9).fillColor('#475569').font('Helvetica')
       .text(`Identificado con DNI N° ${data.dniEnmascarado}`, { align: 'center' });

    // Detalle
    doc.moveDown(1.5);
    const textoCuerpo = `Por haber culminado satisfactoriamente su periodo de ${data.modalidad} en el área de ${data.area_asignada}, demostrando alto compromiso ético y profesional. Totalizando un récord convalidado de ${data.total_horas} horas cronológicas.`;
    doc.fontSize(10).fillColor('#334155').font('Helvetica')
       .text(textoCuerpo, 90, doc.y, { align: 'center', width: width - 180, lineGap: 4 });

    // Bloque inferior
    const bottomY = height - 145;

    // Firma
    doc.moveTo(130, bottomY + 50).lineTo(310, bottomY + 50).strokeColor('#64748b').lineWidth(1).stroke();
    doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold')
       .text('Ing. Representante Legal', 130, bottomY + 55, { width: 180, align: 'center' });
    doc.fontSize(8).fillColor('#64748b').font('Helvetica')
       .text('Gerencia General - Matt Innova Solution', 130, bottomY + 68, { width: 180, align: 'center' });

    // QR
    if (qrDataUrl) {
      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');
      doc.image(qrBuffer, width - 210, bottomY - 5, { width: 80, height: 80 });
      doc.fontSize(7).fillColor('#1d4ed8').font('Helvetica-Bold')
         .text(data.codigo_oficial, width - 210, bottomY + 78, { width: 80, align: 'center' });
      doc.fontSize(6).fillColor('#64748b').font('Helvetica')
         .text('Escanee para verificar', width - 210, bottomY + 88, { width: 80, align: 'center' });
    }

    doc.fontSize(7).fillColor('#94a3b8').font('Helvetica')
       .text(`Fecha de Emisión: ${data.fecha_emision}`, 50, height - 42);
    doc.fontSize(7).fillColor('#16a34a').font('Helvetica-Bold')
       .text('• VÁLIDO & FIRMADO DIGITALMENTE', width - 220, height - 42, { align: 'right' });

    doc.end();
  });
};

module.exports = {
  generateCertificatePdfBuffer,
};