const { validationResult } = require('express-validator');
const User = require('../models/User');

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const safe = user.toObject();
    delete safe.password;
    return res.json({ success: true, data: { user: safe } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function updateProfile(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
      });
    }

    const { name, phone, profilePic, vehicleType, isAvailable, location } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profilePic !== undefined) user.profilePic = profilePic;
    if (user.role === 'worker') {
      if (vehicleType !== undefined) user.vehicleType = vehicleType;
      if (typeof isAvailable === 'boolean') user.isAvailable = isAvailable;
    }

    if (location && location.lng != null && location.lat != null) {
      const lng = Number(location.lng);
      const lat = Number(location.lat);
      if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
        user.location = {
          type: 'Point',
          coordinates: [lng, lat],
        };
      }
    }

    await user.save();
    const safe = user.toObject();
    delete safe.password;
    return res.json({ success: true, data: { user: safe } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Update failed' });
  }
}

async function nearbyWorkers(req, res) {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radiusKm);
    const maxKm = Number.isFinite(radiusKm) ? Math.min(50, Math.max(1, radiusKm)) : 10;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'lat and lng query params are required',
      });
    }

    const maxMeters = maxKm * 1000;
    const workers = await User.find({
      role: 'worker',
      isActive: true,
      isAvailable: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: maxMeters,
        },
      },
    })
      .select('name profilePic rating vehicleType location')
      .limit(20);

    return res.json({ success: true, data: { workers } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to find workers' });
  }
}

module.exports = { getProfile, updateProfile, nearbyWorkers };
