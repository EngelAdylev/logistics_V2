# Analytics Hub — Дизайн

**Дата:** 2026-05-26  
**Статус:** Approved  
**Путь:** `mvps/analytics-hub/`

---

## Цель

Дашборд для технической поддержки — видеть состояние потока пакетов Datareon и заказов в реальном времени, чтобы замечать проблемы раньше пользователей и самостоятельно диагностировать без привлечения разработчиков.

---

## Стек

| Слой | Технология |
|------|-----------|
| Backend | Java 17 + Spring Boot 3.x + Spring Data JPA |
| Database | ALIS PostgreSQL (read-only, схема `alis`) |
| Frontend | React + TypeScript + MUI v6 |
| Обновление данных | Polling каждые 10 секунд |
| Структура | Аналогична `mvps/railway-dislocation-java` |

Backend читает из ALIS PostgreSQL только на чтение. Никаких записей в таблицы ALIS.

---

## Архитектура

```
ALIS PostgreSQL (read-only)
        │
        ▼
Spring Boot (REST API)
  ├── /api/datareon/summary     — счётчики за час
  ├── /api/datareon/events      — список событий с фильтрами
  ├── /api/orders/summary       — сводка по статусам
  └── /api/orders/stuck         — зависшие заказы
        │
        ▼
React Frontend (polling 10s)
  ├── Главный экран — пакеты Datareon
  └── Вкладка — Заказы
```

---

## Источники данных

| Таблица | Использование |
|---------|--------------|
| `alis.inbound_event` | Входящие пакеты Datareon (← WMS, TOS, 1С, ETRAN) |
| `alis.outbound_data` | Исходящие пакеты Datareon (→ WMS, TOS, 1С, ETRAN) |
| `alis.inbound_event_config` | Типы входящих событий (для человекочитаемых названий) |
| `alis.outbound_config` | Типы исходящих сообщений |
| `alis.receiving_order` | Заявки на приёмку |
| `alis.shipping_order` | Заявки на отгрузку |
| `alis.client` | Клиенты (для фильтрации заказов по клиенту) |

---

## Главный экран — Пакеты Datareon

### Счётчики (за последний час)

Четыре карточки вверху страницы:
- **Всего** — общее количество событий
- **Успешно** — обработанные без ошибок
- **Ошибки** — события с ошибкой обработки
- **Зависли** — события без финального статуса дольше 15 минут

### Таблица событий

Колонки: Время | Направление | Система | Тип события | Статус | Ошибка (если есть)

- **Направление:** Входящий (← из WMS/TOS/1С/ETRAN) / Исходящий (→ в WMS/TOS/1С/ETRAN)
- **Система:** 1С, WMS, TOS, ETRAN
- **Статус:** цветовая индикация — зелёный (успех), красный (ошибка), жёлтый (в обработке)
- Пагинация: 50 записей на страницу, сортировка по времени (новые сверху)

### Фильтры

- По системе (чекбоксы: 1С / WMS / TOS / ETRAN)
- По статусу (Все / Ошибки / Зависли)
- По временному диапазону (последний час / 6 часов / 24 часа)

---

## Вкладка — Заказы

### Сводка по статусам

Шесть карточек — количество заявок в каждом статусе прямо сейчас:

`DRAFT` | `ON_REVIEW` | `ACCEPTED` | `IN_PROGRESS` | `DONE`

Отдельно выделены два типа: **Приёмка** (`receiving_order`) и **Отгрузка** (`shipping_order`).

### Зависшие заказы

Таблица заказов в статусе `IN_PROGRESS` дольше 4 часов:

Колонки: Тип (приёмка/отгрузка) | Номер заказа | Клиент | Статус | Время в статусе

Пороговое значение "завис" — 4 часа (можно будет сделать настраиваемым позже).

### Фильтры

- По типу заказа (Приёмка / Отгрузка / Все)
- По клиенту (выпадающий список)
- По дате создания

---

## Структура проекта

```
mvps/analytics-hub/
├── backend/
│   ├── build.gradle
│   ├── src/main/java/ru/alabuga/analytics/
│   │   ├── config/
│   │   │   ├── DataSourceConfig.java      — read-only подключение к ALIS DB
│   │   │   └── SecurityConfig.java        — dev: без авторизации
│   │   ├── controller/
│   │   │   ├── DatareonController.java
│   │   │   └── OrderController.java
│   │   ├── dto/
│   │   │   ├── datareon/EventDto.java
│   │   │   ├── datareon/SummaryDto.java
│   │   │   ├── orders/OrderDto.java
│   │   │   └── orders/OrderSummaryDto.java
│   │   ├── repository/
│   │   │   ├── InboundEventRepository.java
│   │   │   ├── OutboundDataRepository.java
│   │   │   ├── ReceivingOrderRepository.java
│   │   │   └── ShippingOrderRepository.java
│   │   └── service/
│   │       ├── DatareonService.java
│   │       └── OrderService.java
│   └── src/main/resources/
│       └── application.yml
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── datareon.ts
    │   │   └── orders.ts
    │   ├── components/
    │   │   ├── Layout.tsx
    │   │   └── StatCard.tsx
    │   ├── hooks/
    │   │   └── usePolling.ts              — универсальный polling hook (10s)
    │   ├── pages/
    │   │   ├── DatareonPage.tsx
    │   │   └── OrdersPage.tsx
    │   └── App.tsx
    ├── package.json
    └── vite.config.ts
```

---

## Обработка ошибок

- Если ALIS PostgreSQL недоступен — бэкенд возвращает 503, фронтенд показывает баннер "Нет соединения с БД"
- Если данных нет за выбранный период — таблица показывает "Нет данных" (не ошибку)
- Polling при сетевой ошибке — повторная попытка через 10 секунд без уведомления пользователя (тихий ретрай)

---

## Что не входит в скоуп (v1)

- Авторизация (добавить позже, аналогично railway-dislocation-java)
- Алерты / уведомления
- Запись или изменение данных в ALIS
- Исторические графики и тренды
- Детальный просмотр отдельного пакета (drill-down)
