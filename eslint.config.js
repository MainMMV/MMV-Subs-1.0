import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*']
  },
  {
    files: ['**/*.rules'],
    plugins: {
      'firebase-security-rules': firebaseRulesPlugin,
    },
    rules: {
      'firebase-security-rules/no-wildcard-reads': 'error',
      'firebase-security-rules/no-wildcard-writes': 'error',
    }
  }
];
