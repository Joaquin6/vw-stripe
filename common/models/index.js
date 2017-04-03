/**
 * @module models/index
 * @type {Object}
 * @fileOverview This file is known as the VWModel Module.
 * This model serves as a centric location to access methods that utilize the
 * rest of the application's models. This enables us to ONLY REQUIRE ONE model
 * throughout the entire application.
 *
 * Note:
 *     Sublime Text Shortcuts
 *         Collapse All Methods:
 *             Command + K, 2
 *
 * @author Joaquin Briceno <joaquin.briceno@mirumshopper.com>
 */
var Q = require("q"),
    _ = require("underscore"),
    Moment = require("moment"),
    Helprs = require("helprs"),
    colors = require("libs/colors"),
    logger = require("libs/logger"),
    Taxapi = require("libs/taxapi"),
    Crypt = require("libs/crypt"),
    MSSQL = require("libs/mssql"),
    AWS = require("libs/aws"),
    debug = require("libs/buglog"),
    Stripe = require("libs/stripe"),
    ShippingCalculator = require("libs/shipping_calculator"),
    Mockdata = require("libs/helpers/mockery"),
    Exectimer = require("libs/helpers/exectimer"),
    EmailController = require("controllers/email"),
    Checkout = require( "models/checkout" ),
    Generic = require("models/generic"),
    Brand = require("models/public/brand"),
    Item = require("models/public/item"),
    Product = require("models/public/product"),
    ProductList = require("models/public/product_list"),
    Sale = require("models/sales/sale"),
    SaleItem = require("models/sales/sale_item"),
    Salesrep = require("models/sales/salesrep"),
    User = require("models/membership/user"),
    Login = require("models/membership/login"),
    Dealer = require("models/membership/dealer"),
    log = debug("models", "vwmodel"),
    warehousesJSON = require("../config/settings/warehouses");

require("clarify");
var start;

/**
 * The `VWModelObject` containing the module logic and public accessible methods.
 * This is what being exported as the module logic. Any methods inside this object
 * are accessible externally. Any methods/functions outside of this object are meant to
 * be accessible internally.
 * @type  {Object}
 */
