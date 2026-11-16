import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expired, log the user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// Auth
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);

// Weather
export const getWeather = (params) => api.get("/weather", { params });
export const getHistory = () => api.get("/weather/history");
export const clearHistory = () => api.delete("/weather/history");

// Favorites
export const getFavorites = () => api.get("/favorites");
export const addFavorite = (data) => api.post("/favorites", data);
export const removeFavorite = (id) => api.delete(`/favorites/${id}`);
