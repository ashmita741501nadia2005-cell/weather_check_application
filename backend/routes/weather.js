const express = require("express");
const axios = require("axios");
const History = require("../models/History");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth); // every weather route needs a logged-in user

const BASE = "https://api.openweathermap.org/data/2.5";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// GET /api/weather?city=Kolkata   OR   /api/weather?lat=22.57&lon=88.36
router.get("/", async (req, res) => {
  const { city, lat, lon } = req.query;
  if (!city && !(lat && lon))
    return res.status(400).json({ message: "Provide a city or lat & lon" });

  try {
    const key = process.env.WEATHER_API_KEY;
    const params = { appid: key, units: "metric" };
    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    } else {
      params.q = city;
    }

    const [current, forecast] = await Promise.all([
      axios.get(`${BASE}/weather`, { params }),
      axios.get(`${BASE}/forecast`, { params }),
    ]);

    const c = current.data;
    const tz = c.timezone; // city's offset from UTC in seconds

    // Hourly chart: next 8 entries (3-hour steps = 24 hours)
    const hourly = forecast.data.list.slice(0, 8).map((d) => {
      const local = new Date((d.dt + tz) * 1000);
      return {
        time: `${String(local.getUTCHours()).padStart(2, "0")}:00`,
        temp: d.main.temp,
        pop: Math.round((d.pop || 0) * 100), // chance of rain %
      };
    });

    // Group 3-hour entries by the city's local date -> daily summary
    const byDay = {};
    forecast.data.list.forEach((d) => {
      const local = new Date((d.dt + tz) * 1000);
      const dateKey = local.toISOString().slice(0, 10);
      if (!byDay[dateKey]) byDay[dateKey] = { items: [], weekday: DAYS[local.getUTCDay()] };
      byDay[dateKey].items.push({ ...d, hour: local.getUTCHours() });
    });

    const daily = Object.entries(byDay)
      .slice(0, 5)
      .map(([date, { items, weekday }]) => {
        const temps = items.map((i) => i.main.temp);
        // pick the entry closest to midday for the icon
        const mid = items.reduce((a, b) =>
          Math.abs(b.hour - 12) < Math.abs(a.hour - 12) ? b : a
        );
        return {
          date,
          day: weekday,
          min: Math.min(...temps),
          max: Math.max(...temps),
          condition: mid.weather[0].main,
          icon: mid.weather[0].icon,
        };
      });

    // Save to this user's history
    await History.create({
      user: req.userId,
      city: c.name,
      temp: c.main.temp,
      condition: c.weather[0].main,
    });

    res.json({
      city: c.name,
      country: c.sys.country,
      temp: c.main.temp,
      feelsLike: c.main.feels_like,
      humidity: c.main.humidity,
      pressure: c.main.pressure,
      wind: c.wind.speed, // m/s
      visibility: c.visibility, // metres
      condition: c.weather[0].description,
      icon: c.weather[0].icon,
      sunrise: c.sys.sunrise + tz,
      sunset: c.sys.sunset + tz,
      hourly,
      daily,
    });
  } catch (err) {
    if (err.response?.status === 404)
      return res.status(404).json({ message: "City not found" });
    if (err.response?.status === 401)
      return res.status(500).json({ message: "Weather API key invalid or not activated yet" });
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/weather/history  -> this user's last 10 searches
router.get("/history", async (req, res) => {
  const history = await History.find({ user: req.userId })
    .sort({ createdAt: -1 })
    .limit(10);
  res.json(history);
});

// DELETE /api/weather/history -> clear this user's history
router.delete("/history", async (req, res) => {
  await History.deleteMany({ user: req.userId });
  res.json({ message: "History cleared" });
});

module.exports = router;
