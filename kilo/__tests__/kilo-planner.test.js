// kilo/__tests__/kilo-planner.test.js
// Pure unit tests for the planner's text -> steps parser (no network).
const { parsePlanFromText } = require("../core/kilo-planner");

describe("parsePlanFromText", () => {
  test("parses numbered list", () => {
    const steps = parsePlanFromText("1. Open the site\n2. Log in\n3. Click submit");
    expect(steps).toHaveLength(3);
    expect(steps[0].content).toBe("Open the site");
    expect(steps[0].status).toBe("pending");
    expect(steps[0].priority).toBe("medium");
  });

  test("parses bullet list", () => {
    const steps = parsePlanFromText("- navigate to example.com\n* fill the form\n- submit");
    expect(steps).toHaveLength(3);
    expect(steps[1].content).toBe("fill the form");
  });

  test("parses checkbox list", () => {
    const steps = parsePlanFromText("[ ] step one\n[x] step two");
    expect(steps).toHaveLength(2);
    expect(steps[0].content).toBe("step one");
    expect(steps[1].content).toBe("step two");
  });

  test("falls back to a single step for plain text", () => {
    const steps = parsePlanFromText("just do the thing");
    expect(steps).toHaveLength(1);
    expect(steps[0].content).toContain("just do the thing");
  });
});
