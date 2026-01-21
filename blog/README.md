```mermaid
graph TD
    %% Layers
    subgraph Frontend [Frontend Layer]
        UI[ORRO.art Web App]
        Wallet[Solana Wallet Adapter]
    end

    subgraph Logic [Application Logic]
        SDK[Solana Web3.js]
        Irys[Irys SDK Gateway]
    end

    subgraph Blockchain [Solana On-Chain]
        Program[ORRO Rust Program]
        Ledger[(Grit Ledger Account)]
        Tokens[(Token State Vault)]
    end

    subgraph Storage [Permanent Storage]
        Arweave[(Arweave / Irys)]
        Metadata[JSON Proofs]
    end

    %% Connections
    UI --> Wallet
    Wallet --> SDK
    SDK --> Program
    Program --> Ledger
    Program --> Tokens
    
    UI --> Irys
    Irys --> Storage
    Storage --> Metadata
    Metadata -.->|Immutable Link| Ledger
```
