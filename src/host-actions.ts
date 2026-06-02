/** HostAction helper types for Omegon extensions. */

export const TERMINAL_CREATE_V1 = "terminal.create@1";
export const RESOURCE_OPEN_V1 = "resource.open@1";

export const PACKAGE_INSTALL_V1 = "package.install@1";

export type HostActionExecution = "manual" | "auto_if_allowed";

export interface HostAction<TParams = unknown> {
  id: string;
  type: string;
  params: TParams;
  label?: string;
  execution?: HostActionExecution;
  metadata?: Record<string, unknown>;
}

export type HostActionStatus =
  | "completed"
  | "needs_approval"
  | "denied"
  | "unsupported"
  | "invalid"
  | "failed";

export interface HostActionError {
  code: string;
  message: string;
}

export interface HostActionOutcome<TResult = unknown> {
  action_id: string;
  status: HostActionStatus;
  result?: TResult;
  error?: HostActionError;
}

export type TerminalPlacement =
  | "default"
  | "side_pane"
  | "bottom_pane"
  | "new_tab"
  | "background_session";

export interface TerminalCreateParams {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  title?: string;
  placement?: TerminalPlacement;
  reuse_key?: string;
}

export interface TerminalCreateResult {
  terminal_id: string;
  backend: string;
  actual_placement: string;
  warnings?: string[];
}

export function terminalCreateAction(
  id: string,
  params: TerminalCreateParams,
  options: Omit<HostAction<TerminalCreateParams>, "id" | "type" | "params"> = {},
): HostAction<TerminalCreateParams> {
  return { id, type: TERMINAL_CREATE_V1, params, ...options };
}

export type ResourceOpenIntent = "view" | "edit" | "read" | "inspect";

export type ResourceKind =
  | "markdown"
  | "code"
  | "text"
  | "diagram"
  | "image"
  | "ebook"
  | "pdf"
  | "directory"
  | "unknown";

export type ResourceOpenPlacement =
  | "default"
  | "main_tab"
  | "side_pane"
  | "editor"
  | "background_session";

export interface ResourceOpenParams {
  uri: string;
  intent?: ResourceOpenIntent;
  kind?: ResourceKind;
  placement?: ResourceOpenPlacement;
  reuse_key?: string;
  title?: string;
}

export interface ResourceOpenResult {
  resource_id: string;
  backend: string;
  actual_placement: string;
  handle?: unknown;
  warnings?: string[];
}

export function resourceOpenAction(
  id: string,
  params: ResourceOpenParams,
  options: Omit<HostAction<ResourceOpenParams>, "id" | "type" | "params"> = {},
): HostAction<ResourceOpenParams> {
  return { id, type: RESOURCE_OPEN_V1, params, ...options };
}


export type PackageInstallSource = "registry" | "local_path";
export type PackageActivation = "none" | "enable" | "restart";

export interface PackageInstallParams {
  package: string;
  source: PackageInstallSource;
  version?: string;
  digest?: string;
  dry_run?: boolean;
  activation?: PackageActivation;
  reuse_key?: string;
}

export interface PackageInstallResult {
  install_id: string;
  package: string;
  source: PackageInstallSource;
  version?: string;
  dry_run: boolean;
  status: string;
  plan?: string[];
  effects?: string[];
  handle?: unknown;
  warnings?: string[];
}

export function packageInstallAction(
  id: string,
  params: PackageInstallParams,
  options: Omit<HostAction<PackageInstallParams>, "id" | "type" | "params"> = {},
): HostAction<PackageInstallParams> {
  return { id, type: PACKAGE_INSTALL_V1, params, ...options };
}
