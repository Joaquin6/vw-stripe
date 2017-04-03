module.exports = {
	name: "NAV-Ecomsub",
	schema: {
		name: "dbo",
		tables: {
			items: {
				name: "Vision Wheel, Inc_$EComm Item Data",
				columns: {
					/** @type {Object} Part Number */
					itemNum: {
						name: "Item No_"
					},
					itemNum2: {
						name: "Item No_ 2"
					},
					itemDesc: {
						name: "Description"
					},
					itemDesc2: {
						name: "Description 2"
					},
					finishDesc: {
						name: "Finish Description"
					},
					searchDesc: {
						name: "Search Description"
					},
					/** @type {Object} Product Type (wheel, tire, accessory) */
					inventoryGrp: {
						name: "Inventory Posting Group"
					}
				}
			},
			inventory: {
				name: "Vision Wheel, Inc_$Location Inventory",
				columns: {
					itemDesc: {
						name: "Item Description"
					},
					itemNum: {
						name: "Item No_",
						datatype: "varchar"
					},
					itemUnitCost: {
						name: "Item Unit Cost",
						datatype: "decimal"
					},
					onHandQty: {
						name: "Nav Qty On Hand"
					},
					locCode: {
						name: "Location Code"
					}
				}
			},
			pricing: {
				name: "Vision Wheel, Inc_$E-Comm Cust Sales Price",
				columns: {
					customerNum: {
						name: "Customer No_"
					},
					itemNum: {
						name: "Item No_"
					},
					itemDesc: {
						name: "Item Description"
					},
					baseUnitMeasure: {
						name: "Base Unit of Measure"
					},
					unitPrice: {
						name: "Unit Price"
					},
					crossRef1: {
						name: "Item Xref1"
					},
					crossRef2: {
						name: "Item Xref2"
					},
					crossRef3: {
						name: "Item Xref3"
					},
					crossRef4: {
						name: "Item Xref4"
					},
					crossRef5: {
						name: "Item Xref5"
					}
				}
			},
			orderHeader: {
				name: "Vision Wheel, Inc_$Website Inbound Order Header",
				columns: {
					addShipToCodeToNAV: {
						datatype: "tinyint",
						name: "Add Ship-to Code to NAV"
					},
					agentEmailAddress: {
						datatype: "varchar",
						name: "Agent Email Address"
					},
					billToEmail: {
						datatype: "varchar",
						name: "Bill-to E-mail"
					},
					customerEmail: {
						datatype: "varchar",
						name: "Customer E-mail"
					},
					customerPhone: {
						datatype: "varchar",
						name: "Customer Phone No_"
					},
					ccStatus: {
						datatype: "int",
						name: "CCStatus"
					},
					ccAuthCode: {
						datatype: "varchar",
						name: "CCAuthCode",
						capitalize: true
					},
					ccAuthDate: {
						datatype: "datetime",
						name: "CCAuthDate"
					},
					ccSettleDate: {
						datatype: "datetime",
						name: "CCSettleDate"
					},
					ccResponse: {
						datatype: "varchar",
						name: "CCResponse",
						capitalize: true
					},
					customerNum: {
						datatype: "varchar",
						name: "Customer No_",
						capitalize: true
					},
					cancelAfterDate: {
						datatype: "datetime",
						name: "Cancel after Date"
					},
					changedDefaultPaymentInfo: {
						datatype: "tinyint",
						name: "Changed Default Payment Info"
					},
					commentLine1: {
						datatype: "varchar",
						name: "Comment Line 1"
					},
					commentLine2: {
						datatype: "varchar",
						name: "Comment Line 2"
					},
					commentLine3: {
						datatype: "varchar",
						name: "Comment Line 3"
					},
					commentLine4: {
						datatype: "varchar",
						name: "Comment Line 4"
					},
					commentLine5: {
						datatype: "varchar",
						name: "Comment Line 5"
					},
					creditAppliedTo: {
						datatype: "varchar",
						name: "Credit Applied to",
						capitalize: true
					},
					customerSelectedShipMethod: {
						datatype: "tinyint",
						name: "Customer Selected Ship Method"
					},
					docType: {
						datatype: "int",
						name: "Document Type"
					},
					docNum: {
						datatype: "varchar",
						name: "Document No_"
					},
					deliveryType: {
						datatype: "int",
						name: "Delivery Type"
					},
					discountCode: {
						datatype: "varchar",
						name: "Discount Code",
						capitalize: true
					},
					discountHandled: {
						datatype: "tinyint",
						name: "Discount Handled"
					},
					externalDocNum: {
						datatype: "varchar",
						name: "External Document No_"
					},
					errors: {
						datatype: "tinyint",
						name: "Errors"
					},
					errorMessage: {
						datatype: "varchar",
						name: "Error Message"
					},
					eShipAgentService: {
						datatype: "varchar",
						name: "EShip Agent Service",
						capitalize: true
					},
					freightTotal: {
						datatype: "decimal",
						name: "Freight Total"
					},
					locationCode: {
						datatype: "varchar",
						name: "Location Code",
						capitalize: true
					},
					msReplTranVersion: {
						datatype: "varchar",
						name: "msrepl_tran_version"
					},
					noOfTries: {
						datatype: "int",
						name: "No of Tries"
					},
					orderType: {
						datatype: "varchar",
						name: "Order Type"
					},
					orderDate: {
						datatype: "datetime",
						name: "Order Date"
					},
					paymentMethod: {
						datatype: "varchar",
						name: "Payment Method",
						capitalize: true
					},
					paymentTermsCode: {
						datatype: "varchar",
						name: "Payment Terms Code",
						capitalize: true
					},
					processed: {
						datatype: "tinyint",
						name: "Processed"
					},
					processedDate: {
						datatype: "datetime",
						name: "Processed Date"
					},
					processFee: {
						datatype: "decimal",
						name: "Process Fee"
					},
					released: {
						datatype: "tinyint",
						name: "Released"
					},
					releasedDate: {
						datatype: "datetime",
						name: "Released Date"
					},
					requestDeliveryDate: {
						datatype: "datetime",
						name: "Requested Delivery Date"
					},
					sellToName: {
						datatype: "varchar",
						name: "Sell-to Name"
					},
					sellToAddress: {
						datatype: "varchar",
						name: "Sell-to Address 1"
					},
					sellToAddress2: {
						datatype: "varchar",
						name: "Sell-to Address 2"
					},
					sellToPostCode: {
						datatype: "varchar",
						name: "Sell-to Post Code"
					},
					sellToCounty: {
						datatype: "varchar",
						name: "Sell-to County"
					},
					sellToCity: {
						datatype: "varchar",
						name: "Sell-to City"
					},
					sellToCountryCode: {
						datatype: "varchar",
						name: "Sell-to Country Code",
						capitalize: true
					},
					sellToEmail: {
						datatype: "varchar",
						name: "Sell-to E-Mail"
					},
					shipToCode: {
						datatype: "varchar",
						name: "Ship-to Code",
						capitalize: true
					},
					shipToName: {
						datatype: "varchar",
						name: "Ship-to Name"
					},
					shipToName2: {
						datatype: "varchar",
						name: "Ship-to Name 2"
					},
					shipToAddress: {
						datatype: "varchar",
						name: "Ship-to Address"
					},
					shipToAddress2: {
						datatype: "varchar",
						name: "Ship-to Address 2"
					},
					shipToPostCode: {
						datatype: "varchar",
						name: "Ship-to Post Code"
					},
					shipToCity: {
						datatype: "varchar",
						name: "Ship-to City"
					},
					shipToCountryCode: {
						datatype: "varchar",
						name: "Ship-to Country Code",
						capitalize: true
					},
					shipToPhone: {
						datatype: "varchar",
						name: "Ship-to Phone No_"
					},
					shipToEmail: {
						datatype: "varchar",
						name: "Ship-to E-Mail"
					},
					shipToContact: {
						datatype: "varchar",
						name: "Ship-to Contact"
					},
					shipToCounty: {
						datatype: "varchar",
						name: "Ship-to County",
						capitalize: true
					},
					shipmentMethod: {
						datatype: "varchar",
						name: "Shipment Method",
						capitalize: true
					},
					shippingAgent: {
						datatype: "varchar",
						name: "Shipping Agent",
						capitalize: true
					},
					storeNo: {
						datatype: "varchar",
						name: "Store No_"
					},
					shippingServiceIndicator: {
						datatype: "varchar",
						name: "Shipping Service Indicator",
						capitalize: true
					},
					timeStamp: {
						datatype: "timestamp",
						name: "timestamp"
					},
					termsDiscountAmount: {
						datatype: "decimal",
						name: "Terms Discount Amount"
					},
					thirdPartAccountNum: {
						datatype: "varchar",
						name: "Third Part Account No_"
					},
					totalDiscountAmount: {
						datatype: "decimal",
						name: "Total Discount Amount"
					},
					taxAmount: {
						datatype: "decimal",
						name: "Tax Amount"
					},
					totalInvoiceAmount: {
						datatype: "decimal",
						name: "Total Invoice Amount"
					},
					webmasterOrderNum: {
						datatype: "varchar",
						name: "Web Master Order No_"
					},
					websiteUserEmailAddress: {
						datatype: "varchar",
						name: "Website User Email Address"
					},
					yourReference: {
						datatype: "varchar",
						name: "Your Reference"
					}
				}
			},
			orderLine: {
				name: "Vision Wheel, Inc_$Website Inbound Order Line",
				columns: {
					timeStamp: {
						datatype: "timestamp",
						name: "timestamp"
					},
					docType: {
						datatype: "int",
						name: "Document Type"
					},
					docNum: {
						datatype: "varchar",
						name: "Document No_"
					},
					lineNum: {
						datatype: "int",
						name: "Line No_"
					},
					itemNum: {
						datatype: "varchar",
						name: "Item No_"
					},
					description: {
						datatype: "varchar",
						name: "Description"
					},
					qty: {
						datatype: "decimal",
						name: "Quantity"
					},
					qtyUnitOfMeasure: {
						datatype: "varchar",
						name: "Quantity Unit of Measure"
					},
					unitPrice: {
						datatype: "decimal",
						name: "Unit Price"
					},
					extendedLinePrice: {
						datatype: "decimal",
						name: "Extended Line Price"
					},
					customerItemNo_: {
						datatype: "varchar",
						name: "Customer Item No_"
					},
					customerLineNo_: {
						datatype: "varchar",
						name: "Customer Line No_"
					},
					promotionNum: {
						datatype: "varchar",
						name: "Promotion No_"
					},
					promotionPairedLineNum: {
						datatype: "int",
						name: "Promotion Paired Line No_"
					},
					promotionDiscAmt: {
						datatype: "decimal",
						name: "Promotion Disc_ Amt_"
					},
					promotionDiscPercentage: {
						datatype: "decimal",
						name: "Promotion Discount Percentage"
					},
					taxAmount: {
						datatype: "decimal",
						name: "Tax Amount"
					},
					totalLineAmount: {
						datatype: "decimal",
						name: "Total Line Amount"
					},
					appliedToInvoiceNum: {
						datatype: "varchar",
						name: "Applied-to Invoice No"
					},
					appliedToInvoiceLineNum: {
						datatype: "int",
						name: "Applied-to Invoice Line No_"
					},
					creditMemoReasonCode: {
						datatype: "varchar",
						name: "Credit Memo Reason Code",
						capitalize: true
					},
					eCommLineType: {
						datatype: "int",
						name: "E-Comm Line Type"
					}
				}
			}
		}
	}
};