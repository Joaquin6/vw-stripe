/**
 * This Route Module is here ONLY for debugging purposes.
 * This router helpus us trigger POST/GET requests to test the VWModel response.
 */
var express = require("express");
var colors = require('colors');
var router = express.Router();

router.get("/item-photos", function(req, res) {
	console.log(">>> Debugging Route: " + colors.yellow("Getting List of orphined items;"));
	var VWModel = req.VWModel;
	VWModel.findItems().then(result=>{
		function pivot(arr) {
			var hashTable = {};
			arr.forEach(item => {
				var key = JSON.stringify({ brand: item.brand, model:item.model, finish:item.finish});
				if (hashTable[key])
					hashTable[key].push(item.part_number);
				else
					hashTable[key] = [item.part_number]
			});
			//console.log("hashTable", hashTable);
			let returnItems =  Object.keys(hashTable).map(key=>{
				let row = JSON.parse(key);
				row.part_numbers = hashTable[key];
				return row;
			});
			//console.log("returnItems", returnItems);
			return returnItems;
		}

		let noImages = result.filter(item=>{return item.image.list.length==0});
		let base =  noImages.map(item=>{
			return { brand: item.specification.brand, model:item.specification.model, finish:item.specification.finish, part_number: item.part_number}
		});
		let pivoted = pivot(base);
		let sorted = pivoted.sort((a,b)=>{
			return a.brand.localeCompare(b.brand);
		});

		console.log("Total items:", result.length);
		console.log("Items without images:", noImages.length);
		console.log("Total Images needed:", pivoted.length);

		res.render("debug/item-images", {items: sorted});

		//res.status(200).json(deduped);
	}).catch(function(response) {
		console.log(response);
		res.status(500).json(response);
	});
});

router.get("/userorders/:user_id", function(req, res) {
	console.log(">>> Debugging Route: " + colors.yellow("VWModel.findCartDetails();"));
	var user_id = req.params.user_id;
	var user = req.user;
	var VWModel = req.VWModel;
	VWModel.getOrderHistoryById(user_id).then(function(response) {
		console.log(response);
		res.status(200).json(response);
	}).catch(function(response) {
		console.log(response);
		res.status(500).json(response);
	});
});

router.post("/getitemspecifications", function(req, res) {
	console.log(">>> Debugging Route: " + colors.yellow("VWModel.getItemSpecifications();"));
	var params = req.body;
	var user = req.user;
	var VWModel = req.VWModel;
	console.log( params );
	VWModel.getItemSpecifications(params).then(function(response) {
		console.log(response);
		res.status(200).json(response);
	}).catch(function(response) {
		console.log(response);
		res.status(500).json(response);
	});
});

router.post("/submitpurchaseorder", function(req, res) {
	console.log(">>> Debugging Route: " + colors.yellow("VWModel.submitPurchaseOrder();"));
	var body = req.body;
	var user = req.user;
	var VWModel = req.VWModel;
	console.log( body );
	VWModel.submitPurchaseOrder(body).then(function(response) {
		console.log(response);
		res.status(200).json(response);
	}).catch(function(response) {
		console.log(response);
		res.status(500).json(response);
	});
});

router.post("/submitstripepayment", function(req, res) {
	console.log(">>> Debugging Route: " + colors.yellow("VWModel.submitStripePayment();"));
	var body = req.body;
	var user = req.user;
	var VWModel = req.VWModel;
	console.log( body );
	VWModel.submitStripePayment(body).then(function(response) {
		console.log(response);
		res.status(200).json(response);
	}).catch(function(response) {
		console.log(response);
		res.status(500).json(response);
	});
});

router.post("/taxapi/bypostal", function(req, res) {
	console.log(">>> Debugging Route: " + colors.yellow("VWModel.getTaxRateByZip();"));
	var params = req.body;
	var user = req.user;
	var VWModel = req.VWModel;
	console.log( params );
	VWModel.getTaxRateByZip(params).then(function(response) {
		console.log(response);
		res.status(200).json(response);
	}).catch(function(response) {
		console.log(response);
		res.status(500).json(response);
	});
});

router.post("/taxapi/byaddress", function(req, res) {
	console.log(">>> Debugging Route: " + colors.yellow("VWModel.getTaxRateByAddress();"));
	var params = req.body;
	var user = req.user;
	var VWModel = req.VWModel;
	console.log( params );
	VWModel.getTaxRateByAddress(params).then(function(response) {
		console.log(response);
		res.status(200).json(response);
	}).catch(function(response) {
		console.log(response);
		res.status(500).json(response);
	});
});

router.post("/search/global", function(req, res) {
	console.log(">>> Debugging Route: " + colors.yellow("VWModel.search();"));
	var params = req.body;
	var user = req.user;
	var VWModel = req.VWModel;
	console.log( params );
	VWModel.search(params).then(function(response) {
		console.log(response);
		res.status(200).json(response);
	}).catch(function(response) {
		console.log(response);
		res.status(500).json(response);
	});
});

router.post("/search/items", function(req, res) {
	console.log(">>> Debugging Route: " + colors.yellow("VWModel.searchItems();"));
	var params = req.body;
	var user = req.user;
	var VWModel = req.VWModel;
	console.log( params );
	VWModel.searchItems(params).then(function(response) {
		console.log(response);
		res.status(200).json(response);
	}).catch(function(response) {
		console.log(response);
		res.status(500).json(response);
	});
});

module.exports = {
	Router: router
};