const parser = require('@typescript-eslint/parser');

// Scope TypeScript correctness checks to this package. The repository config covers
// web JavaScript; TypeScript itself checks types and unused bindings.
module.exports = [{
    files: ['nodes/**/*.ts', 'credentials/**/*.ts'],
    languageOptions: { parser, ecmaVersion: 2020, sourceType: 'module' },
    rules: {
        'constructor-super': 'error',
        'for-direction': 'error',
        'getter-return': 'error',
        'no-async-promise-executor': 'error',
        'no-compare-neg-zero': 'error',
        'no-constant-condition': 'error',
        'no-control-regex': 'error',
        'no-debugger': 'error',
        'no-dupe-args': 'error',
        'no-dupe-else-if': 'error',
        'no-dupe-keys': 'error',
        'no-duplicate-case': 'error',
        'no-empty-character-class': 'error',
        'no-ex-assign': 'error',
        'no-fallthrough': 'error',
        'no-func-assign': 'error',
        'no-invalid-regexp': 'error',
        'no-loss-of-precision': 'error',
        'no-misleading-character-class': 'error',
        'no-prototype-builtins': 'error',
        'no-setter-return': 'error',
        'no-sparse-arrays': 'error',
        'no-this-before-super': 'error',
        'no-unexpected-multiline': 'error',
        'no-unreachable': 'error',
        'no-unsafe-finally': 'error',
        'no-unsafe-negation': 'error',
        'no-unsafe-optional-chaining': 'error',
        'use-isnan': 'error',
        'valid-typeof': 'error'
    }
}];
