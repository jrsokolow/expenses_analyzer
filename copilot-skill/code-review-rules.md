# Code Review Rules

## Backend Rules (Express/Node.js)

### CRITICAL

#### Unvalidated Request Body
- **Pattern**: `req.body` used without type assertion or validation
- **Severity**: critical
- **Message**: Request body accessed without validation
- **Suggestion**: Add type assertions or validation middleware to req.body
- **Files**: `*.ts`

#### Hardcoded Secrets
- **Pattern**: `password|secret|token|key\s*[:=]\s*['"][^'"]*['"]`
- **Severity**: critical
- **Message**: Potential hardcoded secrets/credentials found
- **Suggestion**: Move sensitive data to environment variables
- **Files**: `*.ts`

### WARNING

#### Missing Error Handling
- **Pattern**: `async` function without `try-catch` or `.catch()`
- **Severity**: warning
- **Message**: Async functions should have try-catch blocks
- **Suggestion**: Wrap async operations in try-catch or use .catch()
- **Files**: `*.ts`

#### Any Type Usage
- **Pattern**: `:\s*any\b`
- **Severity**: warning
- **Message**: Found usage of 'any' type
- **Suggestion**: Use proper TypeScript types instead of "any"
- **Files**: `*.ts`

#### Potential SQL Injection
- **Pattern**: `query` near template literals (backticks)
- **Severity**: warning
- **Message**: Template literals found near query operations
- **Suggestion**: Use parameterized queries to prevent SQL injection
- **Files**: `*.ts`

### INFO

#### Console.log in Code
- **Pattern**: `console\.log`
- **Severity**: info
- **Message**: console.log found in code
- **Suggestion**: Use proper logging library (winston, pino) or remove for production
- **Files**: `*.ts`

---

## Frontend Rules (Angular/TypeScript)

### WARNING

#### Missing OnDestroy with Subscriptions
- **Pattern**: Component uses `subscribe` but no `OnDestroy` implementation
- **Severity**: warning
- **Message**: Component has subscriptions but no OnDestroy
- **Suggestion**: Implement OnDestroy and unsubscribe from observables to prevent memory leaks
- **Files**: `*.component.ts`

#### Hardcoded URLs
- **Pattern**: `https?:\/\/localhost|http:\/\/localhost`
- **Severity**: warning
- **Message**: Hardcoded localhost URL found
- **Suggestion**: Move API URLs to environment configuration
- **Files**: `*.ts`

#### Missing HTTP Error Handling
- **Pattern**: `this.http.` without `catchError` or error handler
- **Severity**: warning
- **Message**: HTTP request without error handler
- **Suggestion**: Add error handling with catchError operator or subscribe error handler
- **Files**: `*.component.ts`

#### Any Type Usage
- **Pattern**: `:\s*any\b`
- **Severity**: warning
- **Message**: Found usage of 'any' type
- **Suggestion**: Use proper TypeScript types instead of "any"
- **Files**: `*.ts`

### INFO

#### Console.log in Code
- **Pattern**: `console\.log`
- **Severity**: info
- **Message**: console.log found in code
- **Suggestion**: Remove or use proper logging for debugging
- **Files**: `*.ts`

#### Manual Subscriptions Instead of Async Pipe
- **Pattern**: `subscribe(` in component classes
- **Severity**: info
- **Message**: Manual subscription found in component
- **Suggestion**: Consider using async pipe in template to simplify code and auto-unsubscribe
- **Files**: `*.component.ts`

---

## Configuration

- **Backend Path**: `backend/src`
- **Frontend Path**: `frontend/src`
- **Exclude**: `*.spec.ts`, `node_modules`, `.git`

## How to Extend

Add new rules following this format:

```markdown
#### Rule Name
- **Pattern**: regex or description
- **Severity**: critical | warning | info
- **Message**: User-facing message
- **Suggestion**: How to fix
- **Files**: file pattern (*.ts, *.component.ts, etc)
```
