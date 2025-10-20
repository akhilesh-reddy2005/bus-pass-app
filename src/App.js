import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { logLoginEvent } from "./utils/logLoginEvent";
import { motion } from 'framer-motion';

// Components
import TrackingPlaceholder from './components/TrackingPlaceholder';
import Home from './components/Home';
import SignUpForm from './components/SignUpForm';
import LoginForm from './components/LoginForm';
import BusPassRequestForm from './components/BusPassRequestForm';
import AdminDashboard from './components/AdminDashboard';
import AdminComplaints from './components/AdminComplaints';
import StudentBusPassView from './components/StudentBusPassView';
import Navbar from "./components/Navbar";
import ContactUs from './components/ContactUs';
import AdminUsersTable from './components/AdminUsersTableClean';
import AllData from './components/AllData'; 
import AdminNotifications from './components/AdminNotifications';
import UserNotifications from './components/UserNotifications';
import PassVerification from './components/PassVerification';
import AddToHomeScreen from './components/AddToHomeScreen';
import PwaDebugStatus from './components/PwaDebugStatus';

// Helper to safely convert Firestore Timestamp to Date
const toDate = (v) => {
  if (!v) return null;
  if (typeof v.toDate === "function") return v.toDate();
  return v instanceof Date ? v : null;
};

