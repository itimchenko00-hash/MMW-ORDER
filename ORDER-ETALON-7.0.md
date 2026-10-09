# ORDER ETALON 7.0

Frozen source baseline recorded on 2026-10-09.

- Production service: https://mmw-order.onrender.com
- Repository: https://github.com/itimchenko00-hash/MMW-ORDER
- Production branch: main
- Production commit: b5e72a692eecb276b43eb57c5dbd5c6a641d7c6c
- Etalon branch: ETALON/ORDER-7.0-2026-10-09
- Pre-change rollback branch: BACKUP/BEFORE-ORDER-ETALON7-2026-10-09
- Previous live production baseline: c4a2941852c501fcf627e381c34fb4f7eecfae46

## Changes in this version
- Responsive mobile layout for small screens and tablets.
- Safe-area spacing for floating controls and modal dialogs.
- Better wrapping for long labels, product names, and order details.
- Cart recovery if the browser's saved cart JSON is invalid.
- Cart quantity capped at 99 per item.
- Static asset query versions updated to avoid stale browser cache.

## Boundaries
- No server-side order logic or database schema changed in this stabilization pass.
- No production environment variables or secrets copied into this repository.
- Render deployment for commit b5e72a692eecb276b43eb57c5dbd5c6a641d7c6c reported Live.
- A real end-to-end test order and visual verification on a physical phone should still be completed manually before treating mobile QA as fully signed off.
