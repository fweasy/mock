const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
require("dotenv").config();
const webpack = require("webpack");
const ManifestPlugin = require("webpack-manifest-plugin");

const appBuild = path.resolve(__dirname, "build");
const appIndex = path.resolve(__dirname, "src", "index.tsx");
const appHtml = path.resolve(__dirname, "public", "index.html");
const appPublic = path.resolve(__dirname, "public");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";

function getCliendEnv(nodeEnv) {
    return {
        "process.env": JSON.stringify(
            Object.keys(process.env)
                .filter((key) => /^REACT_APP/i.test(key))
                .reduce(
                    (env, key) => {
                        env[key] = process.env[key];
                        return env;
                    },
                    { NODE_ENV: nodeEnv }
                )
        ),
    };
}

module.exports = (webpackEnv) => {
    const isEnvDevelopment = webpackEnv === "development";
    const isEnvProduction = webpackEnv === "production";
    const clientEnv = getClientEnv(webpackEnv);
    return {
        mode: webpackEnv,
        entry: appIndex,
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
        },
        output: {
            path: appBuild,
            filename: isEnvProduction
                ? "static/js/[name].[contenthash:8].js"
                : isEnvDevelopment && "static/js/bundle.js",
        },
        devtool: isEnvProduction
            ? shouldUseSourceMap
                ? "source-map"
                : false
            : isEnvDevelopment && "cheap-module-source-map",
        devServer: {
            port: 3000,
            contentBase: appPublic,
            open: true,
            historyApiFallback: true,
            overlay: true,
            stats: "errors-warnings",
        },
        plugins: [
            new HtmlWebpackPlugin({ template: appHtml }),
            new webpack.DefinePlugin(clientEnv),
            new ManifestPlugin({
                generate: (seed, files, entrypoints) => {
                    const manifestFiles = files.reduce(
                        (manifest, { name, path }) => ({ ...manifest, [name]: path }),
                        seed
                    );
                    const entryFiles = entrypoints.main.filter(
                        (filename) => !/\.map/.test(filename)
                    );
                    return { files: manifestFiles, entrypoints: entryFiles };
                }

            }),
            new ForkTsCheckerWebpackPlugin({
                eslint: {
                    files: "./src/**/*.{ts,tsx,js,jsx}",
                },
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    exclude: /node_modules/,
                    use: [
                        "cache-loader",
                        {
                            loader: "ts-loader",
                            options: {
                                transpileOnly: isEnvDevelopment ? true : false,
                            },
                        },
                    ],
                },
                {
                    loader: "file-loader",
                    exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
                    options: {
                        outputPath: "static/media",
                        name: "[name].[hash:8].[ext]",
                        esModule: false,
                    },
                },
                {
                    test: [/\.bmp$/, /\.gif/, /\.jpe?g$/, /\.png$/],
                    loader: "url-loader",
                    options: {
                        limit: 10000,
                        outputPath: "static/media",
                        name: "[name].[hash:8].[ext]",
                    }
                },
            ],
        }
    };
};