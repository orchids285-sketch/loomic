import type { StructuredTool } from "@langchain/core/tools";
import type { BackendFactory, BackendProtocol } from "deepagents";

import type { ConnectionManager } from "../../ws/connection-manager.js";
import { createBrandKitTool } from "./brand-kit.js";
import { createInspectCanvasTool } from "./inspect-canvas.js";
import { createManipulateCanvasTool } from "./manipulate-canvas.js";
import {
  createImageGenerateTool,
  type PersistImageFn,
  type SubmitImageJobFn,
} from "./image-generate.js";
import { createProjectSearchTool } from "./project-search.js";
import { createScreenshotCanvasTool } from "./screenshot-canvas.js";
import {
  createVideoGenerateTool,
  type SubmitVideoJobFn,
} from "./video-generate.js";
import { createPersistSandboxFileTool } from "./persist-sandbox-file.js";

export { createImageGenerateTool } from "./image-generate.js";
export { createVideoGenerateTool } from "./video-generate.js";
export { createInspectCanvasTool } from "./inspect-canvas.js";
export { createManipulateCanvasTool } from "./manipulate-canvas.js";

// ---------------------------------------------------------------------------
// deepagents built-in tools (injected by FilesystemMiddleware)
// ---------------------------------------------------------------------------
//
// deepagents@1.8.4 injects the following tools via createFilesystemMiddleware,
// our own tool names must not collide with these:
//
//   ls          - list a directory
//   read_file   - read a file (supports offset/limit)
//   write_file  - write a file
//   edit_file   - edit a file (find & replace)
//   glob        - match file paths by pattern
//   grep        - search file contents by regex
//   execute     - run a shell command (only under SandboxBackendProtocol)
//   task        - hand a subtask to a subagent
//   write_todos - manage the TODO list
//
// LocalShellBackend is the default backend of the CompositeBackend,
// it implements SandboxBackendProtocol, so execute is available automatically.
// code execution needs no extra custom tool.
//
// the CompositeBackend routes do not overlap:
//   /workspace/  -> StoreBackend (PostgresStore) - file persistence
//   /memories/   -> StoreBackend (PostgresStore) - agent memory
//   /skills/     -> FilesystemBackend            - built-in skills
//   default      -> LocalShellBackend            - execute + temp files
// ---------------------------------------------------------------------------

export function createMainAgentTools(
  backend: BackendProtocol | BackendFactory,
  deps: {
    createUserClient: (accessToken: string) => any;
    brandKitId?: string | null;
    connectionManager?: ConnectionManager;
    persistImage?: PersistImageFn;
    sandboxDir?: string;
    submitImageJob?: SubmitImageJobFn;
    submitVideoJob?: SubmitVideoJobFn;
  },
) {
  const tools: StructuredTool[] = [
    createProjectSearchTool(backend),
    createInspectCanvasTool(deps),
    createManipulateCanvasTool(deps),
    createImageGenerateTool({
      ...(deps.persistImage ? { persistImage: deps.persistImage } : {}),
      ...(deps.submitImageJob ? { submitImageJob: deps.submitImageJob } : {}),
    }),
    createVideoGenerateTool({
      ...(deps.submitVideoJob ? { submitVideoJob: deps.submitVideoJob } : {}),
    }),
    createPersistSandboxFileTool({
      createUserClient: deps.createUserClient,
      ...(deps.sandboxDir ? { sandboxDir: deps.sandboxDir } : {}),
    }),
    // execute is injected automatically by the deepagents FilesystemMiddleware,
    // because the CompositeBackend's default backend is LocalShellBackend.
    // nothing to register here by hand.
  ];
  if (deps.brandKitId) {
    tools.push(createBrandKitTool(deps, deps.brandKitId));
  }
  if (deps.connectionManager) {
    tools.push(createScreenshotCanvasTool({
      connectionManager: deps.connectionManager,
      ...(deps.persistImage ? { persistImage: deps.persistImage } : {}),
    }));
  }
  return tools;
}

/** @deprecated Use createMainAgentTools + sub-agents instead */
export function createPhaseATools(backend: BackendProtocol | BackendFactory) {
  return [
    createProjectSearchTool(backend),
    createImageGenerateTool(),
    createVideoGenerateTool(),
  ] as const;
}
