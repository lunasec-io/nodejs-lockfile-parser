"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YarnLockParser = void 0;
const yarnLockfileParser = require("@yarnpkg/lockfile");
const index_1 = require("./index");
const errors_1 = require("../errors");
const lock_parser_base_1 = require("./lock-parser-base");
const config_1 = require("../config");
const yarn_utils_1 = require("./yarn-utils");
class YarnLockParser extends lock_parser_base_1.LockParserBase {
    constructor() {
        super(index_1.LockfileType.yarn, config_1.config.YARN_TREE_SIZE_LIMIT);
    }
    parseLockFile(lockFileContents) {
        try {
            const yarnLock = yarnLockfileParser.parse(lockFileContents);
            yarnLock.dependencies = yarnLock.object;
            yarnLock.type = this.type;
            return yarnLock;
        }
        catch (e) {
            throw new errors_1.InvalidUserInputError(`yarn.lock parsing failed with an error: ${e.message}`);
        }
    }
    async getDependencyTree(manifestFile, lockfile, includeDev = false, strictOutOfSync = true) {
        const depTree = await super.getDependencyTree(manifestFile, lockfile, includeDev, strictOutOfSync);
        const meta = { lockfileVersion: 1, packageManager: 'yarn' };
        const depTreeWithMeta = Object.assign(Object.assign({}, depTree), { meta: Object.assign(Object.assign({}, depTree.meta), meta) });
        return depTreeWithMeta;
    }
    getDepMap(lockfile) {
        const yarnLockfile = lockfile;
        const depMap = {};
        for (const [depName, dep] of Object.entries(yarnLockfile.object)) {
            const subDependencies = Object.entries(Object.assign(Object.assign({}, (dep.dependencies || {})), (dep.optionalDependencies || {})));
            const { range } = yarn_utils_1.parseDepName(depName);
            depMap[depName] = {
                labels: {
                    scope: index_1.Scope.prod,
                },
                name: getName(depName),
                range,
                requires: subDependencies.reduce((requires, [key, ver]) => (Object.assign(Object.assign({}, requires), { [`${key}@${ver}`]: {
                        key,
                        range: ver,
                    } })), {}),
                version: dep.version,
            };
        }
        return depMap;
    }
    getDepTreeKey(dep) {
        return `${dep.name}@${dep.version}`;
    }
}
exports.YarnLockParser = YarnLockParser;
function getName(depName) {
    return depName.slice(0, depName.indexOf('@', 1));
}
//# sourceMappingURL=yarn-lock-parser.js.map