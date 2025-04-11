# Testing the Chapter Editor

This directory contains tests for the chapter editor component and related functionality.

## Test Structure

- `hooks/use-chapter-editor.test.ts`: Unit tests for the chapter editor hook
- `components/editor.test.tsx`: Unit tests for the editor component
- `pages/chapter-editor-page.test.tsx`: Integration tests for the chapter editor page

## Running Tests

To run all tests:

```bash
npm test
```

To run a specific test file:

```bash
npm test -- src/__tests__/hooks/use-chapter-editor.test.ts
```

To run tests in watch mode (automatically re-run when files change):

```bash
npm test -- --watch
```

## Test Coverage

To generate a test coverage report:

```bash
npm test -- --coverage
```

This will create a coverage report in the `coverage` directory.

## Writing New Tests

When adding new features to the chapter editor, please add corresponding tests. Follow these guidelines:

1. **Unit tests** should test individual functions or components in isolation
2. **Integration tests** should test how components work together
3. **Mock external dependencies** like API calls and browser APIs
4. **Test both success and failure cases**
5. **Test edge cases** like empty inputs, large inputs, etc.

## Debugging Tests

If a test is failing, you can add `console.log` statements to debug. In watch mode, press `p` to filter by filename, then press `t` to filter by test name.

For more complex debugging, you can use the `--inspect` flag:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand src/__tests__/hooks/use-chapter-editor.test.ts
```

Then open Chrome and navigate to `chrome://inspect` to use the debugger.
