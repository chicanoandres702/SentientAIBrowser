// kilo/__tests__/kilo-planner.test.js
// Pure unit tests for the planner (no network required).
const { parsePlanFromText, localPlan, KiloPlanner } = require("../core/kilo-planner");

describe("parsePlanFromText", () => {
  test("parses numbered list", () => {
    const steps = parsePlanFromText("1. Open the site\n2. Log in\n3. Click submit");
    expect(steps).toHaveLength(3);
    expect(steps[0].content).toBe("Open the site");
    expect(steps[0].status).toBe("pending");
    expect(steps[0].priority).toBe("medium");
  });

  test("drops meta-instruction lines", () => {
    const steps = parsePlanFromText("1. Create a concise step-by-step plan\n2. Do the work");
    expect(steps).toHaveLength(1);
    expect(steps[0].content).toBe("Do the work");
  });

  test("ignores non-numbered lines", () => {
    const steps = parsePlanFromText("- a bullet\n* another\n1. real step");
    expect(steps).toHaveLength(1);
    expect(steps[0].content).toBe("real step");
  });

  test("returns empty for plain prose", () => {
    const steps = parsePlanFromText("just do the thing eventually maybe");
    expect(steps).toHaveLength(0);
  });
});

describe("localPlan", () => {
  test("produces a generic browse workflow for a free-text task", () => {
    const steps = localPlan("Find the best pizza in town");
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps[0].content.toLowerCase()).toContain("search");
  });

  test("keeps an enumerated task as discrete steps", () => {
    const steps = localPlan("1. Open Google\n2. Search cats\n3. Save results");
    expect(steps).toHaveLength(3);
    expect(steps[1].content).toBe("Search cats");
  });
});

describe("KiloPlanner (local mode)", () => {
  test("defaults to a local plan without network", async () => {
    const planner = new KiloPlanner();
    const result = await planner.plan("Book a flight to Tokyo");
    expect(result.mode).toBe("local");
    expect(Array.isArray(result.steps)).toBe(true);
    expect(result.steps.length).toBeGreaterThan(0);
  });
});
