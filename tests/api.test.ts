import { afterEach, describe, expect, test } from "bun:test";
import {
  listAdminSubmissions,
  listPublicEvents,
  type AdminSubmissions,
  type PublicEvent,
} from "../src/lib/api";

const originalFetch = globalThis.fetch;
const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

function mockJsonResponse(payload: unknown, ok = true) {
  globalThis.fetch = (() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(payload),
    } as Response)) as typeof fetch;
}

describe("API list normalization", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalLocalStorage)
      Object.defineProperty(globalThis, "localStorage", originalLocalStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });

  test("public events defaults non-array responses to an empty list", async () => {
    mockJsonResponse({ data: [{ id: "event-1" }], error: null });

    const events = await listPublicEvents();

    expect(events).toEqual([]);
  });

  test("public events returns array responses unchanged", async () => {
    const payload = [{ id: "event-1", title: "Show" }] as PublicEvent[];
    mockJsonResponse(payload);

    const events = await listPublicEvents();

    expect(events).toBe(payload);
  });

  test("admin submissions defaults missing or malformed lists to empty arrays", async () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: { getItem: () => "token" },
      configurable: true,
    });
    mockJsonResponse({
      rsvps: { data: [{ id: "bad-shape" }] },
      newsletter: null,
      applications: [{ id: "application-1" }],
    });

    const submissions = await listAdminSubmissions();

    expect(submissions).toEqual({
      rsvps: [],
      newsletter: [],
      applications: [{ id: "application-1" }],
      contacts: [],
    } satisfies AdminSubmissions);
  });
});
