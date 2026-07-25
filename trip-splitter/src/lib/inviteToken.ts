const TOKEN_BYTE_LENGTH = 32;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function generateInviteToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTE_LENGTH);
  crypto.getRandomValues(bytes);

  return bytesToHex(bytes);
}

export async function hashInviteToken(
  token: string,
): Promise<string> {
  const encodedToken = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encodedToken,
  );

  return bytesToHex(new Uint8Array(digest));
}
