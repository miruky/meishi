import './style.css';
import { createApp } from './app';
import { createStore, defaultCard } from './lib/card';

const root = document.getElementById('app');
if (!root) throw new Error('#app が見つかりません');

const store = createStore(localStorage);

// 初回起動は見本の内容から始める。一度でも保存があればその状態を尊重する
let card = store.load();
if (card === null) {
  card = defaultCard();
  store.save(card);
}

createApp({ root, store, initialCard: card });
