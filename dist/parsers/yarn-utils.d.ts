import { structUtils } from '@yarnpkg/core';
export declare type ParseDescriptor = typeof structUtils.parseDescriptor;
export declare type ParseRange = typeof structUtils.parseRange;
interface ParsedDepName {
    name: string;
    range: string;
}
export declare function parseDepName(depName: string): ParsedDepName;
export declare function normalizeDepRange(version: string): string;
export declare type YarnLockFileKeyNormalizer = (fullDescriptor: string) => Set<string>;
export declare const yarnLockFileKeyNormalizer: (parseDescriptor: ParseDescriptor, parseRange: ParseRange) => YarnLockFileKeyNormalizer;
export {};
