var webpack = require("webpack");
var extractTextWebpackPlugin = require("extract-text-webpack-plugin");
var dedupePlugin = new webpack.optimize.DedupePlugin();
var extractSass = new extractTextWebpackPlugin("./css/[name].css");
var provideJQuery = new webpack.ProvidePlugin({
	$: "jquery",
	jQuery: "jquery"
});
var entries = [{
	name: "accessories",
	src: "./server/scripts/accessories.js"
}, {
	name: "brand",
	src: "./server/scripts/brand.js"
}, {
	name: "checkout",
	src: "./server/scripts/checkout.js"
}, {
	name: "checkout-pending",
	src: "./server/scripts/checkout-pending.js"
}, {
	name: "home",
	src: "./server/scripts/home.js"
}, {
	name: "login",
	src: "./server/scripts/login.js"
}, {
	name: "product",
	src: "./server/scripts/product.js"
}, {
	name: "products",
	src: "./server/scripts/products.js"
}, {
	name: "search",
	src: "./server/scripts/search.js"
}, {
	name: "signup",
	src: "./server/scripts/signup.js"
}, {
	name: "tires",
	src: "./server/scripts/tires.js"
}, {
	name: "wheels",
	src: "./server/scripts/wheels.js"
}, {
	name: "account",
	src: "./server/scripts/account.js"
}, {
	name: "locations",
	src: "./server/scripts/locations.js"
}];
var webpackConfig = entries.map(function(entry, index, array) {
	var config = {
		// devtool: "source-map",
		entry: {},
		module: {
			loaders: [{
				test: /\.jsx?$/,
				loader: "babel",
				query: {
					presets: ["es2015", "react"]
				},
				exclude: /(node_modules|bower_components)/
			}, {
				test: /\.s?css$/,
				loader: extractSass.extract("style", ["css?sourceMap", "sass?sourceMap"])
			}, {
				test: /\.svg/,
				loader: "svg-url-loader"
			}, {
				test: /\.(gif|jpg|jpeg|png)$/,
				loader: `file?name=img/${ entry.name }/[name].[ext]`,
			}, {
				test: /\.(eot|otf|ttf|woff|woff2)$/,
				loader: `file?name=fonts/[name].[ext]`,
			}]
		},
		output: {
			path: "./release",
			publicPath: "../",
			filename: "./js/[name].js"
		},
		plugins: [
			dedupePlugin,
			extractSass,
			provideJQuery
		]
	};
	config.entry[entry.name] = entry.src;
	return config;
});
module.exports = webpackConfig;