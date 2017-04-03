require("clarify");

var _ = require("underscore"),
    colors = require('colors'),
    Helprs = require("helprs"),
    debug = require("libs/buglog"),
    Exectimer = require("libs/helpers/exectimer"),
    dbStructure = require('libs/mssql/structure'),
    log = debug("libs", "mssql:querybuilder"),
    logMessage = {};

var QBObj = {
    addLogColumnRequirements: function(columnName, requirements) {
        var requirementsString = "";

        if (_.isString(requirements))
            requirementsString = requirements;
        else if (_.isArray(requirements)) {
            var numOfReqs = requirements.length;

            requirements.forEach(function(str, i) {
                if (i === 0)
                    requirementsString = str;
                else if ((i + 1) === numOfReqs)
                    requirementsString += "and " + str;
                else
                    requirementsString += ", " + str;
            });
        }

        columnName = columnName.replace(/(\[|\])/g, "").trim();

        if (!_.has(logMessage, 'QueryRequirements'))
            logMessage.QueryRequirements = {};

        if (!_.has(logMessage.QueryRequirements, columnName))
            logMessage.QueryRequirements[columnName] = [];

        logMessage.QueryRequirements[columnName].push({
            RequirementValues: requirementsString,
            RequirementDescription: "Must Equal to the following values"
        });
    },
    create: function(options) {
        Exectimer.time("create()");
    	var qry = "";
        options = options || {};

        if (options.type) {
            switch(options.type) {
                case "items":
                    qry = __buildItemQuery();
                    break;
                case "inventory":
                    qry = __buildInventoryQuery();
                    break;
                case "pricing":
                    qry = __buildPricingQuery(options);
                    break;
                case "publishpo":
                    qry = __buildPublishPOQuery(options);
                    break;
                case "crossreference":
                    qry = __buildCrossReferenceQuery(options);
                    break;
                case "infoschema":
                    qry = __buildInfoSchemaQuery(options);
                    break;
                case "search":
                    qry = __buildSearchQuery(options);
                    break;
            }
        }

        // logMessage.DatabaseName = dbStructure.dbName();
        // logMessage.SchemaName = dbStructure.schemaName();
        // logMessage.QueryBuilt = qry;
        // logMessage.ExecutionTime = new Date().toLocaleString();
        // log(logMessage);

        log("Query Built: %s", colors.green(qry));
        logMessage = {};
        log(Exectimer.timeEnd("create()"));

        return qry;
    }
};

module.exports = QBObj;

function __buildItemQuery() {
    var qry = "SELECT";

    qry += " * FROM " + __sqlNC(dbStructure.dbName(), {
        spacing: false
    });

    qry += "." + __sqlNC(dbStructure.schemaName(), {
        spacing: false
    });

    qry += "." + __sqlNC(dbStructure.itemTableName(), {
        spacing: false
    });

    return qry;
}

function __buildInventoryQuery() {
    var inventoryTable = dbStructure.get({
        from: "tables.inventory"
    });
    var qry = "SELECT", selection = " *";

    /**
     * To SELECT Minimal.
     * If you want this query to select all
     * simply comment out the following code.
     */
    selection = " " + __sqlNC(inventoryTable.columns.itemNum.name, {
        spacing: false
    });
    selection += ", " + __sqlNC(inventoryTable.columns.itemUnitCost.name, {
        spacing: false
    });
    selection += ", " + __sqlNC(inventoryTable.columns.onHandQty.name, {
        spacing: false
    });
    selection += ", " + __sqlNC(inventoryTable.columns.locCode.name, {
        spacing: false
    });

    /** Append the SELECTION values to the query */
    qry += selection;

    qry += " FROM " + __sqlNC(dbStructure.dbName(), {
        spacing: false
    });

    qry += "." + __sqlNC(dbStructure.schemaName(), {
        spacing: false
    });

    qry += "." + __sqlNC(inventoryTable.name, {
        spacing: false
    });

    /** Now we add a WHERE clause so we ONLY query inventory Items with lcation codes that we know. */
    qry = __addLocationCodesQuery(qry, inventoryTable.columns.locCode.name);

    return qry;
}

function __buildPricingQuery(options) {
    var qry = "SELECT ";

    qry += "* FROM " + __sqlNC(dbStructure.dbName(), {
        spacing: false
    });

    qry += "." + __sqlNC(dbStructure.schemaName(), {
        spacing: false
    });

    var pricingTable = dbStructure.get({
        from: "tables.pricing"
    });

    qry += "." + __sqlNC(pricingTable.name, {
        spacing: false
    });

    if (options.item) {
        // Location Code to match any of the known location codes
        qry = __addItemPricingQuery(qry, pricingTable, options);
    }

    return qry;
}

function __buildPublishPOQuery(options) {
    var orderTable = null;

    switch (options.category) {
        case "header":
            orderTable = options.orderTable = dbStructure.get({
                from: "tables.orderHeader"
            });
            break;
        case "line":
            orderTable = options.orderTable = dbStructure.get({
                from: "tables.orderLine"
            });
            break;
    }

    var qry = "INSERT INTO ";

    qry += __sqlNC(dbStructure.dbName(), {
        spacing: false
    });

    qry += "." + __sqlNC(dbStructure.schemaName(), {
        spacing: false
    });

    qry += "." + __sqlNC(orderTable.name, {
        spacing: false
    });

    qry = __addPublishPOValuesQuery(qry, options);

    return qry;
}

