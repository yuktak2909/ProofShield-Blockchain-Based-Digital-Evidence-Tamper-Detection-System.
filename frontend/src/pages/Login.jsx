import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, LogIn, Key, Mail } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail) => {
    setError("");
    setLoading(true);
    try {
      await login(roleEmail, "Password123");
      navigate("/");
    } catch (err) {
      setError(err.message || "Quick Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const quickRoles = [
    { name: "Investigator", email: "investigator@proofshield.com", desc: "Register evidence & request transfers", color: "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" },
    { name: "Forensic Analyst", email: "analyst@proofshield.com", desc: "Download files & execute verification", color: "border-purple-500/30 text-purple-400 hover:bg-purple-500/10" },
    { name: "Court Official", email: "court@proofshield.com", desc: "Verify hashes & view chain custody", color: "border-green-500/30 text-green-400 hover:bg-green-500/10" },
    { name: "Administrator", email: "admin@proofshield.com", desc: "Manage accounts & system credentials", color: "border-red-500/30 text-red-400 hover:bg-red-500/10" }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-950/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-950/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-4xl bg-[#111827] border border-[#1F2937] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* Left Side - Login Form */}
        <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-[#1F2937]">
          <div className="flex items-center gap-3 mb-8">
            <ShieldAlert className="w-10 h-10 text-cyan-400" />
            <div>
              <h2 className="font-tech font-bold text-2xl tracking-wider text-cyan-400">PROOFSHIELD</h2>
              <p className="text-[10px] text-cyber-muted tracking-widest font-mono">DIGITAL EVIDENCE INTEGRITY SYSTEM</p>
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-6">Enter your authorized system credentials to access the secure node.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-950/20 border border-red-500/30 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-cyber-muted font-semibold uppercase tracking-wider block mb-1">Security Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-cyber-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.gov"
                  className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none text-gray-100 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-cyber-muted font-semibold uppercase tracking-wider block mb-1">Passkey</label>
              <div className="relative">
                <Key className="absolute left-3 top-3.5 w-4 h-4 text-cyber-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none text-gray-100 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-gray-950 py-3 rounded-lg text-sm font-semibold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  INITIALIZE SESSION
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side - Quick Role Selector */}
        <div className="w-full md:w-80 bg-[#151B2C]/50 p-8 flex flex-col justify-center">
          <h3 className="font-tech text-xs tracking-widest text-cyber-muted uppercase block mb-4">Quick Demonstration Access</h3>
          <p className="text-xs text-gray-500 mb-6">Select a profile below to log in pre-authorized role accounts automatically.</p>

          <div className="space-y-3">
            {quickRoles.map((role) => (
              <button
                key={role.name}
                type="button"
                onClick={() => handleQuickLogin(role.email)}
                disabled={loading}
                className={`w-full text-left p-3.5 border rounded-lg transition-all group disabled:opacity-50 ${role.color}`}
              >
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs font-bold font-tech tracking-wider">{role.name}</span>
                  <span className="text-[9px] font-mono text-cyber-muted group-hover:text-cyan-300">Login &rarr;</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">{role.desc}</p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
