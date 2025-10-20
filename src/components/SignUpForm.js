import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name,
        usn,
        role: "student", // default role
        createdAt: new Date(),
      });

      // Reset fields
      setEmail("");
      setPassword("");
      setName("");
      setUsn("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.85)", // transparent glassy look
        borderRadius: "16px",
        padding: "32px",
        backdropFilter: "blur(10px)", // glass effect
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "420px",
      }}
    >
      <h2 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "20px", color: "#111" }}>
        Signup
      </h2>

      <form onSubmit={handleSignUp}>
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="USN/EMP-ID"
            value={usn}
            onChange={(e) => setUsn(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <input
            type="email"
            placeholder="Email(eg. user@jainuniversity.ac.in)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </div>

        {error && (
          <p style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "#10B981",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Sign Up
        </button>
      </form>
    </motion.div>
  );
}

export default SignUpForm;
