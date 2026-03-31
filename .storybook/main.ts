import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: '@storybook/react-vite',
  staticDirs: [{ from: '../dist', to: '/static/duckdb' }],
  viteFinal: (config) => {
    return mergeConfig(config, {
      optimizeDeps: {
        exclude: ['@duckdb/duckdb-wasm'],
      },
    });
  },
};

export default config;
