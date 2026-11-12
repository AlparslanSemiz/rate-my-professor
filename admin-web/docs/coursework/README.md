# Coursework

Documents this project owes the **course**, not documents the product needs.
`admin-web` would build, run and deploy with this folder deleted; PSE would not
accept it.

Everything here is **tracked on purpose**. The wiki tells the examiners that the
delivery is archived in the repository, so a coursework document that lives only
on somebody's laptop makes that claim false. Nothing in this folder is
`.gitignore`d, and nothing in it should be.

## What belongs here

| Kind | Examples |
| --- | --- |
| Kolloquium material | Speaking notes, the question-and-answer crib, timings |
| Presentation drafts | Slide sources and their exported form |
| Abnahme material | The demo script, the data state it assumes, the order to walk it |
| Submission artefacts | Anything handed to the Betreuer that is not source code |

## What does not

Anything an operator or a maintainer of the panel would need. Architecture
decisions go to [`docs/adr/`](../adr/), open work to [`docs/TODO.md`](../TODO.md),
test scope to [`docs/testplan.md`](../testplan.md), and the reasoning behind a
change to [`CHANGELOG.md`](../../CHANGELOG.md). A document that answers "why is
the code like this?" is product documentation even when it was written for a
presentation.

## What is here

| File | What it is |
| --- | --- |
| [demo-notes.md](demo-notes.md) | The live-demo script: the traps to avoid, the order to walk the panel, the data state each screen assumes. Derived from the code, not from course material. |

## What is missing

Nothing else has been written yet. The Kolloquium notes and the presentation
draft do not exist in this repository or anywhere near it: this folder is the
place they go when they do.

The defence of the architecture is deliberately **not** here: it is
[`docs/adr/`](../adr/), because the reasoning is true whether or not there is an
examination. The Kolloquium notes, when they arrive, should cite the ADRs rather
than restate them.
