# APPROVAL.md - 24/7 Continuous Work Authorization

## 🔓 Current Authorization Level

**Status**: ⏳ PENDING APPROVAL

Once you approve, I will operate under these rules:

---

## ✅ **AUTO-APPROVED ACTIONS** (No asking needed)

### Code Quality
- ✅ Fix TypeScript errors
- ✅ Improve accessibility (ARIA labels, semantics)
- ✅ Refactor for clarity/performance (<100 lines)
- ✅ Add comments to complex logic
- ✅ Format code consistently

### Documentation
- ✅ Update README/PROGRESS.md/docs
- ✅ Add comments explaining decisions
- ✅ Create examples or tutorials
- ✅ Fix broken links or outdated info
- ✅ Generate API documentation

### Research
- ✅ Search web for latest patterns
- ✅ Analyze competitors (Orca, Jupiter, Magic Eden UI)
- ✅ Track Solana ecosystem updates
- ✅ Document findings in memory files
- ✅ Suggest improvements based on research

### Commits & Pushing
- ✅ Commit local work (with clear messages)
- ✅ Push to GitHub `main` branch (improvements only)
- ✅ Create descriptive commit messages
- ✅ Keep git history clean

### Communication
- ✅ Post 6-hourly updates to #code channel
- ✅ Report blockers/security findings
- ✅ Answer questions about the project
- ✅ Request feedback from team

---

## ❌ **HARD STOPS** (Always ask first)

Never auto-do these without explicit approval per action:

- ❌ Deploy to production/Cloudflare Pages
- ❌ Modify smart contract code
- ❌ Change wallet/security logic
- ❌ Add new major dependencies
- ❌ Delete files or branches
- ❌ Change environment variables
- ❌ Major refactors (>500 lines affected)
- ❌ Breaking API changes
- ❌ Merge pull requests
- ❌ Push to other branches than main
- ❌ Access external APIs (except web_search + GitHub)

---

## 📋 How to Approve

### Option A: Approve Everything (Recommended for trusted work)
**Message**: "Approved for 24/7 work" or "Go ahead, full automation"

**I will then**:
1. ✅ Check HEARTBEAT.md every 30 minutes
2. ✅ Auto-commit improvements
3. ✅ Auto-push to GitHub
4. ✅ Post updates to #code
5. ✅ Keep improving frontend, docs, research
6. ✅ Ask for approval on hard stops only

### Option B: Selective Approval
**Message**: "Approved to: [list specific items]"

Examples:
- "Approved to commit & push frontend improvements, but ask before deploying"
- "Approved to research & document only, no commits"
- "Approved to update docs, but check with me on code changes"

### Option C: Revoke Anytime
**Message**: "Hold on, pause automation"

I will immediately:
- ⏹️ Stop auto-commits/pushes
- ⏹️ Only do what you explicitly ask
- ⏹️ Return to normal (ask-before-doing) mode

---

## 🕐 Work Schedule (If Approved)

**Every 30 minutes**:
- Check git status (any uncommitted changes?)
- Verify build (no TypeScript errors?)
- Review recent research findings
- Commit improvements if any

**Every 2 hours**:
- Deep dive on research (new Solana patterns, DeFi trends)
- Suggest UI/UX improvements
- Update documentation
- Plan next steps

**Every 6 hours**:
- Post summary to #code channel
- Report metrics (commits, research findings, blockers)
- Ask for feedback

**Daily**:
- Full progress report
- Weekly review of major accomplishments

---

## 📝 Commit Message Format

All commits will follow this pattern:

```
[AUTO] Type: Brief description

- Specific change 1
- Specific change 2
- Why this helps the project
```

Examples:
```
[AUTO] Docs: Update PROGRESS.md with Feb 4 metrics
- Added new features section
- Updated timeline
- Synced with git log

[AUTO] Fix: Resolve TypeScript error in AuctionDetail
- Fixed type mismatch in bid array
- Added proper null checks
- Tests pass

[AUTO] Improve: Better error messages in wallet connection
- Added user-friendly error copy
- Added retry button
- Follows fintech UX patterns
```

---

## 🎯 Current Goals (24/7 Focus)

1. **Frontend Polish** (in progress)
   - Accessibility improvements
   - UX enhancements (based on Solana research)
   - Error handling edge cases

2. **Smart Contract Integration Prep**
   - Research Anchor framework patterns
   - Document integration checklist
   - Create hook templates

3. **Documentation Excellence**
   - Keep PROGRESS.md fresh
   - Add deployment troubleshooting
   - Create video tutorials (if applicable)

4. **Monitoring & Alerts**
   - Track Solana ecosystem news
   - Monitor GitHub for breaking updates
   - Document security concerns

---

## 🛑 Safety Guarantees

Even with full approval, I **WILL NEVER**:
- Commit or push code that breaks the build
- Push without running local tests
- Delete important files
- Expose secrets in logs
- Make decisions that contradict your stated rules
- Assume approval for hard stops (always ask)

---

## 📞 How to Reach Me

If I go 6+ hours without contact and I have approval:
- I'll keep working (research, docs, improvements)
- I'll post to #code with progress
- I won't do hard stops without explicit approval

If you need to pause me:
- Just say "Pause" or "Hold"
- I stop auto-work immediately
- Return to ask-before-doing mode

---

## ✨ Example Conversation Flow

**You**: "Approved for 24/7 work. Focus on frontend polish and research."

**Me** (30 min later): ✅ Committed 2 TypeScript fixes, pushed to main

**You**: (6 hours later) See #code update with progress

**Me** (finds issue): 🤔 "Found potential security concern in form validation. Should we fix? Or wait for you?"

**You**: "Fix it"

**Me**: ✅ Fixed, committed, pushed, reported

**You**: "New requirement: add dark mode toggle"

**Me**: ❌ "That's outside our current scope. Confirm?" (Asks before auto-implementing)

---

**Ready to approve? Just say the word!** 🚀
