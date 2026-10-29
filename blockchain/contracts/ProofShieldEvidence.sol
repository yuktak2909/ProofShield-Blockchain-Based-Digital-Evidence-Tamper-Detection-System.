// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProofShieldEvidence {
    address public owner;

    struct Evidence {
        string evidenceId;
        string fileHash;
        string caseId;
        string metadata; // description or reference
        address submitter;
        uint256 timestamp;
        address currentCustodian;
        bool exists;
    }

    struct CustodyEvent {
        address actor;
        string action; // "REGISTERED", "TRANSFERRED"
        address previousCustodian;
        address newCustodian;
        uint256 timestamp;
    }

    // Mapping from evidenceId to Evidence details
    mapping(string => Evidence) private evidences;
    // Mapping from evidenceId to list of custody events
    mapping(string => CustodyEvent[]) private custodyHistories;

    event EvidenceRegistered(
        string indexed evidenceId,
        string fileHash,
        string caseId,
        address indexed submitter,
        uint256 timestamp
    );

    event CustodyTransferred(
        string indexed evidenceId,
        address indexed previousCustodian,
        address indexed newCustodian,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerEvidence(
        string calldata _evidenceId,
        string calldata _fileHash,
        string calldata _caseId,
        string calldata _metadata,
        address _submitter
    ) external {
        require(!evidences[_evidenceId].exists, "Evidence already registered");
        require(bytes(_evidenceId).length > 0, "Evidence ID cannot be empty");
        require(bytes(_fileHash).length > 0, "File hash cannot be empty");
        require(bytes(_caseId).length > 0, "Case ID cannot be empty");

        evidences[_evidenceId] = Evidence({
            evidenceId: _evidenceId,
            fileHash: _fileHash,
            caseId: _caseId,
            metadata: _metadata,
            submitter: _submitter,
            timestamp: block.timestamp,
            currentCustodian: _submitter,
            exists: true
        });

        custodyHistories[_evidenceId].push(CustodyEvent({
            actor: _submitter,
            action: "REGISTERED",
            previousCustodian: address(0),
            newCustodian: _submitter,
            timestamp: block.timestamp
        }));

        emit EvidenceRegistered(_evidenceId, _fileHash, _caseId, _submitter, block.timestamp);
    }

    function transferCustody(
        string calldata _evidenceId,
        address _newCustodian,
        address _currentCustodian
    ) external {
        require(evidences[_evidenceId].exists, "Evidence not registered");
        require(_newCustodian != address(0), "Invalid new custodian address");
        require(evidences[_evidenceId].currentCustodian == _currentCustodian, "Custodian address mismatch");

        address previousCustodian = evidences[_evidenceId].currentCustodian;
        evidences[_evidenceId].currentCustodian = _newCustodian;

        custodyHistories[_evidenceId].push(CustodyEvent({
            actor: msg.sender,
            action: "TRANSFERRED",
            previousCustodian: previousCustodian,
            newCustodian: _newCustodian,
            timestamp: block.timestamp
        }));

        emit CustodyTransferred(_evidenceId, previousCustodian, _newCustodian, block.timestamp);
    }

    function verifyEvidence(
        string calldata _evidenceId,
        string calldata _fileHash
    ) external view returns (bool isVerified, string memory registeredHash) {
        require(evidences[_evidenceId].exists, "Evidence not registered");
        string memory actualHash = evidences[_evidenceId].fileHash;
        bool matches = keccak256(bytes(actualHash)) == keccak256(bytes(_fileHash));
        return (matches, actualHash);
    }

    function getEvidence(
        string calldata _evidenceId
    ) external view returns (
        string memory evidenceId,
        string memory fileHash,
        string memory caseId,
        string memory metadata,
        address submitter,
        uint256 timestamp,
        address currentCustodian,
        bool exists
    ) {
        require(evidences[_evidenceId].exists, "Evidence does not exist");
        Evidence memory ev = evidences[_evidenceId];
        return (
            ev.evidenceId,
            ev.fileHash,
            ev.caseId,
            ev.metadata,
            ev.submitter,
            ev.timestamp,
            ev.currentCustodian,
            ev.exists
        );
    }

    function getCustodyHistory(
        string calldata _evidenceId
    ) external view returns (CustodyEvent[] memory) {
        require(evidences[_evidenceId].exists, "Evidence not registered");
        return custodyHistories[_evidenceId];
    }
}