var VWModelObject = {
    createCheckout: function( parameters, options ) {
        return new Checkout( parameters );
    },
    /**
     * The `parameters` object needs to contain an id key.
     * The id key will contain the user's id.
     * @param  {Object} parameters  Parameter Object containing the User ID
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     id: 123
     * }
     * @param  {Object} options Additional Options that may be defined later in dev.
     * @return {Object}         Initially, Returns a Deferred Promise Object
     */
    clearCart: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};

        Generic.clearCart(parameters, options).then(function(updatedUser) {
            deferred.resolve(updatedUser.cart);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    /**
     * Method used to clear all rows from the passed in Table.
     * @param   {Object}  parameters  Parameters containing the table details.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     table: "user",    [REQUIRED]
     *     schema: "public"
     * }
     * @param   {Object}  options     [description]
     * @return  {Object}              [description]
     */
    clearTable: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};

        /** If we have a table but no schema, we can apply the schema value. */
        if (!parameters.schema && parameters.table) {
            switch (parameters.table) {
                case "dealer":
                case "login":
                case "user":
                    parameters.schema = "membership";
                    break;
                case "brand":
                case "item":
                case "product":
                case "product_list":
                    parameters.schema = "public";
                    break;
                case "sale":
                case "sale_item":
                case "salesrep":
                    parameters.schema = "sale";
                    break;
            }
        }

        Generic.clearTableData(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    countUsers: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        User.count(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Method to save the dealer and user data on our DB.
     * This method will eventually trigger an email to VW as planed.
     *
     * @param   {Object}  parameters  Object containing all the data
     *                                from the filled out signup form.
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     * @return  {Object}              Initially, Returns a Deferred Promise Object.
     *                                When the promise is resolved, it returns the saved user object.
     */
    dealerSignup: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};

        if (parameters.company_name_1) {
            parameters.company_name_1 = parameters.company_name_1.toUpperCase();
        }
        if (parameters.company_name_2) {
            parameters.company_name_2 = parameters.company_name_2.toUpperCase();
        }
        if (!parameters.website)
            parameters.website = "";

        __dealerSignup(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            log("Dealer Signup Error: %O", err);
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    /**
     * Used to delete a Dealer from our Database.
     * @param   {Object}  parameters  Parameter object containing the Dealer's ID.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     id: 123 (optional)   [REQUIRED]
     * }
     * @param   {Object}  options     Additional Options that may be defined for custom cases.
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    deleteDealer: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        Dealer.destroy(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    deleteLogin: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        Login.destroy(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Filter Items based on the parameters passed in.
     *
     * @param   {Object}  parameters  Filter values to apply.
     *                                At least one parameter property is required to filter
     *                                for items.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     type: "wheel",
     *     brand: "Vision",
     *     model: "715 Crazy Eight",
     *     diameter: 17,
     *     finish: "Chrome"
     * }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    filterItems: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};

        /** First, we validate a proper data structure that massive can use. */
        var parameterSchema = {};
        var parameterKeys = _.allKeys(parameters);

        /**
         * Confirm if this search is strictly for the `part_number` ONLY.
         * This flag will help us determine whether to make an extra call to
         * NAV if no items are found in our DB.
         *
         * If no Items found in our DB and this flag is set to true, this means
         * the user attempted to serahc by part number but that number doesnt
         * exist in our DB, therefore, we will now make that extra call to NAV
         * to confirm that the inputted number is a cross reference of the
         * actual part number.
         * @type  {Boolean}
         */
        var searchingPrivateLabel = null;
        var searchingPartNumber = null;
        var searchingByPartNumber = false;
        /**
         * We have to structure the data so that the `parameterSchema` object
         * matches the item table column arrangement. This way massive can
         * query for the items based on the properties passed in with the
         * parameters.
         */
        parameterSchema["product_id !"] = null;
        for (var f = 0; f < parameterKeys.length; f++) {
            var key = parameterKeys[f];
            var value = parameters[key];

            switch(key) {
                case "part_number":
                case "upc":
                case "type":
                case "inventory":
                case "privateLabel":
                    if (key === "part_number") {
                        searchingByPartNumber = true;
                        searchingPartNumber = value;
                    }
                    if (key === "privateLabel")
                        searchingPrivateLabel = value;
                    parameterSchema[key] = value;
                    break;
                default:
                    parameterSchema[`specification ->> ${key}`] = value;
            }
        }

        var that = this;
        this.findItems(parameterSchema, options).then(function(items) {
            if (items.length)
                deferred.resolve(items);
            else {
                MSSQL.crossReference(parameters, options).then(function(crossRefItem) {
                    var crossRefItemNum = crossRefItem["Item No_"] || "";
                    if (_.isEmpty(crossRefItemNum) && crossRefItem.crossReference)
                        crossRefItemNum = crossRefItem.crossReference.referencedItemNumber || "";
                    crossRefItemNum = crossRefItemNum.toString().trim();

                    /** @ignore For Debugging Purposes */
                    var crossRefMsg = "\nRetrieving Cross Referenced Item from Postgres.";
                    crossRefMsg += "\n\tPart Number:\t\t" + colors.yellow(crossRefItemNum);
                    crossRefMsg += "\n\tCross Reference Number:\t" + colors.yellow(searchingPartNumber);
                    crossRefMsg += "\n\tPostgres Query Built:";
                    crossRefMsg += colors.yellow("\n\t\tSELECT * FROM public.item WHERE part_number = '" + colors.yellow(crossRefItemNum) + "';");
                    crossRefMsg += "\n\tCross Reference Details:";
                    crossRefMsg += colors.yellow("\n\t\t" + colors.yellow(JSON.stringify(crossRefItem.crossReference)) + "\n");
                    log(crossRefMsg);

                    that.findItem({part_number: crossRefItemNum}).then(function(item) {
                        deferred.resolve([item]);
                    }).fail(function(err) {
                        if (err.message && err.message === "Record Not Found")
                            deferred.resolve([]);
                        else
                            deferred.reject(err);
                    }).done();
                }).fail(function(err) {
                    if (err.statusCode === 1002)
                        deferred.resolve([]);
                    else
                        deferred.reject(err);
                }).done();
            }
        }).fail(function(err) {
            log("There was a ERROR while Filtering Items");
            log(err);
            if (err.stack) {
                log("WARNING: Long Stack Traces");
                log(err.stack);
            }
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    /**
     * Filter Items based on the supplied part number.
     *
     * @param   {Object}  parameters  Filter values to apply.
     *                                Only the `part_number` property is required.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     partNumber: "181H7681MBF"
     * }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    filterItemsByPartNumber: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};

        this.findItems({part_number: parameters.partNumber}, options).then(function(items) {
            deferred.resolve(items);
        }).fail(function(err) {
            console.log("!!! VWModel: There was a ERROR while Filtering Items By Part Number");
            console.log(err);
            if (err.stack) {
                console.log(colors.yellow(">>> WARNING: Long Stack Traces <<<"));
                console.log(err.stack);
            }
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    findBrand: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        Brand.findOne(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findBrands: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        Brand.find(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to get Cart Item Details. In other words, this method will return
     * the items in the User's cart with each of their specific details.
     * @param   {Object}  parameters   Parameter object that contains the User ID.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     id: 123
     * }
     * @param   {Object}  options  Additional Options that may be defined later in dev.
     * @return  {Object}           Initially, Returns a Deferred Promise Object
     */
    findCartDetails: function(parameters, options) {
        var deferred = Q.defer();

        options = options || {};
        parameters = parameters || {};

        /**
         * Flag to be set to confirm weather we should get the user
         * from postgres or not. When this method is called from the routes,
         * the user object along with the dealer object will always be available.
         * Therefore, passing in the user object will determine that there is no
         * need to go and fetch the user from the db.
         *
         * First we check if the parameters contains a combination of user cart object
         * and dealer object, if so this is the user object and there is no need to fetch
         * it again.
         * @type  {Boolean}
         */
        var fetchUser = true;
        if (parameters.cart && (parameters.dealer && _.isObject(parameters.dealer)))
            fetchUser = false;

        var that = this;

        if (fetchUser) {
            this.findUser({id: parameters.id}, options)
            .then(itemPricingHandler)
            .fail(function(err) {
                deferred.reject(err);
            }).done();
        } else {
            itemPricingHandler(parameters);
        }

        function itemPricingHandler(user) {
            var Cart = user.cart;
            var itemsObj = Cart.items;
            var itemIds = _.allKeys(itemsObj);

            options.excludePrivateLabelQuery = false;

            if (itemIds.length) {
                that.getItemPricing(user, options).then(function(pricedItems) {
                    /**
                     * Once all Items are found, we add the user.cart.items object values to the
                     * found items data. This will add the QTY and Location values.
                     */
                    Cart.subtotal = 0;
                    for (var t = 0; t < pricedItems.length; t++) {
                        var item = pricedItems[t];

                        /** Create Location Property */
                        item.locations = itemsObj[item.id];

                        /** Now calculate the price per WH */
                        var states = _.allKeys(item.locations);
                        for (var f = 0; f < states.length; f++) {
                            var state = states[f];
                            var price = 0;

                            if (item.price.dealer !== undefined)
                                price = item.price.dealer;
                            else if (item.price.retail !== undefined)
                                price = item.price.retail;

                            Cart.subtotal += item.locations[state] * price;
                        }
                    }

                    Cart.subtotal = __parseDecimalPricing(Cart.subtotal);
                    Cart.items = pricedItems;
                    /** We resolve with an array of Objects containing Item Details */
                    deferred.resolve(Cart);
                }).fail(function(err) {
                    log(err);
                    if (err.stack) {
                        log(colors.yellow(">>> WARNING: Long Stack Traces <<<"));
                        log(err.stack);
                    }
                    deferred.reject(err);
                }).done();
            } else {
                Cart.subtotal = 0;
                Cart.items = [];
                deferred.resolve(Cart);
            }
        }

        return deferred.promise;
    },
    findDealer: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        Dealer.findOne(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findDealers: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        Dealer.find(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findItem: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        Item.findOne(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findItems: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        Item.find(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findLogin: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        Login.findOne(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findProduct: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};

        var privateLabel = parameters.privateLabel || false;
        delete parameters.privateLabel;

        Product.findOne(parameters, options)
        .then(function(product) {
            var itemParams = {
                product_id: product.id, //items.list,
                privateLabel: privateLabel
            };
            Item.find(itemParams).then(function(items) {
                product.items.list = items;
                deferred.resolve(product);
            }).fail(function(err) {
                deferred.reject(err);
            }).done();
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findProducts: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        Product.find(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findProductListing: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        ProductList.findOne(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findProductListings: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        ProductList.find(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to find a Sale from our Database.
     *
     * @param   {Object}  parameters  Parameter object containing the Sale or User's ID.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     id: 123 (optional),
     *     user_id: 345 (required)
     * }
     *
     * @param   {Object}  options     Additional Options that may be defined for custom cases.
     *                                Here we have the additional options that can be passed in
     *                                as part of the `options` object:
     *                                    noItems  {Boolean}  Flag that determines whether to grab the
     *                                                        items for the sale.
     *                                                        Default: undefined
     * @example <caption>Example Usage of the Options Object</caption>
     * {
     *     noItems: false
     * }
     *
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    findSale: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};

        var that = this;
        Sale.findOne(parameters).then(function(sale) {
            /**
             * This can be an options where if `options.noItems` is set to true,
             * then we exclude the fetching of the Items associated with the Sale.
             * One would do this if, they just want the sale data but not the full
             * breakdown including the items in the sale.
             *
             * @param   {Boolean}  options.noItems  If to include the Sale's Items or not.
             *
             * @return  {Object}                    Resolve the promise with the Sale Object found.
             */
            if (options.noItems) {
                return deferred.resolve(sale);
            }
            __findSaleItems(sale).then(function(response) {
                deferred.resolve(response);
            }).fail(function(err) {
                deferred.reject(err);
            }).done();
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findSales: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};

        var that = this;
        Sale.find(parameters).then(function(sales) {
            /**
             * This can be an options where if `options.noItems` is set to true,
             * then we exclude the fetching of the Items associated with the Sale.
             * One would do this if, they just want the sale data but not the full
             * breakdown including the items in the sale.
             *
             * @param   {Boolean}  options.noItems  If to include the Sale's Items or not.
             *
             * @return  {Object}                    Resolve the promise with the Sale Object found.
             */
            if (options.noItems) {
                return deferred.resolve(sales);
            }

            var promises = [], genSales = [];
            for (var f = 0; f < sales.length; f++) {
                var promise = __findSaleItems(sales[f]).then(function(sale) {
                    genSales.push(sale);
                });
                promises.push(promise);
            }

            Q.allSettled(promises).then(function(results) {
                var isError = false,
                    errorResult;
                results.forEach(function(result) {
                    if (result.state !== 'fulfilled') {
                        isError = true;
                        errorResult = result;
                    }
                });

                if (isError) {
                    console.log(colors.red("!!! " + errorResult.reason));
                    errorResult.message = errorResult.reason;
                    deferred.reject(errorResult);
                } else {
                    deferred.resolve(genSales);
                }
            }).done();
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findSaleItems: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        SaleItem.find(parameters).then(function(sale) {
            deferred.resolve(sale);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findSalesrep: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        Salesrep.findOne(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findSalesreps: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        Salesrep.find(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findUser: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        User.findOne(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    findUsers: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        User.find(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    getBrands: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        Brand.find(parameters).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    getBrandsByType: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};

        /**
         * If no type is specified, I will apply the default type
         * to an array of `wheel`, `cap`, `accessory` and `tire`.
         */
        if (!parameters.type) {
            parameters.type = ["wheel", "tire"];
        }

        Brand.find(parameters).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    getItemsByType: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};

        /**
         * If no type is specified, I will apply the default type
         * to an array of `wheel`, `cap`, `accessory` and `tire`.
         */
        if (!parameters.type) {
            parameters.type = ["wheel", "cap", "accessory", "tire"];
        }

        Item.find(parameters).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Get all possible specification values for wheels and/or tires.
     * @param   {[type]}  parameters  [description]
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     type: ["wheel"],
     *     fields: [“brand”, “size”, “finish”],
     *     privateLabel: "DISCOUNTTIRE"
     * }
     * @param   {[type]}  options     [description]
     * @return  {[type]}              [description]
     */
    getItemSpecifications: function(parameters, options) {
        var deferred = Q.defer();

        Exectimer.time("getItemSpecifications()");

        parameters = parameters || {};
        options = options || {};

        /**
         * If no `parameters.type` is specified, I will apply the default type
         * to an array of `wheel`, `cap`, `accessory` and `tire`.
         */
        if (!parameters.type)
            parameters.type = ["wheel", "accessory", "tire"];
        /**
         * If no `parameters.fields` is specified, I will apply the default type
         * to an array of `brand`, `size` and `finish`.
         */
        if (!parameters.fields)
            parameters.fields = ["brand", "size", "finish"];

        Item.findBySpecs(parameters, options).then(function(response) {
            log(Exectimer.timeEnd("getItemSpecifications()", {
                methodSuccess: true
            }));
            deferred.resolve(response);
        }).fail(function(err) {
            log(Exectimer.timeEnd("getItemSpecifications()", {
                methodSuccess: false
            }));
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    /**
     * Used to get Inventory data on a specified Item ID. This method can be extended to use
     * slugs as well. To be determined.
     *
     * @param   {Object}  parameters  Parameter object that contains the Item ID.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     id: 123
     * }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     *
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    getInventory: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        this.findItems(parameters).then(function(item) {
            deferred.resolve(item.inventory);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    getLastWebOrderNumber: function(parameters) {
        var deferred = Q.defer();
        parameters = parameters || {};

        var promise = null;

        if (_.has(parameters, 'envCode'))
            promise = Generic.getLastWebOrderNumberByEnv(parameters.envCode);
        else
            promise = Generic.getLastWebOrderNumber();

        promise.then(function(WebOrderNumber) {
            deferred.resolve(WebOrderNumber);
        }).fail(function(err) {
            log("ERROR with DB Function 'getLastWebOrderNumber()'.");
            log(err);
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    getOrdersAdmin: function(){
        return Sale.find();
    },
    getOrderHistoryById: function(user_id) {
        return this.findSales({user_id: user_id});
    },
    getPopularProducts: function(parameters){
        parameters = parameters ||{};
        var deferred = Q.defer();
        this.findProductListing({id:298})
        .then(result=>{
            parameters.id = result.products.list;
            return this.findProducts(parameters);
        })
        .then(products=>{
            deferred.resolve(products);
        })
        .catch(err=>{
            deferred.reject(err);
        });
        return deferred.promise;
    },
    getProduct: function(parameters, options) {
        /** ADD GET SINGLE PRODUCT WITH ITEM DATA */
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        var that = this;
        Product.find(parameters, options).then(function(product) {
            Item.find({product_id: product.id}).then(function(items) {
                product.items.list = items;
                deferred.resolve(product);
            }).fail(function(err) {
                deferred.reject(err);
            }).done();
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    getProducts: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        Product.find(parameters, options).then(function(products) {
            deferred.resolve(products);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to get all products that belong to a certain brand.
     *
     * @param   {Object}  parameters  Parameter object that contains the Brand Name.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     name: "Vision"
     * }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     *
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    getProductsByBrand: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};

        var that = this;
        ProductList.find(parameters, options).then(function(productListed) {
            if (productListed.length) {
                var productsParams = {
                    id: productListed.products.list
                };
                that.getProducts(productsParams).then(function(products) {
                    productListed.products = products;
                    deferred.resolve(productListed);
                }).fail(function(err) {
                    deferred.reject(err);
                }).done();
            }
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Method to get all sales associated with the User's ID.
     *
     * @param   {Object}  parameters  Parameters containing the User's ID
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     id: 346
     * }
     * @param   {Object}  options     [description]
     *
     * @return  {Object}              [description]
     */
    getSalesByUser: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        this.findSales({user_id: parameters.id}, options).then(function(taxRate) {
            deferred.resolve(taxRate);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to get the Tax Rate based on a provided address.
     *
     * NOTE:    If you would like to know how these values calculate Tax Rates based on
     *          on the data provided visit this link:
     *          [Avalara Address Validation]{@link http://developer.avalara.com/avatax/address-validation/}
     *
     * @param   {Object}  parameters  Object that contains the Address Information.
     * @example <caption>Example Usage of the Parameters Object</caption>
     *              {
     *   [REQUIRED]     country: "USA",
     *   [REQUIRED]     state: "CA",
     *   [OPTIONAL]     street: "2920 S SEPULVEDA BLVD",
     *   [OPTIONAL]     city: "CULVER CITY",
     *   [OPTIONAL]     postal: 90064
     *              }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     * @return  {Object}              The responding Object currently has 2 properties.
     *                                The possible values for the responding object's type
     *                                property are `totalRate`, `County`, `State` and `Special`.
     *                                The `type` property is important because it tells us the used
     *                                values behind the `rate` property value.
     * @example <caption>Example of Returning Object</caption>
     *              {
     *                   type: "totalRate",
     *                   rate: 9
     *              }
     */
    getTaxRateByAddress: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        Taxapi.getTaxRateByAddress(parameters, options).then(function(taxRate) {
            deferred.resolve(taxRate);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to get the Tax Rate based on a provided postal and country.
     *
     * NOTE:    If you would like to know how these values calculate Tax Rates based on
     *          on the data provided visit this link:
     *          [Avalara Address Validation]{@link http://developer.avalara.com/avatax/address-validation/}
     *
     * @param   {Object}  parameters  Object that contains the Address Information.
     * @example <caption>Example Usage of the Parameters Object</caption>
     *              {
     *   [REQUIRED]     country: "USA",
     *   [REQUIRED]     postal: 90064
     *              }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     * @return  {Object}              The responding Object currently has 2 properties.
     *                                The possible values for the responding object's type
     *                                property are `totalRate`, `County`, `State` and `Special`.
     *                                The `type` property is important because it tells us the used
     *                                values behind the `rate` property value.
     * @example <caption>Example of Returning Object</caption>
     *              {
     *                   type: "totalRate",
     *                   rate: 9
     *              }
     */
    getTaxRateByZip: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        Taxapi.getTaxRateByZip(parameters, options).then(function(taxRate) {
            deferred.resolve(taxRate);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    getUserDealerById: function(id, cb) {
        Exectimer.time("getUserDealerById()");
        var that = this;
        return this.findUser({id:id}).then(function(user) {
            if (!user.dealer_id) {
                log(colors.cyan("User (" + colors.yellow(user.id) + ") is NOT Associated to a Dealer"));
                user.dealer = null;
                log(Exectimer.timeEnd("getUserDealerById()"));
                return user;
            }
            return that.findDealer({id: user.dealer_id}).then(function(dealer) {
                user.dealer = dealer;
                log(Exectimer.timeEnd("getUserDealerById()"));
                return user;
            });
        });
    },
    getUserDealers: function(params) {
        params = params || {};
        var deferred = Q.defer();
        var that = this;
        this.findUsers(params).then(function(users) {
            let userDealers = users.map(user=>{
                return that.findDealer({id: user.dealer_id}).then(function(dealer) {
                    if (dealer){
                        user.dealer = dealer;
                    }
                    return user;
                }).fail(err=>{
                    return user;
                });
            });
            return Q.allSettled(userDealers);
        }).then(userDealersPromise=>{
            deferred.resolve(userDealersPromise.map(udp=>{return udp.value}));
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
       return deferred.promise;
    },
    /**
     * It updates the User's Password.
     * @param   {String}  token     This is the hashed token generated for the link
     * @param   {String}  password  The User's New Password
     * @return  {Object}            Depending on the state of the promise which will
     *                              result in an Error Object or an Object Representing
     *                              the updated Login Record.
     */
    resetPasswordByLogin: function(token, password){
        var deferred = Q.defer();

        /** Password has to be a string else hashing wont work. */
        if (typeof password !== 'string')
            password = password.toString();

        var that = this;
        /** First we find the login record with the given token. */
        this.findLogin({hashed_reset_id: token}).then(function(login) {
            if (Crypt.compareSync(password, login.password_hash)) {
                var err = Helprs.err('Invalid Password: Password Already Used.', {
                    statusCode: 401,
                    hint: "Please try another password. The password provided has already been used.",
                    args: {
                        token: token,
                        password: password
                    }
                });
                console.log(err);
                deferred.reject(err);
            } else {
                var updateParams = {
                    id: login.id,
                    password_hash: Crypt.hashSync(password),
                    hashed_reset_id: null
                };

                that.saveLogin(updateParams).then(function(updatedLogin) {
                    console.log(updatedLogin);
                    deferred.resolve(updatedLogin);
                }).fail(function(err) {
                    console.log(colors.red("!!! VWModel ERROR: Unable to Update Login Record."));
                    console.log(err);
                    deferred.reject(err);
                }).done();
            }
        }).fail(function(err) {
            console.log(colors.red("!!! VWModel ERROR: Unable to Find Login Record with the given `hashed_reset_id`."));
            console.log(err);
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    saveBrand: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        Brand.save(parameters).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    saveDealer: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        Dealer.save(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    saveItem: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        Item.save(parameters).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    saveLogin: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        Login.save(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    saveProduct: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        Product.save(parameters).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    saveProductListing: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        ProductList.save(parameters).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    saveSale: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        Sale.save(parameters).then(function(sale) {
            log("Successfully Saved Sale ID %s", colors.green(sale.id));
            deferred.resolve(sale);
        }).fail(function(err) {
            log("There was an ERROR Saving a Sale");
            log(err);
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    saveSaleItem: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        SaleItem.save(parameters).then(function(saleItem) {
            log("Successfully Saved Sale-Item ID %s for Sale ID %s", colors.green(saleItem.id), colors.green(saleItem.sale_id));
            deferred.resolve(saleItem);
        }).fail(function(err) {
            log("There was an ERROR Saving a Sale Item");
            log(err);
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    saveUser: function(parameters, options) {
        var deferred = Q.defer();
        options = options || {};
        parameters = parameters || {};
        User.save(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Method to search for Global search based on the passed in term.
     * @param   {Object}  parameters  Parameter properties that contain the term to search by.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     term: "Vision"
     * }
     * @param   {Object}  options     Optional Options Object that modify the search behavior.
     *                                Currently, options only expects one property which is columns.
     *                                The columns property states which columns to search the term for.
     *                                Default is set to ["name", "description"], so the search query will
     *                                execute against the name and description columns.
     * @example <caption>Example Usage of the Options Object</caption>
     * {
     *     columns: ["name"]
     * }
     * @return  {Object}               Returns an Object of with the properties `brands` and `products` with the word 'Vision' in their name or description.
     * @example <caption>Example of the Returning Object</caption>
     * {
     *     brands: [{
     *         id: 52,
     *         type: "wheel",
     *         name: "Vision Wheel",
     *         slug: "vision-wheel",
     *         logo: "http://visionwheel.s3.amazonAWS.com/pages/brands/wheels/VisionWheel.svg",
     *         description: "Browse our full selection of ATV tires designed for the performance you want on your chosen terrain.",
     *         image: {
     *                 hero: "http://visionwheel.s3.amazonAWS.com/pages/brands/wheels/Headerimage_VisionWheelHD.jpg"
     *             }
     *         }
     *     }],
     *     products: [{
     *         id: 52,
     *         type: "wheel",
     *         name: "141 Legend 5",
     *         slug: "american-muscle",
     *         logo: "http://visionwheel.s3.amazonAWS.com/pages/brands/wheels/AmericanMuscle.svg",
     *         description: null,
     *         image: {
     *             list: [{
     *                 "src": "https://visionwheel.s3.amazonAWS.com/wheels/vision-hd/vision_181_heavy_hauler_dualie_chrome_front_std_hires.jpg",
     *                 "finish": "Chrome"
     *             }, {
     *                 "src": "https://visionwheel.s3.amazonAWS.com/wheels/vision-hd/181_19.5x6.75_MBF2.jpg",
     *                 "finish": "Matte Black"
     *             }, {
     *                 "src": "https://visionwheel.s3.amazonAWS.com/wheels/vision-hd/vision_181_heavy_hauler_dualie_machined_clear_coat_front_std_hires.jpg",
     *                 "finish": "Machined"
     *             }]
     *         }
     *     }]
     * }
     */
    search: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};

        /** @type {Array} Default to `["name", "description"]` */
        parameters.columns = ["name", "description"];

        /** Check if `options.columns` has been passed. If so, override the defaults. */
        if (options && options.columns) {
            parameters.columns = options.columns;
            delete options.columns;
        }

        /** Validate that a Term has been provided. */
        if (!parameters.term) {
            var err = Helprs.err("No Search Term Provided", {
                statusCode: 1003,
                paramaters: parameters
            });
            return deferred.reject(err);
        }

        __globalSearch(parameters).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    /**
     * Method to search for Brands based on the passed in term.
     * @param   {Object}  parameters  Parameter properties that contain the term to search by.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     term: "Vision"
     * }
     * @param   {Object}  options     Optional Options Object that modify the search behavior.
     *                                Currently, options only expects one property which is columns.
     *                                The columns property states which columns to search the term for.
     *                                Default is set to ["name", "description"], so the search query will
     *                                execute against the name and description columns.
     * @example <caption>Example Usage of the Options Object</caption>
     * {
     *     columns: ["name"]
     * }
     * @return  {Array}               Returns an array of all brands with the word 'Vision' in their name or description.
     * @example <caption>Example of the Returning Array</caption>
     * [{
     *     id: 52,
     *     type: "wheel",
     *     name: "Vision Wheel",
     *     slug: "vision-wheel",
     *     logo: "http://visionwheel.s3.amazonAWS.com/pages/brands/wheels/VisionWheel.svg",
     *     description: "Browse our full selection of ATV tires designed for the performance you want on your chosen terrain.",
     *     image: {
     *         hero: "http://visionwheel.s3.amazonAWS.com/pages/brands/wheels/Headerimage_VisionWheelHD.jpg"
     *     }
     * }]
     */
    searchBrands: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};

        /** @type {Array} Default to `["name", "description"]` */
        parameters.columns = ["name", "description"];

        /** Check if `options.columns` has been passed. If so, override the defaults. */
        if (options && options.columns) {
            parameters.columns = options.columns;
            delete options.columns;
        }

        /** Validate that a Term has been provided. */
        if (!parameters.term) {
            var err = Helprs.err("No Search Term Provided", {
                statusCode: 1003,
                paramaters: parameters
            });
            return deferred.reject(err);
        }

        Brand.search(parameters, options).then(function(response) {
            var resObject = null;
            if (_.isObject(response)) {
                resObject = _.clone(response);
                if (response.records)
                    response = response.records;
            }

            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    /**
     * Method to search for Items based on the passed in term.
     * @param   {Object}  parameters  Parameter properties that contain the term to search by.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     term: "17X9"
     * }
     * @param   {Object}  options     Optional Options Object that modify the search behavior.
     *                                Currently, options only expects one property which is columns.
     *                                The columns property states which columns to search the term for.
     *                                Default is set to ["part_number", "upc", "specification"], so the search query will
     *                                execute against the name and description columns.
     * @example <caption>Example Usage of the Options Object</caption>
     * {
     *     columns: ["name"]
     * }
     * @return  {Array}               Returns an array of all brands with the word 'Vision' in their name or description.
     * @example <caption>Example of the Returning Array</caption>
     * [{
     *     id: 52,
     *     type: "wheel",
     *     upc: "886821066629",
     *     part_number: "375H7883GBMF25",
     *     specification: {"bs": 5.75, "cap": "C375-6C", "pcd": 83, "size": "17X8.5", "brand": "Vision Off-Road", "model": "375 Warrior", "style": "375 Warrior", "width": 8.5, "finish": "Gloss Black Machined Face", "offset": 25, "diameter": 17, "hub_bore": 106.2, "load_rating": 2400, "production_line": "Vision Off-Road", "boltpattern1_inches": "6-5.5", "boltpattern1_metric": "6-139.7", "boltpattern2_inches": "", "boltpattern2_metric": ""},
     *     description: null,
     *     image: {"list": []},
     *     inventory: {"AB": 24, "AL": 200, "CA": 200, "IN": 127, "ON": 34, "TX": 200, "US": 727, "CAD": 58}
     * }]
     */
    searchItems: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};

        /** @type {Array} Default to `["name", "description"]` */
        parameters.columns = ["part_number", "upc", "specification"];

        /** Check if `options.columns` has been passed. If so, override the defaults. */
        if (options && options.columns) {
            parameters.columns = options.columns;
            delete options.columns;
        }

        /** Validate that a Term has been provided. */
        if (!parameters.term) {
            var err = Helprs.err("No Search Term Provided", {
                statusCode: 1003,
                paramaters: parameters
            });
            return deferred.reject(err);
        }

        Item.search(parameters, options).then(function(response) {
            var resObject = null;
            if (_.isObject(response)) {
                resObject = _.clone(response);
                if (response.records)
                    response = response.records;
            }

            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    searchNAVXRefs: function(parameters, options) {
        return MSSQL.searchXRefs(parameters, options);
    },
    /**
     * Method to search for Products based on the passed in term.
     * @param   {Object}  parameters  Parameter properties that contain the term to search by.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     term: "Legend"
     * }
     * @param   {Object}  options     Optional Options Object that modify the search behavior.
     *                                Currently, options only expects one property which is columns.
     *                                The columns property states which columns to search the term for.
     *                                Default is set to ["name", "description"], so the search query will
     *                                execute against the name and description columns.
     * @example <caption>Example Usage of the Options Object</caption>
     * {
     *     columns: ["name"]
     * }
     * @return  {Array}               Returns an array of all brands with the word 'Vision' in their name or description.
     * @example <caption>Example of the Returning Array</caption>
     * [{
     *     id: 52,
     *     type: "wheel",
     *     name: "141 Legend 5",
     *     slug: "american-muscle",
     *     logo: "http://visionwheel.s3.amazonAWS.com/pages/brands/wheels/AmericanMuscle.svg",
     *     description: null,
     *     image: {
     *         list: [{
     *             "src": "https://visionwheel.s3.amazonAWS.com/wheels/vision-hd/vision_181_heavy_hauler_dualie_chrome_front_std_hires.jpg",
     *             "finish": "Chrome"
     *         }, {
     *             "src": "https://visionwheel.s3.amazonAWS.com/wheels/vision-hd/181_19.5x6.75_MBF2.jpg",
     *             "finish": "Matte Black"
     *         }, {
     *             "src": "https://visionwheel.s3.amazonAWS.com/wheels/vision-hd/vision_181_heavy_hauler_dualie_machined_clear_coat_front_std_hires.jpg",
     *             "finish": "Machined"
     *         }]
     *     }
     * }, {
     *     id: 52,
     *     type: "wheel",
     *     name: "141 Legend 6",
     *     slug: "american-muscle",
     *     logo: "http://visionwheel.s3.amazonAWS.com/pages/brands/wheels/AmericanMuscle.svg",
     *     description: null,
     *     image: {
     *         list: [{
     *             "src": "https://visionwheel.s3.amazonAWS.com/wheels/american-muscle/vision_142_legend_6_chrome_6_lug_std_1000.jpg",
     *             "finish": "Chrome"
     *         }, {
     *             "src": "https://visionwheel.s3.amazonAWS.com/wheels/american-muscle/141_Legend-5_GM_1000.jpg",
     *             "finish": "Gunmetal"
     *         }, {
     *             "src": "https://visionwheel.s3.amazonAWS.com/wheels/american-muscle/vision_142_legend_6_gunmetal_machine_lip_6_lug_std_1000.jpg",
     *             "finish": "Gunmetal Machined Lip"
     *         }]
     *     }
     * }]
     */
    searchProducts: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};

        /** @type {Array} Default to `["name", "description"]` */
        parameters.columns = ["name", "description"];

        /** Check if `options.columns` has been passed. If so, override the defaults. */
        if (options && options.columns) {
            parameters.columns = options.columns;
            delete options.columns;
        }

        /** Validate that a Term has been provided. */
        if (!parameters.term) {
            var err = Helprs.err("No Search Term Provided", {
                statusCode: 1003,
                paramaters: parameters
            });
            return deferred.reject(err);
        }

        Product.search(parameters, options).then(function(response) {
            var resObject = null;
            if (_.isObject(response)) {
                resObject = _.clone(response);
                if (response.records)
                    response = response.records;
            }

            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    searchProductList: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        ProductList.search(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to search brands by their description.
     * Returns all brands with the term provided in their description.
     *
     * @param   {Object}  parameters  Parameter containing the term to search by.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     term: "provides the perfect look"
     * }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     *
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    searchBrandsByDescription: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        options.columns = ["description"];
        this.searchBrands(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to search brands by their name.
     * Returns all brands with the term provided in their name.
     *
     * @param   {Object}  parameters  Parameter containing the term to search by.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     term: "milanni"
     * }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     *
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    searchBrandsByName: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        options.columns = ["name"];
        this.searchBrands(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to search brands by their type.
     * Returns all brands with the term provided in their type.
     *
     * @param   {Object}  parameters  Parameter containing the term to search by.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     term: "wheel"
     * }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     *
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    searchBrandsByType: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        options.columns = ["type"];
        this.searchBrands(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to search products by their name.
     * Returns all products with the term provided in their name.
     *
     * @param   {Object}  parameters  Parameter containing the term to search by.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     term: "legend"
     * }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     *
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    searchProductsByName: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        options.columns = ["name"];
        this.searchProducts(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to search products by their type.
     * Returns all products with the term provided in their type.
     *
     * @param   {Object}  parameters  Parameter containing the term to search by.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     term: "wheel"
     * }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     *
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    searchProductsByType: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        options.columns = ["type"];
        this.searchProducts(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to search product list by their description.
     * Returns all product list with the term provided in their description.
     *
     * @param   {Object}  parameters  Parameter containing the term to search by.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     term: "wheel"
     * }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     *
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    searchProductListByDescription: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        options.columns = ["description"];
        this.searchProductList(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to search product list by their name.
     * Returns all product list with the term provided in their name.
     *
     * @param   {Object}  parameters  Parameter containing the term to search by.
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *     term: "milanni"
     * }
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     *
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    searchProductListByName: function(parameters, options) {
        var deferred = Q.defer();
        parameters = parameters || {};
        options = options || {};
        options.columns = ["name"];
        this.searchProductList(parameters, options).then(function(response) {
            deferred.resolve(response);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    /**
     * Used to send the Password Reset Email to the user.
     * It generates the hash for the login record in question and updates the login record.
     * @param   {String}  userEmail  Email Address where we will be sending the password reset email.
     * @param   {String}  resetUrl   The URL Link the user will need to click on to reset their password.
     * @return  {Object}             Depending on the state of the promise which will
     *                               result in an Error Object or an Object Representing
     *                               the updated Login Record.
     */
    sendPasswordResetEmail: function(userEmail, resetUrl){
        var deferred = Q.defer();
        var that = this;
        this.findUser({email: userEmail}).then(function(user) {
            var userId = user.id;
            /** @todo - add email template soon */
            var subject = "Vision Wheel Password Reset";
            /** @type {String} We hash the User ID to make it Unique */
            var hashed_reset_id = Helprs.guid();
            var body = "Click here to reset your password: " + resetUrl + "/" + hashed_reset_id;
            AWS.sendEmail(user.email, subject, body).then(function(emailDataResponse) {
                console.log('>>> VWModel: Email Sent Successfully.');
                /** Just before Resolving, we save the `hashed_reset_id` on the User's Login Record */
                that.saveLogin({id: user.login_id, hashed_reset_id: hashed_reset_id}).then(function(savedLogin) {
                    emailDataResponse.success = true;
                    console.log(emailDataResponse);
                    deferred.resolve(emailDataResponse);
                }).fail(function(err) {
                    console.log(colors.red("!!! VWModel ERROR: Problem While Saving the Hashed Reset ID on the User's Login Record."));
                    err.success = false;
                    console.log(err);
                    deferred.reject(err);
                }).done();
            }).fail(function(err) {
                console.log(colors.red("!!! VWModel ERROR: Problem While Sending Email."));
                err.success = false;
                console.log(err);
                deferred.reject(err);
            }).done();
        }).fail(function(err) {
            console.log(colors.red("!!! VWModel ERROR: No User Found with Provided Email."));
            err.success = false;
            console.log(err);
            deferred.reject(err);
        }).done();
        return deferred.promise;
    },
    sendContactEmail : function(contactMessage) {
        return AWS.sendEmail(contactMessage.email, contactMessage.subject, contactMessage.name+"\r\r\r\r"+contactMessage.email+"\r\r\r\r"+contactMessage.message);
    },
    sendOrderEmail: function(orderID, options, renderEmail) {
        return this.findSale({id: orderID})
        .then(order=>{
            return EmailController.sendOrderEmail(order, options, renderEmail);
        });
    },
    /**
     * Used to submit a Purchase Order. This will save a new `sale` on
     * the database. This will also save the sale's items in an additional
     * table (sale_item).
     * Here we also generate a `Web Order Number`.
     * So it is not necessary to pass in a `web_order_number` field.
     * Once the Web Order gets submitted to NAV, we will then save the ID generated with the record
     * as reference on our DB. This will allow is to do cross referencing when a PO Number becomes
     * available.
     *
     * @param   {Object}  parameters  Parameter object containing all sale data required to
     *                                create and submit a sale on the database.
     * @example <caption>Fields that aren't necessary from the front-end or need further clarification are:</caption>
     * {
     *    web_order_number: null,   // May not be known from the front-end
     *    po_number: null,          // Will not be available from the front-end
     *    status: "submitted",      // We can set this from the back-end.
     *                                    No need for the front-end to do this.
     *    // This can be set from the back-end. Payment info will only be available in the back end.
     *    payment: {
     *        paid: false,
     *        payment_method: "po",
     *        CCInfo: "((VISA) xxxxx-xxxxx-9591)",
     *        CCStatus: "",
     *        CCAuthCode: "",
     *        CCAuthDate: "",
     *        CCSettleDate: "",
     *        CCResponse: ""
     *    }
     * }
     *
     * @example <caption>Example Usage of the Parameters Object</caption>
     * {
     *    user_id: 123,
     *    dealer_id: 1234,
     *    salesrep_id: 853,
     *    tax_amount: 20.87,
     *    customer_id: "DISCOUNTTIRE",
     *    customer_info: {
     *        customer_name: "John Doe",
     *        company_name: "MIRUM SHOPPER",
     *        phone: 8185554545,
     *        email: john.doe@email.com
     *    },
     *    customer_billing_info: {
     *        customer_name: customer_name,
     *        company_name: "MIRUM SHOPPER",
     *        phone: 8185554545,
     *        email: john.doe@email.com,
     *        address_1: "123 Some St",
     *        address_2: "",
     *        city: "Los Angeles",
     *        state: "CA",
     *        zip: "91605",
     *        country: "us"
     *    },
     *    ship_to_info: {
     *        store_number: 10000,
     *        address_1: "123 Some Store St",
     *        address_2: "",
     *        city: "Culver City",
     *        state: "CA",
     *        zip: "91604",
     *        country: "us"
     *    },
     *    freight_total: 45.56,
     *    subtotal_amount: 678.90,
     *    total_discount_amount: 8.89,
     *    total_invoice_amount: 3000.00
     * }
     *
     * @param   {Object}  options     Additional Options that may be defined later in dev.
     *                                Currently one of the options is to confirm whether this method should use
     *                                fake data or not. If the `mockdata` property is set to true, we will get
     *                                all mock data, else use real data passed in.
     *                                If using `mockdata` but the `parameters` already contains half the data
     *                                only missing data will be merged into the `parameters` data.
     * @example <caption>Example Usage of the Options Object</caption>
     * {
     *    mockdata: false
     * }
     *
     * @return  {Object}              Initially, Returns a Deferred Promise Object
     */
    submitPurchaseOrder: function( parameters, options ) {
        var deferred = Q.defer();

        Exectimer.time("submitPurchaseOrder()");

        options = options || {};
        parameters = parameters || {};

        /**
         * If mockdata flag is true,
         * we get generated mock data and override the mocked data
         * with the passed in parameters, if any.
         */
        if( options.mockdata ) {
            parameters = _.extend(Mockdata.order(), parameters);
        }
        else {
            parameters.status = "submitted";
        }

        /** Add the `created` property as a time stamp. */
        parameters.created = parameters.updated = new Date();
        if( options.totals && options.totals.canPay ) {
            parameters.payment.payable = true;
        }
        parameters.nav_record = null;

        var that = this;
        /** @type {String} Generate a Web Order Number */
        Q.when(__generateWebOrderNumber(options), function(wons) {
            log(wons);
            parameters.web_order_number = wons["New Generated Web Order Number"];
            __createPO(parameters, options).then(function(webOrder) {
                log("Successfully Created PO (Sale & Sale Items) in Postgres");

                that.sendOrderEmail(webOrder.savedSale.id, {action:"initOrder"});
                options.savedWebOrder = webOrder;
                /**
                 * Now we clear the user's cart and
                 * We wan to get the salesrep's info for NAV PO Submission.
                 */
                __clearCartAndFindSalesrep(parameters, options).then(function(updatesResponse) {
                    options.savedWebOrder.salesrep = updatesResponse.salesrep;
                    options.shippingTotalsPerLocation = options.totals.shippingRates;
                    /** @type {Object|Array} Parse Locations and their items to satisfy NAV */
                    options.perLocationPurchaseOrders = __parseLocationHeaders(parameters, options);
                    /*
                     * Once, we have saved onto our DB and the user's cart has been cleared,
                     * we publish the PO to NAV. Once we get a successful response, we finally resolve.
                     */
                    log("Now Publishing PO to NAV");
                    MSSQL.publishPurchaseOrder(parameters, options).then(function(publishedPO) {
                        /**
                         * Now that we have submitted to NAV we will now take the extra step
                         * to save the inserted NAV records into our DB.
                         */
                        __saveNavRecords(publishedPO, options.savedWebOrder).then(function(savedRecords) {
                            log("Successfully Updated Sale and Sale Items NAV Records.");
                            log(Exectimer.timeEnd("submitPurchaseOrder()"));
                            deferred.resolve(savedRecords);
                        }).catch(function(err) {
                            var errMsg = "Failed to Update Sale and/or Sale Items NAV Records";
                            log(colors.red(errMsg) + ": %O", err);
                            logger.error(errMsg);
                            logger.error(err);
                            log(Exectimer.timeEnd("submitPurchaseOrder()"));
                            deferred.reject(err);
                        });
                    }).fail(function(err) {
                        log("Failed to Publish PO to NAV");
                        log(err);
                        deferred.reject(err);
                    }).done();
                }).fail(function(err) {
                    log("Failed to Publish PO to NAV");
                    log(err);
                    deferred.reject(err);
                }).done();
            }).fail(function(err) {
                log(err);
                deferred.reject(err);
            }).done();
        }, function(err) {
            log(err);
            deferred.reject(err);
        });

        return deferred.promise;
    },
    submitStripePayment: function(parameters, options) {
        var deferred = Q.defer();

        Exectimer.time("submitStripePayment()");

        options = options || {};
        parameters = parameters || {};

        if (!parameters.description)
            parameters.description = "Vision Wheel Dealer Web Order Purchase.";

        /** Build up the options for metadata on stripe charge */
        if (parameters.customer_billing_info) {
            var customerBillingInfo = parameters.customer_billing_info;
            for (var billingKey in customerBillingInfo) {
                if (customerBillingInfo.hasOwnProperty(billingKey))
                    options["billing_" + billingKey] = customerBillingInfo[billingKey];
            }
        }

        if (__decimalPlaces(parameters.amount) > 1)
            parameters.amount = parseInt(parameters.amount);

        log("Stripe Payment Submission Parameters");
        log(parameters);
        log("Stripe Payment Submission Options");
        log(options);

        Stripe.submitPayment(parameters, options).then(function(publishedPO) {
            log(Exectimer.timeEnd("submitStripePayment()"));
            deferred.resolve(publishedPO);
        }).fail(function(err) {
            log(Exectimer.timeEnd("submitStripePayment()"));
            deferred.reject(err);
        }).done();

        return deferred.promise;
    },
    createProduct: function(productUpdateObj) {
        return Product.save(productUpdateObj);
    },
    updateDealer: function(parameters) {
        return Dealer.update(parameters);
    },
    updateLogin: function(parameters) {
        return Login.update(parameters);
    },
    updateProduct: function(productUpdateObj) {
        if (!productUpdateObj.id){
            throw Error("Cannot update product without ID param");
        }
        return Product.save(productUpdateObj);
    },
    updateUser: function(parameters) {
        if (parameters.id === undefined)
            throw new Error("Missing User Id");
        return User.update(parameters);
    },
    updateUserProfile: function(userId, profileUpdateData) {
        // Not used for the time being till we sort out how to handle multi user
        // company_name_1 : profileUpdateData.company_name_1,
        // company_name_2 : profileUpdateData.company_name_2,
        var updateData ={
            id : userId,
            address_1 : profileUpdateData.address_1,
            address_2 : profileUpdateData.address_2,
            city : profileUpdateData.city,
            state : profileUpdateData.state,
            zip : profileUpdateData.zip,
            phone_number : profileUpdateData.phone_number,
            email : profileUpdateData.email
        }
        return User.update(updateData);
    },
    updateUserSalesRep: function(userId, newSalesRepId) {
        return User.update({id:userId, sales_rep:newSalesRepId});
    },
    updateSale: function(parameters) {
        return Sale.update(parameters);
    },
    updateSaleItem: function(parameters) {
        return SaleItem.update(parameters);
    },
    validateAndResetPasswordByLoginId: function(loginId, current, newPassword) {
        var deferred = Q.defer();

        Exectimer.time("validateAndResetPasswordByLoginId()")

        var that = this;
        this.findLogin({id:loginId}).then(function(login) {
            if (!Crypt.compareSync(current, login.password_hash)) {
                var err = Helprs.err('Invalid Login: Incorrect Password', {
                    statusCode: 401,
                    args: {
                        loginId: loginId,
                        current: current,
                        newPassword: newPassword
                    }
                });
                log(err);
                log(Exectimer.timeEnd("validateAndResetPasswordByLoginId()"));
                return deferred.reject(err);
            }

            var hashedPassword = Crypt.hashSync(newPassword);
            that.updateLogin({id: loginId, password_hash: hashedPassword}).then(function(updatedLogin) {
                log(updatedLogin);
                log(Exectimer.timeEnd("validateAndResetPasswordByLoginId()"));
                deferred.resolve(updatedLogin);
            }).fail(function(err) {
                log("Issue updating login: %O", err);
                log(Exectimer.timeEnd("validateAndResetPasswordByLoginId()"));
                deferred.reject(err);
            }).done();
        }).fail(function(err) {
            log("Issue finding login: %O", err);
            log(Exectimer.timeEnd("validateAndResetPasswordByLoginId()"));
            deferred.reject(err);
        }).done();

        return deferred.promise;
    }
};

/** @module VWModel */
module.exports = VWModelObject;

/**
 * @private
 * This method is being used privately by `submitPurchaseOrder`.
 * By the time this method resolves the following steps have successfully executed:
 *     1.)  A new sale has been created on postgres.
 *     2.)  All sale items pertaining to the new created sale have been saved
 *             and created on the `sale_item` table in postgres.
 * @param   {Object}  parameters  Sale information to be saved.
 * @param   {Object}  saleItems   Sale items to be saved for this sale in question.
 * @return  {Array}              An array of all resolved promises.
 */
function __createPO(parameters, options) {
    var deferred = Q.defer();

    log("PO Submission Parameters: %O", parameters);
    log("PO Submission Options: %O", options);

    VWModelObject.saveSale(parameters).then(function(savedSale) {
        log("Created Postgres Sale Record: %O", savedSale);

        var warehouses = options.warehouses;
        var totals = options.totals;
        var saleItems = {};
        var states = _.allKeys(warehouses);
        var lineItemCount = 0;

        for (var r = 0; r < states.length; r++) {
            var state = states[r];
            var info = warehouses[state];
            var items = info.items;

            /**
             * Retrieves the Tax Rates from the shippingRates.
             * @example
             * {"from":"AL","to":"91367","items":[{"type":"wheel","size":20,"qty":2}],"totalCost":84,"taxrate":9,"taxtotal":7.56}
             * @type  {Object}
             */
            var rates = null;
            if (_.has(totals, 'shippingRates')) {
                for (var c = 0; c < totals.shippingRates.length; c++) {
                    rates = totals.shippingRates[c];
                    if (rates.from === state)
                        break;
                }
            }

            for (var t = 0; t < items.length; t++) {
                var item = items[t];
                var itemId = (item.item) ? item.item.id : item.id;

                lineItemCount++;
                item.lineItem = lineItemCount;
                item = __parseWarehouseSaleItem(item, state, info, rates);

                if (!_.has(saleItems, itemId))
                    saleItems[itemId] = [];

                saleItems[itemId].push(item);
            }
        }

        log("Parsed Sale Items to save in Postgres: %O", saleItems);

        var webOrder = {
            savedSale: savedSale,
            saleItems: saleItems
        };

        __parseSaleItemsSave(savedSale, saleItems).then(function(response) {
            webOrder.savedSaleItems = response;
            deferred.resolve(webOrder);
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
    }).fail(function(err) {
        deferred.reject(err);
    }).done();

    return deferred.promise;
}
/** @private */
function __parseLocationHeaders(parameters, options) {
    var locations = [];
    var warehouses = options.warehouses;
    var savedSale = options.savedWebOrder.savedSale;
    var savedSaleItems = options.savedWebOrder.savedSaleItems;
    var shippingTotalsPerLocation = options.shippingTotalsPerLocation;

    var created = savedSale.created;
    var customer_info = savedSale.customer_info;
    var customer_billing_info = savedSale.customer_billing_info;
    var ship_to_info = savedSale.ship_to_info;
    var payment = savedSale.payment;
    var web_order_number = savedSale.web_order_number;
    var web_master_order_number = web_order_number.replace(/-/g, "").trim();
    var line_num_counter = 0;

    var toDecimalRegex = /[^0-9\.]+/g;
    var posubmissiontracker = {
        headers: 0,
        lineitems: 0
    };
    var CCDetails = {
        ccStatus: null,
        ccAuthCode: null,
        ccAuthDate: null
    };

    if (ship_to_info.country === "United States" || ship_to_info.country === "USA")
        ship_to_info.country = "US";
    else if (ship_to_info.country === "Canada")
        ship_to_info.country = "CAN";

    /**
     * Correct UTC Created Time from Postgres
     * http://stackoverflow.com/questions/10797720/postgresql-how-to-render-date-in-different-time-zone
     * var cstCreated = Moment(created).utcOffset("-06:00:00");
     */
    // var userOffset = created.getTimezoneOffset() * 60 * 1000; // offset time
    // var centralOffset = 6 * 60 * 60 * 1000; // 6 for central time
    // created = new Date(created.getTime() - centralOffset); // redefine variable

    // var orderDate = created.getDate() + "-" + (created.getMonth() + 1) + "-" + created.getFullYear()
    // log("Created Date in CST: Date: %s, Time: %s", orderDate, );
    created = __calcTime(created);
    log("Datetime in CST: %s", created.toLocaleString())

    /** Check if the PO was payable and a Stripe Transaction took place */
    if (payment.payment_method === "CREDIT CAR") {
        /** ONLY log this during 'development' environment */
        log("Verified Stripe CC Transaction");
        /** If so, add all CC Information to submit to NAV */
        CCDetails.ccStatus = payment.CCStatus;
        CCDetails.ccAuthCode = payment.CCAuthCode;
        /** @type {Number|Timestamp} Convert the CCAuthDate from timestamp to formatted */
        CCDetails.ccAuthDate = Moment(payment.CCAuthDate * 1000).format("DD-MM-YYYY");
        log("These CC details will be added to the Headers: %o", CCDetails);
    }

    for (var state in warehouses) {
        if (warehouses.hasOwnProperty(state)) {
            var warehouse = warehouses[state];
            var whDetails = warehouse.details;
            var whItems = warehouse.items;
            var whLocationCode = whDetails.locationCode;

            var shippingtotal;
            if (shippingTotalsPerLocation) {
                shippingtotal = shippingTotalsPerLocation.filter(function(wh) {
                    return wh.from === state;
                })[0].totalCost;
            }

            shippingtotal = shippingtotal ? shippingtotal : 0;
            log("Shipping Total for %s is %d", state, shippingtotal);

            var locationPO = {
                header: null,
                lines: []
            };

            var shipping_agent = "ups";
            var shipping_method = warehouse.method;
            var eship_agent_service_code = "ground";
            if (!_.isEmpty(warehouse.option)) {
                if (warehouse.option === "2 day")
                    warehouse.option = "2nd day";
                eship_agent_service_code = warehouse.option;
                if (info.option === "2nd day" || "overnight")
                    shipping_method = "expedited";
            }
            if (shipping_method === "ltl")
                shipping_agent = "ltl";
            else if (shipping_method === "pickup") {
                eship_agent_service_code = shipping_agent = "cpu";
                shipping_method = "pickup cpu";
            }

            var location = {
                docNum: web_order_number + "-" + whDetails.locationCode,
                docType: 0,
                orderDate: created.getDate() + "-" + (created.getMonth() + 1) + "-" + created.getFullYear(),
                externalDocNum: parameters.po_number,
                locationCode: whLocationCode,
                customerNum: parameters.customer_id.toString(),
                shipToName: customer_billing_info.customer_name,
                shipToAddress: ship_to_info.address_1,
                shipToAddress2: ship_to_info.address_2,
                shipToPostCode: ship_to_info.zip,
                shipToCity: ship_to_info.city,
                shipToCounty: ship_to_info.state,
                shipToCountryCode: ship_to_info.country,
                addShipToCodeToNAV: 0,
                shippingAgent: shipping_agent,
                shipmentMethod: shipping_method,
                eShipAgentService: eship_agent_service_code,
                paymentMethod: payment.payment_method,
                freightTotal: Number(shippingtotal),
                totalDiscountAmount: Number((savedSale.total_discount_amount || 0).replace(toDecimalRegex, "")),
                taxAmount: Number(savedSale.tax_amount.replace(toDecimalRegex,"")),
                totalInvoiceAmount: Number(savedSale.total_invoice_amount.replace(toDecimalRegex, "")),
                websiteUserEmailAddress: customer_info.email,
                customerPhone: customer_info.phone,
                storeNo: parameters.ship_to_info.store_number,
                webmasterOrderNum: web_master_order_number
            };

            /** Extend with the CC Details */
            if (location.paymentMethod === "CREDIT CAR")
                location = _.extend(location, CCDetails);

            locationPO.header = location;
            posubmissiontracker.headers++;

            for (var z = 0; z < whItems.length; z++) {
                var whItem = whItems[z];
                var savedSaleItem = null;

                for (var q = 0; q < savedSaleItems.length; q++) {
                    savedSaleItem = savedSaleItems[q];
                    if (savedSaleItem.applied)
                        continue;

                    if (savedSaleItem.item_no === whItem.item.part_number) {
                        savedSaleItem.applied = true;
                        break;
                    }
                }
                line_num_counter++;

                var line_item = {
                    docNum: location.docNum,
                    docType: 0,
                    lineNum: line_num_counter,
                    itemNum: savedSaleItem.item_no,
                    qty: savedSaleItem.qty,
                    unitPrice: Number(savedSaleItem.unit_price.replace(/[^0-9\.]+/g, "")),
                    taxAmount: Number(savedSaleItem.tax_amount.replace(/[^0-9\.]+/g, "")),
                    totalLineAmount: Number(savedSaleItem.total_line_amount.replace(/[^0-9\.]+/g, "")),
                    eCommLineType: 0
                };

                locationPO.lines.push(line_item);
                posubmissiontracker.lineitems++;
            }

            locations.push(locationPO);
        }
    }

    log("Total PO Submission Count: %o", posubmissiontracker);

    return locations;
}
/** @private */
function __findSaleItems(sale) {
    var deferred = Q.defer();

    sale.sale_items = {};
    /** Find `sale_items` associated with this Sale's ID. */
    VWModelObject.findSaleItems({sale_id: sale.id}).then(function(saleItems) {
        /**
         * If we found `sale_items` with the associated `sale.id`, we
         * append them to the `sale.sale_items` object as hashes. Else
         * we just keep it as an empty object indicating no Items.
         *
         * However, empty items should never happen. That means there is a
         * bug somewhere. A sale can not occur without items.
         */
        if (saleItems.length) {
            for (var f = 0; f < saleItems.length; f++) {
                var saleItem = saleItems[f];
                var saleItemId = saleItem.id;
                delete saleItem.id;
                sale.sale_items[saleItemId] = _.extend({}, saleItem);
            }
            deferred.resolve(sale);
        } else {
            deferred.resolve(sale);
        }
    }).fail(function(err) {
        deferred.reject(err);
    }).done();

    return deferred.promise;
}
/** @private */
function __validateCredentials(parameters) {
    var deferred = Q.defer();

    var validation = {
        success: true,
        message: null
    };

    var credentials = _.pick(parameters, "customer_number", "email", "password", "confirm_password");

    if (!credentials.email) {
        validation.title = "No Email Passed In";
        validation.message = "No Email Address was Provided.";
        validation.success = false;
    }

    if (validation.success && !__validateEmail(credentials.email)) {
        validation.title = "Email Is Not Valid";
        validation.message = "Email Address must be Valid.";
        validation.success = false;
    }

    if (!validation.success)
        deferred.reject(validation);
    else {
        /** Now we confirm with the email already exist in our DB. */
        VWModelObject.countUsers({email: credentials.email}).then(function(response) {
            validation.title = "This Email Already exists in our Database.";
            validation.message = "Email is already active with an account.";
            validation.success = false;
            deferred.reject(validation);
        }).fail(function(err) {
            if (validation.success && !credentials.password) {
                validation.title = "No Password Passed In";
                if (validation.message)
                    validation.message += "\nNo Password was Provided.";
                else
                    validation.message = "No Password was Provided.";
                validation.success = false;
            }

            if (validation.success && !credentials.confirm_password) {
                validation.title = "No Password Confirmation Passed In";
                if (validation.message)
                    validation.message += "\nPassword Was Not Confirmed.";
                else
                    validation.message = "Password Was Not Confirmed.";
                validation.success = false;
            }

            if (validation.success && (credentials.password && credentials.confirm_password)) {
                if (credentials.password !== credentials.confirm_password) {
                    validation.title = "Invalid Password Confirmation";
                    validation.message = "Passwords Do Not Match.";
                    validation.success = false;
                }
            }

            if (validation.success)
                deferred.resolve(validation);
            else
                deferred.reject(validation);
        }).done();
    }

    return deferred.promise;
}
/** @private */
function __dealerSignup(parameters, options) {
    var deferred = Q.defer();
    /** Validate Credentials */
    __validateCredentials(parameters).then(function(validation) {
        __handleDealerSignup(parameters).then(function(dealer) {
            /** When dealers signup, account is created immediately with a “pending” status. */
            var userAccount = _.pick(parameters, "first_name", "last_name", "phone_number", "email", "address_1");
            userAccount.status = "pending";
            userAccount.role = "owner";
            userAccount.cart = {
                items: {}
            };
            if (parameters.address_2)
                userAccount.address_2 = parameters.address_2.toString().trim();
            if (parameters.city)
                userAccount.city = parameters.city.toString().trim();
            if (parameters.state)
                userAccount.state = parameters.state.toString().trim();
            if (parameters.postal)
                userAccount.zip = parameters.postal.toString().trim();
            if (parameters.country)
                userAccount.country = parameters.country.toString().trim();
            if (parameters.comments)
                userAccount.comments = parameters.comments.toString().trim();

            /** First, we create the login record */
            __handleSaveLogin(parameters).then(function(login) {
                userAccount.dealer_id = dealer.id;
                userAccount.login_id = login.id;
                /** Now we create the user record */
                __handleSaveUser(userAccount).then(function(user) {
                    /** Just before we finish, we have to make sure the login record has a user id reference. */
                    login.user_id = user.id;
                    VWModelObject.saveLogin(login).then(function(updatedLogin) {
                        deferred.resolve(user);
                    }).fail(function(err) {
                        deferred.reject(err);
                    }).done();
                }).fail(function(err) {
                    if (err.code === "23505" && err.message.indexOf("duplicate key value violates unique constraint") > -1) {
                        switch (err.constraint) {
                            case "user_email_key":
                                err.message = "This Email Already exists in our Database.";
                                err.hint = "The user either already signed up once with this Email or forgot their password.";
                                if (err.detail) {
                                    var splitDetail = err.detail.split("=");
                                    splitDetail[0] = splitDetail[0].replace("Key ", "");
                                    err.detail = splitDetail[0].replace(/(\(|\))/g, "") + " ";
                                    err.detail += splitDetail[1].replace(/(\(|\))/g, "");
                                }
                                if (!err.detail && userAccount.email) {
                                    err.detail = "email " + userAccount.email + " already exists.";
                                }
                                break;
                        }
                    }
                    /** Since the Sign up is failing, we need to remove the created login record. */
                    VWModelObject.deleteLogin({id: userAccount.login_id}).then(function(response) {
                        log("Successfully Deleted Login Record due to Failed Dealer Signup.");
                        deferred.reject(err);
                    }).fail(function(errChild) {
                        if (!errChild.message)
                            err.message += "\nIn addition, we were unable to delete the created login record for this user.";
                        else
                            err.message += "\n" + errChild.message;
                        deferred.reject(err);
                    }).done();
                }).done();
            }).fail(function(err) {
                deferred.reject(err);
            }).done();
        }).fail(function(err) {
            deferred.reject(err);
        }).done();
    }).fail(function(err) {
        log("Signup Credentials are No Good!");
        deferred.reject(err);
    }).done();
    return deferred.promise;
}
/** @private */
function __handleDealerSignup(parameters) {
    var deferred = Q.defer();

    if (parameters.customer_number) {
        /** Dealer ID was Provided */
        /** @type {String} Now we confirm if input is a dealer's account or customer number. */
        var customerNumber = parameters.customer_number.toString().trim();
        var dealerParamQry = {
            or: [{
                nav_customer_id: customerNumber
            }, {
                account_number: customerNumber
            }]
        };

        log("Checking if Dealer ID exist in DB");

        VWModelObject.findDealer(dealerParamQry).then(function(dealer) {
            if (!_.isEmpty(parameters.website) && !dealer.profile.website) {
                log("Dealer Already in DB. Updating Dealer with Supplied Website URL.");
                dealer.profile.website = parameters.website;
                VWModelObject.saveDealer({id: dealer.id, profile: dealer.profile}).then(function(updatedDealer) {
                    log("Successfully Updated the Dealer Website URL");
                    deferred.resolve(updatedDealer);
                }).fail(function(err) {
                    log("Failed to Save the Dealer");
                    deferred.reject(err);
                }).done();
            } else {
                log("Dealer Already in DB. Resolving existing Dealer.");
                deferred.resolve(dealer);
            }
        }).fail(function(err) {
            var errMsg = err.message || "Record Not Found (" + customerNumber + ")";
            err.hint = "The Account Number provided does not belong to any of our dealers.";
            deferred.reject(Helprs.err(errMsg, err));
        }).done();
    } else {
        /** Dealer ID was NOT Provided */
        deferred.resolve({
            id: null,
            message: "No Dealer ID was Provided"
        });
    }

    return deferred.promise;
}
/** @private */
function __handleSaveLogin(parameters) {
    var deferred = Q.defer();

    var loginAccount = _.pick(parameters, "password");
    if (loginAccount.password) {
        loginAccount.password_hash = loginAccount.password;
        delete loginAccount.password;
    }
    loginAccount.password_hash = Crypt.hashSync(loginAccount.password_hash);

    log("Checking if Login Already in DB");

    VWModelObject.findLogin(loginAccount).then(function(login) {
        log(colors.yellow("Login Already in DB. Resolving existing Login."));
        deferred.resolve(login);
    }).fail(function(err) {
        if (err.errorCode && err.errorCode === 1000) {
            log("Login doesnt exist. Creating the Login Record.");
            loginAccount.created = Moment().format("YYYY-MM-DD");
            VWModelObject.saveLogin(loginAccount).then(function(login) {
                log(colors.yellow("Successfully Created and Saved the Login"));
                deferred.resolve(login);
            }).fail(function(err) {
                log("Failed to Create and Save the Login");
                deferred.reject(err);
            }).done();
        } else {
            log("Unable to Find Login Record.");
            deferred.reject(err);
        }
    }).done();

    return deferred.promise;
}
/** @private */
function __handleSaveUser(parameters) {
    var deferred = Q.defer();

    log("Checking if User Already in DB");

    VWModelObject.findUser(parameters).then(function(user) {
        log(colors.yellow("User Already in DB. Resolving existing User."));
        deferred.resolve(user);
    }).fail(function(err) {
        if (err.errorCode && err.errorCode === 1000) {
            log("User doesnt exist. Creating the User Record.");
            VWModelObject.saveUser(parameters).then(function(user) {
                log(colors.yellow("Successfully Created and Saved the User"));
                deferred.resolve(user);
            }).fail(function(err) {
                log("Failed to Create and Save the User");
                deferred.reject(err);
            }).done();
        } else {
            log("There was an ERROR while trying to find the User.");
            deferred.reject(err);
        }
    }).done();

    return deferred.promise;
}
/**
 * @private
 * Parses the info to create a `sale_item` with the required postgres
 * schema.
 * @param   {[type]}  item          [description]
 * @param   {[type]}  state         [description]
 * @param   {[type]}  stateDetails  [description]
 * @return  {[type]}                [description]
 */
function __parseWarehouseSaleItem(item, state, info, rates) {
    var stateDetails = info.details;
    var qty = item.quantity;
    var lineItem = item.lineItem;
    if (item.item)
        item = item.item;

    var unit_price = item.price.dealer || item.price.retail;
    var total_line_amount = parseFloat(unit_price) * qty;
    total_line_amount = __parseDecimalPricing(total_line_amount);

    var taxRate = rates ? rates.taxrate : 0;
    var taxAmount = (taxRate / 100) * unit_price;
    taxAmount = __parseDecimalPricing(taxAmount);

    var shipping_agent = "UPS";
    var shipping_method = info.method;
    var eship_agent_service_code = "GROUND";

    if (!_.isEmpty(info.option)) {
        if (info.option === "2 day")
            info.option = "2nd day";
        eship_agent_service_code = info.option;
        if (info.option === "2nd day" || "overnight")
            shipping_method = "expedited";
    }

    if (shipping_method === "ltl")
        shipping_agent = "ltl";
    else if (shipping_method === "pickup") {
        eship_agent_service_code = shipping_agent = "cpu";
        shipping_method = "pickup cpu";
    }

    var item_description = {
        product_name: item.specification.model,
        size: item.specification.size,
        finish: item.specification.finish,
        line_item_number: lineItem
    };
    /** @type {String} Set the Item's Image. This shouldbe only one image. */
    if (item.image && item.image.list)
        item_description.image = item.image.list[0];

    var fulfilment_location = {
        code: state,
        name: stateDetails.name,
        address: stateDetails.address,
        city: stateDetails.city,
        state: stateDetails.state,
        postal: stateDetails.postal
    };

    var shipping_options = {
        shipped: false,
        delivery_type: "commercial",
        shipping_agent: "",
        shipping_method: shipping_method,
        eship_agent_service_code: eship_agent_service_code
    };

    var sale_item = {};
    sale_item.customer_item_no = "";
    sale_item.tax_amount = taxAmount;
    sale_item.item_no = item.part_number;
    sale_item.qty = qty;
    sale_item.unit_price = unit_price;
    sale_item.total_line_amount = total_line_amount;
    sale_item.item_description = item_description;
    sale_item.fulfilment_location = fulfilment_location;
    sale_item.shipping_options = shipping_options;

    return sale_item;
}
/** @private */
function __parseSaleItemsSave(savedSale, saleItems) {
    var deferred = Q.defer();
    var promises = [];

    /** Now we iterate throughout each Item in the sale and save it onto the Database */
    for (var itemId in saleItems) {
        if (saleItems.hasOwnProperty(itemId)) {
            var saleItemArr = saleItems[itemId];

            for (var y = 0; y < saleItemArr.length; y++) {
                var newSaleItem = saleItemArr[y];
                /** On each sale item, we associate the saved sale id and the item id. */
                newSaleItem.sale_id = savedSale.id;
                newSaleItem.item_id = parseInt(itemId);

                var promise = VWModelObject.saveSaleItem(newSaleItem);
                promises.push(promise);
            }
        }
    }

    Q.allSettled(promises).then(function(results) {
        var isError = false,
            errorResult, resolvedValues = [];
        results.forEach(function(result) {
            if (result.state !== 'fulfilled') {
                isError = true;
                errorResult = result;
            } else {
                resolvedValues.push(result.value);
            }
        });
        if (isError) {
            log(errorResult.reason);
            errorResult.message = errorResult.reason;
            deferred.reject(errorResult);
        } else {
            deferred.resolve(resolvedValues);
        }
    }).done();

    return deferred.promise;
}
/** @private */
function __validateSalesrepCode(parameters) {
    console.log(colors.yellow(">>> VWModel: Validating the Dealer Selected Salesrep."));
    var deferred = Q.defer();
    var salesrepParameters = {};

    parameters.salesrep = parameters.salesrep || 0;
    if (typeof parameters.salesrep === "string")
        parameters.salesrep = parseInt(parameters.salesrep);
    if (isNaN(parameters.salesrep) || parameters.salesrep === 0) {
        if (parameters.salesrep_firstname)
            salesrepParameters.name = parameters.salesrep_firstname.toUpperCase();
        if (parameters.salesrep_lastname) {
            if (salesrepParameters.name)
                salesrepParameters.name += " " + parameters.salesrep_lastname.toUpperCase();
            else
                salesrepParameters.name = parameters.salesrep_lastname.toUpperCase();
        }
        if (salesrepParameters.name)
            salesrepParameters.name = salesrepParameters.name.trim();
    } else {
        salesrepParameters.code = parameters.salesrep;
    }

    VWModelObject.findSalesrep(salesrepParameters).then(function(salesrep) {
        console.log(colors.yellow(">>> VWModel: Salesrep was found for Dealer."));
        deferred.resolve(salesrep);
    }).fail(function(err) {
        if (err.errorCode && err.errorCode === 1000) {
            console.log(colors.yellow(">>> VWModel: Unable to Match Dealers Salesrep."));
            deferred.resolve(null);
        } else {
            deferred.reject(err);
        }
    }).done();

    return deferred.promise;
}
/** @private */
function __clearCartAndFindSalesrep(parameters, options) {
    var promises = [
        VWModelObject.clearCart({id: parameters.user_id}),
        VWModelObject.findSalesrep({id: options.savedWebOrder.savedSale.salesrep_id})
    ];
    return Q.spread(promises, function(updatedUser, salesrep) {
        var results = {
            updatedUser: updatedUser,
            salesrep: salesrep
        };
        return results;
    });
}
/** @private */
function __saveNavRecords(publishedPO, savedWebOrder) {
    log("Published PO Headers");
    log(publishedPO.header);
    log("Published PO Lines");
    log(publishedPO.lines);

    var savedSale = savedWebOrder.savedSale;
    var savedSaleItems = savedWebOrder.savedSaleItems;

    var updatedSaleItems = savedSaleItems.map(function(savedSaleItem) {
        var matchingItems = publishedPO.lines.filter(function(lineItem) {
            return lineItem["Item No_"] === savedSaleItem.item_no;
        });

        for (var d = 0; d < matchingItems.length; d++) {
            var matchingItem = matchingItems[d];
            if (matchingItem.Quantity !== savedSaleItem.qty)
                continue;

            var tax_amount = savedSaleItem.tax_amount.replace(/\$/g, '');
            tax_amount = parseFloat(tax_amount);
            if (matchingItem['Tax Amount'] !== tax_amount)
                continue;

            var unit_price = savedSaleItem.unit_price.replace(/\$/g, '');
            unit_price = parseFloat(unit_price);
            if (matchingItem['Unit Price'] !== unit_price)
                continue;

            var total_line_amount = savedSaleItem.total_line_amount.replace(/\$/g, '');
            total_line_amount = parseFloat(total_line_amount);
            if (matchingItem['Total Line Amount'] !== total_line_amount)
                continue;

            savedSaleItem.nav_record = matchingItem;
            break;
        }

        if (savedSaleItem.applied)
            delete savedSaleItem.applied;

        return VWModelObject.updateSaleItem(savedSaleItem);
    });

    savedSale.nav_record = {
        headers: publishedPO.header
    };

    var promises = _.union([VWModelObject.updateSale(savedSale)], updatedSaleItems);

    return Q.allSettled(promises);
}
/** @private */
function __globalSearch(parameters) {
    return Q.spread([VWModelObject.searchBrands(parameters), VWModelObject.searchProducts(parameters)], function(brandResults, productResults) {
        var results = {
            brands: brandResults,
            products: productResults
        };
        return results;
    });
}
/** @private */
function __generateWebOrderNumber(options) {
    var deferred = Q.defer();

    var envCode = "01";
    if (!options.environment)
        options.environment = process.env.NODE_ENV;

    if (options.environment === "qa")
        envCode = "02";
    else if (options.environment === "development")
        envCode = "03";

    var wons = {
        "Latest Generated Web Order Number": null,
        "New Generated Web Order Number": null
    };

    VWModelObject.getLastWebOrderNumber({envCode: envCode}).then(function(lastWebOrderNumber) {
        wons["Latest Generated Web Order Number"] = lastWebOrderNumber;
        var splitLWON = lastWebOrderNumber.split("-");
        /** Now put it back together and resolve. */
        var WebOrderNumber = null;
        var isEnvBasedWON = false;
        splitLWON.forEach(function(roundset, index) {
            if (index === 0) {
                if (roundset === '01' || roundset === '02' || roundset === '03')
                    isEnvBasedWON = true;
                WebOrderNumber = roundset;
            } else if ((index + 1) === splitLWON.length) {
                // If last, increment the value
                roundset = parseInt(roundset);
                roundset++;
                roundset = roundset.toString();
                WebOrderNumber += "-" + roundset;
            } else
                WebOrderNumber += "-" + roundset;
        });
        if (!isEnvBasedWON)
            WebOrderNumber = envCode + "-" + WebOrderNumber;
        wons["New Generated Web Order Number"] = WebOrderNumber;
        deferred.resolve(wons);
    }).fail(function(err) {
        log("Error getting 'lastWebOrderNumber'.");
        log(err);
        wons["New Generated Web Order Number"] = envCode + "-" + Helprs.webOrderNumber();
        deferred.resolve(wons);
    }).done();
    return deferred.promise;
}
/**
 * @private
 * Private method that converts your decimal to a currency standard value.
 * @param   {Number|Decimal}  pricing   The value to be formatted to 'US' Currency.
 * @return  {String}                    The US Currency Standard formatted value
 */
function __parseDecimalPricing(pricing) {
    if (typeof pricing !== 'string')
        pricing = pricing.toString();
    return parseFloat(Math.round(pricing * 100) / 100).toFixed(2);
}
function __decimalPlaces(num) {
    var numStr = num;

    if (typeof numStr !== "string")
        numStr = numStr.toString();

    if (numStr.indexOf(".") < 0)
        return 0;

    var pieces = numStr.split(".");
    return pieces[1].length;
}
function __validateEmail(email) {
    if (email.length == 0)
        return false;
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}
/** @private */
function __startDebugTimer(note) {
    start = process.hrtime();
    return note;
}
/** @private */
function __endDebugTimer(note) {
    var precision = 3; // 3 decimal places
    var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
    start = process.hrtime(); // reset the timer
    note = "'VWModel." + note + "()'";
    return "Method Execution Time: " + note + " " + process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms";
}
/**
 * function to calculate local time in a different city
 * given the city's UTC offset
 * @param   {[type]}  city    [description]
 * @param   {[type]}  offset  [description]
 * @return  {[type]}          [description]
 */
function __calcTime(dateObj) {
    var offset = "-06";
    // create Date object for current location
    var d = dateObj || new Date();

    // convert to msec
    // add local time zone offset
    // get UTC time in msec
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);

    // create new Date object for different city
    // using supplied offset
    return new Date(utc + (3600000 * offset));
}
