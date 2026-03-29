# Contributing to Kvale

Thank you for your interest in contributing to Kvale. We're a small team with high standards, and we genuinely appreciate every contribution — whether it's a bug report, a documentation fix, or a new feature.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Code](#submitting-code)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Design Principles](#design-principles)
- [Questions](#questions)

---

## Code of Conduct

We follow a simple rule: **be kind**. We are building tools for developers, by developers. Treat every contributor with the same respect you'd want in return. Harassment, discrimination, or bad faith arguing will result in removal from the project.

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally.
3. **Install dependencies** with Bun:
   ```bash
   bun install
   ```
4. **Run tests** to confirm everything works:
   ```bash
   bun test
   ```
5. **Create a branch** for your work:
   ```bash
   git checkout -b feat/your-feature-name
   ```

We use **Bun** for everything — package management, running scripts, and publishing. Please do not submit PRs that introduce npm/yarn/pnpm lock files.

---

## How to Contribute

### Reporting Bugs

Found something broken? Please open an issue with:

- A **clear title** summarizing the problem
- **Steps to reproduce** — the more specific, the better
- **Expected behavior** vs. **actual behavior**
- Your environment: Svelte version, Bun version, browser/Node version
- A **minimal reproduction** (a REPL or small code snippet is ideal)

> Good bug reports save enormous amounts of time. We'll prioritize issues with clear reproductions.

### Suggesting Features

We love good ideas, but Kvale has strong opinions about scope. Before opening a feature request, ask yourself: does this make the library _simpler_ or _more powerful_? We're not interested in both at the same time.

Open an issue with:

- The **problem you're trying to solve** (not the solution)
- How you currently work around it
- Whether you're willing to implement it yourself

Features that add dependencies, break the zero-dep constraint, or require wrapper components will not be accepted.

### Submitting Code

For small fixes (typos, documentation, obvious bugs): open a PR directly.

For larger changes (new features, API changes, architectural shifts): **open an issue first**. We don't want you spending days on a PR we can't merge. Alignment upfront saves everyone time.

---

## Development Setup

```bash
# Install dependencies
bun install

# Run tests (single pass)
bun test

# Run tests in watch mode
bun test:watch

# Type-check
bun run check

# Lint and format check
bun run lint

# Auto-format
bun run format

# Build the package
bun run package
```

All scripts are in `package.json`. Never run `npm run` or `yarn` — use `bun run`.

---

## Project Structure

```
src/
├── core/           # Pure TypeScript — zero framework dependencies
│   ├── cache.ts    # CacheStore: Map-based storage, staleness, persistence
│   ├── query.ts    # QueryRunner: fetch, retry, polling, lifecycle
│   ├── types.ts    # All interfaces and config types
│   └── storage.ts  # localStorage persistence adapter
├── svelte/         # Svelte 5 adapter — bridges core to $state reactivity
│   └── adapter.svelte.ts
└── index.ts        # Public API surface

tests/
├── core/           # Core tests — no Svelte imports allowed
└── svelte/         # Adapter tests — uses @testing-library/svelte
```

**The most important architectural rule:**

`src/core/` must never import from `svelte`, `svelte/store`, or any `.svelte` file. The core is pure TypeScript that must run in any JS environment. The Svelte adapter bridges core events into Svelte 5 `$state`.

If you break this boundary, your PR will not be merged.

---

## Testing

We take testing seriously. All contributions must include tests.

**Rules:**
- Core tests (`tests/core/`) must not import anything Svelte-related
- Use `vi.useFakeTimers()` for any time-dependent behavior (staleTime, polling, retry delays)
- Mock `fetch` with `vi.fn()` — never hit real network endpoints
- Every public API function must have unit tests
- Test file naming: `*.test.ts` for core, `*.test.svelte.ts` for adapter

**Run tests before submitting:**
```bash
bun test
```

All tests must pass. PRs with failing tests will not be reviewed.

---

## Code Style

We use **Biome** for formatting and linting. Run it before committing:

```bash
bun run format
bun run lint
```

Additional conventions:

- **TypeScript strict mode** — no `any`, ever
- Use `interface` over `type` for public API shapes
- Private class fields use the `private` keyword
- All public exports must have JSDoc comments with `@example` blocks
- `$state`, `$effect`, `$derived` — runes only, no Svelte stores

---

## Commit Messages

We follow a simplified version of [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `test` — adding or correcting tests
- `refactor` — no behavior change
- `chore` — build, deps, tooling

**Examples:**
```
feat: add refetchInterval polling support
fix: persist cache on delete and clear
docs: add dependent query example to README
test: add adapter tests for enabled toggle
```

Keep the first line under 72 characters. Use the body to explain _why_, not _what_.

---

## Pull Request Guidelines

- **One thing per PR.** A PR that adds a feature and refactors unrelated code is harder to review and more likely to be rejected.
- **Tests included.** No exceptions.
- **Passing CI.** Fix lint errors and test failures before requesting review.
- **Small is better.** A 50-line PR gets reviewed same day. A 500-line PR takes a week.
- **Describe your change.** Fill out the PR description: what problem does this solve, how did you solve it, how can a reviewer test it?

When you open a PR, you're asking someone to spend their time reviewing your work. Make it easy for them.

---

## Design Principles

These are the values that guide every decision in Kvale. When in doubt, refer back to them.

1. **Zero dependencies.** Kvale ships nothing except itself. Every dependency is a liability.

2. **No providers.** `createCache()` returns a plain object. No context, no wrappers, no React-isms accidentally ported over.

3. **Runes-native.** `$state` and `$effect` only. If your contribution uses `writable()`, `readable()`, or `$:`, it doesn't belong here.

4. **The core is framework-agnostic.** `src/core/` runs in Node, Deno, Bun, or a browser — without Svelte. This must stay true.

5. **Small surface area.** The API should shrink, not grow. Every new option is a cost. Prefer solving problems in userland.

6. **Correctness over convenience.** We'd rather have one right way to do something than three "convenient" ways that are subtly broken.

---

## Questions

- **General discussion:** Open a [GitHub Discussion](https://github.com/qkal/Fynd/discussions)
- **Bugs and feature requests:** Open a [GitHub Issue](https://github.com/qkal/Fynd/issues)
- **Direct questions:** Reach out to [Kal](https://github.com/qkal)

We're a small team. We'll do our best to respond promptly, but please be patient.

---

MIT © [Complexia](https://complexia.org)
