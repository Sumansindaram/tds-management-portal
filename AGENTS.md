
- Offline edition lives in `offline/` and reuses `src/pages` via alias mocks (local storage instead of the backend); build with `SNAPSHOT=<json> npx vite build --config offline/vite.config.ts` so offline and online stay in sync.
