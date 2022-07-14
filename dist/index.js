"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYarnLockfileType = exports.OutOfSyncError = exports.InvalidUserInputError = exports.UnsupportedRuntimeError = exports.LockfileType = exports.Scope = exports.getYarnWorkspaces = exports.getYarnWorkspacesFromFiles = exports.buildDepGraphFromCliOutput = exports.buildDepTreeFromFiles = exports.buildDepTree = void 0;
const fs = require("fs");
const path = require("path");
const parsers_1 = require("./parsers");
Object.defineProperty(exports, "Scope", { enumerable: true, get: function () { return parsers_1.Scope; } });
Object.defineProperty(exports, "LockfileType", { enumerable: true, get: function () { return parsers_1.LockfileType; } });
Object.defineProperty(exports, "getYarnWorkspaces", { enumerable: true, get: function () { return parsers_1.getYarnWorkspaces; } });
const package_lock_parser_1 = require("./parsers/package-lock-parser");
const yarn_lock_parser_1 = require("./parsers/yarn-lock-parser");
const yarn2_lock_parser_1 = require("./parsers/yarn2-lock-parser");
const errors_1 = require("./errors");
Object.defineProperty(exports, "UnsupportedRuntimeError", { enumerable: true, get: function () { return errors_1.UnsupportedRuntimeError; } });
Object.defineProperty(exports, "InvalidUserInputError", { enumerable: true, get: function () { return errors_1.InvalidUserInputError; } });
Object.defineProperty(exports, "OutOfSyncError", { enumerable: true, get: function () { return errors_1.OutOfSyncError; } });
const cli_parsers_1 = require("./cli-parsers");
Object.defineProperty(exports, "buildDepGraphFromCliOutput", { enumerable: true, get: function () { return cli_parsers_1.buildDepGraphFromCliOutput; } });
async function buildDepTree(manifestFileContents, lockFileContents, includeDev = false, lockfileType, strictOutOfSync = true, defaultManifestFileName = 'package.json') {
    if (!lockfileType) {
        lockfileType = parsers_1.LockfileType.npm;
    }
    else if (lockfileType === parsers_1.LockfileType.yarn) {
        lockfileType = getYarnLockfileType(lockFileContents);
    }
    let lockfileParser;
    switch (lockfileType) {
        case parsers_1.LockfileType.npm:
            lockfileParser = new package_lock_parser_1.PackageLockParser();
            break;
        case parsers_1.LockfileType.yarn:
            lockfileParser = new yarn_lock_parser_1.YarnLockParser();
            break;
        case parsers_1.LockfileType.yarn2:
            lockfileParser = new yarn2_lock_parser_1.Yarn2LockParser();
            break;
        default:
            throw new errors_1.InvalidUserInputError('Unsupported lockfile type ' +
                `${lockfileType} provided. Only 'npm' or 'yarn' is currently ` +
                'supported.');
    }
    const manifestFile = parsers_1.parseManifestFile(manifestFileContents);
    if (!manifestFile.name) {
        manifestFile.name = path.isAbsolute(defaultManifestFileName)
            ? path.basename(defaultManifestFileName)
            : defaultManifestFileName;
    }
    const lockFile = lockfileParser.parseLockFile(lockFileContents);
    return lockfileParser.getDependencyTree(manifestFile, lockFile, includeDev, strictOutOfSync);
}
exports.buildDepTree = buildDepTree;
async function buildDepTreeFromFiles(root, manifestFilePath, lockFilePath, includeDev = false, strictOutOfSync = true) {
    if (!root || !manifestFilePath || !lockFilePath) {
        throw new Error('Missing required parameters for buildDepTreeFromFiles()');
    }
    const manifestFileFullPath = path.resolve(root, manifestFilePath);
    const lockFileFullPath = path.resolve(root, lockFilePath);
    if (!fs.existsSync(manifestFileFullPath)) {
        throw new errors_1.InvalidUserInputError('Target file package.json not found at ' +
            `location: ${manifestFileFullPath}`);
    }
    if (!fs.existsSync(lockFileFullPath)) {
        throw new errors_1.InvalidUserInputError('Lockfile not found at location: ' + lockFileFullPath);
    }
    const manifestFileContents = fs.readFileSync(manifestFileFullPath, 'utf-8');
    const lockFileContents = fs.readFileSync(lockFileFullPath, 'utf-8');
    let lockFileType;
    if (lockFilePath.endsWith('package-lock.json')) {
        lockFileType = parsers_1.LockfileType.npm;
    }
    else if (lockFilePath.endsWith('yarn.lock')) {
        lockFileType = getYarnLockfileType(lockFileContents, root, lockFilePath);
    }
    else {
        throw new errors_1.InvalidUserInputError(`Unknown lockfile ${lockFilePath}. ` +
            'Please provide either package-lock.json or yarn.lock.');
    }
    return await buildDepTree(manifestFileContents, lockFileContents, includeDev, lockFileType, strictOutOfSync, manifestFilePath);
}
exports.buildDepTreeFromFiles = buildDepTreeFromFiles;
function getYarnWorkspacesFromFiles(root, manifestFilePath) {
    if (!root || !manifestFilePath) {
        throw new Error('Missing required parameters for getYarnWorkspacesFromFiles()');
    }
    const manifestFileFullPath = path.resolve(root, manifestFilePath);
    if (!fs.existsSync(manifestFileFullPath)) {
        throw new errors_1.InvalidUserInputError('Target file package.json not found at ' +
            `location: ${manifestFileFullPath}`);
    }
    const manifestFileContents = fs.readFileSync(manifestFileFullPath, 'utf-8');
    return parsers_1.getYarnWorkspaces(manifestFileContents);
}
exports.getYarnWorkspacesFromFiles = getYarnWorkspacesFromFiles;
function getYarnLockfileType(lockFileContents, root, lockFilePath) {
    if (lockFileContents.includes('__metadata') ||
        (root &&
            lockFilePath &&
            fs.existsSync(path.resolve(root, lockFilePath.replace('yarn.lock', '.yarnrc.yml'))))) {
        return parsers_1.LockfileType.yarn2;
    }
    else {
        return parsers_1.LockfileType.yarn;
    }
}
exports.getYarnLockfileType = getYarnLockfileType;
//# sourceMappingURL=index.js.map