// backend/src/services/pdf.service.js
const PDFDocument = require('pdfkit');

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

    // ========================================================
    // 1. ROSETA DE SEGURIDAD DE FONDO (GUILLOCHE)
    // ========================================================
    doc.save();
    doc.strokeColor('#0284c7').lineWidth(0.6).opacity(0.08);
    const cx = w / 2;
    const cy = h / 2 + 10;
    doc.circle(cx, cy, 110).stroke();
    doc.circle(cx, cy, 140).dash(4, { space: 2 }).stroke();
    doc.undash();
    doc.circle(cx, cy, 170).stroke();
    doc.circle(cx, cy, 200).dash(6, { space: 3 }).stroke();
    doc.undash();

    // Elipses concéntricas rotadas
    for (let angle = 0; angle < 180; angle += 30) {
      doc.save();
      doc.translate(cx, cy);
      doc.rotate(angle);
      // PDFKit no tiene ellipse nativo con rotación libre sin transform; usamos bezier simulado
      doc.ellipse(0, 0, 190, 115).stroke();
      doc.restore();
    }
    doc.restore();

    // ========================================================
    // 2. MARCO MONUMENTAL PERIMETRAL
    // ========================================================
    // Marco exterior grueso azul oscuro (#0A1931)
    doc.lineWidth(5).strokeColor('#0A1931').rect(15, 15, w - 30, h - 30).stroke();
    // Línea de corte blanca de resalte
    doc.lineWidth(2).strokeColor('#FFFFFF').rect(20, 20, w - 40, h - 40).stroke();
    // Marco intermedio cyan/azul institucional (#0284C7)
    doc.lineWidth(2).strokeColor('#0284C7').rect(24, 24, w - 48, h - 48).stroke();
    // Marco fino interior
    doc.lineWidth(0.8).strokeColor('#0A1931').opacity(0.3).rect(30, 30, w - 60, h - 60).stroke();
    doc.opacity(1);

    // ========================================================
    // 3. ESQUINAS BISELADAS SÓLIDAS
    // ========================================================
    const drawBevelCorners = () => {
      doc.fillColor('#0A1931');
      // Superior Izquierda
      doc.polygon([15, 65], [65, 15], [42, 15], [15, 42]).fill();
      // Superior Derecha
      doc.polygon([w - 15, 65], [w - 65, 15], [w - 42, 15], [w - 15, 42]).fill();
      // Inferior Izquierda
      doc.polygon([15, h - 65], [65, h - 15], [42, h - 15], [15, h - 42]).fill();
      // Inferior Derecha
      doc.polygon([w - 15, h - 65], [w - 65, h - 15], [w - 42, h - 15], [w - 15, h - 42]).fill();

      // Franjas de acento celeste (#0284C7)
      doc.fillColor('#0284C7');
      doc.polygon([15, 78], [78, 15], [70, 15], [15, 70]).fill();
      doc.polygon([w - 15, 78], [w - 78, 15], [w - 70, 15], [w - 15, 70]).fill();
      doc.polygon([15, h - 78], [78, h - 15], [70, h - 15], [15, h - 70]).fill();
      doc.polygon([w - 15, h - 78], [w - 78, h - 15], [w - 70, h - 15], [w - 15, h - 70]).fill();
    };
    drawBevelCorners();

    // ========================================================
    // 4. CIRCUITOS PERIMETRALES DE SEGURIDAD
    // ========================================================
    doc.strokeColor('#0284C7').lineWidth(1.2).lineCap('round');
    // Sup-Izq
    doc.moveTo(15, 95).lineTo(32, 95).lineTo(44, 83).lineTo(44, 65).stroke();
    doc.circle(44, 65, 1.8).fillColor('#0284C7').fill();
    doc.moveTo(95, 15).lineTo(95, 32).lineTo(83, 44).lineTo(65, 44).stroke();
    doc.circle(65, 44, 1.8).fillColor('#0284C7').fill();

    // Sup-Der
    doc.moveTo(w - 15, 95).lineTo(w - 32, 95).lineTo(w - 44, 83).lineTo(w - 44, 65).stroke();
    doc.circle(w - 44, 65, 1.8).fillColor('#0284C7').fill();
    doc.moveTo(w - 95, 15).lineTo(w - 95, 32).lineTo(w - 83, 44).lineTo(w - 65, 44).stroke();
    doc.circle(w - 65, 44, 1.8).fillColor('#0284C7').fill();

    // Inf-Izq
    doc.moveTo(15, h - 95).lineTo(32, h - 95).lineTo(44, h - 83).lineTo(44, h - 65).stroke();
    doc.circle(44, h - 65, 1.8).fillColor('#0284C7').fill();
    doc.moveTo(95, h - 15).lineTo(95, h - 32).lineTo(83, h - 44).lineTo(65, h - 44).stroke();
    doc.circle(65, h - 44, 1.8).fillColor('#0284C7').fill();

    // Inf-Der
    doc.moveTo(w - 15, h - 95).lineTo(w - 32, h - 95).lineTo(w - 44, h - 83).lineTo(w - 44, h - 65).stroke();
    doc.circle(w - 44, h - 65, 1.8).fillColor('#0284C7').fill();
    doc.moveTo(w - 95, h - 15).lineTo(w - 95, h - 32).lineTo(w - 83, h - 44).lineTo(w - 65, h - 44).stroke();
    doc.circle(w - 65, h - 44, 1.8).fillColor('#0284C7').fill();

    // ========================================================
    // 5. CABECERA INSTITUCIONAL
    // ========================================================
    // Lado izquierdo: Razón social
    doc.fontSize(13).fillColor('#0A1931').font('Helvetica-Bold')
       .text('MATT INNOVA SOLUTION', 55, 48);
    doc.fontSize(8.5).fillColor('#64748B').font('Helvetica')
       .text('E.I.R.L. • RUC: 20608934521', 55, 64);

    // Lado derecho: Logotipo y eslogan
    doc.fontSize(11).fillColor('#0284C7').font('Helvetica-Bold')
       .text('MATT INNOVA', w - 190, 48, { align: 'right', width: 135 });
    doc.fontSize(7).fillColor('#0A1931').font('Helvetica-Bold')
       .text('SOLUTION', w - 190, 61, { align: 'right', width: 135 });
    doc.fontSize(5.5).fillColor('#94A3B8').font('Helvetica')
       .text('SOLUCIONES TI QUE TRANSFORMAN', w - 190, 71, { align: 'right', width: 135 });

    // ========================================================
    // 6. CUERPO DEL RECONOCIMIENTO
    // ========================================================
    doc.fontSize(9).fillColor('#64748B').font('Helvetica-Bold')
       .text('OTORGA EL PRESENTE', 0, 120, { align: 'center', characterSpacing: 2 });

    doc.fontSize(22).fillColor('#0A1931').font('Times-Bold')
       .text('CERTIFICADO DE RECONOCIMIENTO', 0, 142, { align: 'center', characterSpacing: 1 });

    doc.fontSize(9.5).fillColor('#64748B').font('Times-Italic')
       .text('A favor de:', 0, 180, { align: 'center' });

    // Nombre del Titular destacado
    doc.fontSize(26).fillColor('#0A1931').font('Times-BoldItalic')
       .text(data.nombreCompleto || data.titular, 0, 202, { align: 'center' });

    // DNI Enmascarado
    doc.fontSize(8.5).fillColor('#475569').font('Helvetica')
       .text(`Identificado con DNI N° ${data.dniEnmascarado || data.dni || '---'}`, 0, 238, { align: 'center' });

    // Párrafo convalidado
    const textoCuerpo = `Por haber culminado satisfactoriamente su periodo de ${data.modalidad || 'Prácticas Preprofesionales'} en el área de ${data.area_asignada || data.area || 'Ingeniería de Sistemas'}, demostrando alto compromiso ético y profesional en los proyectos asignados. Totalizando un récord convalidado de ${data.total_horas || 480} horas cronológicas.`;
    
    doc.fontSize(10).fillColor('#334155').font('Helvetica')
       .text(textoCuerpo, 110, 268, {
         align: 'center',
         width: w - 220,
         lineGap: 4.5,
       });

    // ========================================================
    // 7. BLOQUE INFERIOR (FIRMA, QR Y SELLOS)
    // ========================================================
    const baseY = h - 140;

    // Bloque Izquierdo: Firma
    doc.moveTo(80, baseY + 45).lineTo(250, baseY + 45).strokeColor('#94A3B8').lineWidth(1).stroke();
    doc.fontSize(9).fillColor('#0A1931').font('Helvetica-Bold')
       .text('Ing. Representante Legal', 80, baseY + 50, { width: 170, align: 'center' });
    doc.fontSize(7.5).fillColor('#64748B').font('Helvetica')
       .text('Matt Innova Solution E.I.R.L.', 80, baseY + 62, { width: 170, align: 'center' });
    doc.fontSize(7.5).fillColor('#94A3B8').font('Helvetica')
       .text(`Fecha de Emisión: ${data.fecha_emision || new Date().toISOString().split('T')[0]}`, 80, baseY + 80, { width: 170, align: 'center' });

    // Bloque Derecho: Código QR
    if (qrDataUrl) {
      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');
      const qrX = w - 165;
      
      // Contenedor blanco con borde suave para el QR
      doc.roundedRect(qrX - 4, baseY - 6, 76, 76, 3).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
      doc.image(qrBuffer, qrX, baseY - 2, { width: 68, height: 68 });

      // Código y leyenda
      doc.fontSize(7.5).fillColor('#0A1931').font('Helvetica-Bold')
         .text(data.codigo_oficial || 'CERT-OFICIAL', qrX - 10, baseY + 72, { width: 88, align: 'center' });
      doc.fontSize(6).fillColor('#94A3B8').font('Helvetica')
         .text('Escanee para verificar', qrX - 10, baseY + 82, { width: 88, align: 'center' });

      // Badge cápsula celeste
      doc.roundedRect(qrX - 25, baseY + 93, 118, 14, 7).fillColor('#0284C7').fill();
      doc.fontSize(6).fillColor('#FFFFFF').font('Helvetica-Bold')
         .text('✓ VÁLIDO & FIRMADO DIGITALMENTE', qrX - 25, baseY + 97, { width: 118, align: 'center' });
    }

    doc.end();
  });
};

module.exports = {
  generateCertificatePdfBuffer,
};