import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, LogIn, Lock, Mail, ArrowRight } from "lucide-react";

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
      setError(err.message || "Invalid credentials. Please verify your email and passkey.");
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
      setError(err.message || "Quick authorization failed.");
    } finally {
      setLoading(false);
    }
  };

  const quickRoles = [
    {
      name: "Investigator Alice",
      role: "Investigator",
      email: "investigator@proofshield.com",
      desc: "Register evidence, seal hashes & initiate custody transfers",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      name: "Forensic Analyst Bob",
      role: "Forensic Analyst",
      email: "analyst@proofshield.com",
      desc: "Examine raw binaries, inspect metadata & run cryptographic audits",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
    },
    {
      name: "Court Official Charles",
      role: "Judicial Officer",
      email: "court@proofshield.com",
      desc: "Verify chain of custody timeline & review FRE 902(13)/(14) certificates",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      name: "Administrator Dave",
      role: "System Administrator",
      email: "admin@proofshield.com",
      desc: "Node access governance, identity management & contract configuration",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Section: Official Login Form */}
        <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-slate-900 tracking-tight">PROOFSHIELD</h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                Digital Evidence Integrity & Custody Protocol
              </p>
            </div>
          </div>

          <p className="text-slate-600 text-sm mb-6">
            Sign in with authorized agency credentials to access the cryptographically sealed evidence ledger.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-700 font-semibold uppercase tracking-wider block mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investigator@proofshield.com"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none text-slate-900 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold uppercase tracking-wider block mb-1.5">
                Authentication Passkey
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none text-slate-900 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In to Evidence Portal
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>FIPS 180-4 SHA-256 Compliant</span>
            <span>Chain ID: 1337 (Local Node)</span>
          </div>
        </div>

        {/* Right Section: Quick Demonstration Profiles */}
        <div className="w-full md:w-88 bg-slate-50/80 p-8 flex flex-col justify-center">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
              Demonstration Role Access
            </h3>
            <p className="text-xs text-slate-500">
              One-click authentication for pre-seeded demonstration accounts:
            </p>
          </div>

          <div className="space-y-3">
            {quickRoles.map((role) => (
              <button
                key={role.email}
                type="button"
                onClick={() => handleQuickLogin(role.email)}
                disabled={loading}
                className="w-full text-left p-3.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs group cursor-pointer disabled:opacity-50"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    {role.name}
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5">
                    Login <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${role.badgeColor}`}>
                    {role.role}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate">{role.email}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {role.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
