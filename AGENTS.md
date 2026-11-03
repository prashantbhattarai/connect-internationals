# Repository instructions
- Follow CODEX_PLAYBOOK.md; implement only the requested stage.
- UI belongs in app/. API routes authenticate and validate, then call lib/db/services/. Only lib/db/repositories/ may query Prisma. Actor identity will come from lib/auth/currentUser.ts.
- Keep private inputs, seed records, emails and credentials out of source, logs, client responses, Git and Docker images. Mount the private seed only at runtime.
- Discovery must be opt-in; enforce privacy and permissions on the server. No real integrations or credentials.
- Use Node 20, Next 14, React 18, Tailwind 3 and matching Prisma 5/client for this local compatibility prototype. Upgrade before deployment.
- Validate with npm run typecheck, npm run lint, npm run build and docker compose -f docker-compose.dev.yml config --quiet. Run appropriate focused checks as features arrive. Never delete database volumes.
