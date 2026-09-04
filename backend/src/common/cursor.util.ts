/**
 * Cursor-based pagination helper.
 *
 * Cursor = base64(JSON({ ts, id }))
 * Opaque to the client, debuggable on the server.
 */

export interface CursorPayload {
  ts: string;
  id: string;
}

export function encodeCursor(ts: string, id: string): string {
  return Buffer.from(JSON.stringify({ ts, id })).toString('base64');
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
    if (!decoded.ts || !decoded.id) throw new Error('invalid cursor shape');
    return decoded;
  } catch {
    throw new Error('Invalid cursor');
  }
}
