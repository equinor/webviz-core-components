const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const packagejson = require("./package.json");

const dashLibraryName = packagejson.name
    .replace(/[-/]/g, "_")
    .replace(/@/g, "");

module.exports = (env, argv) => {
    const overrides = module.exports || {};

    // Mode

    let mode;
    if (argv && argv.mode) {
        mode = argv.mode;
    } else if (overrides.mode) {
        mode = overrides.mode;
    } else {
        mode = "production";
    }

    // Entry

    const entry =
        argv && argv.entry
            ? argv.entry[0]
            : path.join(__dirname, "src/demo/index.tsx");

    // Output

    const demo = entry !== "./dist/index.js";

    const filenameJs = demo
        ? "output.js"
        : `${dashLibraryName}.${mode === "development" ? "dev" : "min"}.js`;

    const filenameCss = demo ? "output.css" : `${dashLibraryName}.css`;

    // Devtool

    const devtool =
        argv.devtool ||
        (mode === "development" ? "eval-source-map" : "source-map");

    // Externals

    const externals = demo
        ? undefined
        : {
              react: "React",
              "react-dom": "ReactDOM",
              "plotly.js": "Plotly",
          };

    // NOTE: Keep order of the following configuration output
    // See: https://webpack.js.org/configuration/

    return {
        mode,
        entry,
        target: "web",
        output: {
            path: demo
                ? __dirname
                : path.resolve(__dirname, "..", dashLibraryName),
            filename: filenameJs,
            library: dashLibraryName,
            libraryTarget: "umd",
        },
        module: {
            rules: [
                {
                    test: /\.(t|j)sx?$/,
                    use: [
                        {
                            loader: "ts-loader",
                            options: {
                                transpileOnly: true,
                            },
                        },
                    ],
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader:
                                mode === "production"
                                    ? MiniCssExtractPlugin.loader
                                    : "style-loader",
                        },
                        "css-loader",
                    ],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    use: {
                        loader: "url-loader",
                    },
                },
            ],
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
        },
        devtool: devtool,
        externals: externals,
        plugins: [
            new MiniCssExtractPlugin({
                filename: filenameCss,
            }),
        ],
        optimization: {
            minimizer: [
                () => {
                    return () => {
                        return {
                            terserOptions: {},
                        };
                    };
                },
                new CssMinimizerPlugin({}),
            ],
        },
    };
};
