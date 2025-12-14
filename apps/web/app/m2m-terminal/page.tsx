'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, Lock, Server, Clock, Copy } from 'lucide-react';

const MOCK_SENDER_USER_ID = "0xbd21046c7d8200a080811e9410ccca5aeb7d2310f37222add2e2cafb1e916fc5";
const HEX64_REGEX = /^0x[0-9a-f]{64}$/i;

const generateMockTranId = () => {
  const hex = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 64; i++) result += hex[Math.floor(Math.random() * 16)];
  return result;
};

export default function M2MTerminal() {
  const [peerId, setPeerId] = useState('');
  const [assetType, setAssetType] = useState('Certificate of Authenticity (CoA)');
  const [poiNote, setPoiNote] = useState('');
  const [tranId, setTranId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ message: React.ReactNode; type: 'info' | 'error' | 'success' | 'pending' | 'warning' }>({
    message: 'Awaiting APIS Validation',
    type: 'info'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const SENDER_DISPLAY = MOCK_SENDER_USER_ID.slice(0, 10) + '...' + MOCK_SENDER_USER_ID.slice(-8);

  const handleTransfer = async () => {
    setIsProcessing(true);
    setTranId(null);
    setStatus({ message: 'Initiating APIS Validation...', type: 'info' });

    if (!HEX64_REGEX.test(peerId)) {
      setStatus({ message: 'Validation Failed: Peer ID must be canonical 32 Byte Hex64 format.', type: 'error' });
      setIsProcessing(false);
      return;
    }
    if (!poiNote.trim()) {
      setStatus({ message: 'Validation Failed: Proof-of-Intent Note is required.', type: 'error' });
      setIsProcessing(false);
      return;
    }

    setStatus({ message: 'APIS: Checks Passed. Generating &tran_id...', type: 'pending' });
    const mockTranId = generateMockTranId();
    await new Promise(r => setTimeout(r, 500));

    setStatus({ 
      message: (
        <span className="flex items-center gap-2">
          <Clock className="animate-spin" />
          L2 Anchoring... Immutable Proof Generation in progress (3s)
        </span>
      ), 
      type: 'warning' 
    });
    await new Promise(r => setTimeout(r, 3000));

    setTranId(mockTranId);
    setStatus({ message: 'Transaction Complete. Data Aggregated to Global Activity DB.', type: 'success' });
    setIsProcessing(false);
  };

  const copyTranId = () => tranId && navigator.clipboard.writeText(tranId);

  const statusIcon = {
    info: <Server className="w-5 h-5" />,
    error: <Lock className="w-5 h-5 text-red-400" />,
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    pending: <RefreshCw className="w-5 h-5 animate-spin text-yellow-400" />,
    warning: <Clock className="w-5 h-5 animate-spin text-orange-400" />,
  }[status.type];

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-green-400 p-8 rounded-lg shadow-2xl max-w-2xl w-full mx-auto border border-green-700 font-mono">
        <h1 className="text-3xl font-extrabold text-green-300 mb-2 text-center">ORRO M2M TRANSACTION TERMINAL</h1>
        <p className="text-sm text-gray-400 mb-6 text-center border-b border-green-700 pb-3">
          PROTOCOL-GOVERNED TRANSFER OF HIGH-TRUST ASSETS VIA APIS
        </p>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-800 p-3 rounded border border-gray-700">
            <label className="text-gray-500 block mb-1">SENDER ID (&user_id)</label>
            <p className="text-yellow-300 break-all">{SENDER_DISPLAY}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded border border-gray-700">
            <label className="text-gray-500 block mb-1">TRUST SCORE LEVEL</label>
            <p className="text-xl text-green-300">L1 (Verified)</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-green-400 mb-1">
              RECEIVER ID (&peer_id) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={peerId}
              onChange={(e) => setPeerId(e.target.value.toLowerCase())}
              placeholder="0x..."
              className="w-full p-2 bg-gray-800 border border-green-600 rounded focus:ring-green-400 focus:border-green-400"
              disabled={isProcessing}
            />
          </div>

          <div>
            <label className="block text-sm text-green-400 mb-1">ASSET TYPE</label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-green-600 rounded"
              disabled={isProcessing}
            >
              <option>Certificate of Authenticity (CoA)</option>
              <option>Administrative NFT (Reward)</option>
              <option>Trust Code (MTC)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-green-400 mb-1">
              PROOF-OF-INTENT NOTE (PoI) <span className="text-red-400">*</span>
            </label>
            <textarea
              value={poiNote}
              onChange={(e) => setPoiNote(e.target.value)}
              rows={3}
              placeholder="e.g., Transferring CoA for Project Phoenix V2.0 final delivery."
              className="w-full p-2 bg-gray-800 border border-green-600 rounded"
              disabled={isProcessing}
            />
          </div>
        </div>

        <div aria-live="polite" className="mt-6 p-4 bg-gray-800/70 rounded border border-gray-700 flex items-start gap-3">
          {statusIcon}
          <div className={status.type === 'error' ? 'text-red-400' : status.type === 'success' ? 'text-green-400' : 'text-gray-300'}>
            <span className="font-bold uppercase">{status.type}:</span> {status.message}
          </div>
        </div>

        {tranId && (
          <div className="mt-4 p-4 bg-gray-700 rounded border border-green-500">
            <label className="text-xs text-green-300 block mb-1">IMMUTABLE PROOF ID (&tran_id)</label>
            <p className="break-all text-lg font-bold text-white">{tranId}</p>
            <button onClick={copyTranId} className="text-xs text-cyan-400 underline mt-2 flex items-center gap-1">
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
        )}

        <button
          onClick={handleTransfer}
          disabled={isProcessing}
          className={`w-full py-3 mt-6 rounded font-bold transition ${isProcessing 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-green-700 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/50'}`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="inline w-5 h-5 animate-spin mr-2" />
              APIS Protocol Execution...
            </>
          ) : (
            'EXECUTE PROTOCOL TRANSFER'
          )}
        </button>
      </div>
    </div>
  );
}