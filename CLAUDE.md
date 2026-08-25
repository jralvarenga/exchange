Always read [code-guidelines](.agents/skills/jralv-code-guidelines/SKILL.md) for every coding task, follow every instruction unless it contradicts the project specific instructions or the framework syntax.

When a task requires design work, read [design](.agents/skills/jralv-design/SKILL.md), follow every instruction unless it contradicts the project specific instructions or the framework syntax.

Depending on the project, feature or task assigned, read the respective skill on this skill tree and follow the instructions unless it contradicts the project specific instructions or the framework syntax.

The skills inside the skill tree should be the base of the project, always try to apply this rules when working on the project unless it contradicts the project specific instructions or the framework syntax. if any other skill contradicts these rules try to follow the ones on this skill tree unless is required by the project, the instructions or the feature/task assigned.

### Skill tree

```text
init
├── code-guidelines (.agents/skills/jralv-code-guidelines/SKILL.md)
│   └── Writing, changing, formatting, or reviewing code
└── design (.agents/skills/jralv-design/SKILL.md)
    ├── UI and frontend design rules
    ├── frontend-design (.agents/skills/jralv-design/frontend-design/SKILL.md)
    │   └── Visual direction
    └── ui-ux-pro-max (.agents/skills/jralv-design/ui-ux-pro-max/SKILL.md)
        └── UI/UX and accessibility
```

<!-- Write project specific instructions here -->

- Don't look over the browser unless I ask you to and give you permission

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
