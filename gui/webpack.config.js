/*
 * Copyright 2022 Avaiga Private Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

// webpack should be in the node_modules directory, install if not.
const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const ESLintPlugin = require("eslint-webpack-plugin");

const resolveApp = relativePath => path.resolve(__dirname, relativePath);

const getEnvVariables = () => ({ VERSION: require(resolveApp('package.json')).version });

const reactBundle = "taipy-vendor"
const taipyBundle = "taipy-gui"

const reactBundleName = "TaipyVendor"
const taipyBundleName = "TaipyGui"

const basePath = "../src/taipy/gui/webapp";
const webAppPath = resolveApp(basePath);
const reactManifestPath = resolveApp(basePath + "/" + reactBundle + "-manifest.json");
const reactDllPath = resolveApp(basePath + "/" + reactBundle + ".dll.js")
const taipyDllPath = resolveApp(basePath + "/" + taipyBundle + ".js")

module.exports = (env, options) => {
    return [{
            mode: options.mode, //'development', //'production',
            name: reactBundleName,
            entry: ["react", "react-dom", 
            "@emotion/react","@emotion/styled",
            "@mui/icons-material","@mui/lab","@mui/material","@mui/x-date-pickers"],
            output: {
                filename: reactBundle + ".dll.js",
                path: webAppPath,
                library: reactBundleName
            },
            plugins: [
                new webpack.DllPlugin({
                    name: reactBundleName, 
                    path: reactManifestPath
                })
            ]
        },
        {
            mode: options.mode, //'development', //'production',
            name: taipyBundleName,
            entry: ["./src/extensions/exports.ts"],
            output: {
                filename: taipyBundle + ".js",
                path: webAppPath,
                library: {
                    name: taipyBundleName,
                    type: "umd"
                }
            },
            dependencies: [reactBundleName],
            devtool: options.mode === "development" && "inline-source-map",
            resolve: {
                // Add '.ts' and '.tsx' as resolvable extensions.
                extensions: [".ts", ".tsx", ".js"],
            },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        use: "ts-loader",
                        exclude: /node_modules/,
                    },
                    {
                        // added to resolve apache-arrow library (don't really understand the problem tbh)
                        // Reference: https://github.com/graphql/graphql-js/issues/2721
                        test: /\.m?js/,
                        resolve: {
                            fullySpecified: false,
                        },
                    },
                ]
            },
            plugins: [
                new ESLintPlugin({
                    extensions: [`ts`, `tsx`],
                    exclude: [`/node_modules/`],
                    eslintPath: require.resolve("eslint"),
                }),
                new webpack.DllReferencePlugin({
                    name: reactBundleName,
                    manifest: reactManifestPath
                })
            ]
        },
        {
            mode: options.mode, //'development', //'production',
            context: resolveApp("dom"),
            entry: ["./src/index.tsx"],
            output: {
                filename: "taipy-gui-dom.js",
                path: webAppPath,
                publicPath: "/"
            },
            dependencies: [taipyBundleName, reactBundleName],
            externals: {"taipy-gui": taipyBundleName},

            // Enable sourcemaps for debugging webpack's output.
            devtool: options.mode === "development" && "inline-source-map",

            resolve: {
                // Add '.ts' and '.tsx' as resolvable extensions.
                extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
            },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        use: "ts-loader",
                        exclude: /node_modules/,
                    },
                ]
            },
    
            plugins: [
                new CopyWebpackPlugin({
                    patterns: [
                        { from: "../public", filter: (name) => !name.endsWith(".html") },
                        { from: "../packaging", filter: (name) => !name.includes(".gen.") }
                    ],
                }),
                new HtmlWebpackPlugin({
                    template: "../public/index.html",
                    hash: true,
                    ...getEnvVariables()
                }),
                new HtmlWebpackPlugin({
                    template: "../public/status.html",
                    filename: "status.html",
                    inject: false,
                    ...getEnvVariables()
                }),
                new ESLintPlugin({
                    extensions: [`ts`, `tsx`],
                    exclude: [`/node_modules/`],
                    eslintPath: require.resolve("eslint"),
                }),
                new webpack.DllReferencePlugin({
                    name: reactBundleName,
                    manifest: reactManifestPath
                }),
                new AddAssetHtmlPlugin([{
                    filepath: reactDllPath,
                    hash: true
                },{
                    filepath: taipyDllPath,
                    hash: true
                }]),
            ],
    }];
};
