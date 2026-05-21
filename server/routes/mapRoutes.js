const express = require('express');
const { getRoute, postDebugLog } = require('../controllers/mapController');

const router = express.Router();

router.get('/route', getRoute);
router.post('/debug/log', postDebugLog);

module.exports = router;
