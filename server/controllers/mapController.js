const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DEBUG_LOG_PATH = path.join(__dirname, '..', '..', 'debug-bf6bbc.log');

function appendDebugLog(entry) {
  const line = `${JSON.stringify({ ...entry, timestamp: entry.timestamp ?? Date.now() })}\n`;
  fs.appendFile(DEBUG_LOG_PATH, line, () => {});
}

async function getRoute(req, res) {
  try {
    const pickupLat = parseFloat(req.query.pickupLat);
    const pickupLng = parseFloat(req.query.pickupLng);
    const deliveryLat = parseFloat(req.query.deliveryLat);
    const deliveryLng = parseFloat(req.query.deliveryLng);

    if (
      [pickupLat, pickupLng, deliveryLat, deliveryLng].some((n) => Number.isNaN(n))
    ) {
      return res.status(400).json({
        success: false,
        message: 'pickupLat, pickupLng, deliveryLat, deliveryLng are required',
      });
    }

    const coordsPath = `${pickupLng},${pickupLat};${deliveryLng},${deliveryLat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsPath}`;
    const { data } = await axios.get(url, {
      params: { overview: 'full', geometries: 'geojson' },
      timeout: 12000,
    });

    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) {
      appendDebugLog({
        sessionId: 'bf6bbc',
        runId: 'post-fix-v2',
        hypothesisId: 'H2',
        location: 'mapController.js:getRoute',
        message: 'OSRM bad response',
        data: { code: data.code },
      });
      return res.status(502).json({
        success: false,
        message: data.message || 'Routing unavailable',
      });
    }

    const coordinates = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
      lat,
      lng,
    }));

    appendDebugLog({
      sessionId: 'bf6bbc',
      runId: 'post-fix-v2',
      hypothesisId: 'H2',
      location: 'mapController.js:getRoute',
      message: 'OSRM route OK (server)',
      data: { pointCount: coordinates.length },
    });

    return res.json({ success: true, data: { coordinates } });
  } catch (err) {
    appendDebugLog({
      sessionId: 'bf6bbc',
      runId: 'post-fix-v2',
      hypothesisId: 'H2',
      location: 'mapController.js:getRoute',
      message: 'OSRM request failed',
      data: { error: err.message },
    });
    return res.status(502).json({
      success: false,
      message: err.message || 'Routing request failed',
    });
  }
}

function postDebugLog(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  appendDebugLog(req.body || {});
  return res.status(204).end();
}

module.exports = { getRoute, postDebugLog };
