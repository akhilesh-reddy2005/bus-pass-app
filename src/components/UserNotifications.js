import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setNotifications(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsub();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>User Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications available.</p>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li key={n.id} style={{ marginBottom: "15px" }}>
              <strong>{n.title}</strong> - {n.message}
              <br />
              <small>
                {n.createdAt?.toDate
                  ? n.createdAt.toDate().toLocaleString()
                  : ""}
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserNotifications;
