# ORRO Protocol: The Live Creation Lead

<p align="center">
  <img src="https://github.com/orroprotocol/core/docs/images/orro-logo-header.png" alt="ORRO Protocol Logo" width="180">
</p>

<p align="center"><strong>The world's first decentralized reputation and trust engine for the creative economy.</strong></p>

<p align="center"><a href="[GitHub - orroprotocol/core](https://github.com/orroprotocol/core)"><img src="https://img.shields.io/badge/ORRO%20Protocol-v2.0-8B5CF6?style=for-the-badge&logoColor=white" alt="ORRO Protocol v2.0"></a><a href="https://github.com/orroprotocol/core/releases"><img src="https://img.shields.io/github/v/release/orroprotocol/core?style=for-the-badge&include_prereleases" alt="Version"></a><a href="[The MIT License &#8211; Open Source Initiative](https://opensource.org/licenses/MIT)"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"></a><a href="[https://solana.com](https://solana.com)"><img src="https://img.shields.io/badge/Built%20on-Solana-00d1b2?style=for-the-badge&logo=solana&logoColor=white" alt="Built on Solana"></a><a href="[https://www.rust-lang.org](https://www.rust-lang.org)"><img src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust"></a><a href="[https://www.anchor-lang.com](https://www.anchor-lang.com)"><img src="https://img.shields.io/badge/Anchor-Framework-8B5CF6?style=for-the-badge&logoColor=white" alt="Anchor Framework"></a></p>
<p align="center"><a href="https://twitter.com/orroprotocol"><img src="https://img.shields.io/twitter/follow/orroprotocol?style=social" alt="Twitter"></a></p>

## Table of Contents

* [Introduction](https://www.google.com/search?q=%23-introduction)

* [Installation](https://www.google.com/search?q=%23-installation)

* [Usage](https://www.google.com/search?q=%23-usage)

* [Roadmap](https://www.google.com/search?q=%23-roadmap)

* [Community](https://www.google.com/search?q=%23-community)

* [Contributing](https://www.google.com/search?q=%23-contributing)

* [Security](https://www.google.com/search?q=%23-security)

* [Licence](https://www.google.com/search?q=%23-licence)

## Introduction

ORRO is a Solana-based protocol for verifiable creative reputation. Creators build a "Live Lead" through time-stamped fragments—proving merit without faking portfolios or buying likes. Key features:

* **MTC/YTC Endorsements**: Signed messages for private/public trust shares.

* **Fragments**: Customizable, compressed provenance trails (IPFS/Arweave storage).

* **Reputation Scores**: TrustScore (user), ResonanceScore (project), PopularityScore (asset).

* **Gossip Box**: Moderated community chat with AI assistance.

## Installation

- Prerequisitest: Rust 1.75+, Anchor CLI v0.29+, Solana CLI v1.18+

```bash
Bash
# Clone repo (Rust + Anchor for Solana programs)

git clone https://github.com/orroprotocol/core.git
cd core

# Install dependencies

cargo install --locked anchor-cli

# Build programs

anchor build

# Test locally

anchor test
```

## Usage

Example: Create a fragment in Rust (Anchor program):

```rust
Rust
use anchor_lang::prelude::*;

#[program]
pub mod orro {
    use super::*;

    pub fn create_fragment(ctx: Context<CreateFragment>, hash: [u8; 32]) -> Result<()> {
        let fragment = &mut ctx.accounts.fragment;
        fragment.creator = *ctx.accounts.signer.key;
        fragment.timestamp = Clock::get()?.unix_timestamp;
        fragment.hash = hash;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateFragment<'info> {
    #[account(init, payer = signer, space = 8 + 32 + 8 + 32)]
    pub fragment: Account<'info, Fragment>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Fragment {
    pub creator: Pubkey,
    pub timestamp: i64,
    pub hash: [u8; 32],
}
```

For full API, see [https://github.com/orroprotocol/core/docs/api-reference](https://github.com/orroprotocol/core/docs/api-reference)

## Roadmap

![](https://github.com/orroprotocol/core/docs/images/orro-roadmap.png)

Pre-beta: Security audit in progress. To join the beta test apply for an invite code by PM at the discord community [@orroprotocol](https://discord.gg).

## Community

Join our community today!

X: [@orroprotocol](https://twitter.com/orroprotocol)

Discord: [@orroprotocol](https://discord.gg)

## Contributing

We welcome PRs! See CONTRIBUTING.md for guidelines.

1. Fork the repo.
2. Create branch: `git checkout -b feature/your-feature.`
3. Commit: `git commit -m "feat: add X".`
4. Push & PR.

Issues/PRs for OIPs (ORRO Improvement Proposals) especially encouraged.

## Security

* **Audits**: Pre-beta security audit in progress (OtterSec/Kudelski).
* **Breaches**: Report to [breaches@orro.io](mailto:breaches@orro.io?referrer=grok.com) — bounties up to 1000 ORROT for critical finds.

## License

MIT License — see LICENSE for details.

* * *

<p align="center">Built with 💜 by @darkerdarkofficial and the ORRO Community.</p>


