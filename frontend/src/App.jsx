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

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-cyan-400">
        <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin mb-4"></div>
        <span className="font-tech text-sm tracking-widest animate-pulse font-semibold">AUTHENTICATING SECURE NODE...</span>
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
