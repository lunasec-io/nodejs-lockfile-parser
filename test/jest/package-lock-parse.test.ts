import { join } from 'path';
import { buildDepTreeFromFiles } from '../../lib';
import { DepTreeDep } from '../../lib/parsers';

describe('buildDepTreeFromFiles for package-lock.json', () => {
  it('should be able to parse package-lock.json file', async () => {
    const rootPath = join(
      __dirname,
      '../fixtures/undefined-range-package-lock',
    );
    const manifestFileFullPath = join(rootPath, 'package.json');
    const lockFileFullPath = join(rootPath, 'package-lock.json');
    const depTree = await buildDepTreeFromFiles(
      rootPath,
      manifestFileFullPath,
      lockFileFullPath,
      false,
      true,
    );

    expect(depTree).not.toBeNull();

    const checkDependencyRangesExist = (dep: DepTreeDep) => {
      if (typeof dep.range !== 'string') {
        console.log('dep failed range ', dep);
      }
      expect(typeof dep.range).toBe('string');

      if (dep.dependencies) {
        Object.values(dep.dependencies).forEach(checkDependencyRangesExist);
      }
    };

    Object.values(depTree.dependencies).forEach((item) =>
      checkDependencyRangesExist(item),
    );
  });
});
