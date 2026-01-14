# MHG Facilities - Claude Instructions

## Running Ralph Loop (Quick Start)

```bash
cd "/Users/josuerodriguez/Dropbox/MHG Apps/Facilities"
claude --dangerously-skip-permissions
```

Then:
```
/ralph-wiggum:ralph-loop "Execute the phase spec from .claude/ralph-loops/phase-2-locations-users.md" --completion-promise "PHASE_2_COMPLETE" --max-iterations 40
```

## Project Structure

```
Facilities/                    <- Run claude from HERE
├── .claude/
│   ├── ralph-loops/          <- Phase specs live here
│   │   ├── phase-1-auth-tenant.md
│   │   ├── phase-2-locations-users.md
│   │   └── ...
│   └── progress.md           <- Track progress here
├── mhg-facilities/           <- Next.js project
│   └── src/                  <- All code goes here
└── facilities-management-plan-v2.md
```

## Running Ralph Loop

### Step 1: Open Terminal and Navigate
```bash
cd "/Users/josuerodriguez/Dropbox/MHG Apps/Facilities"
```

### Step 2: Start Claude Code CLI (with permissions bypass)
```bash
claude --dangerously-skip-permissions
```

**Note:** The `--dangerously-skip-permissions` flag allows Claude to run autonomously without prompting for every file edit or bash command. Only use in trusted directories.

### Step 3: Run Ralph Loop Command
```
/ralph-wiggum:ralph-loop "Execute the phase spec from .claude/ralph-loops/phase-2-locations-users.md" --completion-promise "PHASE_2_COMPLETE" --max-iterations 40
```

### Available Phase Specs

| Phase | File | Promise |
|-------|------|---------|
| Phase 1 | `.claude/ralph-loops/phase-1-auth-tenant.md` | `PHASE_1_COMPLETE` |
| Phase 2 | `.claude/ralph-loops/phase-2-locations-users.md` | `PHASE_2_COMPLETE` |
| Phase 3 | `.claude/ralph-loops/phase-3-tickets.md` | `PHASE_3_COMPLETE` |
| Phase 4 | `.claude/ralph-loops/phase-4-assets-vendors.md` | `PHASE_4_COMPLETE` |
| Phase 5 | `.claude/ralph-loops/phase-5-compliance-pm.md` | `PHASE_5_COMPLETE` |
| Phase 6 | `.claude/ralph-loops/phase-6-dashboard-reports.md` | `PHASE_6_COMPLETE` |
| **ALL** | `.claude/ralph-loops/all-phases.md` | `ALL_PHASES_COMPLETE` |

### Run All Phases (Auto-Chain)

To run all phases automatically, one after another:

```
/ralph-wiggum:ralph-loop "Execute the complete build spec from .claude/ralph-loops/all-phases.md. Start from the current incomplete phase (check .claude/progress.md). Complete each phase fully before moving to the next." --completion-promise "ALL_PHASES_COMPLETE" --max-iterations 200
```

This will chain through all 6 phases, validating each before moving to the next.

### Canceling a Ralph Loop
```
/ralph-wiggum:cancel-ralph
```

### Monitoring Progress
```bash
# View current iteration
cat .claude/ralph-loop.local.md

# View progress
cat .claude/progress.md
```

## Important Notes

1. **Always run from Facilities directory** - NOT from mhg-facilities
2. **Code lives in mhg-facilities/src/** - All paths in phase specs are relative to mhg-facilities
3. **The plugin is installed at project scope** - Only works when claude starts from Facilities/
4. **Validation commands run from mhg-facilities/** - Always `cd mhg-facilities` before npm commands

## Plugin Bug Fix

If you get "unbound variable" error, the fix was applied to:
`~/.claude/plugins/cache/claude-code-plugins/ralph-wiggum/1.0.0/scripts/setup-ralph-loop.sh`

Line 113 changed from:
```bash
PROMPT="${PROMPT_PARTS[*]}"
```
To:
```bash
PROMPT="${PROMPT_PARTS[*]:-}"
```
