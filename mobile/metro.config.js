const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the project root (mobile directory)
const projectRoot = __dirname;
// Get the monorepo root
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Only the mobile directory should be watched for changes
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages from the monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force Metro to treat the mobile directory as the project root
config.projectRoot = projectRoot;

module.exports = config;