function __buildCrossReferenceQuery(options) {
    var pricingTable = dbStructure.get({
        from: "tables.pricing"
    });
    var qry = "SELECT ";

    qry += "* FROM " + __sqlNC(dbStructure.dbName(), {
        spacing: false
    });

    qry += "." + __sqlNC(dbStructure.schemaName(), {
        spacing: false
    });

    qry += "." + __sqlNC(pricingTable.name, {
        spacing: false
    });

    qry = __addCrossRefPartNumQuery(qry, pricingTable, options);

    return qry;
}

function __buildInfoSchemaQuery(options) {
    var qry = "USE ";

    qry += __sqlNC(dbStructure.dbName(), {
        spacing: false
    });

    switch (options.category) {
        case "tables":
            qry += " SELECT * FROM [INFORMATION_SCHEMA].[TABLES]";
            break;
    }

    return qry;
}

function __buildSearchQuery(options) {
    var itemTable = dbStructure.get({
        from: "tables.items"
    });
    var qry = __buildItemQuery();

    qry += " WHERE ";

    qry += __sqlNC(itemTable.columns.itemNum.name, {
        spacing: false
    });

    qry += " LIKE " + __sqlNC(options.term, {
        spacing: false,
        excludeBrackets: true,
        includeSingleQuotes: true
    });

    switch (options.category) {
        case "xrefs":
            qry += " AND ";
            qry += "[Private Label Customer 1] = " + __sqlNC(options.dealer.nav_customer_id, {
                spacing: false,
                excludeBrackets: true,
                includeSingleQuotes: true
            });
            break;
    }

    return qry;
}

/**
 * @private
 * SQL Naming Convention.
 * @param   {String}  sourcename  [description]
 * @param   {Object}  options     [description]
 * @return  {String}              [description]
 */
function __sqlNC(sourcename, options) {
    options = options || {
        spacing: true,
        excludeBrackets: false,
        includeSingleQuotes: false
    };

    if (!options.spacing) {
        if (options.excludeBrackets) {
            if (options.includeSingleQuotes)
                return "'" + sourcename + "'";
            return sourcename;
        }
        return "[" + sourcename + "]";
    }

    if (options.excludeBrackets)
        if (options.includeSingleQuotes)
            return " '" + sourcename + "' ";
        return " " + sourcename + " ";
    return " [" + sourcename + "] ";
}

function __addLocationCodesQuery(qry, locCodeColumnName) {
    var columnQryString = __sqlNC(locCodeColumnName, {
        spacing: false
    });

    qry += " WHERE " + columnQryString;

    var locCodesObj = dbStructure.getLocationCodes();
    var locationCodes = _.allKeys(locCodesObj);
    var qryOpts = {
        spacing: false,
        excludeBrackets: true,
        includeSingleQuotes: true
    };

    for (var c = 0; c < locationCodes.length; c++) {
        var code = locationCodes[c];
        var appendToQry;

        var qryEnd = ' = ' + __sqlNC(code, qryOpts);

        // if first or last
        if (c === 0)
            appendToQry = qryEnd;

        if (c > 0) {
            appendToQry = ' OR ' + columnQryString;
            appendToQry += qryEnd;
        }

        qry += appendToQry;
    }

    return qry;
}

function __addItemPricingQuery(qry, pricingTable, options) {
    var itemColumnName = pricingTable.columns.itemNum.name;
    var custColumnName = pricingTable.columns.customerNum.name;

    itemColumnName = __sqlNC(itemColumnName, {
        spacing: false
    });

    custColumnName = __sqlNC(custColumnName, {
        spacing: false
    });

    qry += " WHERE " + itemColumnName;
    qry += " = '" + options.item.part_number + "'";

    /** Added Client Based Pricing to query */
    if (options.category === "dealer") {
        if (options.dealer && options.dealer.nav_customer_id) {
            qry += " AND " + custColumnName;
            qry += " = " + __sqlNC(options.dealer.nav_customer_id, {
                spacing: false,
                excludeBrackets: true,
                includeSingleQuotes: true
            });
        }
    }

    var qryOpts = {
        spacing: false,
        excludeBrackets: true
    };

    QBObj.addLogColumnRequirements(itemColumnName, options.item.part_number);

    return qry;
}

function __addPublishPOValuesQuery(qry, options) {
    var valuesQuery = "";
    var valuesQueryObj = __generatePOValues(options);

    valuesQuery += valuesQueryObj.columnsQuery;
    /** Tells the query to return the Inserted Record */
    valuesQuery += " OUTPUT INSERTED.*";
    valuesQuery += " VALUES ";
    valuesQuery += valuesQueryObj.valuesQuery;

    qry += valuesQuery;

    return qry;
}

