# Story folder: Codex + Gemini 4 Argon

This folder holds my Wuthering Waves fiction. Every finished story sits directly in this folder as its own file. You (Codex) plan and review; Gemini 4 Argon writes the prose through `argon_story.py`.

## How the folder works

- Story files live in the main folder. There are no subfolders for lore, chapters or drafts, and I don't want any.
- New stories and chapters also go straight into the main folder, named like the existing ones.
- Your working files (prompts, notes, in-progress text) go in the hidden `.argon/` folder only. Prompt files go in `.argon/prompts/`.
- Character cards live in `Jsons/`, one per character (e.g. `Jsons/Yangyang.json`, `Jsons/Mei.json`, `Jsons/Iuno.json`). They are reference, not stories.
- `.argon/style.md` is my standing style guide for Argon. Pass it on every run with `--system`. Don't edit it unless I ask.
- Before naming a new file, look at how existing stories are named and formatted (title style, file extension, one file per story or per chapter) and match it.

## Your role

- For every request, search the whole folder yourself to decide which stories matter. I won't usually name files. Look for:
  - the story I say to continue from, matched by title or by what I describe ("the one where Denia seals the seam");
  - every story featuring the characters involved (search names and nicknames, e.g. Amy/Aemeath);
  - stories that set up places, events or relationships the new piece touches.
- Read the ones you pick before planning. If it's unclear which story I mean, ask.
- Always include the character card from `Jsons/` for every character who appears or is significantly referenced. If a character has no card, say so.
- Before running Argon, list the stories and cards you're passing as context in one short line, with a reason for each if it isn't obvious, so I can add or drop any.
- Turn my request into a prompt file in `.argon/prompts/`: premise, where things stand, a concrete scene-by-scene outline, the characters involved, tone. Argon follows outlines well but ignores word counts.
- Run Argon to write. Do not write the long prose yourself unless I ask.
- When it finishes, read the new file(s) and report: continuity errors against earlier stories, characters out of voice, outline beats it skipped or rushed. Quote the line and say what's wrong.
- Never edit, rename, move or delete my existing stories without my approval. To fix a new story, propose the change or rerun Argon.

## Running Argon

Vertex credentials are already set in the environment (`GOOGLE_APPLICATION_CREDENTIALS`). Never read, print or copy the key file.
File names have spaces, so always quote paths.

Run in the background with `--quiet` (a run can take 10+ minutes).

A complete short story, one file:

    python argon_story.py single --quiet \
      --system ".argon/style.md" \
      --prompt ".argon/prompts/<name>.md" \
      --context "Jsons/<Character>.json" "<Related Story>.md" \
      -o "<New Story Title>.md"

Choosing a mode:
- Use `single` for anything up to about 3 chapters or ~12k words, even if it has chapter titles. Argon will write every chapter in the outline in one call. In `chapters` mode it often writes the whole outline in call 1, then invents extra chapters for the remaining calls ("Bedside Manner": asked for 3, got 5, two calls wasted).
- Use `chapters` only for long stories (4+ chapters) that won't fit in one response. Then the prompt file must say, near the top: "Write only the chapter you are asked for in each turn, and stop at its end. Never write ahead or add chapters beyond the outline." Head each outline section "Chapter N" so the script's "Continue with Chapter N" lines up with it.
- After a `chapters` run, check that the chapter count in the file matches `-n`.

A multi-chapter story, one file per chapter ("Title - Chapter 01.md", ...):

    python argon_story.py chapters --split --quiet \
      --system ".argon/style.md" \
      --prompt ".argon/prompts/<name>.md" \
      --context "Jsons/<Character>.json" "<Related Story>.md" \
      -n <chapters> -o "<New Story Title>.md"

Drop `--split` to put all chapters into one file instead, if that's how the related stories are stored.

- `--context` takes files and/or `.` for the whole folder. Pass Argon the stories you picked, not the whole folder: unrelated stories cost more on every chapter and blur the voice. Put character cards first, then stories in story order, earliest first. Never pass `Jsons/` whole; pick the cards. The script never loads AGENTS.md, hidden folders, the prompt file, or its own output.
- The script refuses to overwrite an existing file. Choose a new title rather than adding `--overwrite`, unless I ask.
- Progress, token counts and the finish reason print to stderr. While it runs, the in-progress chapter is in `.argon/<file>.partial`. With `--split`, each chapter file appears as soon as it's done, so you can review chapter 1 while the rest are writing.
- If the finish reason is `MAX_TOKENS`, rerun with a higher `--max-tokens` (default 131072).
- - Use `--thinking medium` unless I say otherwise.

## Cost guardrails

- Ask me before any run with `-n` above 5, `--thinking high`, or `--context .` (the whole folder).
- Every chapter resends the whole story so far as input (mostly discounted by caching). Mention the context size the script reports before long runs.
