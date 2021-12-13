const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "index.html"),
            filename: "index.html",
        }
    )],
    module: {
        rules: [
            {
                test: /\.(png|mp4|jpeg)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name(file) {
                                console.log("Adding file to dist: ", file);
                                return "[name].[ext]";
                            },
                            esModule: false,
                        },
                    },
                ],
            }
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
    },
    devtool: 'inline-source-map',
};