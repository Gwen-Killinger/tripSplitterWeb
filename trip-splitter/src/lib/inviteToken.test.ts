import { describe, expect, it } from "vitest";
import {
  generateInviteToken,
  hashInviteToken,
} from "./inviteToken";

describe("invite tokens", () => {
  it("generates cryptographically random 32-byte hex tokens", () => {
    const first = generateInviteToken();
    const second = generateInviteToken();

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toBe(second);
  });

  it("hashes tokens deterministically without returning plaintext", async () => {
    const token = "test-token";
    const first = await hashInviteToken(token);
    const second = await hashInviteToken(token);

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toBe(second);
    expect(first).not.toContain(token);
  });
});
