import {join} from "path";
import {buildDepTreeFromFiles} from "../../lib";

describe('buildDepTreeFromFiles for package-lock.json', () => {
  it('should be able to parse package-lock.json file', async () => {
    const rootPath = join(__dirname, '../fixtures/goof');
    const manifestFileFullPath = join(rootPath, 'package.json');
    const lockFileFullPath = join(rootPath, 'package-lock.json');

    expect(async () => {
      try {
        const depTree = await buildDepTreeFromFiles( rootPath,
          manifestFileFullPath,
          lockFileFullPath,
          false,
          true
        );
        expect(depTree).not.toBeNull();
      } catch (e) {
        fail(e);
      }
    }).not.toThrow();
  })
});
