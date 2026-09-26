# A Homecoming of Wind — set to Rubia

A painterly music video for `A Homecoming of Wind.md`.

- **Watch:** `A Homecoming of Wind (Rubia).mp4` (1080p30, H.264 + AAC, 3:24).
- **Live version:** open `index.html` in Chrome or Edge. It paints every frame in real time from the same code. Space plays or pauses, the arrow keys seek, `f` goes fullscreen and `d` shows the shot name.

## Re-rendering the MP4

This machine has no ffmpeg, so the browser does the encoding and a small Node script writes the file.

1. From the corpus root, run `node "Homecoming MV/server.js" --port 8795` (or start the `homecoming-mv` launch config).
2. Open `http://localhost:8795/render.html`. It writes `A Homecoming of Wind (Rubia).mp4` into this folder in about a minute.
   - Optional query parameters: `mbps=16`, `fps=30`, `from=` / `to=` (seconds, for a test clip), `out=` (file name).

## Where things are

- `js/timeline.js`: the shot list timed to Rubia's bars, the transitions and the captions.
- `js/scenes.js`, `js/scenes2.js`: the scenes. `js/paint.js` and `js/poses.js` hold the figure rig and the bird.
- `js/engine.js`: the brushstroke renderer.
- `tools/`: the song analysis pages used to find the vocal timings, and a pose sheet.
