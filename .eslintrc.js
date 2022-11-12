module.exports = {
    extends: ['fabulator'],
    parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
    },
    rules: {
        camelcase: 0,
    },
};
