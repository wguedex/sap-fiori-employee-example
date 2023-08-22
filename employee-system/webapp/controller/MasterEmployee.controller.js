sap.ui.define([
    "sapui5/com/employeesystem/controller/Base.controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
  
    function (Base, Filter, FilterOperator) {
        "use strict";

        return Base.extend("sapui5.com.employeesystem.controller.MasterEmployee", {

            onInit: function () {

                //var i18nBundle = oView.getModel("i18n").getResourceBundle();

                this._bus = sap.ui.getCore().getEventBus();

            },

            onFilter: function () {
                //Filter for employee table

                var oModelData = this.getView().getModel("jsonCountries").getData();
                var aFilters = [];

                if (oModelData.EmployeeId !== "") {
                    aFilters.push(new Filter("EmployeeID", FilterOperator.EQ, oModelData.EmployeeId));
                }

                if (oModelData.CountryKey !== "") {
                    aFilters.push(new Filter("Country", FilterOperator.EQ, oModelData.CountryKey));
                }

                var oTable = this.getView().byId("tableEmployee");
                var oBinding = oTable.getBinding("items");
                oBinding.filter(aFilters);

            },

            onClearFilter: function () {
                //Clear employee table filter

                var oModel = this.getView().getModel("jsonCountries");

                oModel.setProperty("/EmployeeId", "");
                oModel.setProperty("/CountryKey", "");

                //To auto-reset table filter
                this.onFilter();

            },

            showPostalCode: function (oEvent) {
                //Display employee postal code

                var oItemPressed = oEvent.getSource();
                var oContext = oItemPressed.getBindingContext();
                var oObjectContext = oContext.getObject();

                sap.m.MessageToast.show(oObjectContext.PostalCode);

            },

            onValidateEmployeeInput: function (oEvent) {

                var oInputEmployee = oEvent.getSource();
                var oLabelCountry = this.getView().byId("labelSelectCountry");
                var oSelectCountry = this.getView().byId("slCountry");

                if (oInputEmployee.getValue().length === 6) {
                    oLabelCountry.setVisible(true);
                    oSelectCountry.setVisible(true);
                } else {
                    oLabelCountry.setVisible(false);
                    oSelectCountry.setVisible(false);
                }

            },

            onShowCity: function (oEvent) {
                //Show City Column

                var oJSONModelConfig = this.getView().getModel("jsonConfig");

                oJSONModelConfig.setProperty("/visibleCity", true);
                oJSONModelConfig.setProperty("/visibleBtnShowCity", false);
                oJSONModelConfig.setProperty("/visibleBtnHideCity", true);

            },

            onHideCity: function (oEvent) {
                //Hide City Column 

                var oJSONModelConfig = this.getView().getModel("jsonConfig");

                //Another way to change the model data
                var oJsonConfigData = oJSONModelConfig.getData();
                oJsonConfigData.visibleCity = false;
                oJsonConfigData.visibleBtnShowCity = true;
                oJsonConfigData.visibleBtnHideCity = false;
                oJSONModelConfig.refresh();

            },

            showOrders: function (oEvent) {

                var oIconPressed = oEvent.getSource();
                var oContext = oIconPressed.getBindingContext("odataNorthwind");

                if (!this._oDialogOrders) {
                    this._oDialogOrders = sap.ui.xmlfragment("sapui5.com.employeesystem.fragment.DialogOrders", this);
                    this.getView().addDependent(this._oDialogOrders);
                }

                //Dialog binding to the context to have access to the data of selected item
                this._oDialogOrders.bindElement("odataNorthwind>" + oContext.getPath());
                this._oDialogOrders.open();

            },

            onCloseOrders: function () {
                this._oDialogOrders.close();
            },

            onShowEmployeeDetails: function (oEvent) {

                //Get path of selected item
                var sPath = oEvent.getSource().getBindingContext("odataNorthwind").getPath();

                //Publish event to manage the navigation in the Main View
                this._bus.publish("flexible", "showEmployee", sPath);

            }

        });
    });