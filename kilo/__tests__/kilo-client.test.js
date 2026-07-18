// kilo/__tests__/kilo-client.test.js
// Integration test against the live Kilo server. Skips if the server is
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
    expect(agents.find((a) => a.name === "plan")).toBeTruthy();
  });

  test("planner creates a session and returns steps", async () => {
    if (!online) return console.warn("skipped: server offline");
    const { KiloPlanner } = require("../core/kilo-planner");
    const planner = new KiloPlanner(client);
    const plan = await planner.plan("Search the web for the current weather in Paris");
    expect(Array.isArray(plan.steps)).toBe(true);
    expect(plan.steps.length).toBeGreaterThan(0);
  });
});
