// 名刺の内容をURLに載せて共有するためのエンコード。入力一式をJSONにし、
// UTF-8安全なbase64urlでハッシュに格納する。サーバーは介在しない。

import type { CardData } from './card';
import { deserializeCard } from './card';

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(token: string): Uint8Array {
  const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function encodeCard(card: CardData): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(card)));
}

export function decodeCard(token: string): CardData | null {
  try {
    return deserializeCard(new TextDecoder().decode(fromBase64Url(token)));
  } catch {
    return null;
  }
}

/** 共有用のハッシュ片(例: `#c=...`)を返す。 */
export function cardToHash(card: CardData): string {
  return `#c=${encodeCard(card)}`;
}

/** `location.hash` から名刺を復元する。該当しなければnull。 */
export function cardFromHash(hash: string): CardData | null {
  const match = /[#&]c=([^&]+)/.exec(hash);
  return match && match[1] !== undefined ? decodeCard(match[1]) : null;
}
