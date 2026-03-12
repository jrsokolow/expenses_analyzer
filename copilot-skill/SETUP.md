# Copilot Skill Setup Guide

## Quick Start

### Step 1: Install Dependencies
```bash
cd copilot-skill
npm install
```

### Step 2: Compile TypeScript
```bash
npm run compile
```

### Step 3: Run Extension in Development Mode
```bash
# Option A: Press F5 in VS Code in the copilot-skill folder
# Option B: Use command line
code --extensionDevelopmentPath=. path/to/expenses_analyzer
```

### Step 4: Test the Skill

In the VS Code window that opens:
1. Press `Ctrl+Shift+P`
2. Type "Code Review" to see available commands:
   - 🔍 Code Review: Review Entire Project
   - 🔍 Code Review: Review Current File
   - 🔍 Code Review: Review Selection

## How to Use

### Review Entire Project
```
Command Palette → Code Review: Review Entire Project
```
- Scans all TypeScript files in `backend/src` and `frontend/src`
- Generates comprehensive report with all findings

### Review Currently Open File
```
Command Palette → Code Review: Review Current File
```
or
```
Right-click file → Code Review: Review Current File
```
- Reviews only the active editor file
- Faster than full project review

### Review Selected Code
```
Select code → Command Palette → Code Review: Review Selection
```
- Reviews only the highlighted text
- Useful for quick spot checks

## Understanding the Output

The Output panel shows findings organized by severity:

```
🔴 CRITICAL (2)
  Security issues, hardcoded secrets, validation problems

🟠 WARNING (5)  
  Code quality issues, potential bugs

🔵 INFO (3)
  Suggestions, minor improvements
```

Each finding includes:
- 📄 File path and line number
- Rule name
- Issue description
- 💡 Suggested fix

## Adding Custom Rules

Edit `src/extension.ts` in the `reviewBackendCode()` or `reviewFrontendCode()` methods:

```typescript
// Example: Check for TODO comments
const todoMatches = content.match(/\/\/\s*TODO|\/\*\s*TODO/g);
if (todoMatches) {
  findings.push({
    file: filePath,
    severity: 'info',
    rule: 'unresolved-todos',
    message: `Found ${todoMatches.length} TODO comment(s)`,
    suggestion: 'Address TODO items before deployment',
  });
}
```

After editing:
1. Save the file
2. Recompile: `npm run compile`
3. Reload the extension window: `Ctrl+R`

## Packaging for Distribution

### Create .vsix Package
```bash
npm install -g vsce
vsce package
```

This creates `expenses-analyzer-code-review-1.0.0.vsix`

### Install Manually
```bash
code --install-extension expenses-analyzer-code-review-1.0.0.vsix
```

### Publish to VS Code Marketplace
```bash
# Create publisher account first at https://marketplace.visualstudio.com/manage
vsce publish
```

## Configuration (Optional)

You can extend `package.json` with settings:

```json
"contributes": {
  "configuration": {
    "title": "Code Review",
    "properties": {
      "codeReview.severity": {
        "type": "string",
        "default": "warning",
        "description": "Minimum severity level to report"
      }
    }
  }
}
```

Then access in code:
```typescript
const config = vscode.workspace.getConfiguration('codeReview');
const minSeverity = config.get('severity');
```

## Troubleshooting

### Extension not showing up?
```bash
# Clear compiled output and rebuild
rm -rf out
npm run compile
```

### TypeScript errors?
```bash
# Update TypeScript definitions
npm install --save-dev @types/vscode@latest
npm run compile
```

### Can't find files to review?
- Ensure your workspace root contains `backend/src` and `frontend/src`
- Check Output panel for specific error messages

## File Structure Expectations

```
expenses_analyzer/
├── backend/
│   └── src/
│       ├── index.ts
│       └── ... other backend files
├── frontend/
│   └── src/
│       ├── main.ts
│       ├── app/
│       └── ... other frontend files
└── copilot-skill/
    └── ... extension files
```

## Next Steps

1. **Customize Rules** - Add project-specific review rules
2. **Integrate with CI/CD** - Run reviews in your pipeline
3. **Team Sharing** - Package and share with team
4. **Auto-Fix** - Add suggestion handlers for common issues

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Copilot Skills Documentation](https://docs.github.com/en/copilot)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

Ready to review your code! 🚀
