const config = require('@modusoperandi/eslint-config');
module.exports = [
  ...config.getFlatConfig({
    strict: false,
    header: config.header.mit,
  }),
  {
    rules: {
      //Include any rule overrides here!
      "sonarjs/todo-tag":"warn",
      "sonarjs/no-clear-text-protocols":"warn",
      "import/no-cycle":"warn",
       "no-var": "warn",
       "@typescript-eslint/dot-notation": "warn",

    },
  },
];