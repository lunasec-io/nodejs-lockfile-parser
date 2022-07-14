"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Yarn2LockParser = void 0;
const js_yaml_1 = require("js-yaml");
const yarnCore = require("@yarnpkg/core");
const lock_parser_base_1 = require("./lock-parser-base");
const _1 = require(".");
const config_1 = require("../config");
const errors_1 = require("../errors");
const yarn_utils_1 = require("./yarn-utils");
class Yarn2LockParser extends lock_parser_base_1.LockParserBase {
    constructor() {
        super(_1.LockfileType.yarn2, config_1.config.YARN_TREE_SIZE_LIMIT);
    }
    parseLockFile(lockFileContents) {
        try {
            const rawYarnLock = js_yaml_1.load(lockFileContents, {
                json: true,
                schema: js_yaml_1.FAILSAFE_SCHEMA,
            });
            delete rawYarnLock.__metadata;
            const dependencies = {};
            const structUtils = yarnCore.structUtils;
            const parseDescriptor = structUtils.parseDescriptor;
            const parseRange = structUtils.parseRange;
            const keyNormalizer = yarn_utils_1.yarnLockFileKeyNormalizer(parseDescriptor, parseRange);
            Object.entries(rawYarnLock).forEach(([fullDescriptor, versionData]) => {
                keyNormalizer(fullDescriptor).forEach((descriptor) => {
                    dependencies[descriptor] = versionData;
                });
            });
            return {
                dependencies,
                lockfileType: _1.LockfileType.yarn2,
                object: dependencies,
                type: _1.LockfileType.yarn2,
            };
        }
        catch (e) {
            throw new errors_1.InvalidUserInputError(`yarn.lock parsing failed with an error: ${e.message}`);
        }
    }
    async getDependencyTree(manifestFile, lockfile, includeDev = false, strictOutOfSync = true) {
        const depTree = await super.getDependencyTree(manifestFile, lockfile, includeDev, strictOutOfSync);
        const meta = { lockfileVersion: 2, packageManager: 'yarn' };
        const depTreeWithMeta = Object.assign(Object.assign({}, depTree), { meta: Object.assign(Object.assign({}, depTree.meta), meta) });
        return depTreeWithMeta;
    }
    getDepMap(lockfile, manifestFile) {
        const yarnLockfile = lockfile;
        const depMap = {};
        const dependencies = lockfile.dependencies || {};
        for (const [depName, dep] of Object.entries(yarnLockfile.object)) {
            const subDependencies = Object.entries(Object.assign(Object.assign({}, (dep.dependencies || {})), (dep.optionalDependencies || {}))).reduce((requires, [key, ver]) => {
                const resolution = findResolutions(dependencies, depName, key, manifestFile.resolutions);
                const name = (resolution === null || resolution === void 0 ? void 0 : resolution.name) || `${key}@${ver}`;
                const requirement = (resolution === null || resolution === void 0 ? void 0 : resolution.requirement) || { key, range: ver };
                return Object.assign(Object.assign({}, requires), { [name]: requirement });
            }, {});
            const { name, range } = yarn_utils_1.parseDepName(depName);
            depMap[depName] = {
                labels: {
                    scope: _1.Scope.prod,
                },
                name,
                requires: subDependencies,
                version: dep.version,
                range: yarn_utils_1.normalizeDepRange(range),
            };
        }
        return depMap;
    }
    getDepTreeKey(dep) {
        return `${dep.name}@${dep.version}`;
    }
}
exports.Yarn2LockParser = Yarn2LockParser;
function findResolutions(dependencies, depName, subDepKey, resolutions) {
    if (!resolutions)
        return;
    const resolutionKeys = Object.keys(resolutions);
    const { name, range } = yarn_utils_1.parseDepName(depName);
    const firstMatchingResolution = resolutionKeys.find((res) => {
        if (!res.endsWith(subDepKey)) {
            return false;
        }
        const leadingPkg = res.split(subDepKey)[0].slice(0, -1);
        const noSpecifiedParent = !leadingPkg;
        const specifiedParentMatchesCurrentDep = leadingPkg === name;
        const specifiedParentWithVersionMatches = leadingPkg.includes(name) &&
            leadingPkg.includes(dependencies[`${name}@${range}`].version);
        return (noSpecifiedParent ||
            specifiedParentMatchesCurrentDep ||
            specifiedParentWithVersionMatches);
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
//# sourceMappingURL=yarn2-lock-parser.js.map