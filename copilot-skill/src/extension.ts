import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

interface ReviewRule {
    name: string;
    pattern: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    suggestion: string;
    files: string;
    exclude?: string;
    type: 'backend' | 'frontend' | 'both';
}

interface ReviewFinding {
    file: string;
    line?: number;
    severity: 'critical' | 'warning' | 'info';
    rule: string;
    message: string;
    suggestion?: string;
}

interface ReviewResult {
    findings: ReviewFinding[];
    summary: {
        total: number;
        critical: number;
        warning: number;
        info: number;
        filesReviewed: number;
    };
}

class CodeReviewSkill {
    private outputChannel: vscode.OutputChannel;
    private rules: ReviewRule[] = [];
    private workspacePath: string = '';
    private repoRoot: string = '';

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Code Review Agent');
    }

    async initialize(workspacePath: string): Promise<void> {
        this.workspacePath = workspacePath;
        // determine git repository root (may be parent of workspacePath)
        try {
            const root = execSync('git rev-parse --show-toplevel', {
                cwd: this.workspacePath,
                encoding: 'utf-8',
            }).trim();
            this.repoRoot = root;
        } catch {
            this.repoRoot = this.workspacePath;
        }
        await this.loadRules();
        // Log parsed rules for debugging
        this.log(`Loaded ${this.rules.length} rules:`);
        this.rules.forEach((r) => {
            this.log(` - ${r.name} [${r.type}] pattern=${r.pattern} files=${r.files}`);
        });
    }

    private async loadRules(): Promise<void> {
        const rulesPath = path.join(this.workspacePath, 'copilot-skill', 'code-review-rules.md');
        try {
            const content = await fs.readFile(rulesPath, 'utf-8');
            this.rules = this.parseRulesFromMarkdown(content);
            this.log(`Loaded ${this.rules.length} review rules`);
        } catch (error) {
            this.log(`⚠️  Could not load code-review-rules.md, using default rules`);
        }
    }

    private parseRulesFromMarkdown(content: string): ReviewRule[] {
        const rules: ReviewRule[] = [];
        const sections = content.split('####');

        sections.forEach((section) => {
            const lines = section.split('\n').filter((l) => l.trim());
            if (lines.length > 0) {
                const ruleName = lines[0].trim();
                const ruleObj: Partial<ReviewRule> = { name: ruleName, type: 'both' };

                lines.forEach((line) => {
                    if (line.startsWith('- **Pattern**:')) {
                        let pat = line.replace('- **Pattern**:', '').trim();
                        // if pattern is fenced with backticks, grab the content inside
                        const match = pat.match(/`([^`]+)`/);
                        if (match) {
                            pat = match[1];
                        }
                        ruleObj.pattern = pat;
                    } else if (line.startsWith('- **Severity**:')) {
                        const sev = line.replace('- **Severity**:', '').trim().toLowerCase();
                        ruleObj.severity = sev as 'critical' | 'warning' | 'info';
                    } else if (line.startsWith('- **Message**:')) {
                        ruleObj.message = line.replace('- **Message**:', '').trim();
                    } else if (line.startsWith('- **Suggestion**:')) {
                        ruleObj.suggestion = line.replace('- **Suggestion**:', '').trim();
                    } else if (line.startsWith('- **Files**:')) {
                        ruleObj.files = line.replace('- **Files**:', '').trim();
                    } else if (line.startsWith('- **Exclude**:')) {
                        ruleObj.exclude = line.replace('- **Exclude**:', '').trim();
                    }
                });

                const parent = content.substring(0, content.indexOf('####' + section));
                if (parent.includes('## Backend')) {
                    ruleObj.type = 'backend';
                } else if (parent.includes('## Frontend')) {
                    ruleObj.type = 'frontend';
                }

                if (ruleObj.pattern && ruleObj.severity && ruleObj.message) {
                    rules.push(ruleObj as ReviewRule);
                }
            }
        });

        return rules;
    }

    private async getChangedFiles(baseBranch: string = 'main'): Promise<string[]> {
        try {
            // choose base branch; fall back to master if main doesn't exist
            let branchToUse = baseBranch;
            try {
                const list = execSync('git branch --list main', {
                    cwd: this.workspacePath,
                    encoding: 'utf-8',
                });
                if (!list.trim()) {
                    branchToUse = 'master';
                }
            } catch {
                branchToUse = baseBranch;
            }
            if (branchToUse !== baseBranch) {
                this.log(`⚠️  base branch '${baseBranch}' not found; using '${branchToUse}'`);
            }

            // committed diff relative to base branch
            const cwd = this.repoRoot || this.workspacePath;
            const committed = execSync(`git diff --name-only ${branchToUse}...HEAD`, {
                cwd,
                encoding: 'utf-8',
            });
            this.log(`git diff ${branchToUse}...HEAD (cwd=${cwd}) ->\n${committed}`);

            // unstaged working tree changes
            const unstaged = execSync('git diff --name-only', {
                cwd,
                encoding: 'utf-8',
            });
            this.log(`git diff (unstaged) ->\n${unstaged}`);

            // staged changes (cached)
            const staged = execSync('git diff --name-only --cached', {
                cwd,
                encoding: 'utf-8',
            });
            this.log(`git diff --cached ->\n${staged}`);

            const files = new Set<string>();
            [committed, unstaged, staged].forEach((out) => {
                out
                    .split('\n')
                    .map((f) => f.trim())
                    .filter((f) => f.endsWith('.ts'))
                    .forEach((f) => {
                        if (f) files.add(f);
                    });
            });

            const result = Array.from(files);
            this.log(`Changed TS files: ${result.join(', ')}`);
            return result;
        } catch (error) {
            this.log('⚠️  Could not get changed files from git');
            return [];
        }
    }


    async reviewChangedFiles(baseBranch: string = 'main'): Promise<ReviewResult> {
        if (!vscode.workspace.rootPath) {
            throw new Error('No workspace open');
        }

        await this.initialize(vscode.workspace.rootPath);
        this.outputChannel.clear();
        this.outputChannel.show();
        this.log(`⭐ Repository root detected at: ${this.repoRoot}`);

        this.log(`🔍 Reviewing Changed Files (diff from ${baseBranch})...\n`);
        const findings: ReviewFinding[] = [];
        let filesReviewed = 0;

        try {
            const changedFiles = await this.getChangedFiles(baseBranch);
            if (changedFiles.length === 0) {
                this.log('✅ No changed files to review');
                this.log('   (make sure you have modified or staged .ts files, or commit your changes)');
                return { findings: [], summary: { total: 0, critical: 0, warning: 0, info: 0, filesReviewed: 0 } };
            }

            this.log(`Found ${changedFiles.length} changed file(s)\n`);

            for (const file of changedFiles) {
                const fullPath = path.join(this.repoRoot || vscode.workspace.rootPath!, file);
                this.log(`Reviewing changed file: ${file} -> ${fullPath}`);
                try {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    const relativePath = file;
                    const type = file.includes('backend') ? 'backend' : 'frontend';

                    const fileFindings = this.reviewCode(content, relativePath, type);
                    if (fileFindings.length > 0) {
                        findings.push(...fileFindings);
                        filesReviewed++;
                    }
                } catch (error) {
                    this.log(`❌ Error reading file ${file}: ${error}`);
                }
            }

            this.log('\n✅ Code Review Complete\n');

            const summary = this.summarizeFindings(findings, filesReviewed);
            this.displayReport(findings, summary);

            return { findings, summary };
        } catch (error) {
            this.log(`❌ Error: ${error}`);
            throw error;
        }
    }

    private reviewCode(content: string, filePath: string, type: 'backend' | 'frontend'): ReviewFinding[] {
        const findings: ReviewFinding[] = [];
        const lines = content.split('\n');

        // Apply each rule
        this.rules.forEach((rule) => {
            // Check if rule applies to this file type
            if (rule.type !== type && rule.type !== 'both') {
                return;
            }

            // Check if rule applies to this file pattern
            if (!this.matchesFilePattern(filePath, rule.files)) {
                return;
            }

            try {
                const regex = new RegExp(rule.pattern, 'i');

                lines.forEach((line, idx) => {
                    if (regex.test(line)) {
                        if (rule.exclude && new RegExp(rule.exclude, 'i').test(line)) {
                            return; // skip this line if excluded
                        }
                        findings.push({
                            file: filePath,
                            line: idx + 1,
                            severity: rule.severity,
                            rule: rule.name,
                            message: rule.message,
                            suggestion: rule.suggestion,
                        });
                    }
                });
            } catch (error) {
                console.error(`Error applying rule ${rule.name}:`, error);
            }
        });

        return findings;
    }

    private matchesFilePattern(filePath: string, pattern: string): boolean {
        const patterns = pattern.split(',').map((p) => p.trim());
        return patterns.some((p) => {
            if (p === '*.ts') return filePath.endsWith('.ts');
            if (p === '*.component.ts') return filePath.endsWith('.component.ts');
            if (p === '*.spec.ts') return filePath.endsWith('.spec.ts');
            return filePath.includes(p);
        });
    }

    private summarizeFindings(findings: ReviewFinding[], filesReviewed: number) {
        return {
            total: findings.length,
            critical: findings.filter((f) => f.severity === 'critical').length,
            warning: findings.filter((f) => f.severity === 'warning').length,
            info: findings.filter((f) => f.severity === 'info').length,
            filesReviewed,
        };
    }

    private displayReport(findings: ReviewFinding[], summary: ReturnType<typeof this.summarizeFindings>) {
        const bySeverity = {
            critical: findings.filter((f) => f.severity === 'critical'),
            warning: findings.filter((f) => f.severity === 'warning'),
            info: findings.filter((f) => f.severity === 'info'),
        };

        this.log('═'.repeat(60));

        if (bySeverity.critical.length > 0) {
            this.log(`\n🔴 CRITICAL (${bySeverity.critical.length})`);
            this.log('─'.repeat(60));
            bySeverity.critical.forEach((f) => {
                this.log(`  📄 ${f.file}${f.line ? ':' + f.line : ''}`);
                this.log(`     Rule: ${f.rule}`);
                this.log(`     ${f.message}`);
                if (f.suggestion) this.log(`     💡 ${f.suggestion}`);
            });
        }

        if (bySeverity.warning.length > 0) {
            this.log(`\n🟠 WARNING (${bySeverity.warning.length})`);
            this.log('─'.repeat(60));
            bySeverity.warning.forEach((f) => {
                this.log(`  📄 ${f.file}${f.line ? ':' + f.line : ''}`);
                this.log(`     Rule: ${f.rule}`);
                this.log(`     ${f.message}`);
                if (f.suggestion) this.log(`     💡 ${f.suggestion}`);
            });
        }

        if (bySeverity.info.length > 0) {
            this.log(`\n🔵 INFO (${bySeverity.info.length})`);
            this.log('─'.repeat(60));
            bySeverity.info.forEach((f) => {
                this.log(`  📄 ${f.file}${f.line ? ':' + f.line : ''}`);
                this.log(`     Rule: ${f.rule}`);
                this.log(`     ${f.message}`);
                if (f.suggestion) this.log(`     💡 ${f.suggestion}`);
            });
        }

        this.log('\n' + '═'.repeat(60));
        this.log(`📊 Summary: ${summary.total} findings in ${summary.filesReviewed} file(s)`);
        this.log(`   🔴 Critical: ${summary.critical}`);
        this.log(`   🟠 Warning: ${summary.warning}`);
        this.log(`   🔵 Info: ${summary.info}`);
        this.log('═'.repeat(60));
    }

    private log(message: string) {
        this.outputChannel.appendLine(message);
    }
}

export function activate(context: vscode.ExtensionContext) {
    const codeReview = new CodeReviewSkill();

    const reviewChangedCmd = vscode.commands.registerCommand('expensesCodeReview.reviewChangedFiles', async () => {
        const workspacePath = vscode.workspace.rootPath;
        if (!workspacePath) {
            vscode.window.showErrorMessage('No workspace open');
            return;
        }

        try {
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Reviewing changed files...',
                    cancellable: false,
                },
                async () => {
                    await codeReview.reviewChangedFiles('main');
                }
            );
            vscode.window.showInformationMessage('✅ Code review complete! Check the output panel.');
        } catch (error) {
            vscode.window.showErrorMessage(`Code review failed: ${error}`);
        }
    });

    context.subscriptions.push(reviewChangedCmd);
}

export function deactivate() { }
