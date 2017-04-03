var expect = require("expect");
var path = require("path");
var program = require("commander");
var config = require("config");
var database = require("libs/db");
var settings = {};
var VWModel;

var readEnvironment = function() {
	var configEnv = config.settings(path.join(__dirname, "../", "server", "config", "env"));
	settings = config.mergeSettingsDefault(configEnv, program);
};
var getBrands = function() {
	describe("VWModel.getBrands", function() {
		it("should be a function", function(done) {
			expect(VWModel.getBrands).toBeA("function");
			done();
			describe("VWModel.getBrands({ name: 'Milanni' })", function() {
				it("should return an Array", function(done) {
					VWModel.getBrands({
						name: "Milanni"
					}).then(function(response) {
						expect(Array.isArray(response)).toBe(true);
						done();
						describe("VWModel.getBrands({ name: 'Milanni' }) Response", function() {
							it("should return exactly 1 result", function(done) {
								expect(response.length).toBe(1);
								done();
							});
						});
						describe("VWModel.getBrands({ name: 'Milanni' }) Response Data", function() {
							var brand = response[0];
							it("should have a brand id", function(done) {
								expect(brand.id).toExist();
								done();
							});
							it("should have a brand type", function(done) {
								expect(brand.type).toExist();
								done();
							});
							it("should have a brand name", function(done) {
								expect(brand.name).toExist();
								done();
							});
							it("should have a brand slug", function(done) {
								expect(brand.slug).toExist();
								done();
							});
						});
						getProducts();
					});
				});
			});
		});
	});
};
var getProduct = function() {
	describe("VWModel.getProduct", function() {
		it("should be a function", function(done) {
			expect(VWModel.getProduct).toBeA("function");
			done();
			describe("VWModel.getProduct({ name: '141 Legend 5' })", function() {
				it("should return an object", function(done) {
					VWModel.getProduct({
						name: "141 Legend 5"
					}).then(function(response) {
						expect(response).toBeAn("object");
						done();
						describe("VWModel.getProduct({ name: '141 Legend 5' }) Response Data", function() {
							var product = response;
							it("should have a product id", function(done) {
								expect(product.id).toExist();
								done();
							});
							it("should have a product type", function(done) {
								expect(product.type).toExist();
								done();
							});
							it("should have a product brand_id", function(done) {
								expect(product.brand_id).toExist();
								done();
							});
							it("should have a product name", function(done) {
								expect(product.name).toExist();
								done();
							});
							it("should have a product slug", function(done) {
								expect(product.slug).toExist();
								done();
							});
						});
					});
				});
			});
		});
	});
};
var getProducts = function() {
	describe("VWModel.getProducts", function() {
		it("should be a function", function(done) {
			expect(VWModel.getProducts).toBeA("function");
			done();
			describe("VWModel.getProducts({ type: 'wheel' })", function() {
				it("should return an Array", function(done) {
					VWModel.getProducts({
						type: "wheel"
					}).then(function(response) {
						expect(Array.isArray(response)).toBe(true);
						done();
						describe("VWModel.getProducts({ type: 'wheel' }) Response", function() {
							it("should return at least 1 result", function(done) {
								expect(response.length).toBeGreaterThanOrEqualTo(1);
								done();
							});
						});
						describe("VWModel.getProducts({ type: 'wheel' }) Response Data", function() {
							var product = response[0];
							it("should have a product id", function(done) {
								expect(product.id).toExist();
								done();
							});
							it("should have a product type", function(done) {
								expect(product.type).toExist();
								done();
							});
							it("should have a product brand_id", function(done) {
								expect(product.brand_id).toExist();
								done();
							});
							it("should have a product name", function(done) {
								expect(product.name).toExist();
								done();
							});
							it("should have a product slug", function(done) {
								expect(product.slug).toExist();
								done();
							});
						});
						getProduct();
					});
				});
			});
		});
	});
};
var test = function() {
	VWModel = require("../server/models");
	describe("VWModel", function() {
		it("should be an object", function(done) {
			expect(VWModel).toBeA("object");
			done();
			getBrands();
		});
	});
};

readEnvironment();
describe("Database", function() {
	it("should connect", function(done) {
		database(settings.database, function(error, db) {
			done();
			test();
		});
	});
});