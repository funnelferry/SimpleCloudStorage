const express = require('express');
const router = express.Router();
const upload = require('../middleware/fileUpload');
const verifyToken = require('../middleware/authjwt');
const {fileupload, listfiles, createdirectory, filedownload, moveItem, rollback} = require('../controllers/fileController');
const {shareFile, filedownloadshared, listSharedFiles} = require('../controllers/shareController');

router.post('/upload/*', verifyToken, upload.single('file'), fileupload);

router.get('/download/*', verifyToken, filedownload);

router.get('/list/*', verifyToken, listfiles);

router.post('/create-directory/*', verifyToken, createdirectory);

router.post('/move', verifyToken, moveItem);

router.post('/share', verifyToken, shareFile);

router.get('/downloadshared/*', verifyToken, filedownloadshared );

router.get('/sharedfiles/*', verifyToken, listSharedFiles);

router.post('/rollback/:filepath/:versionnumber', verifyToken, rollback);

router.post('/search', verifyToken, )


module.exports = router;
