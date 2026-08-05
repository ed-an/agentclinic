---
name: update-changelog
description: Create or update a repository-root CHANGELOG.md with ISO-date headings and concise bullets derived from Git history and the current branch. Use when a user explicitly asks to update the changelog, invokes this skill before merging, or needs a missing changelog reconstructed from commits.
---

# Update Changelog

Maintain `CHANGELOG.md` as a concise, human-readable record of completed work.

## Workflow

1. Work from the repository root. Inspect `git status`, the current branch, recent commits, and any existing `CHANGELOG.md` before editing.
2. If `CHANGELOG.md` does not exist, run `python3 .agents/skills/update-changelog/scripts/commits_by_date.py` and create it from the full commit history:
   - Begin with `# Changelog`.
   - Add one `## YYYY-MM-DD` heading per commit date, newest first.
   - Add a concise bullet for each meaningful commit under its date.
3. If `CHANGELOG.md` exists, determine what changed since its most recent update by inspecting the commits and working-tree diff. Add only missing work under the applicable ISO-date heading.
4. Rewrite noisy, typo-filled, or implementation-centric commit subjects into clear outcome-focused bullets. Preserve meaningful scope; do not invent behavior unsupported by commits or diffs.
5. Combine commits into one bullet only when they are inseparable parts of the same outcome. Keep distinct user-visible, architectural, testing, and documentation changes separate.
6. Do not include merge commits, changelog-only commits, generated files, dependency-lockfile churn, or repeated entries unless they represent a meaningful project change.
7. Use the commit author date for committed work and the current local date for uncommitted work. Reuse an existing date heading and keep date headings newest first.
8. Review the final diff for duplicate bullets, missing dates, unsupported claims, and accidental edits outside `CHANGELOG.md`.

## Output style

- Use ISO dates: `## YYYY-MM-DD`.
- Start bullets with a past-tense action verb such as `Added`, `Updated`, `Fixed`, or `Established`.
- Describe outcomes in plain language; omit commit hashes.
- Keep each bullet to one sentence where practical.
- Do not add an `Unreleased` section unless the user requests one.

## Safety

- Never commit, merge, switch branches, or delete branches as part of this skill unless the user separately requests those Git operations.
- Preserve existing changelog content and formatting unless correction is necessary for this structure.
