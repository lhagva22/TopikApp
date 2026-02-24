## 🏗️ Архитектур

Төсөл нь **Feature-Based Modular Architecture** ашигласан:

- **`src/core/`** – Үндсэн тохиргоо, constants, utils, shared hooks
- **`src/features/`** – Функционал модулиуд (auth, home, payment, exam, progress)
- **`src/services/`** – API дуудалт, гадаад системтэй харилцах
- **`src/shared/`** – Хуваалцах компонентууд (atoms, molecules, organisms)
- **`src/store/`** – Глобал state (Zustand)