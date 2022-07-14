import { load, FAILSAFE_SCHEMA } from 'js-yaml';
import * as yarnCore from '@yarnpkg/core';

import {LockParserBase, DepMap, DepMapItemRequire} from './lock-parser-base';
import {
  Dep,
  Lockfile,
  LockfileType,
  ManifestDependencies,
  ManifestFile,
  PkgTree,
  Scope,
} from '.';
import { config } from '../config';
import { YarnLockDeps } from './yarn-lock-parser';
import { InvalidUserInputError } from '../errors';
import {normalizeDepRange, parseDepName, yarnLockFileKeyNormalizer} from './yarn-utils';

export interface Yarn2Lock {
  type: string;
  object: YarnLockDeps;
  dependencies?: YarnLockDeps;
  lockfileType: LockfileType.yarn2;
}

export class Yarn2LockParser extends LockParserBase {
  constructor() {
    super(LockfileType.yarn2, config.YARN_TREE_SIZE_LIMIT);
  }

  public parseLockFile(lockFileContents: string): Yarn2Lock {
    try {
      const rawYarnLock: any = load(lockFileContents, {
        json: true,
        schema: FAILSAFE_SCHEMA,
      });

      delete rawYarnLock.__metadata;
      const dependencies: YarnLockDeps = {};

      const structUtils = yarnCore.structUtils;
      const parseDescriptor = structUtils.parseDescriptor;
      const parseRange = structUtils.parseRange;

      const keyNormalizer = yarnLockFileKeyNormalizer(
        parseDescriptor,
        parseRange,
      );

      Object.entries(rawYarnLock).forEach(
        ([fullDescriptor, versionData]: [string, any]) => {
          keyNormalizer(fullDescriptor).forEach((descriptor) => {
            dependencies[descriptor] = versionData;
          });
        },
      );

      return {
        dependencies,
        lockfileType: LockfileType.yarn2,
        object: dependencies,
        type: LockfileType.yarn2,
      };
    } catch (e) {
      throw new InvalidUserInputError(
        `yarn.lock parsing failed with an error: ${e.message}`,
      );
    }
  }

  public async getDependencyTree(
    manifestFile: ManifestFile,
    lockfile: Lockfile,
    includeDev = false,
    strictOutOfSync = true,
  ): Promise<PkgTree> {
    const depTree = await super.getDependencyTree(
      manifestFile,
      lockfile,
      includeDev,
      strictOutOfSync,
    );

    const meta = { lockfileVersion: 2, packageManager: 'yarn' };
    const depTreeWithMeta = {
      ...depTree,
      meta: { ...depTree.meta, ...meta },
    };

    return depTreeWithMeta;
  }

  protected getDepMap(
    lockfile: Lockfile,
    manifestFile: ManifestFile,
  ): DepMap {
    const yarnLockfile = lockfile as Yarn2Lock;
    const depMap: DepMap = {};

    const dependencies = (lockfile.dependencies as YarnLockDeps) || {};

    for (const [depName, dep] of Object.entries(yarnLockfile.object)) {
      const subDependencies = Object.entries({
        ...(dep.dependencies || {}),
        ...(dep.optionalDependencies || {}),
      }).reduce(
        (requires, [key, ver]) => {
          const resolution = findResolutions(dependencies, depName, key, manifestFile.resolutions);
          const name = resolution?.name || `${key}@${ver}`;
          const requirement = resolution?.requirement || { key, range: ver };
          return {
            ...requires,
            [name]: requirement,
          }
        }, {} as Record<string, DepMapItemRequire>
      );

      const { name, range } = parseDepName(depName);

      depMap[depName] = {
        labels: {
          scope: Scope.prod,
        },
        name,
        requires: subDependencies,
        version: dep.version,
        range: normalizeDepRange(range),
      };
    }

    return depMap;
  }

  protected getDepTreeKey(dep: Dep): string {
    return `${dep.name}@${dep.version}`;
  }
}
function findResolutions(
  dependencies: YarnLockDeps,
  depName: string,
  subDepKey: string,
  resolutions?: ManifestDependencies,
): { name: string, requirement: DepMapItemRequire } | undefined {
  if (!resolutions) return;

  const resolutionKeys = Object.keys(resolutions);

  const { name, range } = parseDepName(depName);

  const firstMatchingResolution = resolutionKeys.find((res) => {
    if (!res.endsWith(subDepKey)) {
      return false;
    }

    const leadingPkg = res.split(subDepKey)[0].slice(0, -1);

    const noSpecifiedParent = !leadingPkg;
    const specifiedParentMatchesCurrentDep = leadingPkg === name;
    const specifiedParentWithVersionMatches =
      leadingPkg.includes(name) &&
      leadingPkg.includes(dependencies[`${name}@${range}`].version);

    return (
      noSpecifiedParent ||
      specifiedParentMatchesCurrentDep ||
      specifiedParentWithVersionMatches
    );
  });

  if (resolutionKeys && firstMatchingResolution) {
    const key = subDepKey;
    const range = resolutions[firstMatchingResolution];
    return {
      name: `${subDepKey}@${resolutions[firstMatchingResolution]}`,
      requirement: {
        key,
        range,
      }
    };
  }
}
