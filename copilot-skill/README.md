# Expenses Analyzer Code Review - Copilot Skill

A GitHub Copilot skill (VS Code extension) that provides intelligent code review for changed files in Express backend and Angular frontend applications.

## Features

🚀 **Review Changed Files** - Analyze only the files you've modified (Git-based, perfect for PR reviews)

### Data-Driven Rules
- ✅ Rules defined in **code-review-rules.md** (easy to update/customize)
- ✅ No need to recompile when changing rules
- ✅ Clear, structured markdown format
- ✅ Backend, frontend, and shared rules

### Backend (Express) Checks
- ✅ Console.log detection
- ✅ Missing error handling in async functions
- ✅ TypeScript `any` type usage
- ✅ Unvalidated request body access
- ✅ Hardcoded secrets/credentials (CRITICAL)
- ✅ Potential SQL injection vulnerabilities

### Frontend (Angular) Checks
- ✅ TypeScript `any` type usage  
- ✅ Missing OnDestroy with subscriptions (memory leaks)
- ✅ Hardcoded HTTP/API URLs
- ✅ Manual subscriptions (suggests async pipe alternative)
- ✅ Console.log detection
- ✅ Missing error handling in HTTP requests

## Installation

### From Source

1. Clone or copy the `copilot-skill` folder to your project
2. Install dependencies:
   ```bash
   cd copilot-skill
   npm install
   ```
3. Compile the extension:
   ```bash
   npm run compile
   ```
4. Open in VS Code and run:
   - Press `F5` to open extension development window
   - Or use: `code --extensionDevelopmentPath=`pwd

### Package & Publish

To package as `.vsix`:
```bash
npm install -g vsce
vsce package
```

## Usage

### Command Palette

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and search for:

**"Code Review: Review Changed Files (Git Diff)"** – Reviews all TypeScript files that Git considers changed. It automatically discovers the repository root (via `git rev-parse --show-toplevel`), so you can open the extension folder or the project root; the review always runs against the full repo.

The command sees:

- Files that differ from the default branch (`main` or `master`)
- Unstaged edits in your working directory
- Staged files that haven’t been committed yet

> If you still see “No changed files to review”, ensure your edits are saved, tracked by git, and have a `.ts` extension. Changes outside the repo root will be ignored.

### How It Works

1. The extension detects files changed since the main branch using `git diff`
2. Only changed/modified TypeScript files are reviewed
3. Rules from `code-review-rules.md` are applied
4. Results appear in the **"Code Review Agent"** output panel

### Output Example

```
🔍 Reviewing Changed Files (diff from main)...

Found 3 changed file(s)

✅ Code Review Complete
════════════════════════════════════════════════════════════

🔴 CRITICAL (1)
────────────────────────────────────────────────────────────
  📄 backend/src/index.ts:85
     Rule: Hardcoded Secrets
     Potential hardcoded secrets/credentials found
     💡 Move sensitive data to environment variables

🟠 WARNING (3)
────────────────────────────────────────────────────────────
  📄 frontend/src/app/cost-list/cost-list.component.ts
     Rule: Missing OnDestroy with Subscriptions
     Component has subscriptions but no OnDestroy
     💡 Implement OnDestroy and unsubscribe from observables

📊 Summary: 4 findings in 3 file(s)
   🔴 Critical: 1
   🟠 Warning: 3
   🔵 Info: 0
════════════════════════════════════════════════════════════
```

## Severity Levels

- 🔴 **CRITICAL**: Security issues, hardcoded secrets, validation problems
- 🟠 **WARNING**: Code quality, potential bugs, best practice violations  
- 🔵 **INFO**: Minor improvements, debugging code, suggestions

## Integration: CI/CD Pipelines

This extension can be integrated into your CI/CD pipeline:

```bash
# Review changes in pull requests
npm run compile
npm run review  # Command from backend/package.json
```

Or use the Git integration directly in your pipeline.

## Development

### Build
```bash
npm run compile
```

### Watch Mode
```bash
npm run watch
```

### Lint
```bash
npm run lint
```

## Project Structure

```
copilot-skill/
├── src/
│   └── extension.ts        # Main extension code
├── package.json            # Extension manifest
├── tsconfig.json           # TypeScript config
└── .vscodeignore          # Package ignore rules
```

## How It Works

1. **Activation** - Extension activates when commands are invoked
2. **Rule Loading** - Loads rules from `code-review-rules.md` 
3. **Git Integration** - Detects changed/staged files (for PR reviews)
4. **Code Analysis** - Reads and analyzes TypeScript files
5. **Rule Engine** - Applies review rules based on patterns
6. **Report Generation** - Aggregates findings by severity and file count
7. **Display** - Shows results in Output panel with progress indicator

## Architecture: Hybrid Data-Driven Approach

This extension uses a **hybrid architecture** separating code from rules:

```
┌─────────────────────────────────────────┐
│    VS Code Extension (TypeScript)       │
│  - Command handlers & UI                │
│  - Git integration                      │
│  - Rule parser & engine                 │
│                                         │
│    ↓ Reads rules from ↓                │
│                                         │
│  code-review-rules.md (Markdown)        │
│  - Rule definitions (data)              │
│  - Patterns & messages                  │
│  - Easy to customize, no recompile      │
│                                         │
│    ↓ Reviews ↓                          │
│                                         │
│  Source Code                            │
│  - Backend (Express)                    │
│  - Frontend (Angular)                   │
└─────────────────────────────────────────┘
```

**Benefits:**
- ✅ Easy rule updates without recompiling
- ✅ Rules are version-controlled data, not code
- ✅ Can be shared across team/projects
- ✅ Can be consumed by other tools (CLI, CI/CD)

## Future Enhancements

- [ ] Integration with ESLint/TSLint configs
- [ ] Custom rule file support  
- [ ] Export to JSON/HTML report
- [ ] Per-file issue decorations in editor
- [ ] Auto-fix suggestions
- [ ] Performance metrics
- [ ] Test coverage analysis
- [ ] Complexity metrics

## Troubleshooting

**Extension not activating?**
- Ensure workspace is open
- Check VS Code version (1.85+ required)
- Reload VS Code (`Ctrl+R`)

**No files reviewed?**
- Check that backend and frontend folders exist
- Verify folder structure: `backend/src` and `frontend/src`

**Performance slow?**
- Large projects may take time
- Check Output panel for progress

## Support

For issues or feature requests, check your project's issue tracker.

## License

MIT
