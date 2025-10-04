// src/components/AdminComplaints.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // Edit state
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", message: "", status: "" });

  // Delete state
  const [deleteComplaint, setDeleteComplaint] = useState(null);

  // Toast state
  const [toast, setToast] = useState(null);

  // Get current user role
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
        if (snap.exists()) {
          setCurrentUserRole(snap.data().role || "student");
        }
      });
      return () => unsub();
    }
  }, []);

  // Fetch complaints
  useEffect(() => {
    try {
      const q = query(collection(db, "complaints"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = [];
          snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
          list.sort((a, b) => {
            const toMs = (v) =>
              v && typeof v.toDate === "function"
                ? v.toDate().getTime()
                : v instanceof Date
                ? v.getTime()
                : 0;
            return toMs(b.createdAt) - toMs(a.createdAt);
          });
          setComplaints(list);
          setLoading(false);
        },
        (err) => {
          console.error("Error loading complaints:", err);
          setError("Failed to load complaints: " + err.message);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.error("Error preparing complaints query:", err);
      setError("Failed to prepare complaints query: " + err.message);
      setLoading(false);
    }
  }, []);

  if (loading) return <p>Loading complaints...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // --- Edit Complaint ---
  const openEdit = (c) => {
    setEditingComplaint(c);
    setForm({
      name: c.name || "",
      email: c.email || "",
      message: c.message || "",
      status: c.status || "Pending",
    });
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, "complaints", editingComplaint.id), form);
      setToast({ type: "success", msg: "✅ Complaint updated successfully!" });
      setEditingComplaint(null);
    } catch (err) {
      console.error("Update failed:", err);
      setToast({ type: "error", msg: "❌ Failed to update: " + err.message });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  // --- Delete Complaint ---
  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "complaints", deleteComplaint.id));
      setToast({ type: "success", msg: "🗑️ Complaint deleted successfully!" });
    } catch (err) {
      console.error("Delete failed:", err);
      setToast({ type: "error", msg: "❌ Failed to delete: " + err.message });
    } finally {
      setDeleteComplaint(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: "center", marginBottom: 6 }}>📢 Complaints</h2>
      <p style={{ textAlign: "center", color: "#6b7280", marginTop: 0 }}>
        Total: {complaints.length}
      </p>

      {complaints.length === 0 ? (
        <p>No complaints found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <thead style={{ background: "#f3f3f3" }}>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>Email</th>
                <th style={th}>Message</th>
                <th style={th}>Status</th>
                <th style={th}>Created</th>
                {currentUserRole === "admin" && <th style={th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td style={td}>{c.name || "—"}</td>
                  <td style={td}>{c.email || "—"}</td>
                  <td style={td}>{c.message || "—"}</td>
                  <td style={td}>{c.status || "Pending"}</td>
                  <td style={td}>
                    {c.createdAt && typeof c.createdAt.toDate === "function"
                      ? c.createdAt.toDate().toLocaleString()
                      : "—"}
                  </td>
                  {currentUserRole === "admin" && (
                    <td style={td}>
                      <button onClick={() => openEdit(c)} style={smallBtn("blue")}>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteComplaint(c)}
                        style={smallBtn("red")}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Edit Modal --- */}
      {editingComplaint && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Edit Complaint</h3>
            <input
              style={input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
            />
            <input
              style={input}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
            />
            <textarea
              style={{ ...input, height: 80 }}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Message"
            />
            <select
              style={input}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <div style={{ marginTop: 15, textAlign: "right" }}>
              <button style={smallBtn("gray")} onClick={() => setEditingComplaint(null)}>
                Cancel
              </button>
              <button style={smallBtn("blue")} onClick={saveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Delete Modal --- */}
      {deleteComplaint && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>⚠️ Confirm Delete</h3>
            <p>
              Are you sure you want to delete complaint from{" "}
              <b>{deleteComplaint.name || deleteComplaint.email}</b>?
            </p>
            <div style={{ marginTop: 15, textAlign: "right" }}>
              <button style={smallBtn("gray")} onClick={() => setDeleteComplaint(null)}>
                Cancel
              </button>
              <button style={smallBtn("red")} onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Toast Notification --- */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            padding: "12px 20px",
            borderRadius: 8,
            background: toast.type === "success" ? "#16a34a" : "#dc2626",
            color: "#fff",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            zIndex: 1100,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const th = { padding: "10px", border: "1px solid #ddd", textAlign: "left" };
const td = { padding: "10px", border: "1px solid #ddd" };
const smallBtn = (color) => ({
  padding: "6px 10px",
  marginRight: 6,
  border: "none",
  borderRadius: 6,
  color: "#fff",
  background:
    color === "red"
      ? "#dc2626"
      : color === "blue"
      ? "#2563eb"
      : color === "gray"
      ? "#6b7280"
      : "#2563eb",
  cursor: "pointer",
});

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center", // makes it perfectly centered vertically & horizontally
  zIndex: 1000,
};

const modalContent = {
  background: "#fff",
  padding: 20,
  borderRadius: 10,
  width: "90%",
  maxWidth: 400,
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
};

const input = {
  width: "100%",
  padding: "8px",
  margin: "6px 0",
  border: "1px solid #ddd",
  borderRadius: 6,
};

export default AdminComplaints;
