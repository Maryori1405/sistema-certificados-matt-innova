// backend/src/routes/certificates.routes.js
const express = require('express');
const router = express.Router();
const certificateCtrl = require('../controllers/certificate.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

// Resolver funciones admitiendo variaciones de nombres
const listFn = certificateCtrl.listCertificates || certificateCtrl.getCertificates;
const issueFn = certificateCtrl.issueCertificate || certificateCtrl.createCertificate;
const revokeFn = certificateCtrl.revokeCertificate;
const downloadFn = certificateCtrl.downloadCertificatePdf || certificateCtrl.downloadCertificate || certificateCtrl.downloadPdf;

// Validar que existan los handlers antes de pasárselos a Express
if (listFn) {
  router.get('/', verifyToken, requireAdmin, listFn);
}
if (issueFn) {
  router.post('/issue', verifyToken, requireAdmin, issueFn);
}
if (revokeFn) {
  router.put('/:id/revoke', verifyToken, requireAdmin, revokeFn);
}
if (downloadFn) {
  router.get('/:id/download', downloadFn);
} else {
  // Handler provisional en caso de que falte exportar la función en el controlador
  router.get('/:id/download', (req, res) => {
    res.status(501).json({ message: 'Función de descarga no configurada en el controlador.' });
  });
}

module.exports = router;