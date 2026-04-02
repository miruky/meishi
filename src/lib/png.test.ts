import { describe, expect, it } from 'vitest';
import { parseViewBox, withPixelSize, svgToDataUrl, pngFilename } from './png';

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 364 220"><rect/></svg>';

describe('parseViewBox', () => {
  it('viewBoxから幅と高さを取り出す', () => {
    expect(parseViewBox(SVG)).toEqual({ width: 364, height: 220 });
  });

  it('負のオフセットを許容する', () => {
    expect(parseViewBox('<svg viewBox="-5 -5 100 50">')).toEqual({ width: 100, height: 50 });
  });

  it('viewBoxが無ければnull', () => {
    expect(parseViewBox('<svg width="10">')).toBeNull();
  });

  it('幅か高さが0以下ならnull', () => {
    expect(parseViewBox('<svg viewBox="0 0 0 50">')).toBeNull();
  });
});

describe('withPixelSize', () => {
  it('ルートのsvgにwidth/heightを足す', () => {
    const out = withPixelSize(SVG, 728, 440);
    expect(out).toContain('<svg width="728" height="440"');
    expect(out).toContain('viewBox="0 0 364 220"');
  });
});

describe('svgToDataUrl', () => {
  it('image/svg+xmlのデータURLを作る', () => {
    const url = svgToDataUrl('<svg/>');
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(url).toContain(encodeURIComponent('<svg/>'));
  });
});

describe('pngFilename', () => {
  it('.svgを.pngに置き換える', () => {
    expect(pngFilename('meishi.svg')).toBe('meishi.png');
    expect(pngFilename('ogp')).toBe('ogp.png');
  });
});
