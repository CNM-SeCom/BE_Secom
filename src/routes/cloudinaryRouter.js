const express = require('express');
const cloudinaryController = require('../controllers/cloudinaryController');

const router = express.Router();

router.post('/uploadVideo', cloudinaryController.uploadVideo, cloudinaryController.handleUpload);
router.post('/uploadVideoWeb', cloudinaryController.uploadVideoWeb, cloudinaryController.handleUpload);
router.post('/uploadFile', cloudinaryController.uploadFile, cloudinaryController.handleUploadFile);

module.exports = router;
