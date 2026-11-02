// backend/src/routes/certificates.routes.js
const express = require('express');
const router = express.Router();
const { 
  issueCertificate, 
  listCertificates, 
  revokeCertificate, 
  downloadCertificatePdf 
} = require('../controllers/certificate.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, requireAdmin, listCertificates);
router.post('/issue', verifyToken, requireAdmin, issueCertificate);
router.put('/:id/revoke', verifyToken, requireAdmin, revokeCertificate);
router.get('/:id/download', downloadCertificatePdf);

module.exports = router;