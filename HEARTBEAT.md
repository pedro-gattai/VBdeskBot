# HEARTBEAT.md - Continuous 24/7 Work Tasks

## ✅ Active Checks (Run Every 30 Minutes)

### Check 1: VB Desk Frontend Progress
- Verify build status locally
- Check for TypeScript errors
- Review git status (uncommitted changes)
- Commit if improvements made (with clear messages)
- Report blockers to #code channel

### Check 2: Documentation Updates
- Review PROGRESS.md for staleness
- Update timestamps if work done
- Sync MEMORY.md with recent wins/learnings

### Check 3: Research & Market Updates
- Search for latest Solana dApp trends
- Check if new auction UI patterns emerge
- Document findings in memory

## ⚠️ Approval Rules (Never Auto-Do These)

❌ **DO NOT**:
- Push to main without explicit approval message
- Deploy to production
- Change contracts or core logic without confirmation
- Delete files without asking
- Make breaking changes

✅ **AUTO-OK**:
- Commit local improvements (accessibility, UI polish, docs)
- Update README/docs
- Fix TypeScript errors
- Refactor for clarity
- Research & analyze
- Generate reports

## 📋 Work Schedule

- **Every 30 min**: Quick checks (build, git status, errors)
- **Every 2 hours**: Deep work (research, improvements, docs)
- **Every 6 hours**: Full report to #code channel
- **Daily**: Summary email/message

## 🎯 Current Focus (Feb 3-4, 2025)

1. Polish VB Desk frontend (accessibility, UX)
2. Research smart contract integration patterns
3. Create deployment checklist
4. Monitor for blockchain updates
5. Keep docs fresh

## 📝 Commit Message Template

```
[HEARTBEAT] Type: Brief description

- Change 1
- Change 2
- Reason for change
```

Examples:
- `[HEARTBEAT] Docs: Update PROGRESS.md with latest metrics`
- `[HEARTBEAT] Fix: Resolve TypeScript error in BidForm`
- `[HEARTBEAT] Improve: Better error messages in forms`

## 🔔 When to Report to #code

Post updates when:
- Major feature completed
- Blocker found
- Breaking discovery (security, performance)
- 6 hours since last report
- User asked for specific status

Keep it brief: "✅ Just finished X. Next: Y. No blockers."

## 🚫 Hard Stops

ALWAYS ask before:
- Pushing to main (unless auto-commits only)
- Changing env vars
- Adding new dependencies
- Modifying wallet/security code
- Touching smart contract integration
- Major refactors (>100 lines changed)

## ✨ Approval Message Format

When you say: "**Approved for 24/7**" or similar, I will:
1. ✅ Auto-commit improvements to local repo
2. ✅ Auto-push to GitHub (if approved)
3. ✅ ✅ Post 6-hourly summaries to #code
4. ✅ Keep working on research/docs/improvements
5. ✅ Ask before doing anything in the "hard stops" list
