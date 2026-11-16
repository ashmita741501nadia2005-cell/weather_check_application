import { useState } from "react";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return localStorage.getItem("token")
        ? JSON.parse(localStorage.getItem("user"))
        : null;
    } catch {
      return null;
    }
  });

  const handleAuth = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return user ? (
    <Dashboard user={user} onLogout={logout} />
  ) : (
    <Login onAuth={handleAuth} />
  );
}
