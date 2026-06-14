# ⚡ ZTH Tracker — Zethereum Mining Tracker

**Язык / Language:** [Русский](#русский) · [English](#english)

---

## Русский

### Что это такое

ZTH Tracker — веб-приложение для отслеживания баланса и истории транзакций на блокчейне [Signum](https://signum.network). Поддерживает три токена:

- ⚡ **ZTH (Zethereum)** — основной токен экосистемы
- ⛏ **VGB** — токен майнинга, увеличивает мощность добычи ZTH
- 💎 **SIGNA** — нативная монета блокчейна Signum

### Возможности

- 🔍 Просмотр баланса ZTH, VGB и SIGNA по любому адресу
- 📊 История транзакций (входящие и исходящие) с фильтрами по токену
- 💰 Получение ZTH-дистрибуций от контрактов GrandPoolZTH и GrandRewardZTH
- 💎 Получение SIGNA-дивидендов от контракта ZTHDividendsPayer
- 🛒 Покупка VGB через Signum Wallet v2, XT Wallet или Phoenix Wallet
- 🌐 Выбор ноды Signum с проверкой пинга (6 публичных нод)
- 🌍 Поддержка трёх языков: **Русский, English, Español**
- 📱 **PWA** — устанавливается на смартфон как нативное приложение

### Технологии

- **Frontend:** React 18 + Vite
- **Стили:** Tailwind CSS
- **Блокчейн:** Signum Node API
- **Кошельки:** Signum Wallet v2 (SRC-22 deeplink), XT Wallet (browser extension), Phoenix Wallet
- **Деплой:** Vercel (serverless proxy для обхода CORS)

### Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/RoyalRanger/zth-tracker-open.git
cd zth-tracker-open

# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev

# Собрать для продакшена
npm run build
```

### Деплой на Vercel

1. Форкни репозиторий
2. Создай проект на [vercel.com](https://vercel.com)
3. Подключи репозиторий — Vercel автоматически определит Vite
4. Serverless функция `api/proxy.js` обеспечит CORS-прокси к нодам Signum

### Структура проекта

```
├── api/
│   └── proxy.js              # Vercel serverless CORS-прокси
├── public/
│   ├── manifest.json         # PWA манифест
│   ├── sw.js                 # Service Worker
│   ├── zth-logo.png          # Логотип
│   └── icons/                # Иконки PWA
├── src/
│   ├── api/
│   │   ├── signum.js         # Клиент Signum API
│   │   └── price.js          # Цены (CoinGecko)
│   ├── components/
│   │   ├── AddressInput.jsx
│   │   ├── BalanceDashboard.jsx
│   │   ├── BuyVGB.jsx
│   │   ├── InstallPrompt.jsx # PWA-баннер установки
│   │   ├── NodeSelector.jsx
│   │   └── TransactionHistory.jsx
│   ├── hooks/
│   │   ├── useAccount.js
│   │   └── useNodes.js
│   └── i18n/
│       ├── lang.js           # Хранилище текущего языка
│       ├── translations.js   # Переводы RU/EN/ES
│       └── LangContext.jsx   # React контекст языка
└── index.html
```

### Установка PWA на смартфон

- **Android (Chrome):** открой сайт → три точки → «Добавить на главный экран»
- **iPhone (Safari):** открой сайт → кнопка «Поделиться» → «На экран Домой»

Или просто подожди 3 минуты — приложение само предложит установку.

### Лицензия

MIT — используй свободно.

---

## English

### What is this

ZTH Tracker is a web application for tracking balances and transaction history on the [Signum](https://signum.network) blockchain. Supports three tokens:

- ⚡ **ZTH (Zethereum)** — main ecosystem token
- ⛏ **VGB** — mining token that boosts ZTH production power
- 💎 **SIGNA** — native coin of the Signum blockchain

### Features

- 🔍 View ZTH, VGB and SIGNA balances for any address
- 📊 Transaction history (incoming & outgoing) with token filters
- 💰 ZTH distributions from GrandPoolZTH and GrandRewardZTH contracts
- 💎 SIGNA dividends from the ZTHDividendsPayer contract
- 🛒 Buy VGB via Signum Wallet v2, XT Wallet or Phoenix Wallet
- 🌐 Signum node selector with ping check (6 public nodes)
- 🌍 Three languages: **Russian, English, Spanish**
- 📱 **PWA** — installs on your smartphone as a native app

### Tech Stack

- **Frontend:** React 18 + Vite
- **Styles:** Tailwind CSS
- **Blockchain:** Signum Node API
- **Wallets:** Signum Wallet v2 (SRC-22 deeplink), XT Wallet (browser extension), Phoenix Wallet
- **Deployment:** Vercel (serverless proxy for CORS bypass)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/RoyalRanger/zth-tracker-open.git
cd zth-tracker-open

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

### Deploy to Vercel

1. Fork this repository
2. Create a project on [vercel.com](https://vercel.com)
3. Connect the repository — Vercel will auto-detect Vite
4. The serverless function `api/proxy.js` handles CORS proxying to Signum nodes

### Project Structure

```
├── api/
│   └── proxy.js              # Vercel serverless CORS proxy
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service Worker
│   ├── zth-logo.png          # Logo
│   └── icons/                # PWA icons
├── src/
│   ├── api/
│   │   ├── signum.js         # Signum API client
│   │   └── price.js          # Prices (CoinGecko)
│   ├── components/
│   │   ├── AddressInput.jsx
│   │   ├── BalanceDashboard.jsx
│   │   ├── BuyVGB.jsx
│   │   ├── InstallPrompt.jsx # PWA install banner
│   │   ├── NodeSelector.jsx
│   │   └── TransactionHistory.jsx
│   ├── hooks/
│   │   ├── useAccount.js
│   │   └── useNodes.js
│   └── i18n/
│       ├── lang.js           # Current language store
│       ├── translations.js   # Translations RU/EN/ES
│       └── LangContext.jsx   # React language context
└── index.html
```

### Install as PWA on your phone

- **Android (Chrome):** open the site → three dots → "Add to Home Screen"
- **iPhone (Safari):** open the site → Share button → "Add to Home Screen"

Or just wait 3 minutes — the app will offer installation automatically.

### License

MIT — use freely.

---

> Built on [Signum Network](https://signum.network) · Token ZTH: `9518219425200752102` · Token VGB: `9381200141252723234`
