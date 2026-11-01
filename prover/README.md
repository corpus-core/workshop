# Take-home: run your own Colibri prover

The workshop uses the public prover at `https://mainnet.colibri-proof.tech`.
You can swap it out for a local one in a minute.

```sh
docker pull ghcr.io/corpus-core/colibri-prover:latest
docker run --rm -p 8090:8090 ghcr.io/corpus-core/colibri-prover:latest
```

Then edit [`../src/config.js`](../src/config.js):

```js
export const PROVER_URL = "http://localhost:8090";
```

Reload the workshop app -- the proof headers now come from your machine, and
panel 4 shows requests going to `localhost:8090` instead of the hosted prover.

For the full set of configuration options (Memcached cache, chain selection,
beacon API endpoints, ...), see
[`bindings/docker/README.md`](https://github.com/corpus-core/colibri-stateless/blob/main/bindings/docker/README.md)
in the Colibri repository.
