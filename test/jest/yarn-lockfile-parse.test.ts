import { join } from 'path';
import { buildDepTreeFromFiles } from '../../lib';

describe('buildDepTreeFromFiles for yarn1', () => {
  it('should be able to parse yarn.lock file (yarn1)', async () => {
    const rootPath = join(__dirname, '../fixtures/goof');
    const manifestFileFullPath = join(rootPath, 'package.json');
    const lockFileFullPath = join(rootPath, 'yarn1/yarn.lock');

    expect(async () => {
      const depTree = await buildDepTreeFromFiles(
        rootPath,
        manifestFileFullPath,
        lockFileFullPath,
        false,
        true,
      );
      expect(depTree).not.toBeNull();
    }).not.toThrow();
  });
});
