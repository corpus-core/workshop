# swap-your-rpc

Hands-on companion to the Devcon 8 workshop
**"Swap Your RPC: Hands-On Verified Reads, Simulation, and Privacy"**.

A tiny vanilla-JS web app built on [ethers.js](https://docs.ethers.org/v6/)
talks to an RPC provider that lies about one account. In three short steps you
put [`@corpus-core/colibri-stateless`](https://www.npmjs.com/package/@corpus-core/colibri-stateless)
between ethers and the RPC and watch the lies disappear, then add simulation
and privacy on top.

## Two ways to follow along

### Code (recommended)

```sh
npm install
npm run dev
```

Open the printed URL. The app loads against
`https://lying-rpc.colibri-proof.tech/plain` by default -- so you see the lie
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

Replace ethers' `JsonRpcProvider` with `new BrowserProvider(colibri)`, where
`colibri` runs in `prover_mode: "hybrid"`. Colibri is an EIP-1193 provider, so
ethers does not care. Only `createProvider` changes; the rest of the file is
untouched. Try each lying mode in the dropdown:

- `/plain` -> correct value, `verified`. Colibri never asked
  `eth_getBalance`; it asked `eth_getProof` and verified the account itself.
- `/field` -> correct value, `verified`. The lie sits only in the
  convenience `balance` field of the proof answer; Colibri reads the balance
  from the proven account leaf and never looks at that field.
- `/forged` -> `rejected`. The leaf itself was rewritten and re-hashed, so
  the computed state root no longer matches the signed block header and
  Colibri refuses to return a value.

### Step 2 -- simulate (`colibri_simulateTransaction`)

Wire the "Simulate & explain" button to Colibri's local EVM. The pending
`approve(unlimited)` transaction is executed against proven state, and the
state changes land in the panel -- *before* anything would be signed.

### Step 3 -- privacy (`privacy_mode: "basic"`)

Add one config field, then press Load and Simulate again and compare panel 4.
Without it, the simulation sends `eth_createAccessList` with your full
transaction (spender, amount) to the RPC. With PAP the EVM discovers the
storage it needs itself, so only `eth_getProof` / `eth_getStorageAt` leave the
client.

What `basic` does *not* hide: those proof requests still name the contract and
storage slot, and `eth_getLogs` goes out unchanged. Hiding the proof requests
as well needs `oblivious_nodes` (TEE RPC endpoints) -- see the Colibri README.

## What panel 4 shows

Every outgoing HTTP request this page makes. We wrap `window.fetch` once at
the top of `src/main.js`; in the browser both ethers and the Colibri package
use `globalThis.fetch`, so you see their prover and RPC traffic there.

## The lying RPC

Hosted at `https://lying-rpc.colibri-proof.tech`, source in a separate repo:
<https://github.com/corpus-core/lying-rpc>. You do not need to run it; the four
URLs in the dropdown point to the hosted instance. If you want to inspect or
host your own, the server-side README explains the forgery and ships with a
`Dockerfile` + `docker-compose.yml`.

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
