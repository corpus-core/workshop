# swap-your-rpc

Hands-on companion to the Devcon 8 workshop
**"Swap Your RPC: Hands-On Verified Reads, Simulation, and Privacy"**.

A tiny vanilla-JS web app built on [ethers.js](https://docs.ethers.org/v6/)
talks to an RPC provider that lies about one account. In three short steps you
put [`@corpus-core/colibri-stateless`](https://www.npmjs.com/package/@corpus-core/colibri-stateless)
between ethers and the RPC and watch the lies disappear, then add privacy
and simulation on top.

## Two ways to follow along

### Code (recommended)

```sh
npm install
npm run dev
```

Open the printed URL. The app loads against the lying RPC
(`https://lying-rpc.colibri-proof.tech/forged`) by default -- so you see the lie
right away without any extra setup. Then edit [`src/main.js`](src/main.js), one
STEP marker at a time. If anything gets stuck you can always drop in the next
checkpoint:

```sh
cp solutions/step-1/main.js src/main.js
cp solutions/step-2/main.js src/main.js
cp solutions/step-3/main.js src/main.js
```

> TODO(simon): add an "Open in StackBlitz" button once we confirm the Colibri
> WASM loads cleanly in the StackBlitz sandbox.

### No setup -- Colibri playgrounds

If you only want to look, these three hosted demos cover the same ground:

- Verification: <https://www.corpuscore.tech/colibri/sandbox>
- Privacy (PAP): <https://papdemo.colibri-proof.tech/>
- Transaction simulation: <https://playground.colibri-proof.tech/>

## The three steps

### Step 1 -- verify (`createProvider`)

Import Colibri and replace ethers' `JsonRpcProvider` with
`new BrowserProvider(colibri)`, where `colibri` runs in `prover_mode: "hybrid"`.
Colibri is an EIP-1193 provider, so ethers does not care. Only the import and
`createProvider` change; the rest of the file is untouched. Then load both
data sources:

- Lying RPC -> `rejected`. Colibri never trusts `eth_getBalance`; it asks
  for `eth_getProof`. The lying RPC even forges that proof and re-hashes it up
  to the root, but the computed state root no longer matches the signed block
  header, so Colibri refuses to return a value.
- Honest RPC -> correct value, `verified`.

### Step 2 -- privacy (`privacy_mode: "basic"`)

Add one config field, then press Load again and compare panel 4. Without it,
Colibri sends `eth_createAccessList` with the full calldata of the USDC
`balanceOf` call to the RPC. With PAP the EVM discovers the storage it needs
itself, so only `eth_getCode` / `eth_getStorageAt` / `eth_getProof` leave the
client.

What `basic` does *not* hide: those proof requests still name the contract and
storage slot, and `eth_getLogs` goes out unchanged. Hiding the proof requests
as well needs `oblivious_nodes` (TEE RPC endpoints) -- see the Colibri README.

### Step 3 -- simulate (`colibri_simulateTransaction`)

Wire the "Simulate & explain" button to Colibri's local EVM. The pending
`approve(unlimited)` transaction is executed against proven state, and the
state changes land in the panel -- *before* anything would be signed. Because
privacy is already on, the transaction itself never reaches the RPC.

## What panel 4 shows

Every outgoing HTTP request this page makes. We wrap `window.fetch` once at
the top of `src/main.js`; in the browser both ethers and the Colibri package
use `globalThis.fetch`, so you see their prover and RPC traffic there.

## The lying RPC

Hosted at `https://lying-rpc.colibri-proof.tech`, source in a separate repo:
<https://github.com/corpus-core/lying-rpc>. You do not need to run it; both
URLs in the dropdown point to the hosted instance. The server offers more
lying modes than the app uses (e.g. one that lies only in `eth_getBalance`);
its README explains them and ships with a `Dockerfile` + `docker-compose.yml`.

## Repo layout

```
.
├── index.html             # single page, inline CSS
├── vite.config.js         # keeps Vite from pre-bundling Colibri (breaks the WASM path)
├── src/
│   ├── config.js          # constants (URLs, demo address, USDC ABI, block range)
│   └── main.js            # the whole app (step 0 start)
├── solutions/
│   ├── step-1/main.js     # drop-in replacement for src/main.js after step 1
│   ├── step-2/main.js
│   └── step-3/main.js
├── prover/README.md       # take-home: run your own prover
└── README.md
```

## Links

- Colibri source: <https://github.com/corpus-core/colibri-stateless>
- Specification: <https://corpus-core.gitbook.io/specification-colibri-stateless>
- Whitepaper: <https://corpus-core.gitbook.io/whitepaper-colibri-stateless>
- Privacy whitepaper (PAP): <https://corpus-core.gitbook.io/pap-colibri-stateless>
- Lying RPC: <https://github.com/corpus-core/lying-rpc>

## Caveats

- The default `proofStrategy` falls back to the unverified RPC on proof
  failure; the workshop uses `Strategy.VerifiedOnly` so lies surface as
  `rejected`. See the comment in `createProvider`.
- First load after the WASM boot takes a few seconds; subsequent requests are
  fast.
- `eth_getLogs` under `hybrid` has had an open issue in the past
  ([#301](https://github.com/corpus-core/colibri-stateless/issues/301)); if
  panel 2 shows a Colibri error, keep going -- the account panel still tells
  the full story.
