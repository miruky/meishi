import { describe, expect, it } from 'vitest';
import { defaultCard, type CardData } from './card';
import { encodeCard, decodeCard, cardToHash, cardFromHash } from './share';

function card(over: Partial<CardData> = {}): CardData {
  return { ...defaultCard(), ...over };
}

describe('share encode/decode', () => {
  it('日本語を含む名刺を往復できる', () => {
    const c = card({ name: '山田 花子', org: '株式会社あいう' });
    expect(decodeCard(encodeCard(c))).toEqual(c);
  });

  it('base64urlは+ / =を含まない', () => {
    const token = encodeCard(card({ name: 'A'.repeat(40) }));
    expect(token).not.toMatch(/[+/=]/);
  });

  it('壊れたトークンはnull', () => {
    expect(decodeCard('!!!not-base64!!!')).toBeNull();
    expect(decodeCard('')).toBeNull();
  });

  it('型に合わないデータはnull', () => {
    const bad = btoa(JSON.stringify({ name: 1 }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeCard(bad)).toBeNull();
  });
});

describe('hash helpers', () => {
  it('cardToHashは#c=で始まる', () => {
    expect(cardToHash(card())).toMatch(/^#c=/);
  });

  it('cardFromHashはハッシュから復元する', () => {
    const c = card({ name: '甲斐' });
    expect(cardFromHash(cardToHash(c))).toEqual(c);
  });

  it('該当しないハッシュはnull', () => {
    expect(cardFromHash('#foo=bar')).toBeNull();
    expect(cardFromHash('')).toBeNull();
  });
});
