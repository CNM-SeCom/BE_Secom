const express = require('express');
const cloudinaryController = require('../controllers/cloudinaryController');

const router = express.Router();

router.post('/uploadVideo', cloudinaryController.uploadVideo, cloudinaryController.handleUpload);

module.exports = router;
