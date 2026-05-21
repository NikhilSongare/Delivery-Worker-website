const mongoose = require('mongoose');

const geoPoint = {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
  },
  coordinates: {
    type: [Number],
    required: true,
  },
};

const jobSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    packageSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      required: true,
    },
    pickupLocation: {
      address: { type: String, required: true },
      coordinates: geoPoint,
    },
    deliveryLocation: {
      address: { type: String, required: true },
      coordinates: geoPoint,
    },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in-progress', 'completed', 'cancelled'],
      default: 'open',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    stripePaymentId: { type: String, default: '' },
    stripePaymentIntentId: { type: String, default: '' },
    distance: { type: Number, default: 0 },
    estimatedTime: { type: Number, default: 0 },
    timeline: {
      postedAt: { type: Date },
      workerFoundAt: { type: Date },
      pickedUpAt: { type: Date },
      deliveredAt: { type: Date },
    },
  },
  { timestamps: true }
);

jobSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
jobSchema.index({ customer: 1, createdAt: -1 });
jobSchema.index({ worker: 1, status: 1 });
jobSchema.index({ status: 1, paymentStatus: 1 });

module.exports = mongoose.model('Job', jobSchema);
