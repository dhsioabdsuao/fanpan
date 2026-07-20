const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch the parent project's lib and types directories for hot reload
config.watchFolders = [
  ...config.watchFolders,
  __dirname + '/../lib',
  __dirname + '/../types',
];

// Resolve @/ imports to the mobile project root (which has the symlinks)
// Also ensure Metro looks for node_modules in the parent project
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    '@': __dirname,
  },
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '..', 'node_modules'),
  ],
};

module.exports = config;
