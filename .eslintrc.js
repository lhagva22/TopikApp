module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['src/features/*/domain/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/data/**', '**/presentation/**', '**/app/**'],
                message:
                  'Domain layer must stay independent. Depend on domain types/contracts only.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/features/*/data/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/presentation/**'],
                message:
                  'Data layer must not depend on presentation. Expose implementations through repository contracts.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/features/*/presentation/**/*.{ts,tsx,js,jsx}'],
      excludedFiles: ['src/features/*/presentation/dependencies.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/data/**'],
                message:
                  'Presentation must use feature use-cases from presentation/dependencies, not data APIs directly.',
              },
            ],
          },
        ],
      },
    },
  ],
};
