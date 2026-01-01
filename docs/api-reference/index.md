# API Reference: Integrating with ORRO

The ORRO API provides the bridge between the Solana ledger and your application. It allows for the real-time processing of **MTC/YTC** actions and the generation of **Experience Artifacts**.

## 1. The Prediction Endpoint

To support the protocol's **Performance Resilience**, applications should query the Load Prediction endpoint before sending transactions.

* **Endpoint:** `GET /v1/network/predict-load`

* **Returns:** A `LoadState` object containing recommended `ComputeUnitLimit` and `ComputeUnitPrice`.

* **Usage:** Ensures transactions are pre-emptively boosted during peak periods (e.g., the "Winner of the Day" rush) to prevent "Compute Budget Exceeded" errors.

## 2. URI Processing (`orro-utils`)

Following the **OIP-1 Standard**, the API provides a TypeScript utility for parsing and validating ORRO URIs.

* **Function:** `parseOrroUri(uri: string): OrroAction`

* **Validation:** MUST validate the recipient address as a 44-character base58 Solana public key.

* **Zero-Option Enforcement:** Unknown parameters are automatically ignored to maintain protocol stability.

## 3. Fragment Management

* **`POST /v1/fragments/generate`**: Creates a new Fragment container. Users may specify manual generation or set an automated frequency (Daily, Weekly, Monthly).

* **`PUT /v1/fragments/recycle`**: Surrenders a Fragment back to the global community pile for re-queueing.
