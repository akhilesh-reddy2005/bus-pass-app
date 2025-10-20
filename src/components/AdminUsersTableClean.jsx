import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import EditDialog from './EditDialog';

const th = { padding: '10px', border: '1px solid #ddd', textAlign: 'left' };
const td = { padding: '10px', border: '1px solid #ddd' };

export default function AdminUsersTable({ roleFilter = 'student' }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  // ✅ Add or update teacher data in "teachrs" collection
  const addTeacherToCollection = async (teacher) => {
    try {
      if (!teacher?.id) return;
      await setDoc(doc(db, 'teachrs', teacher.id), {
        name: teacher.name || '',
        email: teacher.email || '',
        usn: teacher.usn || '',
        role: 'teacher',
        createdAt: teacher.createdAt || serverTimestamp(),
      });
      console.log(`✅ Teacher synced in 'teachrs': ${teacher.name || teacher.email}`);
    } catch (err) {
      console.error('❌ Failed to sync teacher to teachrs:', err);
    }
  };

  // 🧹 Remove teacher data from "teachrs" when they are no longer a teacher
  const removeTeacherFromCollection = async (teacherId) => {
    try {
      const ref = doc(db, 'teachrs', teacherId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
        console.log(`🧹 Removed teacher from 'teachrs' collection: ${teacherId}`);
      }
    } catch (err) {
      console.error("❌ Failed to remove teacher data from teachrs:", err);
    }
  };

  useEffect(() => {
    const base = collection(db, 'users');
    const conditions = [];
    if (roleFilter && roleFilter !== 'all')
      conditions.push(where('role', '==', roleFilter));
    const q = conditions.length ? query(base, ...conditions) : query(base);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const toMs = (v) =>
            v && typeof v.toDate === 'function'
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
        console.error('Error loading users:', err);
        setError('Failed to load users: ' + err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [roleFilter]);

  if (loading)
    return (
      <p>Loading {roleFilter === 'teacher' ? 'teachers' : 'students'}...</p>
    );
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const label =
    roleFilter === 'teacher'
      ? 'Teachers'
      : roleFilter === 'student'
      ? 'Students'
      : 'Users';

  const onNotify = async (u) => {
    try {
      const title = prompt('Notification title', 'Account Update');
      if (title === null) return;
      const message = prompt('Message', 'Hello! This is a notification.');
      if (message === null) return;
      await addDoc(collection(db, 'notifications'), {
        userId: u.id || u.uid || u.userId || '',
        title,
        message,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      alert('✅ Notification sent');
    } catch (err) {
      console.error('Notify failed:', err);
      alert('Failed to send notification: ' + err.message);
    }
  };

  const onDelete = async (u) => {
    try {
      if (
        !window.confirm(
          `Delete user ${u.name || u.email || u.id}? This removes the Firestore user document.`
        )
      )
        return;
      await deleteDoc(doc(db, 'users', u.id));

      // 🧹 If teacher, also remove from teachers collection
      if (u.role === 'teacher') {
        await removeTeacherFromCollection(u.id);
      }

      alert('🗑️ User deleted (Firestore doc). Note: Auth account, if any, is not removed.');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete: ' + err.message);
    }
  };

  const onNotifyAll = async () => {
    try {
      if (users.length === 0) return alert('No users to notify');
      const title = prompt('Notification title for all', 'Announcement');
      if (title === null) return;
      const message = prompt('Message for all', 'Hello everyone!');
      if (message === null) return;
      const confirmAll = window.confirm(
        `Send to ${users.length} ${label.toLowerCase()}?`
      );
      if (!confirmAll) return;
      const batch = users.map((u) =>
        addDoc(collection(db, 'notifications'), {
          userId: u.id || u.uid || u.userId || '',
          title,
          message,
          status: 'new',
          createdAt: serverTimestamp(),
        })
      );
      await Promise.all(batch);
      alert('✅ Sent notifications to all');
    } catch (err) {
      console.error('Notify all failed:', err);
      alert('Failed to send notifications: ' + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 6 }}>👥 {label}</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginTop: 0 }}>
        Total: {users.length}
      </p>

      {users.length === 0 ? (
        <p>No {label.toLowerCase()} found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button className="btn-chip btn-approve" onClick={onNotifyAll}>
              <span className="dot" /> Notify All
            </button>
          </div>
          <table className="ui-table gray" style={{ minWidth: '1000px' }}>
            <thead>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>USN</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Created</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={td}>{u.name || '—'}</td>
                  <td style={td}>{u.usn || '—'}</td>
                  <td style={td}>{u.email || '—'}</td>
                  <td style={td}>{u.role || '—'}</td>
                  <td style={td}>
                    {u.createdAt && typeof u.createdAt.toDate === 'function'
                      ? u.createdAt.toDate().toLocaleString()
                      : '—'}
                  </td>
                  <td style={td}>
                    <button
                      className="btn-chip btn-approve"
                      onClick={() => onNotify(u)}
                    >
                      <span className="dot" /> Notify
                    </button>
                    <span style={{ width: 6 }} />
                    <button
                      className="btn-chip btn-edit goo"
                      onClick={() => setEditing(u)}
                    >
                      <span className="dot" /> Edit
                    </button>
                    <button
                      className="btn-chip btn-delete"
                      style={{ marginLeft: 8 }}
                      onClick={() => onDelete(u)}
                    >
                      <span className="dot" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditDialog
        open={!!editing}
        title={
          editing
            ? `Edit ${editing.name || editing.email || 'User'}`
            : ''
        }
        fields={
          editing
            ? [
                { name: 'name', label: 'Name', value: editing?.name || '' },
                { name: 'usn', label: 'USN', value: editing?.usn || '' },
                { name: 'email', label: 'Email', value: editing?.email || '' },
                { name: 'role', label: 'Role', value: editing?.role || '' },
              ]
            : []
        }
        onChange={(k, v) => setEditing((prev) => ({ ...prev, [k]: v }))}
        onClose={() => setEditing(null)}
        onSave={async () => {
          try {
            if (!editing) return;
            const { id, name, usn, email, role } = editing;

            // Fetch previous data
            const prevSnap = await getDoc(doc(db, 'users', id));
            const prevData = prevSnap.exists() ? prevSnap.data() : {};
            const prevRole = prevData.role;

            // Update user info
            await updateDoc(doc(db, 'users', id), { name, usn, email, role });

            // ✅ Sync or backtrack teacher data
            if (role === 'teacher') {
              await addTeacherToCollection({
                id,
                name,
                email,
                usn,
                createdAt: serverTimestamp(),
              });
            } else if (prevRole === 'teacher' && role !== 'teacher') {
              await removeTeacherFromCollection(id);
            }

            alert('✅ User updated');
            setEditing(null);
          } catch (err) {
            console.error('Update failed:', err);
            alert('Failed to update: ' + err.message);
          }
        }}
      />
    </div>
  );
}
