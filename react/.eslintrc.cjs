module.exports = {
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module"
    },
    "extends": [
        "plugin:react/recommended",
        "eslint:recommended"
    ],
    "rules": {
        "max-len": [
            "error",
            {
                "code": 120
            }
        ]
    },
    "overrides": [
        {
            "files": [
                "*.ts",
                "*.tsx"
            ],
            "plugins": [
                "@typescript-eslint"
            ],
            "extends": [
                "plugin:react/recommended",
                "plugin:@typescript-eslint/recommended"
            ]
        }
    ],
    "settings": {
        "react": {
            "version": "detect"
        }
    },
    "env": {
        "amd": true,
        "browser": true,
        "es6": true,
        "jasmine": true,
        "node": true
    }
}
