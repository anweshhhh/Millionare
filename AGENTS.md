# AGENTS.md

This repo is built with Codex in small, reviewable slices.

## Product
- Product name (working): Millionaire: Mind Reader Mode
- Platform: web first, mobile first
- Core fantasy: a KBC / Who Wants to Be a Millionaire inspired psychological quiz duel
- AI should mostly operate behind the scenes through adaptation, player modeling, and insights

## Global rules
- Do not expand scope without explicit instruction
- Keep tasks PR-sized
- Prefer smallest safe diff
- No hardcoding data that should live in config, seed data, or domain models
- Do not add dependencies unless necessary
- Preserve mobile-first UX
- Preserve dramatic, premium, high-tension feel
- Avoid toy-like styling
- Do not introduce multiplayer, social, or creator-platform features unless asked
- Do not introduce native-app-only assumptions
- Do not add user-facing chatbot features unless asked

## Engineering rules
- Use clear folder structure
- Keep components modular
- Separate UI, domain logic, and data access cleanly
- Avoid unnecessary abstraction in early slices
- Add types for domain objects
- Prefer deterministic behavior for core gameplay
- Add tests when changing important logic
- Do not silently change product behavior outside the requested slice

## UX rules
- Optimize for portrait mobile first
- Minimize clutter
- Keep the hot-seat flow immersive
- Each primary screen should have one obvious main action
- Preserve strong answer states, reveal states, and tension pacing

## Documentation rules
After each meaningful task:
- update `docs/build-log.md`
- update `docs/context.md` if assumptions or architecture changed
- update `README.md` if setup or features changed

## Stop-point rule
At the end of each task:
- stop exactly at the requested scope
- summarize what changed
- note assumptions introduced
- list manual smoke checks