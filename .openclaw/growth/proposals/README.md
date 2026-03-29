# Board Growth Proposals

This directory structure manages self-improvement proposals for the Board auditor system.

## Directory Structure

- `inbox/` - Pending proposals awaiting Board review
- `decided/` - Board-approved or rejected proposals with final decisions

## Proposal Format

Each proposal should be a markdown file with:

```markdown
# Proposal Title

## Summary
Brief overview of the proposed change

## Proposed Changes
- Specific changes to be made
- Files affected (if any)

## Rationale
Why this change is needed

## Risk Assessment
- Risk level: low/medium/high
- Reversibility: yes/no
- Protected paths affected: yes/no

## Board Decision (filled after review)
- Decision: approve/revise/reject
- Apply mode: assisted/manual
- Reason: [explanation]
```

## Review Process

1. Proposals are generated into `inbox/`
2. Board auditor reviews and creates artifacts
3. Approved proposals are moved to `decided/` with decision notes
4. Rejected proposals are archived in `decided/`

## Next Steps

- Create initial proposal templates
- Set up automated proposal generation
- Define Board approval criteria