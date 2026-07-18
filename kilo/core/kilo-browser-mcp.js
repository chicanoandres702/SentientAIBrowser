// kilo/core/kilo-browser-mcp.js
// Feature: Kilo Inner Playwright MCP | Trace: kilo/core/kilo-browser-mcp.js
// Why: Kilo's "inner" browser connection is a Playwright MCP server registered
// with the Kilo server. The model then auto-browses via mcp__playwright__*
// tools (navigate, click, type, screenshot). This module registers that MCP
// server and verifies it connected. Live video is handled separately by
// kilo-browser-video.js (Playwright native recording).
"use strict";

const { KiloClient } = require("./kilo-client");

const PLAYWRIGHT_MCP_NAME = "playwright";

// Build the MCP config. Uses @playwright/mcp when available, otherwise a local
// chromium launch. headed:false keeps it headless; the video module records it.
function buildMcpConfig(opts = {}) {
  const args = ["-y", "@playwright/mcp@latest", "--headless"];
  if (opts.saveDir) args.push(`--save-trace-path=${opts.saveDir}`);
  return {
    type: "local",
    command: ["npx", ...args],
    environment: {
      PLAYWRIGHT_BROWSERS_PATH: opts.browsersPath || "0",
    },
    enabled: true,
  };
}

class KiloBrowserMcp {
  constructor(client = new KiloClient()) {
    this.client = client;
  }

  async register(opts = {}) {
    const config = buildMcpConfig(opts);
    await this.client.registerMcp(PLAYWRIGHT_MCP_NAME, config, 20000);
    // Poll until the server reports connected (or failed). Non-fatal: if it
    // never reports, kilo still runs and the caller degrades gracefully.
    try {
      for (let i = 0; i < 15; i++) {
        const status = await this.client.mcpStatus();
        const s = status[PLAYWRIGHT_MCP_NAME];
        if (s && (s.status === "connected" || s.status === "failed")) {
          if (s.status === "failed") throw new Error(`Playwright MCP failed to connect: ${s.error}`);
          this.toolsNamespace = PLAYWRIGHT_MCP_NAME;
          return s;
        }
        await sleep(1000);
      }
      // No status in time — assume it is still starting; kilo continues.
      this.toolsNamespace = PLAYWRIGHT_MCP_NAME;
      return null;
    } catch (err) {
      this.toolsNamespace = PLAYWRIGHT_MCP_NAME;
      throw err;
    }
  }

  // Tool name prefix used when enabling tools per message.
  toolPrefix() {
    return `mcp__${PLAYWRIGHT_MCP_NAME}__`;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { KiloBrowserMcp, PLAYWRIGHT_MCP_NAME, buildMcpConfig };
