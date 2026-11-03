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

    // Ruta de la imagen del logo oficial
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
    // MARCOS Y FONDOS VECTORIALES (SVG A PDFKIT)
    // =========================================================================
    if (esOpcion2) {
      // -----------------------------------------------------------------------
      // OPCIÓN 2: GEOMÉTRICA TECH
      // -----------------------------------------------------------------------
      doc.save();

      // Marco fino rectangular
      doc.lineWidth(1)
         .strokeColor('#008DDA')
         .opacity(0.35)
         .roundedRect(px(15), py(15), px(970), py(677), 2)
         .stroke();
      doc.opacity(1);

      // Polígonos Superior Izquierda
      doc.fillColor('#0B192C')
         .polygon([px(0), py(0)], [px(115), py(0)], [px(0), py(115)])
         .fill();
      doc.fillColor('#008DDA')
         .polygon([px(0), py(115)], [px(115), py(0)], [px(135), py(0)], [px(0), py(135)])
         .fill();
      doc.fillColor('#41C9E2')
         .opacity(0.8)
         .polygon([px(0), py(135)], [px(135), py(0)], [px(145), py(0)], [px(0), py(145)])
         .fill();
      doc.opacity(1);

      // Barras laterales (Ecualizador)
      doc.save();
      doc.fillColor('#008DDA').opacity(0.35);
      doc.roundedRect(px(10), py(210), px(3.5), py(20), 1).fill();
      doc.roundedRect(px(18), py(195), px(3.5), py(35), 1).fill();
      doc.roundedRect(px(26), py(180), px(3.5), py(55), 1).fill();
      doc.restore();

      // Red de nodos inferior izquierda
      doc.save();
      doc.strokeColor('#008DDA').lineWidth(1).opacity(0.35);
      doc.moveTo(px(30), py(580)).lineTo(px(65), py(540)).stroke();
      doc.moveTo(px(65), py(540)).lineTo(px(100), py(565)).stroke();
      doc.fillColor('#008DDA');
      doc.circle(px(30), py(580), 2.5).fill();
      doc.circle(px(65), py(540), 2.5).fill();
      doc.circle(px(100), py(565), 2.5).fill();
      doc.restore();

      // Polígonos Inferior Izquierda
      doc.fillColor('#0B192C')
         .polygon([px(0), py(707)], [px(0), py(580)], [px(95), py(707)])
         .fill();
      doc.fillColor('#008DDA')
         .polygon([px(0), py(707)], [px(95), py(707)], [px(190), py(707)], [px(0), py(645)])
         .fill();

      // Circuitos superior derecha
      doc.save();
      doc.strokeColor('#008DDA').lineWidth(1.6).lineCap('round');
      doc.moveTo(px(890), py(0)).lineTo(px(940), py(50)).lineTo(px(1000), py(50)).stroke();
      doc.fillColor('#008DDA');
      doc.circle(px(890), py(0), 2.5).fill();
      doc.circle(px(1000), py(50), 2.5).fill();
      doc.restore();

      // Polígonos Superior Derecha
      doc.fillColor('#0B192C')
         .polygon([px(1000), py(0)], [px(885), py(0)], [px(1000), py(115)])
         .fill();
      doc.fillColor('#008DDA')
         .polygon([px(1000), py(115)], [px(885), py(0)], [px(870), py(0)], [px(1000), py(130)])
         .fill();

      // Polígonos Inferior Derecha
      doc.fillColor('#0B192C')
         .polygon([px(1000), py(707)], [px(890), py(707)], [px(1000), py(595)])
         .fill();
      doc.fillColor('#008DDA')
         .opacity(0.4)
         .polygon([px(1000), py(707)], [px(865), py(707)], [px(1000), py(570)])
         .fill();

      doc.restore();

    } else {
      // -----------------------------------------------------------------------
      // OPCIÓN 1: FORMAL ELITE MONUMENTAL CON GUILLOCHE
      // -----------------------------------------------------------------------
      doc.save();

      // Guilloche / Roseta central
      doc.save();
      doc.strokeColor('#0284C7').lineWidth(0.8).opacity(0.06);
      const cx = px(500);
      const cy = py(375);
      doc.circle(cx, cy, px(140)).dash(4, { space: 2 }).stroke();
      doc.undash();
      doc.circle(cx, cy, px(170)).stroke();
      doc.circle(cx, cy, px(200)).dash(8, { space: 4 }).stroke();
      doc.undash();

      [15, -15, 45, -45].forEach((angle) => {
        doc.save();
        doc.translate(cx, cy);
        doc.rotate(angle);
        doc.ellipse(0, 0, px(240), py(150)).stroke();
        doc.restore();
      });
      doc.restore();

      // Marcos Perimetrales
      doc.lineWidth(5).strokeColor('#0A1931').rect(px(15), py(15), px(970), py(677)).stroke();
      doc.lineWidth(2).strokeColor('#FFFFFF').rect(px(22), py(22), px(956), py(663)).stroke();
      doc.lineWidth(2).strokeColor('#0284C7').rect(px(28), py(28), px(944), py(651)).stroke();
      doc.lineWidth(0.8).strokeColor('#0A1931').opacity(0.2).rect(px(35), py(35), px(930), py(637)).stroke();
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

      // Circuitos perimetrales
      doc.strokeColor('#0284C7').lineWidth(1.4).lineCap('round');
      doc.moveTo(px(15), py(115)).lineTo(px(35), py(115)).lineTo(px(48), py(102)).lineTo(px(48), py(80)).stroke();
      doc.circle(px(48), py(80), 2).fillColor('#0284C7').fill();
      doc.moveTo(px(115), py(15)).lineTo(px(115), py(35)).lineTo(px(102), py(48)).lineTo(px(80), py(48)).stroke();
      doc.circle(px(80), py(48), 2.2).fillColor('#0284C7').fill();

      doc.moveTo(px(985), py(115)).lineTo(px(965), py(115)).lineTo(px(952), py(102)).lineTo(px(952), py(80)).stroke();
      doc.circle(px(952), py(80), 2).fillColor('#0284C7').fill();
      doc.moveTo(px(885), py(15)).lineTo(px(885), py(35)).lineTo(px(898), py(48)).lineTo(px(920), py(48)).stroke();
      doc.circle(px(920), py(48), 2.2).fillColor('#0284C7').fill();

      doc.moveTo(px(15), py(592)).lineTo(px(35), py(592)).lineTo(px(48), py(605)).lineTo(px(48), py(627)).stroke();
      doc.circle(px(48), py(627), 2).fillColor('#0284C7').fill();
      doc.moveTo(px(115), py(692)).lineTo(px(115), py(672)).lineTo(px(102), py(659)).lineTo(px(80), py(659)).stroke();
      doc.circle(px(80), py(659), 2.2).fillColor('#0284C7').fill();

      doc.moveTo(px(985), py(592)).lineTo(px(965), py(592)).lineTo(px(952), py(605)).lineTo(px(952), py(627)).stroke();
      doc.circle(px(952), py(627), 2).fillColor('#0284C7').fill();
      doc.moveTo(px(885), py(692)).lineTo(px(885), py(672)).lineTo(px(898), py(659)).lineTo(px(920), py(659)).stroke();
      doc.circle(px(920), py(659), 2.2).fillColor('#0284C7').fill();

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
    // 1. CABECERA INSTITUCIONAL CON LOGO ESCALADO REAL
    // =========================================================================
    const headerLeftX = esOpcion2 ? 84 : 70;
    const headerY = 80;

    // Membrete Izquierdo (Razón Social y RUC)
    doc.fontSize(13.5).fillColor('#0A1931').font('Helvetica-Bold')
       .text('MATT INNOVA SOLUTION', headerLeftX, headerY);
    doc.fontSize(8.5).fillColor('#64748B').font('Courier-Bold')
       .text('E.I.R.L. • RUC: 20608934521', headerLeftX, headerY + 16);

    // Lado Derecho: Renderizado del Logo Oficial compensando márgenes transparentes
    const logoAncho = 340; 
    const logoX = w - logoAncho - 55;
    const logoY = headerY - 110;

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, logoX, logoY, {
        width: logoAncho,
        align: 'right',
      });
    } else {
      doc.fontSize(14).fillColor('#0284C7').font('Helvetica-Bold')
         .text('MATT INNOVA', w - 195, headerY, { align: 'right', width: 140 });
      doc.fontSize(8.5).fillColor('#0A1931').font('Helvetica-Bold')
         .text('SOLUTION', w - 195, headerY + 16, { align: 'right', width: 140, characterSpacing: 1.5 });
    }

    // =========================================================================
    // 2. CUERPO DEL RECONOCIMIENTO
    // =========================================================================
    doc.fontSize(9).fillColor('#475569').font('Helvetica-Bold')
       .text('OTORGA EL PRESENTE', 0, 142, { align: 'center', characterSpacing: 2.5 });

    doc.fontSize(22).fillColor('#0A1931').font('Times-Bold')
       .text('CERTIFICADO DE RECONOCIMIENTO', 0, 162, { align: 'center', characterSpacing: 1 });

    doc.fontSize(9.5).fillColor('#64748B').font('Times-Italic')
       .text('A favor de:', 0, 196, { align: 'center' });

    // Nombre del Titular
    doc.fontSize(28).fillColor('#0A1931').font('Times-BoldItalic')
       .text(data.nombreCompleto || data.titular, 0, 216, { align: 'center' });

    // DNI Enmascarado
    doc.fontSize(8.5).fillColor('#475569').font('Helvetica')
       .text('Identificado con DNI N° ', (w / 2) - 80, 250, { continued: true })
       .font('Courier-Bold').fillColor('#0A1931')
       .text(data.dniEnmascarado || data.dni || '---');

    // Párrafo de convalidación
    const modalidad = data.modalidad || 'Prácticas Profesionales';
    const area = data.area_asignada || data.area || 'Ingeniería de Sistemas';
    const detalle = data.desempeno_detalle ? `${data.desempeno_detalle} ` : 'demostrando alto compromiso ético y profesional en los proyectos asignados. ';
    const horas = data.total_horas || 100;

    const textoCuerpo = `Por haber culminado satisfactoriamente su periodo de ${modalidad} en el área de ${area}, ${detalle}Totalizando un récord convalidado de ${horas} horas cronológicas.`;

    doc.fontSize(10).fillColor('#334155').font('Helvetica')
       .text(textoCuerpo, 105, 278, {
         align: 'center',
         width: w - 210,
         lineGap: 4.5,
       });

    // =========================================================================
    // 3. PIE DE PÁGINA (FIRMA, FECHA Y QR TECH)
    // =========================================================================
    const baseY = h - 138;

    // Línea de firma
    doc.save();
    doc.moveTo(85, baseY + 45).lineTo(255, baseY + 45).strokeColor('#94A3B8').lineWidth(1).dash(4, { space: 3 }).stroke();
    doc.restore();

    doc.fontSize(9.5).fillColor('#0A1931').font('Helvetica-Bold')
       .text('Ing. Representante Legal', 85, baseY + 50, { width: 170, align: 'center' });
    doc.fontSize(8).fillColor('#64748B').font('Helvetica')
       .text('Matt Innova Solution E.I.R.L.', 85, baseY + 62, { width: 170, align: 'center' });
    doc.fontSize(7.5).fillColor('#94A3B8').font('Courier')
       .text(`Fecha de Emisión: ${data.fecha_emision}`, 85, baseY + 80, { width: 170, align: 'left' });

    // Código QR y Badge
    if (qrDataUrl) {
      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');
      const qrX = w - 165;

      doc.roundedRect(qrX - 3, baseY - 5, 74, 74, 3).fillColor('#FFFFFF').fill();
      doc.roundedRect(qrX - 3, baseY - 5, 74, 74, 3).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
      doc.image(qrBuffer, qrX, baseY - 2, { width: 68, height: 68 });

      doc.fontSize(7.5).fillColor('#334155').font('Courier-Bold')
         .text(data.codigo_oficial || 'CERT-OFICIAL', qrX - 10, baseY + 73, { width: 88, align: 'center' });
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