import './style.css';
import { createApp } from './app';
import { createStore, defaultCard } from './lib/card';
import { cardFromHash } from './lib/share';

const root = document.getElementById('app');
if (!root) throw new Error('#app が見つかりません');

const store = createStore(localStorage);

// 共有リンク(#c=...)があればそれを最優先で開く。
// 次に前回の保存、どちらも無ければ見本の内容から始める。
const shared = cardFromHash(location.hash);
let card = shared ?? store.load();
if (card === null) {
  card = defaultCard();
}
store.save(card);

createApp({ root, store, initialCard: card });
