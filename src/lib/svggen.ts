// 名刺とOGP画像のSVG生成。フォントは閲覧環境のシステムフォントに任せ、
// 文字はすべてエスケープして埋め込む。書体・寄せ方・OGP寸法は入力で切り替える。

import type { CardData, FontChoice, OgpSize } from './card';

export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface Palette {
  bg: string;
  ink: string;
  muted: string;
}

function palette(dark: boolean): Palette {
  return dark
    ? { bg: '#1e1f22', ink: '#f0efec', muted: '#a8a69f' }
    : { bg: '#fdfcfa', ink: '#26241f', muted: '#6e6a60' };
}

const FONT_STACKS: Record<FontChoice, string> = {
  sans: `'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif`,
  mincho: `'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif`,
  mono: `ui-monospace, 'SFMono-Regular', Menlo, 'Courier New', monospace`,
};

const OGP_DIMS: Record<OgpSize, readonly [number, number]> = {
  og: [1200, 630],
  square: [1200, 1200],
  wide: [1600, 900],
};

/**
 * 名刺(91×55mm)のSVG。1mm=4単位のviewBox(364×220)で、
 * 印刷時はそのまま91×55mmに合わせられる。
 */
export function meishiSvg(card: CardData): string {
  const p = palette(card.dark);
  const font = FONT_STACKS[card.font];
  const contacts = [card.email, card.site].filter((v) => v.trim() !== '');
  const body =
    card.layout === 'centered'
      ? meishiCentered(card, p, contacts)
      : meishiStandard(card, p, contacts);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 364 220" role="img" aria-label="${esc(card.name)}の名刺">
  <title>${esc(card.name)}の名刺</title>
  <g font-family="${font}">
${body}
  </g>
</svg>`;
}

function meishiStandard(card: CardData, p: Palette, contacts: string[]): string {
  const contactLines = contacts
    .map(
      (line, i) =>
        `  <text x="28" y="${168 + i * 18}" font-size="11" fill="${p.muted}">${esc(line)}</text>`,
    )
    .join('\n');
  return [
    `  <rect width="364" height="220" rx="10" fill="${p.bg}"/>`,
    `  <rect x="0" y="0" width="10" height="220" rx="5" fill="${card.accent}"/>`,
    card.org.trim() !== ''
      ? `  <text x="28" y="44" font-size="13" fill="${p.muted}">${esc(card.org)}</text>`
      : '',
    `  <text x="28" y="98" font-size="30" font-weight="700" fill="${p.ink}">${esc(card.name)}</text>`,
    card.sub.trim() !== ''
      ? `  <text x="28" y="120" font-size="12" letter-spacing="1" fill="${p.muted}">${esc(card.sub)}</text>`
      : '',
    card.title.trim() !== ''
      ? `  <text x="28" y="143" font-size="13" fill="${card.accent}" font-weight="600">${esc(card.title)}</text>`
      : '',
    contactLines,
  ]
    .filter((s) => s !== '')
    .join('\n');
}

function meishiCentered(card: CardData, p: Palette, contacts: string[]): string {
  const cx = 182;
  const contactLines = contacts
    .map(
      (line, i) =>
        `  <text x="${cx}" y="${172 + i * 18}" font-size="11" text-anchor="middle" fill="${p.muted}">${esc(line)}</text>`,
    )
    .join('\n');
  return [
    `  <rect width="364" height="220" rx="10" fill="${p.bg}"/>`,
    card.org.trim() !== ''
      ? `  <text x="${cx}" y="44" font-size="13" text-anchor="middle" fill="${p.muted}">${esc(card.org)}</text>`
      : '',
    `  <text x="${cx}" y="96" font-size="30" font-weight="700" text-anchor="middle" fill="${p.ink}">${esc(card.name)}</text>`,
    `  <rect x="${cx - 28}" y="110" width="56" height="3" rx="1.5" fill="${card.accent}"/>`,
    card.sub.trim() !== ''
      ? `  <text x="${cx}" y="134" font-size="12" letter-spacing="1" text-anchor="middle" fill="${p.muted}">${esc(card.sub)}</text>`
      : '',
    card.title.trim() !== ''
      ? `  <text x="${cx}" y="156" font-size="13" text-anchor="middle" fill="${card.accent}" font-weight="600">${esc(card.title)}</text>`
      : '',
    contactLines,
  ]
    .filter((s) => s !== '')
    .join('\n');
}

/** OGP画像。寸法プリセット(og / square / wide)と寄せ方で構図が変わる。 */
export function ogpSvg(card: CardData): string {
  const p = palette(card.dark);
  const font = FONT_STACKS[card.font];
  const [w, h] = OGP_DIMS[card.ogpSize];
  const centered = card.layout === 'centered';
  const x = centered ? Math.round(w / 2) : Math.round(w * 0.075);
  const anchor = centered ? ' text-anchor="middle"' : '';

  const nameY = Math.round(h * 0.556);
  const titleY = nameY - Math.round(h * 0.159);
  const subY = nameY + Math.round(h * 0.092);
  const footY = h - Math.round(h * 0.143);
  const nameSize = Math.round(h * 0.121);
  const titleSize = Math.round(h * 0.054);
  const subSize = Math.round(h * 0.044);
  const footSize = Math.round(h * 0.041);
  const barH = Math.round(h * 0.032);

  const footer = [card.org, card.site].filter((v) => v.trim() !== '').join('   ');
  const parts = [
    `  <rect width="${w}" height="${h}" fill="${p.bg}"/>`,
    `  <rect x="0" y="${h - barH}" width="${w}" height="${barH}" fill="${card.accent}"/>`,
    `  <circle cx="${w - 150}" cy="${Math.round(h * 0.19)}" r="${Math.round(h * 0.27)}" fill="${card.accent}" opacity="0.12"/>`,
    `  <circle cx="${w - 80}" cy="${Math.round(h * 0.095)}" r="${Math.round(h * 0.143)}" fill="${card.accent}" opacity="0.18"/>`,
    card.title.trim() !== ''
      ? `  <text x="${x}" y="${titleY}" font-size="${titleSize}"${anchor} fill="${card.accent}" font-weight="600">${esc(card.title)}</text>`
      : '',
    `  <text x="${x}" y="${nameY}" font-size="${nameSize}" font-weight="700"${anchor} fill="${p.ink}">${esc(card.name)}</text>`,
    card.sub.trim() !== ''
      ? `  <text x="${x}" y="${subY}" font-size="${subSize}" letter-spacing="2"${anchor} fill="${p.muted}">${esc(card.sub)}</text>`
      : '',
    footer !== ''
      ? `  <text x="${x}" y="${footY}" font-size="${footSize}"${anchor} fill="${p.muted}">${esc(footer)}</text>`
      : '',
  ].filter((s) => s !== '');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(card.name)}のOGP画像">
  <title>${esc(card.name)}のOGP画像</title>
  <g font-family="${font}">
${parts.join('\n')}
  </g>
</svg>`;
}
