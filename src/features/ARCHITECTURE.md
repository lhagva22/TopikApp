# Feature Architecture

Features use a feature-based Clean Architecture shape. Each feature owns its domain, data access, and presentation code.

```text
src/features/<feature>/
  data/
  domain/
  presentation/
  index.ts
```

For `.tsx` feature roots, `index.tsx` is also fine.

## Layers

- `domain`: entities, value types, repository contracts, use-case factories, and pure business rules.
- `data`: API clients, storage adapters, external service integrations, DTO mapping, and repository implementations.
- `presentation`: React Native screens, hooks, state stores, providers, navigation-specific types, and UI components.

## Dependency Direction

```text
presentation -> presentation/dependencies -> domain/useCases -> domain/repositories
data -> domain/repositories
domain -> no data or presentation dependency
```

Rules:

- `domain` must not import `data`, `presentation`, or `app`.
- `data` must not import `presentation`.
- `presentation` must not import `data` directly.
- `presentation/dependencies.ts` is the composition root and may connect data implementations to domain use cases.
- Feature root `index` files expose the public API of a feature and must not export raw `data/api` clients.

## Feature Template

```text
src/features/example/
  domain/
    types.ts
    repositories.ts
    useCases.ts
  data/
    api/exampleApi.ts
    exampleRepository.ts
  presentation/
    dependencies.ts
    screens/ExampleScreen.tsx
    hooks/useExample.ts
  index.ts
```

Minimal flow:

1. Define domain entities and responses in `domain/types.ts`.
2. Define repository contracts in `domain/repositories.ts`.
3. Define use-case factories in `domain/useCases.ts`.
4. Implement the contract in `data/<feature>Repository.ts`.
5. Wire implementations to use cases in `presentation/dependencies.ts`.
6. Use only those use cases from screens, hooks, stores, and providers.
7. Export public screens, hooks, providers, and domain types from `index.ts`.

## Cross-Feature Imports

Prefer importing from another feature root:

```ts
import { PaymentScreen, usePaymentModal } from '../../payment';
import { LEVELS } from '../../home';
```

Avoid importing another feature's private layers directly:

```ts
// Avoid
import { LEVELS } from '../../home/domain/constants/levels';
import { paymentApi } from '../../payment/data/api/paymentApi';
```

## Enforcement

- ESLint boundary rules live in `.eslintrc.js`.
- Jest architecture tests live in `__tests__/featureArchitecture.test.ts`.
- Run `npm run lint`, `npx tsc --noEmit`, and `npm test -- --runInBand` before merging architecture changes.
