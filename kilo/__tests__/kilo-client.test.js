// kilo/__tests__/kilo-client.test.js
// Integration test against the live OpenCode server. Skips if the server is
// unreachable so CI without network still passes.
const { KiloClient } = require("../core/kilo-client");

const client = new KiloClient();
let online = false;

beforeAll(async () => {
  try {
    const h = await client.health();
    online = h && h.healthy === true;
  } catch {
    online = false;
  }
});

describe("KiloClient (live server)", () => {
  test("health reports healthy", async () => {
    if (!online) return console.warn("skipped: server offline");
    const h = await client.health();
    expect(h.healthy).toBe(true);
  });

  test("lists providers and agents", async () => {
    if (!online) return console.warn("skipped: server offline");
    const p = await client.providers();
    expect(Array.isArray(p.providers)).toBe(true);
    const agents = await client.agents();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.find((a) => a.name === "kilo")).toBeTruthy();
  });

  test("prompt() resolves with assistant text (free model)", async () => {
    if (!online) return console.warn("skipped: server offline");
    const s = await client.createSession({ title: "test", agent: "kilo", model: { id: "gemini-2.5-flash", providerID: "google" } });
    const r = await client.prompt(s.id, [{ type: "text", text: "Reply with exactly the word: pong" }], { agent: "kilo", model: { id: "gemini-2.5-flash", providerID: "google" }, timeoutMs: 60000 });
    expect(typeof r.text).toBe("string");
    await client.deleteSession(s.id);
  });
});
