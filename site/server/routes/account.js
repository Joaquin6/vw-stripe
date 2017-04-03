var express = require('express'),
	debug = require("libs/buglog"),
	log = debug("routes", "account"),
	router = express.Router();

/** Authenciated Routes */
router.use("*", function(req, res, next) {
    if (!req.user)
    	return res.redirect("/");
    next();
});

router.get( "/", function(req, res) {
	var nav = req.nav;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	log(req.user);
	res.render("account/index", {
		currentEnv: currentEnv,
		nav: nav,
		user: user
	});
});

router.get( "/profile", function(req, res) {
	renderProfilePage(req, res);
});
router.post( "/profile", function(req, res) {
	let profileUpdateData = req.body;
	log("profileUpdateData", profileUpdateData);

	if (profileUpdateData.action === "profile"){
		log("do profile update");
		req.VWModel.updateUserProfile(req.user.id, profileUpdateData).then(_=>{
			renderProfilePage(req, res, null, {profile:"User Profile Updated!"});
		}).catch(err=>{
			renderProfilePage(req, res, {profile:"Error Updating User Profile"});
		});
	} else if (profileUpdateData.action === "salesRep"){
		log("do sales rep update");
		req.VWModel.updateUserSalesRep(req.user.id, profileUpdateData.salesRep)
		.then(_=>{
			log("sales rep updated", profileUpdateData.salesRep);
			req.user.sales_rep = profileUpdateData.salesRep;
			renderProfilePage(req, res, null, {salesRep:"Sales Representitive Updated Successfully!"});
		}).catch(err=>{
			renderProfilePage(req, res, {salesRep:"Error updating Sales Representitive"});
		}).done();
	} else if (profileUpdateData.action === "password"){
		log("do password update");
		if (profileUpdateData.newPassword!==profileUpdateData.confirm){
			return renderProfilePage(req, res, {password:"The new passwords do not match"})
		}
		req.VWModel.validateAndResetPasswordByLoginId
			(	req.user.login_id,
				profileUpdateData.oldPassword,
				profileUpdateData.newPassword 	)
		.then(_=>{renderProfilePage(req, res, null, {password: "Password updated successfully!"})})
		.catch(err=>{
			log("error render");
			renderProfilePage(req, res, {password:err})
		}).done();
	}
});

// Abstracting the page render from routes so I can handle the usecases more cleanly
let renderProfilePage = (req, res, error, success) => {
	var nav = req.nav;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	let updatedUser;
	req.VWModel.getUserDealerById(req.user.id).then(user=>{
		updatedUser = user;
		return req.VWModel.findSalesreps();
	}).then(function(response) {
		//current sales rep is always on top
		var salesReps = response.sort((a,b)=>{return a.id===updatedUser.sales_rep?-1:1});
		res.render("account/profile", {
			currentEnv: currentEnv,
			error: error,
			nav: nav,
			salesReps:salesReps,
			success:success,
			user: updatedUser
		});
	}).catch(function(err) {
		console.log( err );
		res.render("account/profile", {
			currentEnv: currentEnv,
			error: error,
			nav: nav,
			success:success,
			user: user
		});
	});
}

router.get( "/orders", function(req, res) {
	var nav = req.nav;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	req.VWModel.getOrderHistoryById(req.user.id).then(orders=>{
		log("orders", orders);
		res.render("account/orders", {
			currentEnv: currentEnv,
			orders: orders,
			nav: nav,
			user: user
		});
	}).catch(err=>{
		res.render("account/orders", {
			currentEnv: currentEnv,
			error: err,
			nav: nav,
			user: user
		});
	});
});

router.get( "/pay-purchase-order", function( req, res ) {
	var VWModel = req.VWModel;
	var nav = req.nav;
	var user = req.user;
	var settings = req.appSettings;
	var currentEnv = settings.environment;
	var stripeSettings = settings.stripe;
	var stripeMode = stripeSettings.mode;
	var stripeKey = stripeSettings[stripeMode].keys.publishable_key;
	// get purchase orders
	VWModel.getSalesByUser({
		id: user.id
	}).then(function( response ) {
		log( response );
		var purchaseOrders = [];
		response.forEach(function( purchaseOrder, index, array ) {
			if( purchaseOrder.payment.payable===true && purchaseOrder.payment.paid!==true) {
				purchaseOrders.push({
					address: purchaseOrder.ship_to_info,
					created: purchaseOrder.created,
					id: purchaseOrder.id,
					po: purchaseOrder.po_number,
					name: purchaseOrder.customer_info.customer_name,
					total: purchaseOrder.total_invoice_amount,
					data: purchaseOrder
				});
			}
		});
		res.render( "account/pay-purchase-order", {
			currentEnv: currentEnv,
			nav: nav,
			purchaseOrders: purchaseOrders,
			stripeKey: stripeKey,
			user: user
		});
	}).catch(function( response ) {
		res.render( "account/pay-purchase-order", {
			currentEnv: currentEnv,
			error: "error",
			nav: nav,
			user: user
		});
	});
});

router.post( "/pay-purchase-order", function( req, res ) {
	var nav = req.nav;
	var user = req.user;
	let VWModel = req.VWModel;

	VWModel.findSale({id: req.body.saleId})
	.then(sale=>{
		//update sale to be paid!!
		log("got sale:", sale);
		let update = {
			id : sale.id, //req.body.saleLineId,
			payment: sale.payment
		}
		update.payment.paid = true;
		log("sending updated sale:", update);
		return VWModel.updateSale(update);
	})
	.then(sale=>{
		//send the user a notification for payment
		log("sending user payment notification:", sale);

		return VWModel.sendOrderEmail(sale.id, {action:"userPayment"});
	})
	.then(result=>{
		res.status( 200 ).json({
			error: false,
			data: "ok"
		});
	})
	.catch(err=>{
		log("Order Email Send Error", err);
		res.send(err);
	});
});

module.exports = {
	Router: router
};