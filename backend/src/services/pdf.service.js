// backend/src/services/pdf.service.js
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const generateCertificatePdfBuffer = (data, qrDataUrl) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    const w = doc.page.width;   // 841.89 pt
    const h = doc.page.height;  // 595.28 pt

    // Ruta del logo institucional
    const logoPath = path.join(__dirname, '../assets/logo.png');

    // Factores de escala (viewBox 1000 x 707 a A4 Landscape)
    const sx = w / 1000;
    const sy = h / 707;
    const px = (x) => x * sx;
    const py = (y) => y * sy;

    const esOpcion2 = String(data.plantilla_modelo).includes('2') || 
                      String(data.plantilla_modelo).toLowerCase().includes('geom') ||
                      String(data.plantilla_modelo).toLowerCase().includes('tech');

    // =========================================================================
    // MARCOS VECTORIALES EXACTOS
    // =========================================================================
    if (esOpcion2) {
      // -----------------------------------------------------------------------
      // OPCIÓN 2: GEOMÉTRICA TECH (IMAGEN 2)
      // -----------------------------------------------------------------------
      doc.save();

      // Marco fino
      doc.lineWidth(1)
         .strokeColor('#008DDA')
         .opacity(0.35)
         .rect(px(20), py(20), px(960), py(667))
         .stroke();
      doc.opacity(1);

      // Esquina Superior Izquierda
      doc.fillColor('#0B192C').polygon([px(0), py(0)], [px(150), py(0)], [px(0), py(150)]).fill();
      doc.fillColor('#008DDA').polygon([px(0), py(150)], [px(150), py(0)], [px(170), py(0)], [px(0), py(170)]).fill();

      // Esquina Superior Derecha
      doc.fillColor('#0B192C').polygon([px(1000), py(0)], [px(850), py(0)], [px(1000), py(150)]).fill();
      doc.fillColor('#008DDA').polygon([px(1000), py(150)], [px(850), py(0)], [px(830), py(0)], [px(1000), py(170)]).fill();

      // Esquina Inferior Izquierda
      doc.fillColor('#0B192C').polygon([px(0), py(707)], [px(0), py(557)], [px(150), py(707)]).fill();
      doc.fillColor('#008DDA').polygon([px(0), py(557)], [px(150), py(707)], [px(170), py(707)], [px(0), py(537)]).fill();

      // Esquina Inferior Derecha
      doc.fillColor('#0B192C').polygon([px(1000), py(707)], [px(1000), py(557)], [px(850), py(707)]).fill();
      doc.fillColor('#008DDA').polygon([px(1000), py(557)], [px(850), py(707)], [px(830), py(707)], [px(1000), py(537)]).fill();

      // Barras verticales izquierdas
      doc.save();
      doc.fillColor('#008DDA').opacity(0.4);
      doc.roundedRect(px(45), py(320), px(3), py(45), 1.5).fill();
      doc.roundedRect(px(52), py(300), px(3), py(65), 1.5).fill();
      doc.roundedRect(px(59), py(335), px(3), py(30), 1.5).fill();
      doc.restore();

      // Red de nodos inferior izquierda
      doc.save();
      doc.strokeColor('#008DDA').lineWidth(1.2).opacity(0.45);
      doc.moveTo(px(55), py(550)).lineTo(px(115), py(520)).stroke();
      doc.moveTo(px(115), py(520)).lineTo(px(125), py(540)).stroke();
      doc.moveTo(px(55), py(550)).lineTo(px(85), py(570)).stroke();
      doc.moveTo(px(85), py(570)).lineTo(px(125), py(540)).stroke();

      doc.fillColor('#008DDA');
      doc.circle(px(55), py(550), 3).fill();
      doc.circle(px(115), py(520), 3).fill();
      doc.circle(px(125), py(540), 3).fill();
      doc.circle(px(85), py(570), 3).fill();
      doc.restore();

      doc.restore();

    } else {
      // -----------------------------------------------------------------------
      // OPCIÓN 1: FORMAL ELITE MONUMENTAL (IMAGEN 1)
      // -----------------------------------------------------------------------
      doc.save();

      // Marcos Perimetrales
      doc.lineWidth(5.5).strokeColor('#0A1931').rect(px(15), py(15), px(970), py(677)).stroke();
      doc.lineWidth(2.5).strokeColor('#FFFFFF').rect(px(22), py(22), px(956), py(663)).stroke();
      doc.lineWidth(2).strokeColor('#0284C7').rect(px(27), py(27), px(946), py(653)).stroke();
      doc.lineWidth(0.8).strokeColor('#0A1931').opacity(0.25).rect(px(33), py(33), px(934), py(641)).stroke();
      doc.opacity(1);

      // Esquinas Biseladas Sólidas
      doc.fillColor('#0A1931');
      doc.polygon([px(15), py(75)], [px(75), py(15)], [px(45), py(15)], [px(15), py(45)]).fill();
      doc.polygon([px(985), py(75)], [px(925), py(15)], [px(955), py(15)], [px(985), py(45)]).fill();
      doc.polygon([px(15), py(632)], [px(75), py(692)], [px(45), py(692)], [px(15), py(662)]).fill();
      doc.polygon([px(985), py(632)], [px(925), py(692)], [px(955), py(692)], [px(985), py(662)]).fill();

      doc.fillColor('#0284C7');
      doc.polygon([px(15), py(92)], [px(92), py(15)], [px(82), py(15)], [px(15), py(82)]).fill();
      doc.polygon([px(985), py(92)], [px(908), py(15)], [px(918), py(15)], [px(985), py(82)]).fill();
      doc.polygon([px(15), py(615)], [px(92), py(692)], [px(82), py(692)], [px(15), py(625)]).fill();
      doc.polygon([px(985), py(615)], [px(908), py(692)], [px(918), py(692)], [px(985), py(625)]).fill();

      // Circuitos en esquinas
      doc.strokeColor('#0284C7').lineWidth(1.5).lineCap('round');
      doc.moveTo(px(15), py(115)).lineTo(px(35), py(115)).lineTo(px(48), py(102)).lineTo(px(48), py(80)).stroke();
      doc.circle(px(48), py(80), 2).fillColor('#0284C7').fill();
      doc.moveTo(px(115), py(15)).lineTo(px(115), py(35)).lineTo(px(102), py(48)).lineTo(px(80), py(48)).stroke();
      doc.circle(px(80), py(48), 2.5).fillColor('#0284C7').fill();

      doc.moveTo(px(985), py(115)).lineTo(px(965), py(115)).lineTo(px(952), py(102)).lineTo(px(952), py(80)).stroke();
      doc.circle(px(952), py(80), 2).fillColor('#0284C7').fill();
      doc.moveTo(px(885), py(15)).lineTo(px(885), py(35)).lineTo(px(898), py(48)).lineTo(px(920), py(48)).stroke();
      doc.circle(px(920), py(48), 2).fillColor('#0284C7').fill();

      doc.moveTo(px(15), py(592)).lineTo(px(35), py(592)).lineTo(px(48), py(605)).lineTo(px(48), py(627)).stroke();
      doc.circle(px(48), py(627), 2).fillColor('#0284C7').fill();
      doc.moveTo(px(115), py(692)).lineTo(px(115), py(672)).lineTo(px(102), py(659)).lineTo(px(80), py(659)).stroke();
      doc.circle(px(80), py(659), 2).fillColor('#0284C7').fill();

      doc.moveTo(px(985), py(592)).lineTo(px(965), py(592)).lineTo(px(952), py(605)).lineTo(px(952), py(627)).stroke();
      doc.circle(px(952), py(627), 2).fillColor('#0284C7').fill();
      doc.moveTo(px(885), py(692)).lineTo(px(885), py(672)).lineTo(px(898), py(659)).lineTo(px(920), py(659)).stroke();
      doc.circle(px(920), py(659), 2).fillColor('#0284C7').fill();

      // Pistas laterales punteadas
      doc.save();
      doc.strokeColor('#0284C7').lineWidth(1.2).lineCap('round');
      doc.moveTo(px(10), py(300)).lineTo(px(10), py(405)).dash(5, { space: 3 }).stroke();
      doc.undash();
      doc.circle(px(10), py(295), 2).fillColor('#0284C7').fill();
      doc.circle(px(10), py(410), 2).fillColor('#0284C7').fill();

      doc.moveTo(px(990), py(300)).lineTo(px(990), py(405)).dash(5, { space: 3 }).stroke();
      doc.undash();
      doc.circle(px(990), py(295), 2).fillColor('#0284C7').fill();
      doc.circle(px(990), py(410), 2).fillColor('#0284C7').fill();
      doc.restore();

      doc.restore();
    }

    // =========================================================================
    // 1. CABECERA: LOGO CENTRADO
    // =========================================================================
    const logoW = 210;
    const logoH = 75;
    const logoX = (w - logoW) / 2;
    const logoY = 48;

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, logoX, logoY, {
        fit: [logoW, logoH],
        align: 'center',
        valign: 'center',
      });
    }

    // =========================================================================
    // 2. TEXTO DEL RECONOCIMIENTO
    // =========================================================================
    doc.fontSize(9.5).fillColor('#475569').font('Helvetica-Bold')
       .text('OTORGA EL PRESENTE', 0, 148, { align: 'center', characterSpacing: 2.8 });

    doc.fontSize(23).fillColor('#0A1931').font('Times-Bold')
       .text('CERTIFICADO DE RECONOCIMIENTO', 0, 168, { align: 'center', characterSpacing: 1.2 });

    doc.fontSize(10).fillColor('#64748B').font('Times-Italic')
       .text('A favor de:', 0, 202, { align: 'center' });

    // Titular
    doc.fontSize(30).fillColor('#0A1931').font('Times-BoldItalic')
       .text(data.nombreCompleto || data.titular, 0, 222, { align: 'center' });

    // DNI Enmascarado
    doc.fontSize(9).fillColor('#475569').font('Helvetica')
       .text('Identificado con DNI N° ', (w / 2) - 80, 260, { continued: true })
       .font('Courier-Bold').fillColor('#0A1931')
       .text(data.dniEnmascarado || data.dni || '---');

    // Cuerpo
    const modalidad = data.modalidad || 'Prácticas Preprofesionales';
    const area = data.area_asignada || data.area || 'Ingeniería de Sistemas';
    const detalle = data.desempeno_detalle ? `${data.desempeno_detalle} ` : 'demostrando alto compromiso ético y profesional en los proyectos asignados. ';
    const horas = data.total_horas || 480;

    const textoCuerpo = `Por haber culminado satisfactoriamente su periodo de ${modalidad} en el área de ${area}, ${detalle}Totalizando un récord convalidado de ${horas} horas cronológicas.`;

    doc.fontSize(10.5).fillColor('#334155').font('Helvetica')
       .text(textoCuerpo, 110, 290, {
         align: 'center',
         width: w - 220,
         lineGap: 4.8,
       });

    // =========================================================================
    // 3. PIE DE PÁGINA (FIRMA Y QR TECH)
    // =========================================================================
    const baseY = h - 138;

    // Firma a la izquierda
    doc.save();
    doc.moveTo(85, baseY + 45).lineTo(260, baseY + 45).strokeColor('#94A3B8').lineWidth(1).dash(4, { space: 3 }).stroke();
    doc.restore();

    doc.fontSize(9.5).fillColor('#0A1931').font('Helvetica-Bold')
       .text('Ing. Representante Legal', 85, baseY + 50, { width: 175, align: 'center' });
    doc.fontSize(8.5).fillColor('#64748B').font('Helvetica')
       .text('Matt Innova Solution E.I.R.L.', 85, baseY + 63, { width: 175, align: 'center' });
    doc.fontSize(7.5).fillColor('#94A3B8').font('Courier')
       .text(`Fecha de Emisión: ${data.fecha_emision}`, 85, baseY + 82, { width: 175, align: 'left' });

    // QR y Badge a la derecha
    if (qrDataUrl) {
      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');
      const qrX = w - 170;

      doc.roundedRect(qrX - 3, baseY - 5, 74, 74, 3).fillColor('#FFFFFF').fill();
      doc.roundedRect(qrX - 3, baseY - 5, 74, 74, 3).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
      doc.image(qrBuffer, qrX, baseY - 2, { width: 68, height: 68 });

      doc.fontSize(7.5).fillColor('#334155').font('Courier-Bold')
         .text(data.codigo_oficial || 'CERT-2026-LIVE', qrX - 10, baseY + 73, { width: 88, align: 'center' });
      doc.fontSize(6).fillColor('#94A3B8').font('Helvetica')
         .text('Escanee para verificar', qrX - 10, baseY + 83, { width: 88, align: 'center' });

      doc.roundedRect(qrX - 25, baseY + 94, 118, 14, 7).fillColor('#0284C7').fill();
      doc.fontSize(6.5).fillColor('#FFFFFF').font('Helvetica-Bold')
         .text('✓ VÁLIDO & FIRMADO DIGITALMENTE', qrX - 25, baseY + 98, { width: 118, align: 'center' });
    }

    doc.end();
  });
};

module.exports = {
  generateCertificatePdfBuffer,
};