import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

function AdminUsersTable({ roleFilter = "student" }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // Edit state
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: "", usn: "", email: "", role: "" });

  // Delete state
  const [deleteUser, setDeleteUser] = useState(null);

  // Toast state
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    try {
      const base = collection(db, "users");
      const conditions = [];
      if (roleFilter && roleFilter !== "all") {
        conditions.push(where("role", "==", roleFilter));
      }

      const q = conditions.length ? query(base, ...conditions) : query(base);

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
          setUsers(list);
          setLoading(false);
        },
        (err) => {
          console.error("Error loading users:", err);
          setError("Failed to load users: " + err.message);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.error("Error preparing users query:", err);
      setError("Failed to prepare users query: " + err.message);
      setLoading(false);
    }
  }, [roleFilter]);

  if (loading)
    return (
      <p>Loading {roleFilter === "teacher" ? "teachers" : "students"}...</p>
    );
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const label =
    roleFilter === "teacher"
      ? "Teachers"
      : roleFilter === "student"
      ? "Students"
      : "Users";

  // --- Edit User ---
  const openEdit = (u) => {
    setEditingUser(u);
    setForm({
      name: u.name || "",
      usn: u.usn || "",
      email: u.email || "",
      role: u.role || "student",
    });
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, "users", editingUser.id), form);
      setToast({ type: "success", msg: "✅ User updated successfully!" });
      setEditingUser(null);
    } catch (err) {
      console.error("Update failed:", err);
      setToast({ type: "error", msg: "❌ Failed to update: " + err.message });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  // --- Delete User ---
  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "users", deleteUser.id));
      setToast({ type: "success", msg: "🗑️ User deleted successfully!" });
    } catch (err) {
      console.error("Delete failed:", err);
      setToast({ type: "error", msg: "❌ Failed to delete: " + err.message });
    } finally {
      setDeleteUser(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: "center", marginBottom: 6 }}>👥 {label}</h2>
      <p style={{ textAlign: "center", color: "#6b7280", marginTop: 0 }}>
        Total: {users.length}
      </p>

      {users.length === 0 ? (
        <p>No {label.toLowerCase()} found.</p>
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
                <th style={th}>USN</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Created</th>
                {currentUserRole === "admin" && <th style={th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={td}>{u.name || "—"}</td>
                  <td style={td}>{u.usn || "—"}</td>
                  <td style={td}>{u.email || "—"}</td>
                  <td style={td}>{u.role || "—"}</td>
                  <td style={td}>
                    {u.createdAt && typeof u.createdAt.toDate === "function"
                      ? u.createdAt.toDate().toLocaleString()
                      : "—"}
                  </td>
                  {currentUserRole === "admin" && (
                    <td style={td}>
                      <button onClick={() => openEdit(u)} style={smallBtn("blue")}>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteUser(u)}
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
      {editingUser && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Edit User</h3>
            <input
              style={input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
            />
            <input
              style={input}
              value={form.usn}
              onChange={(e) => setForm({ ...form, usn: e.target.value })}
              placeholder="USN"
            />
            <input
              style={input}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
            />
            <select
              style={input}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            <div style={{ marginTop: 15, textAlign: "right" }}>
              <button style={smallBtn("gray")} onClick={() => setEditingUser(null)}>
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
      {deleteUser && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>⚠️ Confirm Delete</h3>
            <p>
              Are you sure you want to delete{" "}
              <b>{deleteUser.name || deleteUser.email}</b>?
            </p>
            <div style={{ marginTop: 15, textAlign: "right" }}>
              <button style={smallBtn("gray")} onClick={() => setDeleteUser(null)}>
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
  alignItems: "center",
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

export default AdminUsersTable;
