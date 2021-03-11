module.exports = {
    transform: { ".*": "<rootDir>/node_modules/babel-jest" },
    rootDir: ".",
    testMatch: ["**/tests/js/**/*.test.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
    modulePaths: ["/shared/vendor/modules"],
    moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
    moduleDirectories: [
        'node_modules',
        'tests/js/',
    ],
    moduleNameMapper: {
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
            "<rootDir>/__mocks__/fileMock.js",
        "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js"
    },
    transformIgnorePatterns: ["/node_modules/"],
    unmockedModulePathPatterns: [
        "<rootDir>/node_modules/react",
        "<rootDir>/node_modules/react-dom",
        "<rootDir>/node_modules/react-addons-test-utils",
        "<rootDir>/EmptyModule.js"
    ]
}
