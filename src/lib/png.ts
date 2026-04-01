// SVG文字列をPNGに変換する。OGPを受け付けるサービスはSVGより画像形式を
// 求めることが多いため、ブラウザのcanvasでラスタライズして書き出す。

export interface Size {
  width: number;
  height: number;
}

/** viewBoxから論理サイズを取り出す。`min-x min-y width height` を想定。 */
export function parseViewBox(svg: string): Size | null {
  const match = /viewBox="([\d.\s-]+)"/.exec(svg);
  if (!match || match[1] === undefined) return null;
  const parts = match[1].trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const width = parts[2];
  const height = parts[3];
  if (width === undefined || height === undefined || width <= 0 || height <= 0) return null;
  return { width, height };
}

/** ルート要素に明示的なwidth/heightを与える。Imageが寸法0で描けない事態を防ぐ。 */
export function withPixelSize(svg: string, width: number, height: number): string {
  return svg.replace(/^\s*<svg\b/, `<svg width="${width}" height="${height}"`);
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function pngFilename(base: string): string {
  return base.replace(/\.svg$/i, '') + '.png';
}

/**
 * SVGをPNG Blobに変換する。scaleで解像度を上げられる(印刷やRetina向け)。
 * canvasやImageの無い環境では呼べない。
 */
export async function svgToPngBlob(svg: string, scale = 2): Promise<Blob> {
  const box = parseViewBox(svg);
  if (!box) throw new Error('viewBoxを読み取れませんでした');
  const width = Math.round(box.width * scale);
  const height = Math.round(box.height * scale);

  const img = new Image();
  img.width = width;
  img.height = height;
  const url = svgToDataUrl(withPixelSize(svg, width, height));
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('SVGの読み込みに失敗しました'));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvasが利用できません');
  ctx.drawImage(img, 0, 0, width, height);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNGへの変換に失敗しました'));
    }, 'image/png');
  });
}
