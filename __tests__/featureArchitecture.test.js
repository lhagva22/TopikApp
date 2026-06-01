const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const featuresRoot = path.join(projectRoot, 'src', 'features');
const FEATURE_LAYERS = ['data', 'domain', 'presentation'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const walkFiles = (directory) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return walkFiles(entryPath);
    }

    return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [entryPath] : [];
  });
};

const readImports = (filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  const patterns = [
    /import\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g,
    /export\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g,
    /require\(['"]([^'"]+)['"]\)/g,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      imports.push(match[1]);
    }
  });

  return imports;
};

const toProjectPath = (filePath) => path.relative(projectRoot, filePath).replace(/\\/g, '/');

const resolveLocalImport = (fromFile, importPath) => {
  if (!importPath.startsWith('.')) {
    return null;
  }

  const resolved = path.normalize(path.join(path.dirname(fromFile), importPath));
  const relative = path.relative(featuresRoot, resolved).replace(/\\/g, '/');

  return relative.startsWith('..') ? null : relative;
};

const isLayerImport = (resolvedImport, layer) =>
  resolvedImport.includes(`/${layer}/`) || resolvedImport.endsWith(`/${layer}`);

describe('feature architecture boundaries', () => {
  const featureDirectories = fs
    .readdirSync(featuresRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(featuresRoot, entry.name));

  it('keeps every feature on the standard data/domain/presentation structure', () => {
    const invalidFeatures = featureDirectories
      .map((featurePath) => {
        const children = fs
          .readdirSync(featurePath, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
          .sort();

        return {
          feature: path.basename(featurePath),
          children,
        };
      })
      .filter(({ children }) => children.join('|') !== FEATURE_LAYERS.join('|'));

    expect(invalidFeatures).toEqual([]);
  });

  it('prevents domain and presentation layers from importing inward-facing layers', () => {
    const violations = featureDirectories.flatMap((featurePath) =>
      walkFiles(featurePath).flatMap((filePath) => {
        const projectPath = toProjectPath(filePath);
        const relativeToFeature = path.relative(featurePath, filePath).replace(/\\/g, '/');
        const imports = readImports(filePath);

        return imports.flatMap((importPath) => {
          const resolvedImport = resolveLocalImport(filePath, importPath);
          if (!resolvedImport) {
            return [];
          }

          if (relativeToFeature.startsWith('domain/') && (
            isLayerImport(resolvedImport, 'data') ||
            isLayerImport(resolvedImport, 'presentation')
          )) {
            return [`${projectPath} -> ${importPath}`];
          }

          if (
            relativeToFeature.startsWith('presentation/') &&
            !relativeToFeature.endsWith('presentation/dependencies.ts') &&
            isLayerImport(resolvedImport, 'data')
          ) {
            return [`${projectPath} -> ${importPath}`];
          }

          return [];
        });
      }),
    );

    expect(violations).toEqual([]);
  });

  it('keeps feature root public APIs from exporting data APIs directly', () => {
    const violations = featureDirectories.flatMap((featurePath) => {
      const indexFile = ['index.ts', 'index.tsx']
        .map((fileName) => path.join(featurePath, fileName))
        .find((candidate) => fs.existsSync(candidate));

      if (!indexFile) {
        return [`${path.basename(featurePath)} is missing an index file`];
      }

      return readImports(indexFile)
        .filter((importPath) => importPath.includes('/data/api'))
        .map((importPath) => `${toProjectPath(indexFile)} -> ${importPath}`);
    });

    expect(violations).toEqual([]);
  });
});