// Component to wrap page content with animation
const PageWrapper = ({ children }) => (
  <motion.div
    className="page-content"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// Component for Auth Page (Login/Register)
const AuthPage = ({ showRegister, setShowRegister }) => (
  <motion.div className="auth-container" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
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
          <p style={{ fontSize: "12px", color: "#555", margin: 0 }}>Student • Teacher</p>
        </div>
      </div>

      {showRegister ? <SignUpForm /> : <LoginForm />}

      <p style={{ marginTop: "20px" }}>
        {showRegister ? (
          <>Already registered?{' '}
            <span onClick={() => setShowRegister(false)} style={{ color: "#3B82F6", cursor: "pointer", fontWeight: "bold" }}>Login here</span>
          </>
        ) : (
          <>Not registered yet?{' '}
            <span onClick={() => setShowRegister(true)} style={{ color: "#3B82F6", cursor: "pointer", fontWeight: "bold" }}>Register here</span>
          </>
        )}
      </p>
    </div>
  </motion.div>
);


function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApprovedPass, setHasApprovedPass] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [checkingPass, setCheckingPass] = useState(true); 

  // --- PASS CHECK LOGIC (Moved outside useEffect for readability) ---
  const checkApprovedPass = async (uid) => {
    if (!uid) {
        setHasApprovedPass(false);
        setCheckingPass(false);
        return;
    }
    
    setCheckingPass(true);
    const routeCollections = [
      "busPassRequests", 
      ...Array.from({ length: 12 }, (_, i) => `route-${i + 1}`)
    ];

    let isAnyValid = false;
    const now = new Date();

    const queries = routeCollections.map(col => 
      getDocs(query(
        collection(db, col),
        where("studentId", "==", uid),
        where("status", "==", "approved")
      ))
    );

    const snapshots = await Promise.all(queries);

    for (const snapshot of snapshots) {
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const approvedAt = toDate(data.approvedAt) || toDate(data.requestDate);
        const validUntil = toDate(data.validUntil) || 
                           (approvedAt ? new Date(approvedAt.getTime() + 365 * 24 * 60 * 60 * 1000) : null);
        
        if (validUntil && validUntil > now) {
          isAnyValid = true;
          break;
        }
      }
      if (isAnyValid) break; 
    }

    setHasApprovedPass(isAnyValid);
    setCheckingPass(false);
  };
  // -------------------------


  useEffect(() => {
    document.body.style.backgroundColor = "#F9FAFB";
    document.documentElement.style.backgroundColor = "#F9FAFB";
    setCheckingPass(true);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);

        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const role = userDocSnap.data().role || "student";
            setUserRole(role);
            
            const profileData = userDocSnap.data();
            setProfile(profileData);
            await logLoginEvent(db, currentUser, profileData);

            if (role === "student") {
              await checkApprovedPass(currentUser.uid);
            } else {
              setHasApprovedPass(false);
              setCheckingPass(false);
            }
          } else {
            // 🛑 FIX: New user authenticated but no Firestore document found (must be new registration flow)
            console.log("New user detected (no Firestore profile). Redirecting to application.");
            setUserRole("student"); // Assume student role to route them correctly
            setHasApprovedPass(false); // Definitely no pass yet
            setCheckingPass(false); // Stop loading sequence
          }

        } catch (err) {
          console.error("Error fetching user doc/pass:", err);
          setUserRole(null);
          setHasApprovedPass(false);
          setCheckingPass(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setHasApprovedPass(false);
        setCheckingPass(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen for install events and keep Firestore user doc in sync for install/uninstall state
  useEffect(() => {
    if (!user) return;

    const onAppInstalled = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { installedPwa: true });
        setProfile(prev => prev ? { ...prev, installedPwa: true } : { installedPwa: true });
      } catch (err) {
        console.error('Failed to set installedPwa flag:', err);
      }
    };

    window.addEventListener('appinstalled', onAppInstalled);

    // If the user doc says installed but current display mode is not standalone,
    // assume the user opened the site in browser (app may have been uninstalled) and clear the flag.
    (async () => {
      try {
        if (profile && profile.installedPwa) {
          const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone);
          if (!isStandalone) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { installedPwa: false });
            setProfile(prev => prev ? { ...prev, installedPwa: false } : { installedPwa: false });
          }
        }
      } catch (err) {
        console.error('Error reconciling installedPwa flag:', err);
      }
    })();

    return () => window.removeEventListener('appinstalled', onAppInstalled);
  }, [user, profile]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  if (loading || checkingPass) {
  return (
    <div
      style={{
        fontFamily: 'Poppins, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '90px',
          height: '90px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Glow animation around logo */}
        <div
          style={{
            position: 'absolute',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,123,255,0.3) 0%, transparent 70%)',
            animation: 'pulseGlow 1.8s ease-in-out infinite',
          }}
        ></div>

        {/* Rotating border ring */}
        <div
          style={{
            position: 'absolute',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTop: '3px solid #007bff',
            borderRight: '3px solid #007bff',
            animation: 'spin 1.2s linear infinite',
          }}
        ></div>

        {/* Center logo */}
        <img
          src="/logo.png"
          alt="Logo"
          style={{
            width: '45px',
            height: '45px',
            objectFit: 'contain',
            borderRadius: '10px',
            zIndex: 2,
          }}
        />
      </div>

      <p
        style={{
          marginTop: '16px',
          color: '#333',
          fontWeight: 500,
          fontSize: '15px',
          letterSpacing: '0.3px',
        }}
      >
        Loading....
      </p>

      {/* Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes pulseGlow {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.15); opacity: 0.4; }
            100% { transform: scale(1); opacity: 0.8; }
          }
        `}
      </style>
    </div>
  );
}

  
  // Determine the default student path based on pass status
  const studentDefaultPath = hasApprovedPass ? "/epass" : "/apply";


  return (
    <Router>
      <AddToHomeScreen />
      <PwaDebugStatus />
  <Navbar user={user} profile={profile} userRole={userRole} handleLogout={handleLogout} hasApprovedPass={hasApprovedPass} />

      {user ? (
        <>
          {/* STUDENT ROUTES */}
          {userRole === "student" && (
            <Routes>
              {/* CORE LOGIC: Dynamic Root Redirect */}
              <Route path="/" element={<Navigate to={studentDefaultPath} replace />} /> 
              
              <Route path="/home" element={<PageWrapper><Home /></PageWrapper>} />

              {/* /epass route: Displays the pass view */}
              <Route path="/epass" element={<PageWrapper><StudentBusPassView /></PageWrapper>} />
              
              {/* /apply route: Shows form OR redirects user away if they already have a pass */}
              <Route 
                path="/apply" 
                element={
                  hasApprovedPass ? (
                    <Navigate to="/epass" replace />
                  ) : (
                    <PageWrapper><BusPassRequestForm /></PageWrapper>
                  )
                } 
              />
              
              <Route path="/tracking" element={<PageWrapper><TrackingPlaceholder /></PageWrapper>} />
              <Route path="/contact" element={<PageWrapper><ContactUs /></PageWrapper>} />
              <Route path="/notifications" element={<PageWrapper><UserNotifications user={user} /></PageWrapper>} />
              <Route path="/verify-pass" element={<PageWrapper><PassVerification /></PageWrapper>} />
              <Route path="/admin/*" element={<PageWrapper><h2>Access Denied</h2></PageWrapper>} />
              <Route path="*" element={<PageWrapper><h2>404 - Page Not Found</h2></PageWrapper>} />
            </Routes>
          )}

          {/* ADMIN ROUTES */}
          {userRole === "admin" && (
            <Routes>
              <Route path="/" element={<Navigate to="/admin/requests" replace />} />
              <Route path="/admin" element={<Navigate to="/admin/requests" replace />} />
              <Route path="/admin/requests" element={<PageWrapper><AdminDashboard filterProfileType="all" /></PageWrapper>} />
              <Route path="/admin/users" element={<Navigate to="/admin/users/students" replace />} />
              <Route path="/admin/users/students" element={<PageWrapper><AdminUsersTable roleFilter="student" /></PageWrapper>} />
              <Route path="/admin/users/teachers" element={<PageWrapper><AdminUsersTable roleFilter="teacher" /></PageWrapper>} />
              <Route path="/admin/complaints" element={<PageWrapper><AdminComplaints /></PageWrapper>} />
              <Route path="/admin/notifications" element={<PageWrapper><AdminNotifications /></PageWrapper>} />
              <Route path="/admin/all-data" element={<PageWrapper><AllData /></PageWrapper>} />
              <Route path="*" element={<Navigate to="/admin/requests" replace />} />
            </Routes>
          )}

          {/* TEACHER ROUTES */}
          {userRole === "teacher" && (
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          )}
        </>
      ) : (
        // UNAUTHENTICATED ROUTES
        <Routes>
          <Route path="/" element={<AuthPage showRegister={showRegister} setShowRegister={setShowRegister} />} />
          <Route path="/home" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/verify-pass" element={<PageWrapper><PassVerification /></PageWrapper>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
