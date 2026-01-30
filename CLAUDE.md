# CLAUDE.md

## Project Overview

Rails 8.1.2 + React 19 full-stack application using Shakapacker with Rspack bundler. TypeScript-first frontend with strict type checking.

## Development Commands

```bash
# Start development servers (Rails + Shakapacker dev server)
pnpm start              # uses overmind

# Type checking
pnpm type:check         # runs tsgo

# Code formatting
pnpm fmt                # format with oxfmt
pnpm fmt:check          # check formatting

# Ruby linting
bundle exec rubocop
bundle exec rubocop -a  # auto-fix

# Run tests
bin/rails test          # unit tests
bin/rails test:system   # system tests (requires Chrome)

# Run single test file
bin/rails test test/path/to/test_file.rb

# Database
bin/rails db:migrate
bin/rails db:test:prepare
```

## Architecture

### Frontend

- **Entry point**: `app/javascript/packs/application.tsx`
- **Bundler config**: `config/rspack/rspack.config.ts`
- **Shakapacker config**: `config/shakapacker.yml` (dev server on port 3035)
- **Output**: `public/packs/`

### Tailwind CSS 4

- Styles: `app/javascript/styles.css` via `@tailwindcss/postcss`

### TanStack Router

- Routes: `app/javascript/routes/` (file-based, auto code-splitting)
- Add routes: create `routes/mypage.tsx` with `createFileRoute("/mypage")`
- Rails catch-all in `config/routes.rb` enables client-side navigation

### Backend

- Standard Rails MVC in `app/` (controllers, models, views)
- Routes defined in `config/routes.rb`
- SQLite3 database (dev/test)

## Code Style

- **Ruby**: RuboCop with rails-omakase ruleset
- **TypeScript/JavaScript**: oxfmt formatter (Rust-based)
- **Pre-commit hooks**: lefthook runs `fmt`, `tsgo_check`, and `rubocop`

## Tool Versions

Managed by mise.toml:

- Ruby 4.0.1
- Node LTS
- pnpm (latest)
