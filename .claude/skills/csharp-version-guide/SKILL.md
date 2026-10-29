---
name: csharp-version-guide
description: Create a comprehensive study guide for the new features of one C# version (e.g. C# 9, 10, 11...) in csharp-news/csharp-<N>/, with C# (N-1) vs C# N code comparisons, best practices and a quick interview cheat sheet. Use when the user asks for a study guide for a specific C# version, or when a csharp-news/csharp-<N> folder's CLAUDE.md asks for one.
argument-hint: "<csharp-version-number, e.g. 9>"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(ls:*)
---

# C# version study guide

Produces `csharp-news/csharp-<N>/csharp-<N>.md`: a study guide (NOT Q&A format) for
the features introduced in C# `<N>`, for Senior .NET developer interview prep.
Reference output: `csharp-news/csharp-8/csharp-8.md` — read it first to match
structure, tone and density.

## Workflow

1. **Read instructions.** Read `csharp-news/CLAUDE.md` and `csharp-news/csharp-<N>/CLAUDE.md`
   (if present). They override this skill on conflict. The root CLAUDE.md's Q&A format
   does **not** apply to `csharp-news`.
2. **Establish the feature list.** Use your knowledge of the version's official
   "What's new" list; if unsure about a feature, its version, or required runtime/
   `LangVersion`, verify with WebSearch/WebFetch (learn.microsoft.com "What's new in C# N")
   rather than guessing. Don't include features from other versions.
3. **Write the file** with the structure below.
4. **Self-check** with the checklist at the bottom, then summarise to the user in a few lines.

## Strict version rule

Examples must use **only C# `<N>` and older**. Never use syntax or APIs from a later
version, even incidentally. Typical leaks to check for when N is low:
`is not null` (9), `new()` target-typed (9), `record` / `init` (9), relational and
`and`/`or`/`not` patterns (9), file-scoped namespaces (10), `required` (11), list
patterns (11), `ArgumentNullException.ThrowIfNull` (.NET 6), `System.Net.Http.Json` (.NET 5).
Mention of later versions in prose is also avoided unless the user asks. If a feature
can't be shown without newer syntax, rewrite the example with the older equivalent.

## Document structure

```
# C# <N> Study Guide
<intro: release date, .NET/VS version, default LangVersion per target framework,
 and which features need runtime support>

## Table of Contents          (anchor links to every numbered section)

## 1. Overview of new features
  table: Feature | Purpose | Runtime requirement

## 2..K. One section per feature (ordered by importance/interview likelihood)

## K+1. Quick interview cheat sheet
```

### Per-feature section

Use subheadings as they fit (don't pad): 
- **The problem / motivation** — what was painful before.
- **The idea / syntax** — short definition.
- **Example** — minimal, runnable-looking, commented.
- **Comparison with C# <N-1>** — see below.
- **Rules & behaviour** — bullets: edge cases, runtime semantics, what is compile-time only.
- **Best practices & pitfalls** — bullets.
- **Real-world use** — only when meaningful (ASP.NET Core, EF Core, perf hot paths).

Small features (one-liners) get a short section: example, comparison, 2–4 bullets.
Skip sub-parts that have nothing useful to say.

### Comparison with the older version (important — user loves this)

For **every** feature where an older equivalent exists, show it side by side:

```csharp
// C# 7.x – <how it was done / why it was painful>
...

// C# 8 – <what's better>
...
```

- Label each block with the exact versions in comments (`// C# 7.x`, `// C# 8`).
- Use the *real* older idiom (not a strawman): the code must compile on the older version.
  Note compile errors explicitly (`// error CS1674 in C# 7.x`) when the old way was impossible.
- Add a small comparison table (`| | C# 7.x | C# 8 |`) when several dimensions differ
  (null safety, allocations, blocking, breaking changes...).
- If there is genuinely no older equivalent, say so in one line instead of inventing one.
- For feature N, "older" means the previous version (N-1) or the last idiom that worked.

### Quick interview cheat sheet (final section, always)

Three parts:
1. **Likely questions and concise answers** — bold question, 1–3 sentence answer. Cover
   every feature, plus "what is the difference between X and Y" and "what needs runtime support".
2. **Common traps** — bullet list of pitfalls interviewers like (misconceptions,
   copy-vs-view, thread-safety, silent behaviour, runtime vs compile-time).
3. *(Only if asked)* version-context table. Default: omit, since it drags in other versions.

## Style rules

- Markdown only; headings `##` for sections, `###` for subsections; fenced ```csharp blocks.
- Comments inside code explain *why*, not *what*.
- Short bullets and tables over prose; no filler, no marketing language.
- Keep claims precise: say "compiler warning" vs "error" vs "runtime exception" exactly.
- Accuracy over volume: do not invent API names, diagnostics codes or runtime requirements.
  Leave out a diagnostic code if unsure.
- Target length: roughly 600–1000 lines for a big release; proportionally less for small ones.
- Create the folder if it doesn't exist; file name `csharp-<N>.md`; overwrite only the
  guide for that version.

## Final checklist

- [ ] Every feature of the version covered; no feature from another version
- [ ] No syntax/API newer than C# `<N>` in any example
- [ ] Each feature has a `C# <N-1>` vs `C# <N>` comparison (or an explicit "no equivalent" line)
- [ ] Runtime/framework requirements stated (what works only on which .NET)
- [ ] Cheat sheet with questions, answers and traps present
- [ ] TOC anchors match headings
- [ ] File saved at `csharp-news/csharp-<N>/csharp-<N>.md`
