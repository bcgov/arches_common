import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-plugin-prettier/recommended';
import vueConfigPrettier from '@vue/eslint-config-prettier';

const GLOBALS_BROWSER_FIX = Object.assign({}, globals.browser, {
    AudioWorkletGlobalScope: globals.browser['AudioWorkletGlobalScope ']
});

delete GLOBALS_BROWSER_FIX['AudioWorkletGlobalScope '];

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: {
        ...GLOBALS_BROWSER_FIX,
        ...globals.node,
      },
    },
  },
  // js
  pluginJs.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
    },
  },
  // ts
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // vue
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    rules: {
      ...vueConfigPrettier.rules,
      'prettier/prettier': [
        'warn',
        {
          singleQuote: true,
        },
      ],
      'vue/valid-attribute-name': 'off',
      'vue/valid-model-definition': 'off',
      'vue/no-v-model-argument': 'off',
      'vue/no-v-for-template-key': 'off',
      'vue/no-v-for-template-key-on-child': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/no-v-html': 'off',
      'vue/v-on-event-hyphenation': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['node_modules', '.nuxt', '.output', 'dist'],
  },
  // prettier
  prettier,
  {
    rules: {
      'prettier/prettier': ['warn', { singleQuote: true }],
    },
  },
];