function __addCrossRefPartNumQuery(qry, pricingTable, options) {
    var partNumber = options.part_number || null;
    var privateLabel = options.privateLabel || null;
    var itemColumnName = pricingTable.columns.itemNum.name;
    var custColumnName = pricingTable.columns.customerNum.name;

    itemColumnName = __sqlNC(itemColumnName, {
        spacing: false
    });

    custColumnName = __sqlNC(custColumnName, {
        spacing: false
    });

    if (partNumber) {
        QBObj.addLogColumnRequirements(itemColumnName, partNumber);
        qry += " WHERE " + itemColumnName;
        qry += " = '" + partNumber + "'";
    }

    /**
     * If `privateLabel` is passed make sure the "Customer No_" equals
     * the `privateLabel` value.
     *
     * This is commented out at the moment, since VisionWheel did state that
     * it doesn't matter if one dealer has the Referencing Item number from another
     * dealer. However if that changes, all we have to do, is uncomment the code below.
     */
    if (privateLabel) {
        QBObj.addLogColumnRequirements(custColumnName, privateLabel);
        if (partNumber)
            qry += " AND " + custColumnName;
        else
            qry += " WHERE " + custColumnName;
        qry += " = '" + privateLabel + "'";
    }

    return qry;
}

function __generatePOValues(options) {
    var columnValues = __getPOValuesObject(options);
    var columnValuesQuery = {}, columnsQuery = "", valuesQuery = "";
    var columnValuesKeys = _.allKeys(columnValues);
    var numOfKeys = columnValuesKeys.length;
    var numOfCurrentCol = 0;

    for (var key in columnValues) {
        if (columnValues.hasOwnProperty(key)) {
            var columnValue = columnValues[key];
            var columnKey = __sqlNC(key, {
                spacing: false
            });

            if (numOfCurrentCol === 0) {
                columnsQuery = "(" + columnKey + ",";
                valuesQuery = "(" + columnValue + ",";
            } else if ((numOfCurrentCol + 1) === numOfKeys) {
                columnsQuery += columnKey + ")";
                valuesQuery += columnValue + ")";
            } else {
                columnsQuery += columnKey + ",";
                valuesQuery += columnValue + ",";
            }

            numOfCurrentCol++;
        }
    }

    columnValuesQuery.columnsQuery = columnsQuery;
    columnValuesQuery.valuesQuery = valuesQuery;

    return columnValuesQuery;
}

function __getPOValuesObject(options) {
    var orderTable = options.orderTable;
    var tableColumns = orderTable.columns;
    var columnValues = {};
    var locObj = null;

    switch (options.category) {
        case "header":
            locObj = options.locationHeader;
            break;
        case "line":
            locObj = options.locationLine;
            break;
    }

    for (var columnName in locObj) {
        if (locObj.hasOwnProperty(columnName)) {
            var colvalue = locObj[columnName];
            var datatype = tableColumns[columnName].datatype;

            if (_.has(tableColumns[columnName], 'capitalize') && datatype === "varchar")
                colvalue = colvalue.toUpperCase();

            if (datatype === "varchar")
                columnValues[tableColumns[columnName].name] = "'" + colvalue + "'";
            else if (datatype === "datetime") {
                colvalue = "'" + colvalue + "'";
                columnValues[tableColumns[columnName].name] = "convert(datetime, " + colvalue + ", 105)";
            } else
                columnValues[tableColumns[columnName].name] = colvalue;
        }
    }

    return columnValues;
}

/**
 * Convert Date string into a Unix Timestamp.
 * From 2016-12-27 to 135895961313
 * @param   {String}  datestring  Date
 * @return  {Number}              Unix Timestamp of the date
 */
function __dateToTimestamp(datestime) {
    var datestring = datestime.toLocaleString();
    var newDate = datestring[1] + "/" + datestring[2] + "/" + datestring[0];
    return new Date(newDate).getTime();
}

/**
 * When calling .getMonth() you need to add +1 to display the correct month.
 * Javascript count always starts at 0 (look here to check why), so calling .getMonth() in may will return 4 and not 5.
 *
 * So in your code we can use currentdate.getMonth()+1 to output the correct value. In addition:
 *     .getDate() returns the day of the month <- this is the one you want
 *     .getDay() is a separate method of the Date object which will return an integer representing
 *         the current day of the week (0-6) 0 == Sunday etc
 * @param   {String}  datestring  Date
 * @return  {String}              Date Time of the date string.
 */
function __dateToDateTime(datetime) {
    datestring = datestring.split("-");
    /**
     * Rearrange so that JavaScripts Native Date method understands the date.
     * From 2016-12-27 to 12-27-2016
     * @type  {String}
     */
    var newDate = datestring[1] + "/" + datestring[2] + "/" + datestring[0];
    newDate = new Date(newDate);

    var datetime = currentdate.getDate();
    datetime += "/" + (currentdate.getMonth()+1);
    datetime += "/" + currentdate.getFullYear();
    datetime += " @ " + currentdate.getHours();
    datetime += ":" + currentdate.getMinutes();
    datetime += ":" + currentdate.getSeconds();

    return datetime;
}