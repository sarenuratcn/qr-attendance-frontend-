// src/components/AttendanceList.jsx
import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function AttendanceList({ sessionId, teacherName, courseName }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualNumber, setManualNumber] = useState("");

  // Listeyi çek
  const fetchList = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/attend/list?session=${sessionId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setItems(Array.isArray(data.items) ? data.items : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    const t = setInterval(fetchList, 4000);
    return () => clearInterval(t);
  }, [sessionId]);

  // Kaynak etiketi
  const withLabels = useMemo(() => {
    return items.map((it) => ({
      ...it,
      source: it.deviceId === "manual-entry" ? "Manuel" : "QR",
      timeTR: it.attendedAt ? new Date(it.attendedAt).toLocaleString("tr-TR") : "-",
    }));
  }, [items]);

  // Excel indirme
  const downloadExcel = () => {
    const nowTR = new Date().toLocaleString("tr-TR");
    const wsData = [
      ["Ders Adı:", courseName || ""],
      ["Öğretmen:", teacherName || ""],
      ["Tarih:", nowTR],
      [],
      ["#", "Ad Soyad", "Öğrenci No", "Giriş Saati", "SessionID", "Kaynak"],
    ];

    withLabels.forEach((row, idx) => {
      wsData.push([
        idx + 1,
        row.studentName || "-",
        row.studentNumber || "-",
        row.timeTR || "-",
        row.sessionId || "-",
        row.source || "-",
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Yoklama");

    const safeCourse = (courseName || "Ders").replace(/[^\p{L}\p{N}_-]+/gu, "_");
    const fileName = `Yoklama_${safeCourse}_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  // Manuel ekleme fonksiyonu
  const addManual = async () => {
    if (!manualName.trim() || !manualNumber.trim()) return alert("Bilgileri doldur!");
    try {
      const res = await fetch(`${API_BASE}/api/attend/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          studentName: manualName,
          studentNumber: manualNumber,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setManualName("");
        setManualNumber("");
        fetchList();
      } else {
        alert(data.message || "Eklenemedi");
      }
    } catch (err) {
      console.error(err);
      alert("Sunucu hatası");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 20px 50px rgba(0,0,0,0.05)",
      }}
    >
      {/* Başlık + Excel butonu */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>
          Yoklama Listesi
        </h3>

        <button
  onClick={downloadExcel}
  disabled={false}

          style={{
            backgroundColor: withLabels.length ? "#16a34a" : "#9ca3af",
            color: "#fff",
            border: 0,
            borderRadius: 10,
            padding: "8px 12px",
            fontWeight: 600,
            cursor: withLabels.length ? "pointer" : "not-allowed",
          }}
        >
          Excel’e Aktar
        </button>
      </div>

      {/*  Manuel Ekleme Girişi başlığı */}
      <div
        style={{
          fontWeight: 700,
          fontSize: "0.95rem",
          color: "#0f172a",
          marginBottom: 6,
        }}
      >
         Manuel Ekleme Girişi
      </div>

      {/* Manuel ekleme input alanı */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <input
          type="text"
          placeholder="Ad Soyad"
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Öğrenci No"
          value={manualNumber}
          onChange={(e) => setManualNumber(e.target.value)}
          style={inputStyle}
        />
        <button
          onClick={addManual}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            border: 0,
            borderRadius: 10,
            padding: "0 12px",
            fontWeight: 600,
          }}
        >
          Ekle
        </button>
      </div>

      {/* Tablo */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: ".9rem",
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Ad Soyad</th>
              <th style={thStyle}>Öğrenci No</th>
              <th style={thStyle}>Giriş Saati</th>
              <th style={thStyle}>SessionID</th>
              <th style={thStyle}>Kaynak</th>
            </tr>
          </thead>
          <tbody>
            {withLabels.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: 12, color: "#64748b" }}
                >
                  {loading ? "Yükleniyor..." : "Henüz kayıt yok"}
                </td>
              </tr>
            ) : (
              withLabels.map((row, i) => (
                <tr
                  key={`${row.studentNumber}-${i}`}
                  style={{ borderBottom: "1px solid #eaeef3" }}
                >
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={tdStyle}>{row.studentName}</td>
                  <td style={tdStyle}>{row.studentNumber}</td>
                  <td style={tdStyle}>{row.timeTR}</td>
                  <td style={tdStyle}>{row.sessionId}</td>
                  <td style={tdStyle}>
     
                    
                    <span
                      style={{
                        backgroundColor:
                          row.source === "Manuel" ? "#fef9c3" : "#e0f2fe",
                        color:
                          row.source === "Manuel" ? "#92400e" : "#1e3a8a",
                        padding: "2px 8px",
                        borderRadius: 8,
                        fontWeight: 600,
                      }}
                    >
                      {row.source}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- stiller ---
const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 700,
  color: "#0f172a",
  borderBottom: "1px solid #e2e8f0",
};

const tdStyle = {
  padding: "10px 12px",
  color: "#1e293b",
};

const inputStyle = {
  flex: 1,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: "0.9rem",
  outline: "none",
};
