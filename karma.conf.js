/* eslint-env node */
module.exports = function (config) {
  config.set({
    browsers: process.env.CI ? ['FirefoxHeadless', 'ChromeHeadless'] : ['FirefoxHeadless'],
    frameworks: ['qunit'],
    files: [
      'typesense-minibar.js',
      'test/*.js'
    ],
    autoWatch: false,
    singleRun: true,
    preprocessors: {
      'typesense-minibar.js': ['coverage']
    },
    reporters: ['dots', 'coverage'],
    coverageReporter: {
      reporters: [
        { type: 'text' },
        { type: 'html', subdir: '.' }
      ]
    }
  });
};
