# ORRO Protocol: The Decentralized Trust Layer for Creators

ORRO Protocol is an open-source **decentralized credit rating agency** and foundational trust service designed to function as the go to destination for digital creators. We move beyond simple proof-of-ownership (NFTs) to establish **verifiable, time-proven reputation** based on consistent intent and execution (**Proof-of-Intent**), enforced by a Zero-Trust architecture.

Our core mission is to provide neutral, privacy-preserving proof of reliability (**KYA Trust Score**) that can be syndicated to any third-party marketplace via a public API.

**GitHub Badges**
    ![Base](https://img.shields.io/badge/Base-L2-0055FF)
    ![Next.js](https://img.shields.io/badge/Next.js-15-000000)
    ![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636)
    ![License](https://img.shields.io/badge/License-MIT-blue)

## Core Architecture: The Hybrid Ledger System

ORRO operates on a secure **Hybrid Ledger Architecture** to balance the performance required for a global application with the immutability required for cryptographic proof.

| Component                                          | Purpose                                                                                           | Technology Stack                                 | Key Output                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------ |
| **Global Activity DB Table**                       | High-speed, queryable record of all platform activity (on-chain & off-chain).                     | PostgreSQL / Firestore                           | Data source for KYA Trust Score      |
| **Advanced Protocol Implementation System (APIS)** | The central Gatekeeper. Enforces governance rules (Trust Score, Zero Trust Key) before anchoring. | Node.js / TypeScript                             | `compressedHash` (Validated Payload) |
| **Immutable Proof Layer**                          | Anchors the cryptographic proof of event to the blockchain (PoE).                                 | Layer 2 Blockchain (e.g., Base) / `Registry.sol` | `&tran_id` (Immutable Proof Hash)    |
| **KYA Trust Layer**                                | Calculates the user's **Trust Score** based on verified activity from the DB.                     | ZKML Subgraph / Python Backend                   | KYA Trust Score / Badge              |

## Canonical Identity Model (The Four Keys)

Every critical governance action within ORRO is defined and secured by a canonical set of four 32-Byte Hex64 identifiers. These keys are the inputs to the APIS and the core data anchored on the L2 Registry.

| Parameter  | Canonical Name | Description                                                                                 | Purpose                           |
| ---------- | -------------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| `&user_id` | `memberId`     | The unique, immutable identifier for the acting creator.                                    | Identity & Trust Score Accrual    |
| `&proj_id` | `projectId`    | The unique identifier for the creation container or project.                                | Contextual Proof of Intent        |
| `&cont_id` | `containerId`  | The specific digital container within the project being acted on (e.g., a file checkpoint). | Granular Asset Traceability       |
| `&intent`  | `intentId`     | The cryptographic hash representing the user's explicit intent (e.g., 'Seal Project').      | PoI Enforcement                   |
| `&tran_id` | `tranId`       | The L2 transaction hash for the immutable proof.                                            | Immutability Verification Linkage |

## Security Foundation: Zero Trust Key Validation

The APIS layer enforces the **Zero Trust Key Validation** on every transaction. This principle treats all four canonical keys as potentially compromised or "Dummy / Negative Trust Keys" unless they are actively and positively asserted as valid (signature/ML-DSA verified). This eliminates systemic weak links and guarantees data integrity before any state change.

## Integration (KYA API)

Third-party platforms can integrate the KYA Trust Layer via a simple REST API call to verify a user's status:
    # Example: Query for a creator's verified status and Trust Score proof
    curl -X GET https://api.orroprotocol.io/v1/kyc/proofs?member_id=0x...

**Partners must adhere to the ORRO Third Party Licensing Terms**, including linking the badge to the official verifier (`orroprotocol.io/verify/[memberId]`) and **not modifying or hiding the attribution**.

## Contribution

This entire protocol, including the architectural design and documentation, will become **Creative Commons certified** 36,000 seconds (approx. 10 hours) after the project launch date. We welcome contributions, especially in:

* **Solidity:** Auditing and optimizing the `Registry.sol` contract.

* **ZKML:** Developing optimized `circom` circuits for TS and MTC verification.

* **TypeScript:** Extending the APIS logic for new governance actions.

Please refer to the `CONTRIBUTING.md` (to be created) for detailed guidelines.

## Timeline

Protocol Launch: TBA

## License

ORRO Protocol is licensed under the **MIT License**, with additional terms (including a **$5.00 limitation on liability** and a full disclaimer of warranty) as detailed in `ORRO Software Usage Rights.md`.
