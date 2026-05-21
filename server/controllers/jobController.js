const { validationResult } = require('express-validator');
const Job = require('../models/Job');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { priceFromDistanceKm } = require('../utils/pricing');
const { fetchRouteMetricsWithFallback } = require('../utils/osrm');

function point(lng, lat) {
  return {
    type: 'Point',
    coordinates: [Number(lng), Number(lat)],
  };
}

async function fetchDistanceMatrix(pickup, delivery) {
  return fetchRouteMetricsWithFallback(pickup, delivery);
}

async function estimateJob(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
      });
    }

    const { pickup, delivery } = req.body;
    const matrix = await fetchDistanceMatrix(pickup, delivery);
    const price = priceFromDistanceKm(matrix.distanceKm);

    return res.json({
      success: true,
      data: {
        distanceKm: matrix.distanceKm,
        estimatedTimeMin: matrix.durationMin,
        price,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Could not estimate delivery',
    });
  }
}

async function listJobs(req, res) {
  try {
    if (req.user.role === 'customer') {
      const jobs = await Job.find({ customer: req.user._id })
        .sort({ createdAt: -1 })
        .populate('worker', 'name profilePic rating phone');
      return res.json({ success: true, data: { jobs } });
    }

    if (req.user.role === 'worker') {
      const mine = req.query.mine === 'true' || req.query.mine === '1';
      if (mine) {
        const jobs = await Job.find({ worker: req.user._id })
          .sort({ updatedAt: -1 })
          .populate('customer', 'name phone profilePic rating');
        return res.json({ success: true, data: { jobs } });
      }

      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radiusKm = parseFloat(req.query.radiusKm);
      const maxKm = Number.isFinite(radiusKm) ? Math.min(50, Math.max(1, radiusKm)) : 20;

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({
          success: false,
          message: 'Query params lat and lng are required for workers (or use mine=1)',
        });
      }

      const maxMeters = maxKm * 1000;
      const jobs = await Job.find({
        status: 'open',
        paymentStatus: 'paid',
        'pickupLocation.coordinates': {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: maxMeters,
          },
        },
      })
        .populate('customer', 'name phone profilePic rating')
        .sort({ createdAt: -1 });

      return res.json({ success: true, data: { jobs } });
    }

    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to list jobs' });
  }
}

async function createJob(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
      });
    }

    const {
      title,
      description,
      packageSize,
      pickupAddress,
      pickupLng,
      pickupLat,
      deliveryAddress,
      deliveryLng,
      deliveryLat,
      price,
      distanceKm,
      estimatedTimeMin,
    } = req.body;

    let distance = Number(distanceKm);
    let estimatedTime = Number(estimatedTimeMin);
    let finalPrice = Number(price);

    if (
      Number.isNaN(distance) ||
      Number.isNaN(estimatedTime) ||
      Number.isNaN(finalPrice)
    ) {
      const matrix = await fetchDistanceMatrix(
        { lng: pickupLng, lat: pickupLat },
        { lng: deliveryLng, lat: deliveryLat }
      );
      distance = matrix.distanceKm;
      estimatedTime = matrix.durationMin;
      finalPrice = priceFromDistanceKm(distance);
    } else {
      const expected = priceFromDistanceKm(distance);
      if (Math.abs(finalPrice - expected) > expected * 0.25 + 2) {
        return res.status(400).json({
          success: false,
          message: 'Price does not match estimated fare for this distance',
        });
      }
    }

    const job = await Job.create({
      customer: req.user._id,
      title,
      description: description || '',
      packageSize,
      pickupLocation: {
        address: pickupAddress,
        coordinates: point(pickupLng, pickupLat),
      },
      deliveryLocation: {
        address: deliveryAddress,
        coordinates: point(deliveryLng, deliveryLat),
      },
      price: finalPrice,
      distance,
      estimatedTime,
      paymentStatus: 'pending',
      status: 'open',
      timeline: { postedAt: new Date() },
    });

    const populated = await Job.findById(job._id).populate('customer', 'name email phone');
    return res.status(201).json({ success: true, data: { job: populated } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to create job' });
  }
}

async function getJob(req, res) {
  try {
    const job = await Job.findById(req.params.id)
      .populate('customer', 'name email phone profilePic rating')
      .populate('worker', 'name email phone profilePic rating');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const isCustomer = job.customer._id.toString() === req.user._id.toString();
    const isWorker =
      job.worker && job.worker._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (isAdmin) {
      return res.json({ success: true, data: { job } });
    }

    if (!isCustomer && !isWorker) {
      if (req.user.role === 'worker' && job.status === 'open' && job.paymentStatus === 'paid') {
        return res.json({ success: true, data: { job } });
      }
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({ success: true, data: { job } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to load job' });
  }
}

async function acceptJob(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.status !== 'open' || job.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, message: 'Job is not available' });
    }
    if (job.worker) {
      return res.status(400).json({ success: false, message: 'Job already assigned' });
    }

    const worker = await User.findById(req.user._id);
    if (!worker.isAvailable) {
      return res
        .status(400)
        .json({ success: false, message: 'Go online to accept jobs' });
    }

    job.worker = req.user._id;
    job.status = 'assigned';
    job.timeline.workerFoundAt = new Date();
    await job.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`job-${job._id}`).emit('status-change', {
        jobId: job._id.toString(),
        status: job.status,
        timeline: job.timeline,
      });
    }

    const populated = await Job.findById(job._id)
      .populate('customer', 'name phone profilePic rating')
      .populate('worker', 'name phone profilePic rating');

    return res.json({ success: true, data: { job: populated } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to accept job' });
  }
}

async function updateJobStatus(req, res) {
  try {
    const { status } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (!job.worker || job.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only assigned worker can update status' });
    }

    if (status === 'picked-up') {
      if (job.status !== 'assigned') {
        return res.status(400).json({ success: false, message: 'Invalid state for pickup' });
      }
      job.status = 'in-progress';
      job.timeline.pickedUpAt = new Date();
    } else if (status === 'delivered') {
      if (job.status !== 'in-progress') {
        return res.status(400).json({ success: false, message: 'Invalid state for delivery' });
      }
      job.status = 'completed';
      job.timeline.deliveredAt = new Date();

      await Payment.updateMany(
        { job: job._id },
        { $set: { worker: job.worker, workerEarning: job.price * 0.85, platformFee: job.price * 0.15 } }
      );
    } else {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    await job.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`job-${job._id}`).emit('status-change', {
        jobId: job._id.toString(),
        status: job.status,
        timeline: job.timeline,
      });
    }

    const populated = await Job.findById(job._id)
      .populate('customer', 'name phone profilePic rating')
      .populate('worker', 'name phone profilePic rating');

    return res.json({ success: true, data: { job: populated } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to update status' });
  }
}

async function cancelJob(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Only open jobs can be cancelled this way',
      });
    }

    job.status = 'cancelled';
    await job.save();

    return res.json({ success: true, data: { job } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to cancel job' });
  }
}

module.exports = {
  estimateJob,
  listJobs,
  createJob,
  getJob,
  acceptJob,
  updateJobStatus,
  cancelJob,
};
