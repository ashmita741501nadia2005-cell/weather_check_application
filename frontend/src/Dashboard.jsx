import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import {
  getWeather, getHistory, clearHistory,
  getFavorites, addFavorite, removeFavorite,
} from "./api";

export default function Dashboard({ user, onLogout }) {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState(localStorage.getItem("unit") || "C");

  // ---- unit helpers (backend always sends Celsius & m/s) ----
  const t = (c) => Math.round(unit === "C" ? c : (c * 9) / 5 + 32);
  const windText = (ms) =>
    unit === "C" ? `${ms.toFixed(1)} m/s` : `${(ms * 2.237).toFixed(1)} mph`;
  const timeText = (unixLocal) => {
    const d = new Date(unixLocal * 1000);
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  };

  const toggleUnit = () => {
    const next = unit === "C" ? "F" : "C";
    setUnit(next);
    localStorage.setItem("unit", next);
  };

  // ---- data loading ----
  const loadSideData = async () => {
    try {
      const [f, h] = await Promise.all([getFavorites(), getHistory()]);
      setFavorites(f.data);
      setHistory(h.data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadSideData();
  }, []);

  const fetchWeather = async (params) => {
    setLoading(true);
    setError("");
    try {
      const res = await getWeather(params);
      setWeather(res.data);
      loadSideData();
    } catch (err) {
      setWeather(null);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const search = (name) => {
    if (!name.trim()) return;
    fetchWeather({ city: name.trim() });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    search(city);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setError("Location permission denied")
    );
  };

  const isFavorite = weather && favorites.some((f) => f.city === weather.city);

  const saveFavorite = async () => {
    try {
      await addFavorite({ city: weather.city, country: weather.country });
      loadSideData();
    } catch (err) {
      alert(err.response?.data?.message || "Could not save");
    }
  };

  const deleteFavorite = async (id) => {
    await removeFavorite(id);
    loadSideData();
  };

  const wipeHistory = async () => {
    await clearHistory();
    loadSideData();
  };

  // ---- chart data (converted to the selected unit) ----
  const hourlyData = weather?.hourly.map((h) => ({ time: h.time, temp: t(h.temp), rain: h.pop }));
  const dailyData = weather?.daily.map((d) => ({ day: d.day, Max: t(d.max), Min: t(d.min) }));

  return (
    <div className="app">
      <header className="topbar">
        <h2>🌤️ Weather Dashboard</h2>
        <div className="topbar-right">
          <button className="ghost" onClick={toggleUnit}>°{unit}</button>
          <span className="muted">Hi, {user.name}</span>
          <button className="ghost" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="search">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Search a city (e.g. Kolkata)"
        />
        <button type="submit">Search</button>
        <button type="button" className="ghost" onClick={useMyLocation}>📍 My location</button>
      </form>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">{error}</p>}

      {weather && (
        <>
          <div className="card current">
            <div>
              <h2>{weather.city}, {weather.country}</h2>
              <p className="desc">{weather.condition}</p>
              <div className="big-temp">
                <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="" />
                <span>{t(weather.temp)}°{unit}</span>
              </div>
              <button onClick={saveFavorite} disabled={isFavorite}>
                {isFavorite ? "⭐ Saved" : "☆ Save to favorites"}
              </button>
            </div>

            <div className="stats">
              <div><span>Feels like</span><b>{t(weather.feelsLike)}°{unit}</b></div>
              <div><span>Humidity</span><b>{weather.humidity}%</b></div>
              <div><span>Wind</span><b>{windText(weather.wind)}</b></div>
              <div><span>Pressure</span><b>{weather.pressure} hPa</b></div>
              <div><span>Visibility</span><b>{(weather.visibility / 1000).toFixed(1)} km</b></div>
              <div><span>Sunrise / Sunset</span><b>{timeText(weather.sunrise)} / {timeText(weather.sunset)}</b></div>
            </div>
          </div>

          <div className="card">
            <h3>Next 24 hours</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="°" />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                <Line type="monotone" dataKey="temp" name={`Temp (°${unit})`} stroke="#38bdf8" strokeWidth={3} dot />
                <Line type="monotone" dataKey="rain" name="Rain chance (%)" stroke="#a78bfa" strokeDasharray="5 5" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3>5-day forecast</h3>
            <div className="forecast">
              {weather.daily.map((d) => (
                <div key={d.date} className="day">
                  <b>{d.day}</b>
                  <img src={`https://openweathermap.org/img/wn/${d.icon}.png`} alt={d.condition} />
                  <span>{t(d.max)}° / {t(d.min)}°</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="°" />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                <Legend />
                <Bar dataKey="Max" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Min" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="lists">
        <div className="card">
          <h3>⭐ Favorites</h3>
          {favorites.length === 0 && <p className="muted">None yet</p>}
          {favorites.map((f) => (
            <div key={f._id} className="item">
              <span onClick={() => search(f.city)}>{f.city}{f.country ? `, ${f.country}` : ""}</span>
              <button className="ghost small" onClick={() => deleteFavorite(f._id)}>✕</button>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>
            🕘 Recent searches{" "}
            {history.length > 0 && (
              <button className="ghost small" onClick={wipeHistory}>Clear</button>
            )}
          </h3>
          {history.length === 0 && <p className="muted">No searches yet</p>}
          {history.map((h) => (
            <div key={h._id} className="item">
              <span onClick={() => search(h.city)}>
                {h.city} · {t(h.temp)}°{unit} · {h.condition}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
