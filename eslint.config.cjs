const config = require('@modusoperandi/eslint-config');
module.exports = [
  ...config.getFlatConfig({
    strict: false,
    header: config.header.mit,
  }),
  {
    rules: {
      //Include any rule overrides here!
      "sonarjs/todo-tag":"off",
      "sonarjs/no-clear-text-protocols":"off"
    },
  },
];