import { LockParserBase, DepMap } from './lock-parser-base';
import { Dep, Lockfile, LockfileType, ManifestFile, PkgTree } from '.';
import { YarnLockDeps } from './yarn-lock-parser';
export interface Yarn2Lock {
    type: string;
    object: YarnLockDeps;
    dependencies?: YarnLockDeps;
    lockfileType: LockfileType.yarn2;
}
export declare class Yarn2LockParser extends LockParserBase {
    constructor();
    parseLockFile(lockFileContents: string): Yarn2Lock;
    getDependencyTree(manifestFile: ManifestFile, lockfile: Lockfile, includeDev?: boolean, strictOutOfSync?: boolean): Promise<PkgTree>;
    protected getDepMap(lockfile: Lockfile, manifestFile: ManifestFile): DepMap;
    protected getDepTreeKey(dep: Dep): string;
}