import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";

// Import Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import RegisterEvidence from "./pages/RegisterEvidence";
import EvidenceDetails from "./pages/EvidenceDetails";
import VerifyEvidence from "./pages/VerifyEvidence";
import ChainOfCustody from "./pages/ChainOfCustody";
import BlockchainRecords from "./pages/BlockchainRecords";
import Users from "./pages/Users";
import AuditLedger from "./pages/AuditLedger";
import SystemHealth from "./pages/SystemHealth";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-blue-700">
        <div className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-sm tracking-wide font-semibold">Verifying session...</span>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Admin Only Route Wrapper
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user && user.role === "admin" ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Main Layout routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="cases" element={<Cases />} />
            <Route path="cases/:caseId" element={<Cases />} /> {/* Case details page shares Cases.jsx file */}
            <Route path="evidence" element={<EvidenceDetails />} /> {/* Evidence list */}
            <Route path="evidence/:id" element={<EvidenceDetails />} /> {/* Single Evidence Detail View */}
            <Route path="register" element={<RegisterEvidence />} />
            <Route path="verify" element={<VerifyEvidence />} />
            <Route path="custody" element={<ChainOfCustody />} />
            <Route path="blockchain-records" element={<BlockchainRecords />} />
            <Route path="audit-logs" element={<AuditLedger />} />
            <Route path="system-health" element={<SystemHealth />} />
            
            {/* Admin only routes */}
            <Route
              path="users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
