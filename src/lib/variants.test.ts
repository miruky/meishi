import { describe, expect, it } from 'vitest';
import { defaultCard, deserializeCard, normalizeCard, type CardData } from './card';
import { meishiSvg, ogpSvg } from './svggen';

function card(over: Partial<CardData> = {}): CardData {
  return { ...defaultCard(), ...over };
}

describe('書体の切り替え', () => {
  it('明朝・等幅がfont-familyに反映される', () => {
    expect(meishiSvg(card({ font: 'mincho' }))).toContain('Hiragino Mincho ProN');
    expect(meishiSvg(card({ font: 'mono' }))).toContain('monospace');
    expect(ogpSvg(card({ font: 'mono' }))).toContain('monospace');
  });
});

describe('名刺の寄せ方', () => {
  it('中央寄せはtext-anchorとアクセント下線を使い、左帯を持たない', () => {
    const svg = meishiSvg(card({ layout: 'centered' }));
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('width="56" height="3"');
    expect(svg).not.toContain('width="10" height="220"');
  });

  it('標準は左帯を持ち中央寄せにしない', () => {
    const svg = meishiSvg(card({ layout: 'standard' }));
    expect(svg).toContain('width="10" height="220"');
    expect(svg).not.toContain('text-anchor="middle"');
  });
});

describe('OGPの寸法プリセット', () => {
  it('正方形と横長でviewBoxが変わる', () => {
    expect(ogpSvg(card({ ogpSize: 'square' }))).toContain('viewBox="0 0 1200 1200"');
    expect(ogpSvg(card({ ogpSize: 'wide' }))).toContain('viewBox="0 0 1600 900"');
  });

  it('中央寄せのOGPはtext-anchorを使う', () => {
    expect(ogpSvg(card({ layout: 'centered' }))).toContain('text-anchor="middle"');
  });
});

describe('旧データの移行', () => {
  it('新項目の無い保存値は既定で補われる', () => {
    const legacy = {
      name: '甲',
      sub: '',
      title: '',
      org: '',
      email: '',
      site: '',
      accent: '#123456',
      dark: false,
    };
    const got = deserializeCard(JSON.stringify(legacy));
    expect(got).not.toBeNull();
    expect(got?.font).toBe('sans');
    expect(got?.layout).toBe('standard');
    expect(got?.ogpSize).toBe('og');
  });

  it('不正な列挙値は既定へ倒す', () => {
    const got = normalizeCard({ ...defaultCard(), font: 'comic', layout: 9, ogpSize: null });
    expect(got.font).toBe('sans');
    expect(got.layout).toBe('standard');
    expect(got.ogpSize).toBe('og');
  });
});
