// UIで使う線画アイコン。24pxグリッド・stroke=currentColorで統一し、
// 隣に必ずテキストラベルを置く前提ですべて装飾(aria-hidden)とする。

const svg = (body: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const icons = {
  logo: svg(
    '<rect x="3" y="6" width="18" height="12" rx="2"/>' +
      '<path d="M3 9.5h2.5"/>' +
      '<path d="M7.5 11.5h6"/>' +
      '<path d="M7.5 14.5h4"/>',
  ),
  download: svg('<path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>'),
  image: svg(
    '<rect x="3" y="4" width="18" height="16" rx="2"/>' +
      '<circle cx="8.5" cy="9.5" r="1.5"/>' +
      '<path d="m4 18 5-5 4 3 3-3 4 4"/>',
  ),
  copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/>' + '<path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
  link: svg(
    '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5"/>' +
      '<path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.5-1.5"/>',
  ),
  refresh: svg('<path d="M3 11a9 9 0 0 1 15-6l3 3"/><path d="M21 13a9 9 0 0 1-15 6l-3-3"/>'),
  sun: svg(
    '<circle cx="12" cy="12" r="4"/>' +
      '<path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/>',
  ),
  moon: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>'),
  auto: svg('<circle cx="12" cy="12" r="9"/>' + '<path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" stroke="none"/>'),
} as const;
