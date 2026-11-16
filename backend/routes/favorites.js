const express = require("express");
const Favorite = require("../models/Favorite");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);

// GET all favorites of this user
router.get("/", async (req, res) => {
  res.json(await Favorite.find({ user: req.userId }).sort({ createdAt: -1 }));
});

// POST add favorite
router.post("/", async (req, res) => {
  try {
    const { city, country } = req.body;
    if (!city) return res.status(400).json({ message: "City is required" });
    const fav = await Favorite.create({ user: req.userId, city, country });
    res.status(201).json(fav);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: "Already in favorites" });
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE remove favorite (only if it belongs to this user)
router.delete("/:id", async (req, res) => {
  await Favorite.findOneAndDelete({ _id: req.params.id, user: req.userId });
  res.json({ message: "Removed" });
});

module.exports = router;
