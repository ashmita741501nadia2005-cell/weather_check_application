# Weather Dashboard (MERN)

React + Express + Node + MongoDB weather app with login (JWT), favorites,
search history, hourly chart, 5-day forecast and °C/°F toggle.

## 1. Requirements
- Node.js 18+
- MongoDB: local install OR free MongoDB Atlas cluster
- OpenWeatherMap API key (free): https://openweathermap.org/api
  (new keys may take 1-2 hours to activate)

## 2. Setup
1. Open `backend/.env` and fill in:
   - `MONGO_URI`  -> local `mongodb://127.0.0.1:27017/weatherdb` or your Atlas string
   - `JWT_SECRET` -> any long random string
   - `WEATHER_API_KEY` -> your OpenWeatherMap key
2. From this folder run:
   ```
   npm run install:all
   npm run dev
   ```
3. Open http://localhost:5173 , create an account and search a city.

Backend runs on http://localhost:5000, frontend on http://localhost:5173
(Vite proxies `/api` to the backend, so no CORS setup is needed locally).

## 3. Run separately (optional)
```
cd backend  && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## 4. API
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | no | Create account |
| POST | /api/auth/login | no | Log in, returns JWT |
| GET | /api/auth/me | yes | Current user |
| GET | /api/weather?city=X or ?lat=&lon= | yes | Current + hourly + 5-day |
| GET | /api/weather/history | yes | Last 10 searches |
| DELETE | /api/weather/history | yes | Clear history |
| GET/POST | /api/favorites | yes | List / add favorite |
| DELETE | /api/favorites/:id | yes | Remove favorite |

## 5. Deployment
- Database: MongoDB Atlas
- Backend: Render (set env vars; set `CLIENT_URL` to your frontend URL)
- Frontend: Vercel/Netlify (set `VITE_API_URL=https://YOUR-BACKEND/api`)

## 6. Troubleshooting
- "Weather API key invalid": key not activated yet, wait and retry.
- MongoDB connection error: check `MONGO_URI`, Atlas Network Access IP list, and URL-encode special characters in the password.
- Changed `.env` in frontend? Restart `npm run dev`.
