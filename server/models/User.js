const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['customer', 'worker', 'admin'],
      required: true,
    },
    profilePic: { type: String, default: '' },
    rating: { type: Number, default: 4.8, min: 0, max: 5 },
    isAvailable: { type: Boolean, default: false },
    vehicleType: { type: String, default: '' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    isActive: { type: Boolean, default: true },
    idProofUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
