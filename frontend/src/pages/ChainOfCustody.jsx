import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
  Clock,
  FileCheck,
  Send,
  Eye,
  FileText,
  AlertCircle
} from "lucide-react";

const ChainOfCustody = () => {
  const [searchParams] = useSearchParams();
  const targetEvidenceId = searchParams.get("evidenceId") || "";

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
          // If a query param is present, select that item, otherwise default to first item
          if (targetEvidenceId) {
            const found = response.data.find(item => item.id === targetEvidenceId);
            setSelectedItem(found || response.data[0]);
          } else {
            setSelectedItem(response.data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load evidence catalog for custody timeline");
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, [targetEvidenceId]);

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

  const getActionBadge = (action) => {
    switch (action) {
      case "transferred": 
        return { label: "CUSTODY TRANSFERRED", bg: "bg-purple-50 text-purple-700 border-purple-200", icon: Send };
      case "downloaded": 
        return { label: "EVIDENCE DOWNLOADED", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: Download };
      case "viewed": 
        return { label: "EVIDENCE ACCESSED / VIEWED", bg: "bg-slate-100 text-slate-700 border-slate-200", icon: Eye };
      default: 
        return { label: action.toUpperCase(), bg: "bg-slate-100 text-slate-700 border-slate-200", icon: History };
    }
  };

  const filteredList = evidenceList.filter(item => 
    item.evidenceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.case?.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fileHash?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Immutable Evidentiary Ledger
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Chain of Custody & Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Chronological, cryptographically verifiable log recording every view, download, transfer, and custodian handoff anchored by Ethereum smart contract receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/verify"
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verify Checksum
          </Link>
          <Link
            to="/register"
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <FileCheck className="w-4 h-4" />
            Register New Evidence
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-24 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-600 font-medium text-xs">
          <div className="w-8 h-8 border-3 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mb-3"></div>
          LOADING AUDIT TRAIL DATA FROM ON-CHAIN LEDGER...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Search & Catalog Selector (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs h-fit max-h-[700px] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Select Evidence Record</h3>
              <span className="text-[11px] font-mono text-slate-500 font-medium">{filteredList.length} files</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by file name or case..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none transition-all"
              />
            </div>
            
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {filteredList.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-3 border rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                    selectedItem?.id === item.id 
                      ? "border-blue-600 bg-blue-50/60 text-slate-900 shadow-xs" 
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="text-xs font-bold block truncate text-slate-900">{item.evidenceName}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                        {item.case?.caseNumber || "Case"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        {item.fileType?.split("/")[1]?.toUpperCase() || "FILE"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${selectedItem?.id === item.id ? "text-blue-700 font-bold" : "text-slate-400"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel: Selected Item Timeline Details (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedItem ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs">
                
                {/* Evidence Item Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                        {selectedItem.case?.caseNumber}
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                        {selectedItem.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedItem.evidenceName}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      SHA-256: <span className="font-semibold text-slate-800 select-all">{selectedItem.fileHash}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/evidence/${selectedItem.id}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-all flex items-center gap-1"
                    >
                      Inspect Dossier &rarr;
                    </Link>
                    <Link
                      to={`/verify?evidenceId=${selectedItem.id}`}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verify Integrity
                    </Link>
                  </div>
                </div>

                {/* Meta Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Registered Submitter</span>
                    <span className="font-semibold text-slate-800">{selectedItem.submitter?.name || "Investigator Alice"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Current Designated Custodian</span>
                    <span className="font-semibold text-blue-700">{selectedItem.custodian?.name || "Analyst Bob"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">IPFS Content Identifier (CID)</span>
                    <span className="font-mono text-slate-700 text-[11px] truncate block" title={selectedItem.ipfsCid}>
                      {selectedItem.ipfsCid}
                    </span>
                  </div>
                </div>

                {/* Chronological Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Verified Custody Timeline Events ({timeline.length})
                  </h4>

                  {timelineLoading ? (
                    <div className="py-12 flex items-center justify-center text-slate-500 font-medium text-xs">
                      <div className="w-5 h-5 border-2 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mr-3"></div>
                      FETCHING ON-CHAIN AUDIT LOGS...
                    </div>
                  ) : timeline.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                      No custody transitions recorded for this item yet.
                    </div>
                  ) : (
                    <div className="space-y-6 relative pl-6 border-l-2 border-slate-200 ml-4 py-2">
                      {timeline.map((log, idx) => {
                        const badgeInfo = getActionBadge(log.action);
                        const ActionIcon = badgeInfo.icon;
                        const isTransfer = log.action === "transferred";
                        
                        return (
                          <div key={log.id || idx} className="relative group">
                            
                            {/* Circle Marker */}
                            <span className={`absolute -left-[33px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                              isTransfer ? "border-purple-600" : log.action === "downloaded" ? "border-blue-600" : "border-slate-400"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                isTransfer ? "bg-purple-600" : log.action === "downloaded" ? "bg-blue-600" : "bg-slate-400"
                              }`}></span>
                            </span>

                            <div className="bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 rounded-xl space-y-2 transition-all shadow-2xs">
                              
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1.5 ${badgeInfo.bg}`}>
                                  <ActionIcon className="w-3 h-3" />
                                  {badgeInfo.label}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>

                              <p className="text-xs text-slate-800 font-medium">
                                Action authorized by <span className="font-bold text-slate-900">{log.actor?.name || "System Actor"}</span>
                                <span className="text-slate-500 ml-1">({log.actor?.role?.toUpperCase() || "AUTHORIZED"})</span>
                              </p>

                              {isTransfer && (
                                <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-md text-xs text-purple-900 mt-1">
                                  <span className="font-semibold">Custody Transfer:</span> Handoff from <span className="font-semibold">{log.prevCustodian?.name || "Previous Custodian"}</span> &rarr; to <span className="font-semibold">{log.nextCustodian?.name || "New Custodian"}</span>
                                </div>
                              )}

                              {log.blockchainTxId && (
                                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-mono text-slate-500 gap-1">
                                  <span className="truncate max-w-md select-all" title={log.blockchainTxId}>
                                    BLOCKCHAIN RECEIPT TX: <span className="text-purple-700 font-semibold">{log.blockchainTxId}</span>
                                  </span>
                                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 flex-shrink-0">
                                    <Cpu className="w-3 h-3" />
                                    Smart Contract Confirmed
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

              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-xs">
                <History className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">No Evidence Item Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Choose a registered evidence item from the catalog on the left to inspect its on-chain custody audit trail.
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
