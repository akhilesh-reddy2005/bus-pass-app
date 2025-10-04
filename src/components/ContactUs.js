// src/components/ContactUs.js
import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "../App.css";
import { motion } from 'framer-motion';

function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // save to Firestore
      await addDoc(collection(db, "complaints"), {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        createdAt: serverTimestamp(),
      });

      setStatus("success");
      setFormData({ name: "", email: "", message: "" });

      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error saving complaint:", error);
      setStatus("error");
    }
  };

  return (
    <div className="contact-container">
      {/* Left Info Section */}
      <motion.div className="contact-info" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
        <h2>Contact Us</h2>
        <p>
          Have questions or need support? Send us a message below and our team
          will get back to you shortly.
        </p>
        <p>
          <b>📍 Room No:</b> 001
        </p>
        <p>
          <b>📧 Email:</b> support@yourapp.com
        </p>
        <p>
          <b>📞 Phone:</b> +91 98765 43210
        </p>
      </motion.div>

      {/* Right Form Section */}
      <motion.div className="contact-form" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <textarea
            name="message"
            rows="4"
            placeholder="Type your message..."
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>

          <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>Send Message</motion.button>
        </form>

        {status === "success" && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "green", marginTop: "10px" }}>
            ✅ Message sent successfully!
          </motion.p>
        )}
        {status === "error" && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "red", marginTop: "10px" }}>
            ❌ Failed to send message. Try again.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

export default ContactUs;
