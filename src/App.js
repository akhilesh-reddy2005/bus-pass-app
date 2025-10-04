// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { logLoginEvent } from "./utils/logLoginEvent";
import { motion } from 'framer-motion';
import AnimatedCursor from './components/AnimatedCursor';
import TrackingPlaceholder from './components/TrackingPlaceholder';
import Home from './components/Home';
import AdminNotifications from "./components/AdminNotifications"; // ✅ Admin Notifications
import UserNotifications from "./components/UserNotifications";   // ✅ User Notifications
import SignUpForm from './components/SignUpForm';
import LoginForm from './components/LoginForm';
import BusPassRequestForm from './components/BusPassRequestForm';
import AdminDashboard from './components/AdminDashboard';
import AdminComplaints from './components/AdminComplaints';
import StudentBusPassView from './components/StudentBusPassView';
import Navbar from "./components/Navbar";
import ContactUs from "./components/ContactUs";
import AdminUsersTable from './components/AdminUsersTable';
import AdminLoginLogs from './components/AdminLoginLogs';
import AllData from './components/AllData'; // ✅ Correct

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApprovedPass, setHasApprovedPass] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = "#F9FAFB";
    document.documentElement.style.backgroundColor = "#F9FAFB";

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role || "student");
          } else {
            setUserRole("student");
          }

          try {
            const profile = userDocSnap.exists() ? userDocSnap.data() : null;
            await logLoginEvent(db, currentUser, profile);
          } catch (logErr) {
            console.warn("Login log (App) failed:", logErr);
          }

          // ✅ Check approved passes for students across all route collections
          if (userDocSnap.exists() && userDocSnap.data().role === "student") {
            const routeCollections = [
              "route-1","route-2","route-3","route-4","route-5","route-6",
              "route-7","route-8","route-9","route-10","route-11","route-12"
            ];

            const toDate = (v) => {
              if (!v) return null;
              if (typeof v.toDate === "function") return v.toDate();
              return v instanceof Date ? v : null;
            };

            let isAnyValid = false;
            const now = new Date();

            for (const routeCol of routeCollections) {
              const q = query(
                collection(db, routeCol),
                where("studentId", "==", currentUser.uid),
                where("status", "==", "approved")
              );
              const querySnapshot = await getDocs(q);

              querySnapshot.forEach((docSnap) => {
                const d = docSnap.data();
                const approvedAt = toDate(d.approvedAt) || toDate(d.requestDate);
                const validUntil = toDate(d.validUntil) || (approvedAt ? new Date(approvedAt.getTime() + 365*24*60*60*1000) : null);
                if (validUntil && validUntil > now) {
                  isAnyValid = true;
                }
              });

              if (isAnyValid) break;
            }

            setHasApprovedPass(isAnyValid);
          } else {
            setHasApprovedPass(false);
          }

        } catch (err) {
          console.error("Error fetching user doc:", err);
          setUserRole(null);
          setHasApprovedPass(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setHasApprovedPass(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  if (loading) {
    return (
      <div style={{
        fontFamily: 'Poppins, sans-serif',
        minHeight: '100vh',
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <p>Loading user session...</p>
      </div>
    );
  }

  return (
    <Router>
      <AnimatedCursor />
      <Navbar user={user} userRole={userRole} handleLogout={handleLogout} hasApprovedPass={hasApprovedPass} />

      {user ? (
        <>
          {/* ==================== STUDENT ROUTES ==================== */}
          {userRole === "student" && (
            <Routes>
              <Route path="/" element={<Navigate to="/epass" replace />} />

              <Route
                path="/home"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Home />
                  </motion.div>
                }
              />

              <Route
                path="/epass"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    {hasApprovedPass ? <StudentBusPassView /> : <BusPassRequestForm />}
                  </motion.div>
                }
              />

              <Route
                path="/tracking"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <TrackingPlaceholder />
                  </motion.div>
                }
              />

              <Route
                path="/notifications"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <UserNotifications />
                  </motion.div>
                }
              />

              <Route
                path="/apply"
                element={
                  hasApprovedPass ? (
                    <Navigate to="/epass" replace />
                  ) : (
                    <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <BusPassRequestForm />
                    </motion.div>
                  )
                }
              />

              <Route
                path="/contact"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <ContactUs />
                  </motion.div>
                }
              />

              <Route
                path="/admin/*"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <h2>Access Denied</h2>
                  </motion.div>
                }
              />

              <Route
                path="*"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <h2>404 - Page Not Found</h2>
                  </motion.div>
                }
              />
            </Routes>
          )}

          {/* ==================== ADMIN ROUTES ==================== */}
          {userRole === "admin" && (
            <Routes>
              <Route path="/" element={<Navigate to="/admin/requests" replace />} />
              <Route path="/admin" element={<Navigate to="/admin/requests" replace />} />

              <Route
                path="/admin/requests"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <AdminDashboard filterProfileType="all" />
                  </motion.div>
                }
              />

              <Route
                path="/admin/users"
                element={<Navigate to="/admin/users/students" replace />}
              />

              <Route
                path="/admin/users/students"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <AdminUsersTable roleFilter="student" />
                  </motion.div>
                }
              />

              <Route
                path="/admin/users/teachers"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <AdminUsersTable roleFilter="teacher" />
                  </motion.div>
                }
              />

              <Route
                path="/admin/logins"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <AdminLoginLogs />
                  </motion.div>
                }
              />

              <Route
                path="/admin/complaints"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <AdminComplaints />
                  </motion.div>
                }
              />

              <Route
                path="/admin/all-data"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <AllData />
                  </motion.div>
                }
              />

              <Route
                path="/admin/notifications"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <AdminNotifications />
                  </motion.div>
                }
              />
            </Routes>
          )}

          {/* ==================== TEACHER ROUTES ==================== */}
          {userRole === "teacher" && (
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route
                path="/home"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Home />
                  </motion.div>
                }
              />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          )}
        </>
      ) : (
        // ==================== UNAUTHENTICATED ROUTES ====================
        <Routes>
          <Route
            path="/"
            element={
              <motion.div className="auth-container" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="auth-left">
                  <img src="/logo.png" alt="Bus" />
                  <h2>CampusBus Login</h2>
                  <p>Access bus e-pass, tracking, and payments with your university credentials.</p>
                </div>

                <div className="card">
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                    <img src="/logo.png" alt="CampusBus Logo" style={{ width: "50px", height: "50px", marginRight: "12px", borderRadius: "50%" }} />
                    <div>
                      <h1 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>CampusBus Portal</h1>
                      <p style={{ fontSize: "12px", color: "#555", margin: 0 }}>Student • Teacher • Admin</p>
                    </div>
                  </div>

                  {showRegister ? <SignUpForm /> : <LoginForm />}

                  <p style={{ marginTop: "20px" }}>
                    {showRegister ? (
                      <>Already registered?{' '}
                        <span onClick={() => setShowRegister(false)} style={{ color: "#3B82F6", cursor: "pointer", fontWeight: "bold" }}>
                          Login here
                        </span>
                      </>
                    ) : (
                      <>Not registered yet?{' '}
                        <span onClick={() => setShowRegister(true)} style={{ color: "#3B82F6", cursor: "pointer", fontWeight: "bold" }}>
                          Register here
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </motion.div>
            }
          />

          <Route
            path="/home"
            element={
              <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Home />
              </motion.div>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
