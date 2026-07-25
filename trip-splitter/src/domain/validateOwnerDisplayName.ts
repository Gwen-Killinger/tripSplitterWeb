export function validateOwnerDisplayName(
  displayName: string,
): string {
  const trimmedDisplayName = displayName.trim();

  if (trimmedDisplayName.length === 0) {
    throw new Error("Enter your name.");
  }

  return trimmedDisplayName;
}
