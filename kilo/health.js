// kilo/health.js
// Feature: Kilo CLI | Trace: kilo/health.js
// Why: Tiny no-dependency preflight check. Exits 0 when the Kilo/OpenCode
// server is reachable and healthy, non-zero otherwise. Usable as a container
// healthcheck on a plain server deployment.
"use strict";

const { KiloClient } = require("./core/kilo-client");

async function main() {
  const client = new KiloClient();
  try {
    const h = await client.health();
    if (h && h.healthy === true) {
      console.log(`OK ${client.baseUrl} v${h.version || "?"}`);
      process.exit(0);
    }
    console.error(`UNHEALTHY ${client.baseUrl}`, h);
    process.exit(1);
  } catch (err) {
    console.error(`DOWN ${client.baseUrl}: ${err.message}`);
    process.exit(1);
  }
}

main();
