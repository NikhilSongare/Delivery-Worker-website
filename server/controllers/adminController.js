const { validationResult } = require('express-validator');
const User = require('../models/User');
const Job = require('../models/Job');
const Payment = require('../models/Payment');

async function listUsers(req, res) {
  try {
    const { search, role } = req.query;
    const q = {};
    if (role && ['customer', 'worker', 'admin'].includes(role)) {
      q.role = role;
    }
    if (search && String(search).trim()) {
      const rx = new RegExp(String(search).trim(), 'i');
      q.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    const users = await User.find(q).sort({ createdAt: -1 }).limit(500);
    const safe = users.map((u) => {
      const o = u.toObject();
      delete o.password;
      return o;
    });

    return res.json({ success: true, data: { users: safe } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to load users' });
  }
}

async function patchUser(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (typeof req.body.isActive === 'boolean') {
      user.isActive = req.body.isActive;
    }
    await user.save();

    const safe = user.toObject();
    delete safe.password;
    return res.json({ success: true, data: { user: safe } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
}

async function listAllJobs(req, res) {
  try {
    const { status } = req.query;
    const q = {};
    if (status) {
      q.status = status;
    }

    const jobs = await Job.find(q)
      .sort({ createdAt: -1 })
      .limit(500)
      .populate('customer', 'name email phone')
      .populate('worker', 'name email phone');

    return res.json({ success: true, data: { jobs } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to load jobs' });
  }
}

async function cancelJobAdmin(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    job.status = 'cancelled';
    await job.save();
    return res.json({ success: true, data: { job } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to cancel job' });
  }
}

async function listAllPayments(req, res) {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .populate('job', 'title status')
      .populate('customer', 'name email')
      .populate('worker', 'name email');

    return res.json({ success: true, data: { payments } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to load payments' });
  }
}

async function dashboard(req, res) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalUsers, jobsToday, revenueAgg, activeWorkers, statusBreakdown, jobsSeries] =
      await Promise.all([
        User.countDocuments(),
        Job.countDocuments({ createdAt: { $gte: startOfToday } }),
        Payment.aggregate([
          { $match: { status: 'completed', createdAt: { $gte: startOfToday } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        User.countDocuments({ role: 'worker', isAvailable: true, isActive: true }),
        Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Job.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    const revenueToday = revenueAgg[0]?.total || 0;

    return res.json({
      success: true,
      data: {
        kpis: {
          totalUsers,
          jobsToday,
          revenueToday,
          activeWorkers,
        },
        jobStatusBreakdown: statusBreakdown.map((s) => ({
          status: s._id,
          count: s.count,
        })),
        jobsOverTime: jobsSeries.map((d) => ({ date: d._id, jobs: d.count })),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Dashboard failed' });
  }
}

module.exports = {
  listUsers,
  patchUser,
  listAllJobs,
  cancelJobAdmin,
  listAllPayments,
  dashboard,
};
