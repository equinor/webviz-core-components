const path = require("path");
const TerserJSPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const packagejson = require("./package.json");

const dashLibraryName = packagejson.name.replace(/-/g, "_");

module.exports = (env, argv) => {
    let mode;

    const overrides = module.exports || {};

    // if user specified mode flag take that value
    if (argv && argv.mode) {
        mode = argv.mode;
    }

    // else if configuration object is already set (module.exports) use that value
    else if (overrides.mode) {
        mode = overrides.mode;
    }

    // else take webpack default (production)
    else {
        mode = "production";
    }

    const entry = {
        main: argv && argv.entry ? argv.entry : "./src/lib/index.ts",
    };
    const demo = entry.main != "./src/lib/index.ts";

    const filename_js = demo
        ? "output.js"
        : `${dashLibraryName}.${mode === "development" ? "dev" : "min"}.js`;
    const filename_css = demo ? "output.css" : `${dashLibraryName}.css`;

    const devtool =
        argv.devtool || (mode === "development" ? "eval-source-map" : "none");

    const externals = demo
        ? undefined
        : {
            react: "React",
            "react-dom": "ReactDOM",
            "plotly.js": "Plotly",
        };

    return {
        mode,
        entry,
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
        },
        output: {
            path: demo ? __dirname : path.resolve(__dirname, dashLibraryName),
            filename: filename_js,
            library: dashLibraryName,
            libraryTarget: "window",
        },
        optimization: {
            minimizer: [
                new TerserJSPlugin({}),
                new OptimizeCSSAssetsPlugin({}),
            ],
        },
        externals,
        plugins: [
            new MiniCssExtractPlugin({
                filename: filename_css,
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: "babel-loader"
                },
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: ["babel-loader", "ts-loader"],
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
                        loader: 'url-loader',
                    },
                },
            ],
        },
        devtool,
    };
};
