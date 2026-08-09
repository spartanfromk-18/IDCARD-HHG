export const SHARES_DIR = "shares";

const BLOCKED = new Set([".", "..", "_next", "api"]);

export function isBlocklistedId(id: string): boolean {
  return (
    BLOCKED.has(id) ||
    id.length < 8 ||
    id.length > 64 ||
    !/^[a-z0-9-]+$/.test(id)
  );
}