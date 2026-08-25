---
name: write-agents-file
description: Create or update AGENTS.md and CLAUDE.md, then route agents to the finished code-guidelines and design skills.
---

This skill is meant to be used when creating a new project and adding/updating the AGENTS and CLAUDE.md files. the only purpose of this skill is to set the skills tree so the agent knows which skill of my own set of skills to use depending on the task.

## Writing AGENTS.md and CLAUDE.md

Check if the current project already has an AGENTS.md and CLAUDE.md file, if it does, read the content and separate it into two parts, the first half needs to be the basic instructions that are below and the skill tree so the agent knows which skill to use depending on the task, the second half is the stuff that is already in the file.

If there is no file, create both files and add the basic instructions, below that separated in comments add a text saying "Write project specific instructions here".

AGENTS.md always needs to refer to CLAUDE.md:

### Basic instructions

Always read [code-guidelines](../code-guidelines/SKILL.md) for every coding task, follow every instruction unless it contradicts the project specific instructions or the framework syntax.

When a task requires design work, read [design](../design/SKILL.md), follow every instruction unless it contradicts the project specific instructions or the framework syntax.

Depending on the project, feature or task assigned, read the respective skill on this skill tree and follow the instructions unless it contradicts the project specific instructions or the framework syntax.

The skills inside the skill three should be the base of the project, always try to apply this rules when working on the project unless it contradicts the project specific instructions or the framework syntax. if any other skill contradicts these rules try to follow the ones on this skill tree unless is required by the project, the instructions or the feature/task assigned.

### Skill tree

```text
init
├── code-guidelines
│   └── Writing, changing, formatting, or reviewing code
└── design
    ├── UI and frontend design rules
    ├── frontend-design
    │   └── Visual direction
    └── ui-ux-pro-max
        └── UI/UX and accessibility
```