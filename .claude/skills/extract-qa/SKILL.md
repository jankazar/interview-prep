---
name: extract-qa
description: Extract interview Q&As from a source web page (e.g. GeeksforGeeks) into a topic's study .md file, mirroring the source structure exactly. Use when a topic folder's CLAUDE.md says to go through a URL and extract the Q&As "as they are", or when the user asks to generate/regenerate a topic .md from a page.
argument-hint: "<topic-folder>"
allowed-tools: Read, Write, Edit, Bash(node:*), Bash(curl:*)
---

# Extract Q&As from a source page

Turns a source web page into a study Q&A markdown file. The goal is **fidelity**:
copy the page's wording *and* its structure. Do not summarize, reword or re-bullet.

## Workflow

1. **Read the instructions.** Read `<topic-folder>/CLAUDE.md` (target file name, source URL,
   extra Q&As to add) and the root `CLAUDE.md` (Q&A format).
2. **Download the HTML** into the session scratchpad (never fetch through a summarizing tool):
   ```bash
   curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36" -o <scratchpad>/page.html "<url>"
   ```
3. **Convert** with the bundled script (Node 16+, no dependencies):
   ```bash
   node .claude/skills/extract-qa/scripts/html2qa.js <scratchpad>/page.html -o <scratchpad>/raw.md
   ```
   It prints the number of questions found. Compare it with the question count on the page.
4. **Review `raw.md`** against the page and fix anything the script got wrong (see the checklist).
   Remove non-Q&A leftovers such as ads, "Related articles" or course promos.
5. **Assemble the target file**:
   - `# <Topic> Interview Questions` title.
   - `Source: [<page title>](<url>)` line.
   - If the topic adds its own Q&As, split the file into `## Part 1 – ... (Source)` and
     `## Part 2 – ... (Senior focus)` and add a short table of contents linking both parts.
   - The converted content goes in Part 1, unchanged except for the review fixes.
6. **Add extra Q&As** if the topic CLAUDE.md asks for them. Write them in the root CLAUDE.md
   all-bullet format, ordered from basic to advanced, and continue the question numbering.
7. **Verify** with the checklist below, then report the question counts (source + added).

## Formatting rules (source-derived content)

| Source element | Markdown |
| --- | --- |
| `<li>` | `* ` bullet (`1. ` for `<ol>`), nested lists indented two spaces |
| Plain `<p>`, e.g. a lead-in sentence before a list | Plain paragraph, **no bullet** |
| Bold-only `<p>`, `<h4>`–`<h6>` (e.g. "Pros of Docker") | `**Sub-header**` on its own line, **no bullet** |
| `<h3>` | `### N. Question` |
| `<h2>` | `## Section` |
| `<blockquote>`, `<pre>`, code tabs | Fenced code block |
| `<table>` | Markdown table |
| `<img>` | `![alt](src)` using the original image URL |

- Put exactly one blank line between blocks (paragraphs, sub-headers, lists, images, code,
  tables) so they don't merge into a list, and a single blank line between Q&A sections.
- Never add bullets the source doesn't have, and never drop bullets it has.
- Inline bold, italics and `code` are kept; links keep only their text.

Q&As written without a source page (step 6) use the all-bullet format from the root CLAUDE.md:

```markdown
### 1. What is Docker ?
* Docker is a containerization platform ...
* This image can be distributed ...
```

## Review checklist

- [ ] The question count matches the source page, and the numbering has no gaps.
- [ ] No sub-header has a bullet (`* **Pros of ...**` alone on a line is wrong).
- [ ] No intro paragraph has a bullet.
- [ ] Every image from the source is present, in the same position.
- [ ] Code blocks are fenced, the language is set where known, and the indentation is intact.
- [ ] No `****`, empty `**`, stray HTML or entities (`&amp;`) remain.
- [ ] No runs of two or more blank lines (`grep -c` on `^$` pairs, or a quick scan).
