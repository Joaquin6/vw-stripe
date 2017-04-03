/**
 * @fileOverview Module that contains all mocked data.
 * @author Mirum Shoper Team <joaquin.briceno@mirumagency.com>
 * @module libs/helpers/mockery
 */

var Helprs = require("helprs"),
	Cache = require("./cache");

var itemIdsRange = {
	min: 160412,
	max: 161411
};
var salesRepIdsRange = {
	min: 817,
	max: 853
};
var customerNumbers = ["JEGSAUTOMOTIVEINC", "EZGO", "DISCOUNTTIRE", "DIRTSEASTERNOFFROAD"];
var warehouses = null;

module.exports.item = {
	price: {
		retail: 25.00,
		dealer: 15.00
	}
};

module.exports.tax = {
	AB: 5.00,
	AL: 8.91,
	CA: 8.44,
	IN: 7.00,
	TX: 8.05,
	ON: 5.00
};

var payment = module.exports.payment = {
	paid: false,
	payment_method: "po",
	CCInfo: "((VISA) xxxxx-xxxxx-9591)",
	CCStatus: "",
	CCAuthCode: "",
	CCAuthDate: "",
	CCSettleDate: "",
	CCResponse: ""
};

/**
 * Vision Wheel Locations by State Address
 * @type  {Object}
 */
module.exports.locationPostals = {
    /** @type {Object} USA Location Addresses */
    AL: {
        phoneNumber: 8006333936,
        country: "USA",
        street: "3512-B 6th Avenue",
        city: "Decatur",
        state: "Alabama",
        postal: "35603"
    },
    CA: {
        phoneNumber: 8009276888,
        country: "USA",
        street: "1470 East 6th Street Building A",
        city: "Corona",
        state: "California",
        postal: "92879"
    },
    IN: {
        phoneNumber: 8666452664,
        country: "USA",
        street: "6675 Daniel Burnham Dr Suite C",
        city: "Portage",
        state: "Indiana",
        postal: "46368"
    },
    TX: {
        phoneNumber: 8006333936,
        country: "USA",
        street: "200 N Northpoint Dr, Amberpoint Business Park Ste 100",
        city: "Coppell",
		state: "Texas",
		postal: "75019"
    },
    /** @type {Object} Canadian Location Addresses */
    AB: {
        phoneNumber: 8003469722,
        country: "CAN",
        street: "8724-53 Avenue",
        city: "Edmonton",
        state: "Alberta",
        postal: "T6E 5G2"
    },
    ON: {
        phoneNumber: 8002093524,
        country: "CAN",
        street: "45B West Wilmot Street Units 15-16",
        city: "Richmond Hill",
        state: "Ontario",
        postal: "L4B2P3"
    }
};

/**
 * Mack Data (aka Fake Data) for development purposes.
 * @type  {Object}
 */
module.exports.order = function() {
	var customer_name = getCustomerName();

	var phone = Helprs.phone({
		formatted: false
	});
	var email = Helprs.email({
		domain: "mirumagency.com"
	});
	var address = Helprs.address({
		short_suffix: true
	});
	var city = Helprs.city();
	var state = Helprs.state({
		country: 'us'
	});
	var zip = Helprs.zip();

	var order = {
		user_id: null,
		dealer_id: null,
		web_order_number: null,
		salesrep_id: Helprs.natural(salesRepIdsRange),
		po_number: "",
		tax_amount: 20.87,
		status: "submitted",
		customer_id: Helprs.pickone(customerNumbers),
		customer_info: {
			customer_name: customer_name,
			company_name: "MIRUM SHOPPER",
			phone: phone,
			email: email
		},
		customer_billing_info: {
			customer_name: customer_name,
			company_name: "MIRUM SHOPPER",
			phone: phone,
			email: email,
			address_1: address,
			address_2: address,
			city: city,
			state: state,
			zip: zip,
			country: "us"
		},
		ship_to_info: {
			store_number: Helprs.natural({
				min: 10000,
				max: 999999
			}),
			address_1: address,
			address_2: address,
			city: city,
			state: state,
			zip: zip,
			country: "us"
		},
		payment: payment,
		freight_total: 45.56,
		subtotal_amount: 678.90,
		total_discount_amount: 8.89,
		total_invoice_amount: 3000.00
	};

	order.sale_items = generateSaleItems();

	return order;
};

function getCustomerName() {
	var nameOptions = {
		gender: "male",
		nationality: "en"
	};

	if (!Helprs.bool()) {
		nameOptions.gender = "female";
	}

	if (!Helprs.bool({
			likelihood: 70
		})) {
		nameOptions.nationality = "it";
	}

	return Helprs.name(nameOptions);
}

function getFullfilmentLocation() {
	if (!warehouses && Cache.has("Warehouses")) {
		warehouses = Cache.get("Warehouses");
	}
	return Helprs.pickone(warehouses);
}

function generateSaleItems() {
	var sale_items = {};

	var saleItemId = Helprs.natural(itemIdsRange);
	sale_items[saleItemId] = {
		item_no: "XXXXXX",
		item_description: {
			product_name: "",
			size: "",
			finish: "",
		},
		customer_item_no: "",
		qty: 4,
		unit_price: 120.00,
		tax_amount: 20.00,
		total_line_amount: 140.00,
		fulfilment_location: getFullfilmentLocation(),
		shipping_options: {
			shipped: false,
			delivery_type: "commercial",
			shipping_agent: "ups",
			shipping_method: "ground",
			eship_agent_service_code: "ground",
			tracking_number: "",
			third_party_account_number: "",
			shipping_amount: 30.99,
		}
	};

	saleItemId = Helprs.natural(itemIdsRange);
	sale_items[saleItemId] = {
		item_no: "XXXXXX",
		item_description: {
			product_name: "",
			size: "",
			finish: "",
		},
		customer_item_no: "",
		qty: 4,
		unit_price: 120.00,
		tax_amount: 20.00,
		total_line_amount: 140.00,
		fulfilment_location: getFullfilmentLocation(),
		shipping_options: {
			shipped: false,
			delivery_type: "commercial",
			shipping_agent: "ups",
			shipping_method: "ground",
			eship_agent_service_code: "ground",
			tracking_number: "",
			third_party_account_number: "",
			shipping_amount: 30.99,
		}
	};

	return sale_items;
}