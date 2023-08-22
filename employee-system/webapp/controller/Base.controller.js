sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("sapui5.com.employeesystem.controller.Base", {

            onInit: function () {

            },

            toOrdersDetail: function (oEvent) {
                //Nav to Order Details

                var sOrderId = oEvent.getSource().getBindingContext("odataNorthwind").getObject().OrderID;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

                oRouter.navTo("RouteOrderDetails", {
                    OrderId: sOrderId
                });

            }

        });
    });