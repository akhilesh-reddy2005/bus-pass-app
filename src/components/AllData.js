// src/components/AllData.js
import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Filter, FileText, FileSpreadsheet } from "lucide-react";

const COLLECTIONS_TO_FETCH = [
  "route-1","route-2","route-3","route-4",
  "route-5","route-6","route-7","route-8",
  "route-9","route-10","route-11","route-12",
];

// ✅ Format Firestore Timestamp
const formatReqDate = (req) => {
  if (!req.requestDate) return "N/A";
  const date = req.requestDate.toDate
    ? req.requestDate.toDate()
    : new Date(req.requestDate.seconds * 1000);
  return date.toLocaleString();
};

function AllData() {
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  // ✅ Live fetching from Firestore
  useEffect(() => {
    const unsubscribers = [];
    COLLECTIONS_TO_FETCH.forEach((col) => {
      const q = query(collection(db, col), orderBy("requestDate", "desc"));
      const unsub = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          sourceCollection: col,
          ...doc.data(),
        }));
        setAllData((prev) => ({
          ...prev,
          [col]: docs,
        }));
        setLoading(false);
      });
      unsubscribers.push(unsub);
    });
    return () => unsubscribers.forEach((unsub) => unsub());
  }, []);

  // ✅ Apply filter (route / student / teacher)
  const filteredData = useMemo(() => {
    if (filterType === "all") return allData;

    const newData = {};

    if (filterType.startsWith("route")) {
      // ✅ Only one route
      newData[filterType] = allData[filterType] || [];
    } else {
      // ✅ Student / Teacher
      Object.keys(allData).forEach((route) => {
        newData[route] = allData[route].filter((req) => {
          if (filterType === "student")
            return req.profileType?.toLowerCase() === "student";
          if (filterType === "teacher")
            return req.profileType?.toLowerCase() === "teacher";
          return true;
        });
      });
    }

    return newData;
  }, [allData, filterType]);

  // ✅ Export to Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    Object.keys(filteredData).forEach((route) => {
      if (!filteredData[route] || filteredData[route].length === 0) return;
      const sheetData = filteredData[route].map((req) => ({
        Name: req.studentName || req.name || "N/A",
        Email: req.studentEmail || req.email || req.usn || "N/A",
        "Pickup Point": req.pickupPoint || "N/A",
        Role: req.profileType || "Student",
        Date: formatReqDate(req),
      }));
      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, route.toUpperCase());
    });
    XLSX.writeFile(workbook, `BusPassRequests_${filterType.toUpperCase()}.xlsx`);
  };

  // ✅ Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Bus Pass Report - ${filterType.toUpperCase()}`, 14, 15);
    let yOffset = 30;

    Object.keys(filteredData).forEach((route) => {
      const data = filteredData[route];
      if (!data || data.length === 0) return;

      doc.setFontSize(14);
      doc.text(`${route.toUpperCase()} (${data.length})`, 14, yOffset);

      const tableData = data.map((req) => [
        req.studentName || req.name || "N/A",
        req.studentEmail || req.email || req.usn || "N/A",
        req.pickupPoint || "N/A",
        req.profileType || "Student",
        formatReqDate(req),
      ]);

      autoTable(doc, {
        startY: yOffset + 5,
        head: [["Name", "Email", "Pickup Point", "Role", "Date"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59] },
      });

      yOffset = doc.lastAutoTable.finalY + 15;
      if (yOffset > 280) {
        doc.addPage();
        yOffset = 20;
      }
    });

    doc.save(`BusPassRequests_${filterType.toUpperCase()}.pdf`);
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading data... ⏳</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
        📊 Comprehensive Bus Pass Data
      </h2>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <label className="fw-bold me-2">
            <Filter size={16} className="me-1" /> Filter:
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            <option value="all">All</option>
            {COLLECTIONS_TO_FETCH.map((col) => (
              <option key={col} value={col}>
                {col.toUpperCase()}
              </option>
            ))}
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        <div>
          <button
            onClick={exportToExcel}
            style={{
              padding: "6px 12px",
              marginRight: "10px",
              border: "none",
              borderRadius: "6px",
              background: "#107c10",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <FileSpreadsheet size={16} className="me-1" /> Excel
          </button>
          <button
            onClick={exportToPDF}
            style={{
              padding: "6px 12px",
              border: "none",
              borderRadius: "6px",
              background: "#b30000",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <FileText size={16} className="me-1" /> PDF
          </button>
        </div>
      </div>

      {/* Show tables */}
      {Object.keys(filteredData).map((route) =>
        filteredData[route] && filteredData[route].length > 0 ? (
          <div key={route} style={{ marginBottom: "40px" }}>
            <h3 style={{ marginBottom: "12px", color: "#2563eb" }}>
              {route.toUpperCase()} ({filteredData[route].length})
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                minWidth: "900px",
                tableLayout: "fixed",
              }}
            >
              <thead style={{ background: "#f3f3f3" }}>
                <tr>
                  <th style={th}>Name</th>
                  <th style={th}>Email / USN</th>
                  <th style={th}>Pickup Point</th>
                  <th style={th}>Role</th>
                  <th style={th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredData[route].map((req) => (
                  <tr key={req.id}>
                    <td style={td}>{req.studentName || req.name || "N/A"}</td>
                    <td style={td}>
                      {req.studentEmail || req.email || req.usn || "N/A"}
                    </td>
                    <td style={td}>{req.pickupPoint || "N/A"}</td>
                    <td style={td}>{req.profileType || "Student"}</td>
                    <td style={td}>{formatReqDate(req)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null
      )}
    </div>
  );
}

const th = {
  padding: "12px",
  border: "1px solid #ddd",
  textAlign: "center",
};
const td = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "center",
};

export default AllData;
