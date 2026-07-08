import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Import boundaries (bulletproof-react layers). Features never import each
      // other; shared/leaf layers never import "up" into features or app.
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // Features must not import other features — the cross-feature API is
            // each feature's barrel, consumed only by `app`.
            {
              target: './src/features/duel',
              from: ['./src/features/game', './src/features/settings'],
              message: 'Cross-feature import — relocate shared code to a shared layer (§5.3).',
            },
            {
              target: './src/features/game',
              from: ['./src/features/duel', './src/features/settings'],
              message: 'Cross-feature import — relocate shared code to a shared layer (§5.3).',
            },
            {
              target: './src/features/settings',
              from: ['./src/features/duel', './src/features/game'],
              message: 'Cross-feature import — relocate shared code to a shared layer (§5.3).',
            },
            // Features must not import from app.
            {
              target: './src/features',
              from: './src/app',
              message:
                'A feature must not import from app — app composes features, not the reverse.',
            },
            // Shared / leaf layers must never import "up" into features or app.
            {
              target: [
                './src/components/ui',
                './src/lib',
                './src/config',
                './src/types',
                './src/utils',
                './src/hooks',
              ],
              from: ['./src/features', './src/app'],
              message:
                'Shared/leaf layers must not import from features or app (import down only).',
            },
          ],
        },
      ],
    },
  },
)
