const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    city: { type: String, required: true, trim: true },
    country: String,
  },
  { timestamps: true }
);

// A user can't save the same city twice
favoriteSchema.index({ user: 1, city: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
