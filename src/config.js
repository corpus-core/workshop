// Workshop configuration.
//
// Everything that might change for a demo lives here as a plain constant.
// `src/main.js` imports these and nothing else, so you can skim one small file
// to understand what the app shows.

// Remote Colibri prover endpoint. Used from step 1 on. Keep it mainnet.
export const PROVER_URL = "https://mainnet.colibri-proof.tech";

// Entries for the "Data source" dropdown in the header.
// The default is the *lying* RPC on purpose: step 0 shows the lie, step 1
// swaps only the provider and the UI reveals it. Participants do not run the
// lying RPC themselves; it is hosted (source: github.com/corpus-core/lying-rpc).
export const RPC_OPTIONS = [
  // Lies in eth_getBalance only. Colibri never asks for it.
  { label: "Lying RPC (plain)",  url: "https://lying-rpc.colibri-proof.tech/plain"  },
  // Also lies in the `balance` field of eth_getProof, proof nodes untouched.
  // Colibri reads the balance from the proven leaf, so it never sees this lie.
  { label: "Lying RPC (field)",  url: "https://lying-rpc.colibri-proof.tech/field"  },
  // Forges the whole Merkle path; only the signed state root gives it away.
  { label: "Lying RPC (forged)", url: "https://lying-rpc.colibri-proof.tech/forged" },
  // Pass-through to the honest upstream, as a sanity check.
  { label: "Honest RPC",         url: "https://lying-rpc.colibri-proof.tech/honest" },
];

// USDC mainnet contract and the three ABI entries the app needs.
// ethers reads this human-readable ABI directly.
export const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
export const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

// The account the app loads. Must match DEMO_ADDRESS in the lying RPC,
// otherwise step 0 shows the real balance and the swap looks like a no-op.
// TODO(simon): pick a more recognisable address for the live workshop. This
// one has visible ETH + USDC balances and regular USDC activity.
export const DEMO_ADDRESS = "0x7d8eb200c45c273e3bef1bc55c09f76805158e96";

// Fixed block range for the "Transfers" panel. Small on purpose so
// eth_getLogs stays fast on any upstream RPC and fits on one screen.
// TODO(simon): re-check before the workshop that the upstream still serves
// receipts for this range (4 incoming transfers as of Nov 2026).
export const LOG_FROM_BLOCK = 26321289;
export const LOG_TO_BLOCK   = 26321297;

// Pending transaction shown in panel 3: USDC approve(DEMO_SPENDER, unlimited).
// An unknown spender with an unlimited allowance is the classic drainer setup.
export const DEMO_SPENDER = "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead";
