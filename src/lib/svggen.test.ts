import { describe, expect, it } from 'vitest';
import { defaultCard, deserializeCard, createStore, type CardData } from './card';
import { esc, meishiSvg, ogpSvg } from './svggen';

function card(over: Partial<CardData> = {}): CardData {
  return { ...defaultCard(), ...over };
}

describe('esc', () => {
  it('XMLに危険な文字を逃がす', () => {
    expect(esc('<A & "B">')).toBe('&lt;A &amp; &quot;B&quot;&gt;');
  });
});

describe('meishiSvg', () => {
  it('91×55mm相当のviewBoxを持ち、名前を含む', () => {
    const svg = meishiSvg(card());
    expect(svg).toContain('viewBox="0 0 364 220"');
    expect(svg).toContain('山田 花子');
    expect(svg).toContain('Hanako Yamada');
  });

  it('名前に含まれる記号をエスケープする', () => {
    const svg = meishiSvg(card({ name: 'A & B <C>' }));
    expect(svg).toContain('A &amp; B &lt;C&gt;');
    expect(svg).not.toContain('B <C>');
  });

  it('空欄の項目は要素ごと出さない', () => {
    const svg = meishiSvg(card({ title: '', org: '', email: '', site: '' }));
    expect(svg).not.toContain('font-weight="600"');
    expect(svg.match(/<text/g)).toHaveLength(2);
  });

  it('アクセント色が帯に使われる', () => {
    const svg = meishiSvg(card({ accent: '#a93226' }));
    expect(svg).toContain('fill="#a93226"');
  });

  it('暗い地色に切り替えられる', () => {
    expect(meishiSvg(card({ dark: true }))).toContain('#1e1f22');
    expect(meishiSvg(card({ dark: false }))).toContain('#fdfcfa');
  });
});

describe('ogpSvg', () => {
  it('1200×630のviewBoxを持つ', () => {
    const svg = ogpSvg(card());
    expect(svg).toContain('viewBox="0 0 1200 630"');
    expect(svg).toContain('山田 花子');
  });

  it('所属とサイトをまとめた下段を持つ', () => {
    const svg = ogpSvg(card({ org: 'yamada.dev', site: 'https://yamada.dev' }));
    expect(svg).toContain('yamada.dev   https://yamada.dev');
  });
});

describe('card store', () => {
  it('保存して読み戻せ、壊れたデータはnull', () => {
    const map = new Map<string, string>();
    const store = createStore({
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => void map.set(k, v),
    });
    expect(store.load()).toBeNull();
    store.save(card());
    expect(store.load()).toEqual(card());
    expect(deserializeCard('{')).toBeNull();
    expect(deserializeCard(JSON.stringify({ ...card(), accent: 'red' }))).toBeNull();
  });
});
