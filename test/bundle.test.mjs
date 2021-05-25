import { strictEqual } from 'assert';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
import gzipSize from 'gzip-size';

export default (tests) => {
  tests.add('Bundle.', async () => {
    const {
      outputFiles: [bundle],
    } = await esbuild.build({
      entryPoints: [
        fileURLToPath(new URL('../public/index.js', import.meta.url)),
      ],
      external: ['@apollo/client'],
      write: false,
      bundle: true,
      minify: true,
      legalComments: 'none',
    });

    const kB = (await gzipSize(bundle.contents)) / 1000;

    console.info(`${kB} kB minified and gzipped bundle.`);

    strictEqual(kB < 2, true);
  });
};
