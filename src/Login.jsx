import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Giriş başarısız");
      }

      onLogin(data.token, data.teacher);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc", // beyaz arka planla uyum
        color: "#1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Roboto, 'Segoe UI', sans-serif",
        padding: "2rem",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: "360px",
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: "600",
            textAlign: "center",
            color: "#0f172a",
            marginBottom: "1rem",
          }}
        >
          Öğretmen Girişi 
        </h2>

        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              color: "#475569",
              marginBottom: "0.4rem",
              fontWeight: 500,
            }}
          >
            Kullanıcı Adı
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              backgroundColor: "#f1f5f9",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "0.6rem 0.75rem",
              fontSize: "0.9rem",
              outline: "none",
            }}
            placeholder="ogretmen1"
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              color: "#475569",
              marginBottom: "0.4rem",
              fontWeight: 500,
            }}
          >
            Şifre
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={{
              width: "100%",
              backgroundColor: "#f1f5f9",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "0.6rem 0.75rem",
              fontSize: "0.9rem",
              outline: "none",
            }}
            placeholder="••••••••"
          />
        </div>

        {err && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              fontSize: "0.8rem",
              lineHeight: 1.4,
              marginBottom: "1rem",
              wordBreak: "break-word",
            }}
          >
            ❌ {err}
          </div>
        )}

        <button
          disabled={loading}
          style={{
            width: "100%",
            backgroundColor: loading ? "#93c5fd" : "#2563eb", // aynı mavi
            color: "white",
            fontWeight: 600,
            fontSize: "0.95rem",
            border: "none",
            borderRadius: "10px",
            padding: "0.8rem 1rem",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 5px 20px rgba(37,99,235,0.4)",
            transition: "all 0.15s",
            marginBottom: "0.5rem",
          }}
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>

        <div
          style={{
            fontSize: "0.7rem",
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          Bu panel sadece öğretmenler içindir.
        </div>
      </form>
    </div>
  );
}
