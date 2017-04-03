var AWS = require("libs/aws");
var pug = require('pug');
var path = require('path');
var Q = require("q");

//http://responsiveemailpatterns.com/patterns/layout/2-equal-width-columns.html
module.exports = {
	sendOrderEmail : function(order, messageOptions, renderResponse) {
		let emailData = {order:order, message: null};
		if (messageOptions){
			emailData.message = getMessageCopy(messageOptions);
		}

		let templatePath = path.join(__dirname, 'orderTableEmail.pug');
		let emailHtml = pug.renderFile(templatePath, emailData);
		if (renderResponse){
			var deferred = Q.defer();
			deferred.resolve(emailHtml);
			return deferred.promise;
		}

		if (order.customer_info.email) {
			return AWS.sendEmail(order.customer_info.email, emailData.message.subject, emailHtml);
		} else {
			throw new Error("customer email not found");
		}
	}
}

function getMessageCopy(messageOptions) {
	let returnMessage = { subject:null, header:null, subheader: null, aside: null}
	if (messageOptions.action==="initOrder") {
		returnMessage.subject = "Order Received";
		returnMessage.header = "Thanks for your order";
		returnMessage.subheader = "Your order has been received and we are now working to get it ready for shipment. Please review your order below<sup>*</sup>.";
		returnMessage.aside = "<sup>*</sup>Shipping charges may still be pending. Please allow for 24 hours for the final charges to appear.";
	} else if (messageOptions.action==="shippingUpdate") {
		returnMessage.subject = "A shipment is coming your way soon";
		returnMessage.header = getShippedHeaderCopy(messageOptions.itemNumbers);
		returnMessage.subheader = "Once your remaining items in your cart are ready for shipment we will notify you.";
		returnMessage.aside = "Please review your updated charges and final receipt below.";
	} else if (messageOptions.action==="shippingComplete") {
		returnMessage.subject = "A shipment is coming your way soon";
		returnMessage.header = getShippedHeaderCopy(messageOptions.itemNumbers);
		returnMessage.subheader = "This completes all of your order.<br>We look forward to working with you again!";
		returnMessage.aside = "If you have not paid your order in full please click here with your purchase order number available.";
	} else if (messageOptions.action==="userPayment") {
		returnMessage.subject = "Thank you for your payment";
		returnMessage.header = "Thank you for your payment";
		returnMessage.subheader = "Please see your full receipt below.";
	}
	return returnMessage;
}

function getShippedHeaderCopy(itemNumbers) {
	let returnMessageHeader = "";
	switch (itemNumbers.length) {
		case 1:
			returnMessageHeader = `Item Number ${itemNumbers[0]} has shipped and is on it's way`;
			break;
		case 2:
			returnMessageHeader = `Item Number ${itemNumbers[0]} and ${itemNumbers[1]} have shipped and are on their way`;
			break;
		default:
			let shippedNo = itemNumbers.reduce((strBuilder, itemNo, index)=>{
				if (index < itemNumbers.length-1) {
					return strBuilder+= `${itemNo}, `;
				} else {
					return strBuilder+= `and ${itemNo}`;
				}

			}, "");
			returnMessageHeader = `Item Number's ${shippedNo} have shipped and are on their way`;
	}
	return returnMessageHeader;
}