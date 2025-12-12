# Contributing to Tracker Hub

Thanks for your interest in contributing to Tracker Hub!

## Before You Start

1. Fork this repository
2. Clone it to your local machine
3. Run `pnpm install` to install dependencies

## Development Environment

### Option 1: Docker (Recommended)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Rebuild after changes
docker compose build --no-cache && docker compose up -d
```

### Option 2: Local Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in development mode
pnpm --filter dashboard dev
pnpm --filter backend start:dev
```

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting changes
- `refactor`: Code refactoring
- `test`: Adding or fixing tests
- `chore`: Build or tooling changes

### Examples

```bash
feat(dashboard): add session filtering feature
fix(backend): resolve pagination offset issue
docs(readme): update installation steps
```

## Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

## Pull Request Process

1. Create a new branch from `develop`
2. Make your changes
3. Ensure all tests pass
4. Verify the build succeeds with `pnpm build`
5. Open a Pull Request

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Build passes successfully
- [ ] Tests are passing
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow Conventional Commits format

## Project Structure

```
packages/
 core/       # Tracker SDK
 dashboard/  # Admin panel
 backend/    # API server
 frontend/   # Demo application
```

## Code Standards

- TypeScript strict mode enabled
- Use `React.FC<Props>` pattern for React components
- API calls go in the `api/` directory
- State management lives in `store/`

## Questions

Feel free to open a GitHub Issue or start a discussion if you have any questions.

---

Thanks for contributing!
