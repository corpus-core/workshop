// Swap Your RPC -- workshop app, step 0 (starting point).
//
// Read this file top to bottom. It is one linear script built on ethers.js,
// like most dApps. Three STEP markers tell you where to touch.
//
//   Panel 1: ETH + USDC balance of DEMO_ADDRESS
//   Panel 2: USDC Transfer events of DEMO_ADDRESS in a fixed block range
//   Panel 3: a prepared approve(unlimited) transaction
//   Panel 4: every HTTP request this page sends
//
// In step 0 ethers talks to the RPC through a plain JsonRpcProvider and
// believes whatever comes back -- which is why the lying RPC can show a wrong
// balance without any warning.

import { JsonRpcProvider, BrowserProvider, Contract, Interface, formatEther, formatUnits, MaxUint256 } from "ethers";
import {
  PROVER_URL, CHECKPOINTZ_URL, RPC_OPTIONS, USDC_ADDRESS, USDC_ABI, DEMO_ADDRESS,
  LOG_FROM_BLOCK, LOG_TO_BLOCK, DEMO_SPENDER,
} from "./config.js";

// import Colibri, { Strategy } from "@corpus-core/colibri-stateless";


// Fetch monitor (panel 4): wrap the global fetch once, before anything else
// runs. ethers and Colibri both call globalThis.fetch, so all their traffic
// shows up here. ethers sends the body as bytes, hence the TextDecoder.
const logEl = document.querySelector("#panel-provider [data-log]");
const originalFetch = window.fetch.bind(window);
const shorten = (text, max) => (text.length > max ? text.slice(0, max - 3) + "..." : text);
window.fetch = async (input, init) => {
  const url = new URL(input.url ?? input, location.href);
  const method = (init?.method ?? input.method ?? "GET").toUpperCase();
  // GET requests (block proofs, checkpoints) say everything in their path;
  // POST requests are JSON-RPC, so the interesting part is the body.
  let line = `${method.padEnd(4)} ${shorten(url.host + url.pathname + url.search, 90)}`;
  const body = init?.body;
  if (body) {
    try {
      const text = typeof body === "string" ? body : new TextDecoder().decode(body);
      const parsed = JSON.parse(text);
      line += (Array.isArray(parsed) ? parsed : [parsed])
        .map(call => `\n     ${call.method}(${shorten(JSON.stringify(call.params ?? []), 80)})`)
        .join("");
    } catch { line += "  (binary body)"; }
  }
  logEl.textContent += `${line}\n`;
  logEl.scrollTop = logEl.scrollHeight;
  return originalFetch(input, init);
};
document.getElementById("clear-log").addEventListener("click", () => { logEl.textContent = ""; });

// "plain" or "colibri" -- decides which badge a successful load gets.
let providerKind = "plain";

// ===== STEP 1: swap the provider =====
//
// Today ethers talks to the RPC directly and trusts every answer. Replace the
// body of this function so ethers talks to Colibri instead:
//
//   import Colibri, { Strategy } from "@corpus-core/colibri-stateless";
//
//   providerKind = "colibri";
//   const colibri = new Colibri({
//     prover:        [PROVER_URL],          // signed block headers come from here
//     checkpointz:   [CHECKPOINTZ_URL],     // trust anchor; needs CORS in the browser
//     zk_proof:      true,                  // bootstrap from a ZK sync proof instead
//     rpcs:          [rpcUrl],              // account + storage data still from the RPC
//     prover_mode:   "hybrid",
//     proofStrategy: Strategy.VerifiedOnly, // never fall back to unverified data
//   });
//   return new BrowserProvider(colibri);    // Colibri is an EIP-1193 provider
//
// Everything below stays exactly as it is.
function createProvider(rpcUrl) {
  providerKind = "plain";
  // staticNetwork: we know it is mainnet, so ethers skips the eth_chainId probe.
  return new JsonRpcProvider(rpcUrl, "mainnet", { staticNetwork: true });
}

// colibri as provider
function createProvider_colibri(rpcUrl) {
  providerKind = "colibri";
  const colibri = new Colibri({
    prover: [PROVER_URL],
    checkpointz: [CHECKPOINTZ_URL],
    zk_proof: true,
    rpcs: [rpcUrl],
    prover_mode: "hybrid",
    proofStrategy: Strategy.VerifiedOnly,
  });
  return new BrowserProvider(colibri);
}

