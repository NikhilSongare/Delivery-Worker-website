require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');
const { handleWebhook } = require('./controllers/paymentController');
const { attachSocketIO } = require('./socket/socketHandler');

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mapRoutes = require('./routes/mapRoutes');

const PORT = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Delivery Worker Backend Running Successfully'
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend Connected Successfully"
  });
});


app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { ok: true } });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/maps', mapRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: clientUrl, methods: ['GET', 'POST'] },
});

attachSocketIO(io);
app.set('io', io);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed', err);
    process.exit(1);
  });
