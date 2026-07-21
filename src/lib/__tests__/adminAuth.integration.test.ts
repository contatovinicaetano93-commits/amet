import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

import { checkAdminAccess } from "@/lib/adminAuth";

const TEST_IP = "203.0.113.250"; // TEST-NET-3, reserved for documentation/testing
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function makeRequest(key: string): Request {
  return new Request("http://localhost/api/candidaturas", {
    headers: { "x-admin-key": key, "x-forwarded-for": TEST_IP },
  });
}

beforeAll(() => {
  process.env.ADMIN_KEY = "test-secret-key";
});

afterAll(async () => {
  await pool.query(`DELETE FROM admin_access_log WHERE ip = $1`, [TEST_IP]);
  await pool.end();
});

describe("checkAdminAccess", () => {
  it("rejects the wrong key", async () => {
    const result = await checkAdminAccess(makeRequest("wrong-key"), "test");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("accepts the correct key", async () => {
    const result = await checkAdminAccess(makeRequest("test-secret-key"), "test");
    expect(result.ok).toBe(true);
  });

  it("rate-limits an IP after repeated failed attempts", async () => {
    let last;
    for (let i = 0; i < 12; i++) {
      last = await checkAdminAccess(makeRequest("still-wrong"), "test");
    }
    expect(last?.ok).toBe(false);
    if (last && !last.ok) expect(last.status).toBe(429);
  }, 15_000);
});
