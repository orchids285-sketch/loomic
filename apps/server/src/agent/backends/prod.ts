import { mkdirSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  type BackendFactory,
  type BackendProtocol,
  CompositeBackend,
  FilesystemBackend,
  LocalShellBackend,
  StoreBackend,
} from "deepagents";

const DEFAULT_SANDBOX_ROOT = "/tmp/loomic-sandbox";
const DEFAULT_SKILLS_ROOT = "/opt/loomic/skills";

/**
 * Create a production backend with per-project LocalShellBackend sandbox.
 *
 * with LocalShellBackend as the default backend, deepagents exposes its built-ins `execute` tools.
 * each canvasId gets its own working directory, cleaned up by runtime.ts.
 *
 * file persistence (/workspace/, /memories/) goes through StoreBackend (PostgresStore),
 * fully independent of LocalShellBackend.
 *
 * Routes:
 *   /workspace/        → StoreBackend (PostgresStore, per-project)
 *   /memories/         → StoreBackend (PostgresStore, per-project)
 *   /skills/           → FilesystemBackend (shared, read-only system skills)
 *   /workspace-skills/ → StoreBackend (user-installed workspace skills, optional)
 *   default            → LocalShellBackend (per-run sandbox, provides execute tool)
 */
export function createProductionBackendFactory(
  canvasId: string,
  options?: {
    sandboxRoot?: string;
    skillsRoot?: string;
    hasWorkspaceSkills?: boolean;
  },
): { factory: BackendFactory; sandboxDir: string } {
  const sandboxRoot = resolve(options?.sandboxRoot ?? DEFAULT_SANDBOX_ROOT);
  const skillsRoot = resolve(options?.skillsRoot ?? DEFAULT_SKILLS_ROOT);

  // Per-run isolated directory
  const runId = crypto.randomUUID();
  const sandboxDir = join(sandboxRoot, runId);
  mkdirSync(sandboxDir, { recursive: true });
  const realSandboxDir = realpathSync(sandboxDir);

  // LocalShellBackend = FilesystemBackend + execute tool
  // pass only the variables needed -- never API keys or other secrets
  // virtualMode: true confines the file tools (write_file/read_file/ls) to rootDir.
  // stops concurrent users colliding by writing absolute paths through write_file.
  // note: virtualMode does not confine execute -- shell commands still see the whole filesystem.
  const sandbox = new LocalShellBackend({
    rootDir: sandboxDir,
    virtualMode: true,
    timeout: 120,
    maxOutputBytes: 200_000,
    env: {
      PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
      HOME: sandboxDir,
      FONT_DIR: join(skillsRoot, "canvas-design", "canvas-fonts"),
      PYTHONDONTWRITEBYTECODE: "1",
    },
  });

  const skillsBackend = new FilesystemBackend({ rootDir: skillsRoot, virtualMode: true });

  const factory: BackendFactory = (stateAndStore) => {
    const routes: Record<string, BackendProtocol> = {
      "/memories/": new StoreBackend(stateAndStore, {
        namespace: ["projects", canvasId, "memories"],
      }),
      "/workspace/": new StoreBackend(stateAndStore, {
        namespace: ["projects", canvasId, "workspace"],
      }),
      "/skills/": skillsBackend,
    };

    if (options?.hasWorkspaceSkills) {
      routes["/workspace-skills/"] = new StoreBackend(stateAndStore, {
        namespace: ["projects", canvasId, "workspace-skills"],
      });
    }

    return new CompositeBackend(sandbox, routes);
  };

  return { factory, sandboxDir: realSandboxDir };
}
