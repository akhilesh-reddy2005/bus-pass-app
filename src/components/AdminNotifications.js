// src/components/AdminNotifications.js
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Bell, Trash2, Send, Type, MessageSquare } from "lucide-react";

/* ==== Shared styles ==== */
const card = {
  background: "#fff",
  padding: "30px",
  borderRadius: "14px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  maxWidth: "700px",
  margin: "0 auto",
};
const heading = {
  marginBottom: "20px",
  fontWeight: "600",
  fontSize: "20px",
  color: "#2563eb",
  textAlign: "center",
};
const inputGroup = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};
const icon = {
  position: "absolute",
  left: "12px",
  color: "#6b7280",
};
const inputStyle = {
  width: "100%",
  padding: "12px 12px 12px 38px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  outline: "none",
  fontSize: "15px",
};
const textareaStyle = {
  ...inputStyle,
  resize: "none",
  minHeight: "110px",
};
const buttonStyle = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "600",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "background 0.2s ease",
};

/* ==== NotificationForm (inline) ==== */
function NotificationForm({ onSubmit }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    onSubmit({ title: title.trim(), message: message.trim() });
    setTitle("");
    setMessage("");
  };

  return (
    <div style={card}>
      <h3 style={heading}>📢 Send New Notification</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ marginBottom: 6 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Notification Title</label>
          <div style={inputGroup}>
            <Type size={18} style={icon} />
            <input
              type="text"
              placeholder="Enter notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: 6 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Notification Message</label>
          <div style={inputGroup}>
            <MessageSquare size={18} style={icon} />
            <textarea
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={textareaStyle}
              required
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 6 }}>
          <button type="submit" style={buttonStyle}>
            <Send size={16} /> Send Notification
          </button>
        </div>
      </form>
    </div>
  );
}

/* ==== AdminNotifications (main) ==== */
function AdminNotifications() {
  const [status, setStatus] = useState("");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleSend = async ({ title, message }) => {
    try {
      await addDoc(collection(db, "notifications"), {
        title,
        message,
        userId: "all",
        createdAt: serverTimestamp(),
        read: false,
      });
      setStatus("✅ Notification sent successfully!");
      setTimeout(() => setStatus(""), 4000);
    } catch (err) {
      console.error("Error sending notification:", err);
      setStatus("❌ Failed to send notification. Try again.");
      setTimeout(() => setStatus(""), 4000);
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  return (
    <div style={{ padding: 30, maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>
        <Bell size={28} style={{ verticalAlign: "middle", marginRight: 8 }} /> Admin Notifications
      </h2>

      {/* Form */}
      <div style={{ marginBottom: 28 }}>
        <NotificationForm onSubmit={handleSend} />
        {status && (
          <p style={{ textAlign: "center", marginTop: 12, color: status.startsWith("✅") ? "green" : "red", fontWeight: 600 }}>
            {status}
          </p>
        )}
      </div>

      {/* History */}
      <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h4 style={{ color: "#2563eb", margin: 0 }}>📜 Notification History</h4>
          <span style={{ background: "#2563eb", color: "#fff", padding: "6px 12px", borderRadius: 999, fontWeight: 600 }}>
            Total: {notifications.length}
          </span>
        </div>

        {notifications.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280" }}>No notifications sent yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 840 }}>
              <thead style={{ background: "#f3f4f6" }}>
                <tr>
                  <th style={th}>Title</th>
                  <th style={th}>Message</th>
                  <th style={th}>Date</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td style={td}>{n.title}</td>
                    <td style={td}>{n.message}</td>
                    <td style={td}>
                      {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : "Pending..."}
                    </td>
                    <td style={td}>
                      <button
                        onClick={() => deleteNotification(n.id)}
                        style={{
                          background: "#dc2626",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 12px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const th = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left",
  fontWeight: 700,
  color: "#374151",
};
const td = {
  padding: "12px",
  borderBottom: "1px solid #f1f5f9",
  color: "#4b5563",
  verticalAlign: "middle",
};

export default AdminNotifications;
