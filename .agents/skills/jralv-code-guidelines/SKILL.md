---
name: jralv-code-guidelines
description: Rules on how the agent should write and format code.
---

This skills are based on my preferences on how the agent should write new and existing file, taking into account formatters, apply these preferences to new and existing code while respecting language syntax and mandatory framework requirements.
If any of this rules cannot be applied to the project or language syntax, skip the rule and continue with the next one.
If there are organization rules applied to the project, use organization rules as the base but still apply this code guidelines as long as it doesn't conflict with the organization rules.

## Writting code

### General code

For indentation always use 2 spaces, no matter what the language is or what guidelines are required, unless is necessary like in python always use 2 spaces, if needed modify the formatter file of the language to always use 2 space indentation
Imports should use '' and classname and any other text should use "".
Prioritize named functions, only use arrow function when needed (for example inside any hook, function, etc.)
Prioritize using Type instead of interface, only use interface when adding props inside a component/function/hook etc. (for example inside a component, hook, etc.)
Always add types for .env variables.
When writting functions/hooks/lib/etc. always add interfaces for the parameters and return value. always add JSDocs describing what the function does.

### Formatter

Priority using biome, always make sure there's a command to format and another to check.
Check the formatter config file and based on this rules add or update the rules so it matches this skill, create the file if it doesn't exist.
Format command should fix every error, EVERY ERROR, dont leave anything behind.
Apply the relevant rules below without reformatting unrelated files.

### Files and directories

Have a clear separation for:

- components
- hooks
- models
- contexts
- lib
- etc...

Don't put any context or hooks inside /components, have a full context per file, don't segment, put createContext, Provider and export the interface of the context.
When working on features, always have a folder per feature, only if the component/hook/model/context/etc. is for the global app put it in root folder.
Always try to keep the file name short, take into account if a file is inside a feature folder, infer the name and name the file accordanly.
NEVER create and use index.ts files to reexport components, hooks, models, contexts, lib, etc. always use the file name as the name of the export, unless is required by the framework.
Naming files should be in kebab-case, functions and variables should be in camelCase.

### Writting a component

Follow this rules and order of the component

- Only 1 component per file
- The name of the component should be the same name of the file.
- Imports from packages should be first, imports from the same app comes nexts
- Types should go next, always before a type
- If the component have props, always define an interface Props (never type)
- Never do export default for a component unless is required by the framework
- Never use arrow function for a component and never write the props type inside the function
- Empty, loading, error, etc. of that component should be in it's own file

### Writting functions, hooks, lib, etc.

Follow every rule as of components but with the following changes:

- Always use a utils.ts file to group small functions like cn(), debounce(), throttle(), dateFormat(), etc.
- Always add JSDocs describing what the function does. even when the function is small and simple, it's still important to describe what it does and how to use it.