import { ManifestFile, PkgTree, Scope, LockfileType, getYarnWorkspaces } from './parsers';
import { UnsupportedRuntimeError, InvalidUserInputError, OutOfSyncError } from './errors';
import { buildDepGraphFromCliOutput } from './cli-parsers';
export { buildDepTree, buildDepTreeFromFiles, buildDepGraphFromCliOutput, getYarnWorkspacesFromFiles, getYarnWorkspaces, PkgTree, Scope, LockfileType, UnsupportedRuntimeError, InvalidUserInputError, OutOfSyncError, ManifestFile, };
declare function buildDepTree(manifestFileContents: string, lockFileContents: string, includeDev?: boolean, lockfileType?: LockfileType, strictOutOfSync?: boolean, defaultManifestFileName?: string): Promise<PkgTree>;
declare function buildDepTreeFromFiles(root: string, manifestFilePath: string, lockFilePath: string, includeDev?: boolean, strictOutOfSync?: boolean): Promise<PkgTree>;
declare function getYarnWorkspacesFromFiles(root: any, manifestFilePath: string): string[] | false;
export declare function getYarnLockfileType(lockFileContents: string, root?: string, lockFilePath?: string): LockfileType;