```mermaid
graph TD
    %% User Tier
    subgraph User_Interface [Frontend Layer]
        UI[ORRO.art Web App<br/>Next.js + Tailwind]
        Wallet[Solana Wallet Adapter<br/>Phantom/Solflare]
    end

    %% API / Logic Tier
    subgraph Logic_Layer [Application Logic]
        SDK[@solana/web3.js]
        Irys[Irys SDK<br/>Permanent Storage Link]
    end

    %% On-Chain Tier
    subgraph Solana_Blockchain [Solana On-Chain Layer]
        Program[ORRO Grit Program<br/>Rust/Anchor Contract]
        GritLedger[(Grit Ledger Account<br/>1-999 Sequential Data)]
        TokenState[(Token State<br/>ORRO, ORROT, ORROS)]
    end

    %% Decentralized Storage Tier
    subgraph Storage_Layer [Decentralized Data]
        Arweave[(Arweave / Irys<br/>Permanent Fragments)]
        Metadata[JSON Metadata<br/>Proof of Creative Trust]
    end

    %% Connections
    UI --> Wallet
    Wallet --> SDK
    SDK --> Program
    Program --> GritLedger
    Program --> TokenState
    
    UI --> Irys
    Irys --> Arweave
    Arweave --> Metadata
    Metadata -.->|Pointer| GritLedger

    %% Styling
    style User_Interface fill:#1a1a1a,stroke:#fff
    style Solana_Blockchain fill:#080808,stroke:#00ccff,stroke-width:2px
    style Storage_Layer fill:#080808,stroke:#f9d71c,stroke-width:2px
    style Program fill:#ff9900,stroke:#fff,color:#000
```
