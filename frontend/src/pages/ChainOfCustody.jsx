import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  History, 
  Search, 
  User, 
  ArrowRight,
  ShieldCheck, 
  Download, 
  ExternalLink,
  ChevronRight,
  Cpu,
  Clock
} from "lucide-react";

const ChainOfCustody = () => {
  const [evidenceList, setEvidenceList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const response = await axios.get("/api/evidence");
        setEvidenceList(response.data);
        if (response.data.length > 0) {
          // Pre-select first item
          setSelectedItem(response.data[0]);
        }
      } catch (err) {
        console.error("Failed to load evidence catalog");
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, []);

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!selectedItem) return;
      setTimelineLoading(true);
      try {
        const response = await axios.get(`/api/evidence/${selectedItem.id}/custody`);
        setTimeline(response.data.databaseHistory || []);
      } catch (err) {
        console.error("Failed to load custody timeline details");
      } finally {
        setTimelineLoading(false);
      }
    };
    fetchTimeline();
  }, [selectedItem]);

  const getActionBadgeColor = (action) => {
    switch (action) {
      case "transferred": return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "downloaded": return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
      case "viewed": return "bg-gray-500/10 text-gray-400 border border-gray-800";
      default: return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    }
  };

  const filteredList = evidenceList.filter(item => 
    item.evidenceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.case?.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-tech font-bold text-cyan-400 tracking-wide">CHAIN OF CUSTODY TIMELINE</h2>
        <p className="text-xs text-cyber-muted">Chronological audit logs of evidence interactions locked by smart contract receipts.</p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-cyan-400 font-mono text-xs">
          <div className="w-8 h-8 border-3 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin mb-3"></div>
          LOADING AUDIT LOGS...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Panel: Search & Evidence List */}
          <div className="bg-[#151B2C]/40 border border-[#1F2937] p-4 rounded-xl space-y-4 h-fit max-h-[600px] flex flex-col">
            <h3 className="font-tech text-xs tracking-wider uppercase text-cyan-400 border-b border-gray-800 pb-3">Evidence List</h3>
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-cyber-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search catalog..."
                className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg pl-10 pr-4 py-2 text-xs text-gray-100 focus:outline-none"
              />
            </div>
            
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {filteredList.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-3.5 border rounded-lg transition-all flex items-center justify-between ${
                    selectedItem?.id === item.id 
                      ? "border-cyan-400 bg-cyan-500/5 text-cyan-200" 
                      : "border-gray-800 bg-[#111827]/40 text-gray-400 hover:border-gray-700"
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="text-xs font-semibold block truncate">{item.evidenceName}</span>
                    <span className="text-[10px] font-mono text-cyber-muted">{item.case?.caseNumber}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cyber-muted flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel: Selected Item Timeline */}
          <div className="md:col-span-2 space-y-6">
            {selectedItem ? (
              <div className="bg-[#151B2C]/40 border border-[#1F2937] p-6 rounded-xl space-y-6">
                
                {/* Meta details */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-cyan-200">{selectedItem.evidenceName}</h3>
                    <p className="text-xs text-cyber-muted mt-0.5">SHA-256 Checksum: <span className="font-mono text-emerald-400">{selectedItem.fileHash.substring(0, 16)}...</span></p>
                  </div>
                  <Link
                    to={`/evidence/${selectedItem.id}`}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Dossier Details &rarr;
                  </Link>
                </div>

                {/* Timeline */}
                {timelineLoading ? (
                  <div className="py-12 flex items-center justify-center text-cyan-400 font-mono text-xs">
                    <div className="w-5 h-5 border-2 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin mr-3"></div>
                    COMPILING TIMELINE DATA...
                  </div>
                ) : (
                  <div className="space-y-6 relative pl-6 border-l border-gray-800 ml-4 py-2">
                    {timeline.map((log) => {
                      const isTransfer = log.action === "transferred";
                      
                      return (
                        <div key={log.id} className="relative group">
                          {/* Circle Dot Marker */}
                          <span className={`absolute -left-[35px] top-1 w-4 h-4 rounded-full border transition-all ${
                            log.action === "transferred" 
                              ? "bg-purple-950 border-purple-500"
                              : log.action === "downloaded"
                                ? "bg-cyan-950 border-cyan-400"
                                : "bg-gray-950 border-gray-700"
                          }`}></span>

                          <div className="bg-[#111827]/40 border border-[#1F2937] hover:border-gray-800 p-4 rounded-lg space-y-2">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getActionBadgeColor(log.action)}`}>
                                {log.action.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-cyber-muted font-mono flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>

                            <p className="text-xs text-cyan-100 font-sans">
                              Transaction logged by <span className="font-semibold text-cyan-400">{log.actor?.name}</span> ({log.actor?.role})
                            </p>

                            {isTransfer && (
                              <p className="text-xs text-gray-400 mt-1">
                                Custody moved from <span className="text-cyan-200">{log.prevCustodian?.name}</span> to <span className="text-cyan-200">{log.nextCustodian?.name}</span>
                              </p>
                            )}

                            {log.blockchainTxId && (
                              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] font-mono text-cyber-muted">
                                <span className="truncate max-w-[250px]" title={log.blockchainTxId}>
                                  TX ID: <span className="text-purple-400">{log.blockchainTxId}</span>
                                </span>
                                <span className="text-emerald-400 font-semibold uppercase flex items-center gap-0.5 flex-shrink-0">
                                  <Cpu className="w-3 h-3 text-emerald-400" />
                                  Immutable
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-[#151B2C]/20 border border-dashed border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <History className="w-12 h-12 text-cyber-muted mb-3 animate-pulse" />
                <h3 className="font-tech text-xs tracking-wider uppercase text-cyber-muted">Timeline Vault Empty</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  Select a registered evidence file from the left catalog panel to audit its historical timelines.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default ChainOfCustody;
