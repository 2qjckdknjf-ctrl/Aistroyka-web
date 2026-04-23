# Project Dashboard Polish / Information Architecture Pass

IA/polish pass — not a new feature layer.

## Manager view structure

1. **Project identity** — Name + "Overview"
2. **Summary cards** — Tasks, Milestones, Open issues, Pending decisions, Reports, AI (primary numbers)
3. **Status + health** — One-line: badge + single reason
4. **Needs attention** — Actionable queue with links
5. **Tabs** — Schedule, Issues, Documents, Activity first; then Workers, Contractors, Reports, etc.
6. **Activity** — Inside Activity tab (supporting context)

**Primary:** Summary, Status, Needs attention  
**Secondary:** Tabs and their content  
**Historical:** Activity tab

## Owner view structure

1. **Project identity** — Name + "Owner view"
2. **Status + reason** — One-line
3. **Your attention** — Compact actionable overview
4. **Approve documents** — Primary action surface (modal)
5. **Summary cards** — Key numbers
6. **Recent activity** — Last 10 items
7. **Milestones, Open issues** — Secondary context

**Primary:** Approve documents (action)  
**Supporting:** Your attention, Summary, Recent activity  
**Secondary:** Milestones, Issues

## Meaning separation

| Block | Role |
|-------|------|
| **Status / health** | Overall project state |
| **Status reasons** | Why status is what it is |
| **Needs attention** | What requires action now |
| **Timeline / activity** | What happened recently |
| **Notifications** | Personal delivery; not a project-summary block |

## Decisions

- Manager: Summary first, then status, then attention
- Status reasons reduced to 1
- Tabs reordered: operational (Schedule, Issues, Documents, Activity) first
- Default tab: Schedule
- Owner: Approve documents moved up, merged with former "Pending decisions"
- Owner: Redundant caption removed
- Labels: "Needs attention now" → "Needs attention", "All clear" when empty
- Empty states: calm, short copy

## MVP limits

- No new features
- No design-system change
- Notifications remain separate from project blocks
- No role rewrite
