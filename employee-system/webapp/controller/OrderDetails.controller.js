sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.ui.core.routing.History} History
     * @param {typeof sap.m.MessageBox} MessageBox
     * @param {typeof sap.ui.model.Filter} Filter
     * @param {typeof sap.ui.model.FilterOperator} FilterOperator
     */
    function (Controller, History, MessageBox, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("sapui5.com.employeesystem.controller.OrderDetails", {

            onInit: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("RouteOrderDetails").attachPatternMatched(this._onObjectMatched, this);
            },

            _onObjectMatched: function (oEvent) {

                this.onClearSignature();

                this.getView().bindElement({
                    path: "/Orders(" + oEvent.getParameter("arguments").OrderId + ")",
                    model: "odataNorthwind",
                    events: {
                        dataReceived: function (oData) {
                            this._readSignature.bind(this)(oData.getParameter("data").OrderID, oData.getParameter("data").EmployeeID);
                        }.bind(this)
                    }
                });

                var oObjContext = this.getView().getModel("odataNorthwind").getContext("/Orders("
                    + oEvent.getParameter("arguments").OrderId + ")").getObject();

                if (oObjContext) {
                    this._readSignature.bind(this)(oObjContext.OrderID, oObjContext.EmployeeID);
                }

            },

            _readSignature: function (sOrderId, sEmployeeId) {
                //Read signature from backend and load into canvas
                var oModel = this.getView().getModel("incidenceModel");

                oModel.read("/SignatureSet(OrderId='" + sOrderId + "',SapId='"
                    + this.getOwnerComponent().SapId
                    + "',EmployeeId='"
                    + sEmployeeId + "')", {
                    success: function (data) {

                        var oSignature = this.getView().byId("signature");
                        if (data.MediaContent !== "") {
                            oSignature.setSignature("data:image/png;base64," + data.MediaContent);
                        }

                    }.bind(this),
                    error: function (error) {

                    }.bind(this)
                });

                //Bind files 
                this.byId("uploadFile").bindAggregation("items", {
                    path: "incidenceModel>/FilesSet",
                    filters: [
                        new Filter("OrderId", FilterOperator.EQ, sOrderId),
                        new Filter("SapId", FilterOperator.EQ, this.getOwnerComponent().SapId),
                        new Filter("EmployeeId", FilterOperator.EQ, sEmployeeId)
                    ],
                    template: new sap.m.UploadCollectionItem({
                        documentId: "{incidenceModel>AttId}",
                        visibleEdit: false,
                        fileName: "{incidenceModel>FileName}"
                    }).attachPress(this.downloadFile)
                });

            },

            onBack: function (oEvent) {

                var oHistory = History.getInstance();
                var sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                }
                else {
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.navTo("RouteMainView", true);
                }

            },

            onClearSignature: function (oEvent) {

                var oSignature = this.getView().byId("signature");
                oSignature.clear();

            },

            factoryOrderDetails: function (sListId, oContext) {

                var oContextObject = oContext.getObject();
                oContextObject.Currency = "EUR";

                var nUnitsInStock = oContext.getModel().getProperty("/Products(" + oContextObject.ProductID + ")/UnitsInStock");

                if (oContextObject.Quantity <= nUnitsInStock) {

                    var oObjectListItem = new sap.m.ObjectListItem({
                        title: "{odataNorthwind>/Products(" + oContextObject.ProductID + ")/ProductName} ({odataNorthwind>Quantity})",
                        number: "{parts: [{path: 'odataNorthwind>UnitPrice'}, {path: 'odataNorthwind>Currency'}], type: 'sap.ui.model.type.Currency', formatOptions:{showMeasure:false}}",
                        numberUnit: "{odataNorthwind>Currency}"
                    });

                    return oObjectListItem;

                } else {

                    var oCustomListItem = new sap.m.CustomListItem({
                        content: [
                            new sap.m.Bar({
                                contentLeft: new sap.m.Label({ text: "{odataNorthwind>/Products(" + oContextObject.ProductID + ")/ProductName} ({odataNorthwind>Quantity})" }),
                                contentMiddle: new sap.m.ObjectStatus({ text: "{i18n>availableStock} {odataNorthwind>/Products(" + oContextObject.ProductID + ")/UnitsInStock}", state: "Error" }),
                                contentRight: new sap.m.Label({ text: "{parts: [{path: 'odataNorthwind>UnitPrice'}, {path: 'odataNorthwind>Currency'}], type: 'sap.ui.model.type.Currency'}" })
                            })
                        ]
                    });

                    return oCustomListItem;

                }
            },

            onSaveSignature: function (oEvent) {

                var oSignature = this.getView().byId("signature");
                var oi18n = this.getView().getModel("i18n").getResourceBundle();

                if (!oSignature.isFill()) {
                    //Please sign the order
                    MessageBox.error(oi18n.getText("fillTheSignature"));
                } else {

                    var sSignaturePng = oSignature.getSignature().replace("data:image/png;base64", "");
                    var oContextObject = oEvent.getSource().getBindingContext("odataNorthwind").getObject();

                    var oBody = {
                        OrderId: oContextObject.OrderID.toString(),
                        SapId: this.getOwnerComponent().SapId,
                        EmployeeId: oContextObject.EmployeeID.toString(),
                        MimeType: "image/png",
                        MediaContent: sSignaturePng
                    }

                    var oModel = this.getView().getModel("incidenceModel");

                    oModel.create("/SignatureSet", oBody, {
                        success: function () {
                            MessageBox.information(oi18n.getText("signatureSaved"));
                        }.bind(this),
                        error: function () {
                            MessageBox.error(oi18n.getText("signatureNotSaved"));
                        }.bind(this)
                    });

                }

            },

            onFileBeforeUpload: function (oEvent) {
                //Add slug parameter to request header
                var sFilename = oEvent.getParameter("fileName");
                var oObjContext = oEvent.getSource().getBindingContext("odataNorthwind").getObject();

                var oCustomHeaderSlug = new sap.m.UploadCollectionParameter({
                    name: "slug",
                    value: oObjContext.OrderID + ";" + this.getOwnerComponent().SapId + ";" + oObjContext.EmployeeID + ";" + sFilename
                });

                oEvent.getParameters().addHeaderParameter(oCustomHeaderSlug);

            },

            onFileChange: function (oEvent) {

                var oUploadCollection = oEvent.getSource();

                //Header Token CSFR - Cross-site request forgery
                var oCustomHeaderToken = new sap.m.UploadCollectionParameter({
                    name: "x-csrf-token",
                    value: this.getView().getModel("incidenceModel").getSecurityToken()
                });

                oUploadCollection.addHeaderParameter(oCustomHeaderToken);

            },

            onFileUploadComplete: function (oEvent) {
                oEvent.getSource().getBinding("items").refresh();
            },

            onFileDelete: function (oEvent) {
                //Delete file from backend
                var oUploadCollection = oEvent.getSource();
                var sPath = oEvent.getParameter("item").getBindingContext("incidenceModel").getPath();
                var oModel = this.getView().getModel("incidenceModel");

                oModel.remove(sPath, {
                    success: function () {
                        oUploadCollection.getBinding("items").refresh();
                    }.bind(this),
                    error: function () {
                    }.bind(this)
                });

            },

            downloadFile: function (oEvent) {

                var sPath = oEvent.getSource().getBindingContext("incidenceModel").getPath();
                window.open("/sap/opu/odata/sap/YSAPUI5_SRV_01" + sPath + "/$value");

            }

        });
    });