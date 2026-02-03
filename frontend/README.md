# HR Platform Frontend

Enterprise-grade multi-tenant HR SaaS platform frontend.

## Tech Stack

- **Language**: TypeScript 5.x
- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Package Manager**: pnpm 8.x
- **Monorepo**: Turborepo
- **State Management**: Zustand (client), TanStack Query (server)
- **UI Components**: shadcn/ui + TailwindCSS
- **Testing**: Vitest + Testing Library + Playwright
- **Documentation**: Storybook 8.x

## Project Structure

```
frontend/
├── apps/
│   └── web/                    # React web application
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── shared-types/           # API type definitions
│   └── eslint-config/          # ESLint configuration
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Start Storybook
pnpm storybook
```

### Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Test Account

For development with MSW:

- **Username**: demo
- **Password**: demo1234

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm storybook` | Start Storybook |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Type check |

## Ports

| Service | Port |
|---------|------|
| Web App | 5173 |
| Storybook | 6006 |
