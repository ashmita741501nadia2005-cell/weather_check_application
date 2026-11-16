import { useState } from "react";
import { loginUser, registerUser } from "./api";

export default function Login({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await loginUser({ email: form.email, password: form.password })
          : await registerUser(form);
      onAuth(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Cannot reach the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>🌤️ Weather Dashboard</h1>
        <p className="muted">
          {mode === "login" ? "Log in to see your cities" : "Create your account"}
        </p>

        {mode === "register" && (
          <input name="name" placeholder="Name" value={form.name} onChange={change} required />
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} required />
        <input name="password" type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={change} required />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </button>

        <p className="muted">
          {mode === "login" ? "No account? " : "Already registered? "}
          <span
            className="link"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </span>
        </p>
      </form>
    </div>
  );
}
