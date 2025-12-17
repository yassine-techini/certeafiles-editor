# Contributing to CerteaFiles Editor

Thank you for your interest in contributing to CerteaFiles Editor! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/certeafiles-editor.git
   cd certeafiles-editor
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start the development server:
   ```bash
   pnpm dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/add-image-upload` - New features
- `fix/comment-alignment` - Bug fixes
- `refactor/folio-store` - Code refactoring
- `docs/api-documentation` - Documentation updates
- `test/revision-store` - Test additions

### Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following the coding standards below

3. Write or update tests as needed

4. Run the test suite:
   ```bash
   pnpm test
   pnpm test:e2e
   ```

5. Run type checking and linting:
   ```bash
   pnpm tsc
   pnpm lint
   ```

6. Commit your changes with a descriptive message:
   ```bash
   git commit -m "feat: add image upload to editor toolbar"
   ```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or modifications
- `chore:` - Maintenance tasks

Examples:
```
feat: add drag-and-drop folio reordering
fix: resolve comment alignment offset on scroll
docs: update API documentation for FolioStore
refactor: extract thumbnail generation to hook
test: add unit tests for revision diffing
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define explicit types for function parameters and return values
- Use interfaces for object shapes
- Avoid `any` type - use `unknown` if type is truly unknown

```typescript
// Good
interface FolioProps {
  id: string;
  title: string;
  onSelect: (id: string) => void;
}

// Avoid
function handleFolio(folio: any) { ... }
```

### React Components

- Use functional components with hooks
- Memoize components that receive complex props:
  ```typescript
  export const FolioThumbnail = memo(function FolioThumbnail(props: FolioThumbnailProps) {
    // ...
  });
  ```
- Use `useCallback` for functions passed to child components
- Use `useMemo` for expensive computations

### State Management

- Use Zustand stores for global state
- Keep component state local when possible
- Use selectors to minimize re-renders:
  ```typescript
  // Good - only re-renders when activeFolioId changes
  const activeFolioId = useFolioStore(state => state.activeFolioId);

  // Avoid - re-renders on any store change
  const store = useFolioStore();
  ```

### Styling

- Use Tailwind CSS for styling
- Follow the existing component patterns
- Ensure responsive design (mobile-first)
- Support dark mode where applicable

### Accessibility

- Include ARIA labels for interactive elements
- Ensure keyboard navigation works
- Test with screen readers
- Maintain focus management in modals

### Testing

- Write unit tests for utilities and hooks
- Write integration tests for components
- Write E2E tests for critical user flows
- Aim for meaningful coverage, not 100%

```typescript
// Unit test example
describe('generateUUID', () => {
  it('should generate unique IDs', () => {
    const id1 = generateUUID();
    const id2 = generateUUID();
    expect(id1).not.toBe(id2);
  });
});

// Component test example
describe('FolioThumbnail', () => {
  it('should call onSelect when clicked', async () => {
    const onSelect = vi.fn();
    render(<FolioThumbnail id="1" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

## Pull Request Process

1. **Update Documentation**: If your changes affect the API or usage, update the README

2. **Write Tests**: Include tests for new functionality

3. **Pass CI**: Ensure all checks pass:
   - Type checking (`pnpm tsc`)
   - Linting (`pnpm lint`)
   - Unit tests (`pnpm test`)
   - E2E tests (`pnpm test:e2e`)

4. **Request Review**: Request a review from maintainers

5. **Address Feedback**: Respond to review comments and make necessary changes

### PR Template

When creating a PR, include:

```markdown
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Testing
How to test the changes

## Screenshots (if applicable)
```

## Project Structure

Understanding the codebase:

```
src/
├── components/     # React components
│   ├── Editor/     # Main editor components
│   ├── Folios/     # Folio management
│   ├── Comments/   # Comment system
│   └── UI/         # Shared UI components
├── plugins/        # Lexical editor plugins
├── stores/         # Zustand state stores
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
└── types/          # TypeScript type definitions
```

### Key Concepts

- **Folio**: A single page/document in the editor
- **Thread**: A comment thread attached to text
- **Revision**: A snapshot of document state
- **Plugin**: A Lexical plugin extending editor functionality

## Performance Guidelines

When contributing, keep performance in mind:

- Virtualize long lists (>20 items)
- Memoize components receiving object/array props
- Debounce frequent operations (typing, scrolling)
- Lazy load non-critical features
- Profile before and after changes

## Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Open a new issue with your question
3. Tag it with the `question` label

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
