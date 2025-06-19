const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	mode: 'development',
	entry: {
		app: './src/index.js',
	},

	module: {
		rules: [
			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, 'css-loader'],
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: 'asset/resource',
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/i,
				type: 'asset/resource',
			},
			{
				test: /\.html$/i,
				loader: 'html-loader',
			},
		],
	},

	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist/dev'),
		assetModuleFilename: 'assets/[name].[contenthash][ext][query]',
		publicPath: '', // this instruction is needed to avoid an error when import @mdi/font
		clean: true,
	},

	plugins: [
		new HtmlWebpackPlugin({
			template: './src/index.html',
		}),
		new ESLintPlugin(),
		new MiniCssExtractPlugin({
			filename: '[name].css',
		}),
	],

	optimization: {
		splitChunks: {
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					chunks: 'all',
				},
			},
		},
	},
};