// Fill the dropdown and the static texts.
const select = document.getElementById("rpc");
for (const option of RPC_OPTIONS) select.add(new Option(option.label, option.url));
document.querySelector("#panel-account [data-address]").textContent = DEMO_ADDRESS;
document.querySelector("#panel-transfers [data-range]").textContent = `Blocks ${LOG_FROM_BLOCK} .. ${LOG_TO_BLOCK}`;
document.querySelector("#panel-tx [data-to]").textContent = USDC_ADDRESS;
document.querySelector("#panel-tx [data-spender]").textContent = DEMO_SPENDER;

// The pending transaction: approve(DEMO_SPENDER, unlimited) on USDC.
const DEMO_TX = {
  from: DEMO_ADDRESS,
  to: USDC_ADDRESS,
  data: new Interface(USDC_ABI).encodeFunctionData("approve", [DEMO_SPENDER, MaxUint256]),
};

// Set a panel badge to "loading", "unverified", "verified" or "rejected".
// ethers wraps provider errors; the provider's own message sits in error.error.
function setBadge(panelId, kind, error) {
  const badge = document.querySelector(`#${panelId} [data-badge]`);
  badge.className = `badge ${kind}`;
  badge.textContent = kind === "rejected"
    ? `rejected: ${error.error?.message ?? error.shortMessage ?? error.message}`
    : kind;
}

// Load panel 1 and panel 2. One linear function on purpose.
async function loadAll() {
  const provider = createProvider(select.value);
  const goodBadge = providerKind === "colibri" ? "verified" : "unverified";
  const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);

  // Panel 1 -- Account. Clear old values first so a rejection never sits
  // next to a number from the previous data source.
  const ethField = document.querySelector("#panel-account [data-eth]");
  const usdcField = document.querySelector("#panel-account [data-usdc]");
  ethField.textContent = usdcField.textContent = "—";
  setBadge("panel-account", "loading");
  setBadge("panel-transfers", "loading");
  try {
    ethField.textContent = `${formatEther(await provider.getBalance(DEMO_ADDRESS))} ETH`;
    usdcField.textContent = `${formatUnits(await usdc.balanceOf(DEMO_ADDRESS), 6)} USDC`;
    setBadge("panel-account", goodBadge);
  } catch (error) {
    setBadge("panel-account", "rejected", error);
  }

  // Panel 2 -- USDC transfers from and to DEMO_ADDRESS in the fixed range.
  const list = document.querySelector("#panel-transfers [data-list]");
  list.innerHTML = "";
  try {
    const sent = await usdc.queryFilter(usdc.filters.Transfer(DEMO_ADDRESS, null), LOG_FROM_BLOCK, LOG_TO_BLOCK);
    const received = await usdc.queryFilter(usdc.filters.Transfer(null, DEMO_ADDRESS), LOG_FROM_BLOCK, LOG_TO_BLOCK);
    for (const event of [...sent, ...received].sort((a, b) => a.blockNumber - b.blockNumber)) {
      const { from, to, value } = event.args;
      const item = document.createElement("li");
      item.textContent = `block ${event.blockNumber}: ${from.slice(0, 10)}... -> ${to.slice(0, 10)}...  `
        + `${formatUnits(value, 6)} USDC`;
      list.appendChild(item);
    }
    setBadge("panel-transfers", goodBadge);
  } catch (error) {
    setBadge("panel-transfers", "rejected", error);
  }
}
document.getElementById("load").addEventListener("click", loadAll);

// ===== STEP 3: simulate & explain =====
//
// Colibri can run DEMO_TX in its own EVM against proven state and tell you
// what it would change -- before anything is signed. Replace the stub with:
//
//   const result = await createProvider(select.value).send("colibri_simulateTransaction",
//     [DEMO_TX, "latest", null, { positions: true, state_values: true }]);
//
// and print result.status, result.gasUsed and the decoded result.logs.
document.getElementById("simulate").addEventListener("click", () => {
  const output = document.querySelector("#panel-tx [data-sim]");
  output.hidden = false;
  output.textContent = "Not implemented yet -- this is step 3.";
});
