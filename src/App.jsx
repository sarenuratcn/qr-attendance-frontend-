// src/App.jsx
import { useEffect, useState } from "react";
import Login from "./Login";
import AttendanceList from "./components/AttendanceList.jsx";

// API tabanı (yerelde calışıyorsan localhost kalsın)
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

// Tarih/sayaç formatlayıcı
function formatExpiresAt(isoString) {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function App() {
  // Auth
  const [token, setToken] = useState(null);
  const [teacher, setTeacher] = useState(null);

  // Oturum/QR
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeftText, setTimeLeftText] = useState("");

  // Formlar
  const [durationInput, setDurationInput] = useState(10);
  // ⬇️ Ders adını buraya yazacağız (Excel’de kullanılıyor)
  const [courseName, setCourseName] = useState("Ders");

  // Login’den geldiğinde token/öğretmen bilgisini al
  function handleLogin(tok, teacherInfo) {
    setToken(tok);
    setTeacher(teacherInfo);
  }

  function handleLogout() {
    setToken(null);
    setTeacher(null);
    setQrDataUrl(null);
    setSessionId(null);
    setExpiresAt(null);
    setError(null);
    setTimeLeftText("");
  }

  // Oturum oluştur (QR üret)
  async function createSession() {
    try {
      setLoading(true);
      setError(null);

      setQrDataUrl(null);
      setSessionId(null);
      setExpiresAt(null);
      setTimeLeftText("");

      const minutes = Number(durationInput);
      if (isNaN(minutes) || minutes <= 0) {
        throw new Error("Dakika pozitif sayı olmalı");
      }

      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ durationMinutes: minutes }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Oturum oluşturulamadı");
      }

      setQrDataUrl(data.qrDataUrl || null);
      setSessionId(data.sessionId || null);
      setExpiresAt(data.expiresAt || null);
    } catch (err) {
      setError(err.message || "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  // Geri sayım
  useEffect(() => {
    if (!expiresAt) {
      setTimeLeftText("");
      return;
    }
    function updateCountdown() {
      const end = new Date(expiresAt).getTime();
      const now = Date.now();
      const diffMs = end - now;

      if (diffMs <= 0) {
        setTimeLeftText("SÜRE BİTTİ");
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      const secsText = secs < 10 ? "0" + secs : secs.toString();
      setTimeLeftText(`${mins}:${secsText} kaldı`);
    }

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [expiresAt]);

  // Login ekranı
  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  // Öğretmen adı (Excel’de otomatik kullanıyoruz)
  const teacherDisplayName =
    teacher?.name || teacher?.username || "Ogretmen";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        color: "#1e293b",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Roboto, 'Segoe UI', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Dış konteyner: Sol QR kartı + Sağ yoklama listesi */}
      <div
        style={{
          width: "100%",
          maxWidth: "1060px",
          display: "grid",
          gridTemplateColumns: qrDataUrl ? "520px 1fr" : "520px",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* SOL: Öğretmen paneli + QR kartı */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 40px 120px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.04)",
            padding: "24px",
          }}
        >
          {/* Üst bar */}
          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div
                style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}
              >
                {teacherDisplayName}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Öğretmen Paneli
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                backgroundColor: "transparent",
                color: "#ef4444",
                border: "1px solid #ef4444",
                borderRadius: "8px",
                padding: "6px 10px",
                fontSize: "0.75rem",
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              Çıkış
            </button>
          </div>

          {/* Süre inputu */}
          <div style={{ marginBottom: "12px", textAlign: "left" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "#0f172a",
              }}
            >
              Oturum süresi (dakika):
            </label>

            <input
              type="number"
              min="1"
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "#f1f5f9",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "0.7rem 0.8rem",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          {/* Ders adı inputu (Excel için) */}
          <div style={{ marginBottom: "16px", textAlign: "left" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "#0f172a",
              }}
            >
              Ders adı:
            </label>

            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Örn: Ağ Yönetimi"
              style={{
                width: "100%",
                backgroundColor: "#f1f5f9",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "0.7rem 0.8rem",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          {/* Hata */}
          {error && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                border: "1px solid #fca5a5",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                fontSize: "0.8rem",
                lineHeight: 1.4,
                marginBottom: "12px",
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* Oturumu başlat */}
          <button
            onClick={createSession}
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: loading ? "#93c5fd" : "#2563eb",
              color: "white",
              fontWeight: 600,
              fontSize: "0.95rem",
              border: "none",
              borderRadius: "12px",
              padding: "0.9rem 1rem",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 10px 30px rgba(37,99,235,0.45)",
              transition: "all 0.15s",
              marginBottom: "16px",
            }}
          >
            {loading ? "Oluşturuluyor..." : "Oturumu Başlat"}
          </button>

          {/* QR kartı */}
          {qrDataUrl ? (
            timeLeftText !== "SÜRE BİTTİ" ? (
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "16px",
                  padding: "16px 12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  style={{
                    width: "220px",
                    height: "220px",
                    objectFit: "contain",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    padding: "0.6rem",
                    marginBottom: "12px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  }}
                />

                <div
                  style={{
                    width: "100%",
                    fontSize: "0.8rem",
                    color: "#475569",
                    marginBottom: "12px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#0f172a" }}>
                      Session ID
                    </div>
                    <div
                      style={{
                        color: "#1e293b",
                        fontWeight: 600,
                        wordBreak: "break-all",
                        fontSize: "0.8rem",
                      }}
                    >
                      {sessionId || "-"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#0f172a" }}>
                      Bitiş saati
                    </div>
                    <div style={{ color: "#1e293b", fontWeight: 600, fontSize: "0.8rem" }}>
                      {formatExpiresAt(expiresAt)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: timeLeftText === "SÜRE BİTTİ" ? "#dc2626" : "#16a34a",
                    backgroundColor:
                      timeLeftText === "SÜRE BİTTİ" ? "#fee2e2" : "rgba(22,163,74,0.1)",
                    padding: "0.6rem 1.2rem",
                    borderRadius: "10px",
                    display: "inline-block",
                    marginTop: "4px",
                  }}
                >
                  {timeLeftText || "--:--"}
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "#fff1f2",
                  borderRadius: "16px",
                  padding: "16px 12px",
                  border: "1px solid #fecaca",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.05)",
                  textAlign: "center",
                  color: "#b91c1c",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                Oturum kapandı. Yeni QR oluşturmak için "Oturumu Başlat" butonuna basın.
              </div>
            )
          ) : null}
        </div>

        {/* SAĞ: Yoklama Listesi (QR oluşunca görünür) */}
        {qrDataUrl ? (
          <AttendanceList
            sessionId={sessionId}
            teacherName={teacherDisplayName} // ⬅️ otomatik öğretmen
            courseName={courseName}         // ⬅️ sol inputtan gelen ders adı
          />
        ) : null}
      </div>
    </div>
  );
}
