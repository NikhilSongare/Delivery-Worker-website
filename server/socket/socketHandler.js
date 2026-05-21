const jwt = require('jsonwebtoken');
const Job = require('../models/Job');

function attachSocketIO(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Unauthorized'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-job-room', async ({ jobId }) => {
      try {
        if (!jobId) return;
        const job = await Job.findById(jobId);
        if (!job) {
          socket.emit('room-error', { message: 'Job not found' });
          return;
        }
        const uid = String(socket.userId);
        const isCustomer = String(job.customer) === uid;
        const isWorker = job.worker && String(job.worker) === uid;
        if (!isCustomer && !isWorker) {
          socket.emit('room-error', { message: 'Forbidden' });
          return;
        }
        socket.join(`job-${jobId}`);
      } catch {
        socket.emit('room-error', { message: 'Could not join room' });
      }
    });

    socket.on('location-update', async ({ jobId, lat, lng }) => {
      try {
        if (!jobId || lat == null || lng == null) return;
        const job = await Job.findById(jobId);
        if (!job || !job.worker || String(job.worker) !== String(socket.userId)) {
          return;
        }
        io.to(`job-${jobId}`).emit('location-update', {
          jobId,
          lat: Number(lat),
          lng: Number(lng),
          at: new Date().toISOString(),
        });
      } catch {
        /* ignore */
      }
    });
  });
}

module.exports = { attachSocketIO };
