    sap.ui.define([
        "sap/ui/core/mvc/Controller",
        "sap/m/MessageBox"
    ],
        /**
         * @param {typeof sap.ui.core.mvc.Controller} Controller
         * @param {typeof sap.m.MessageBox} MessageBox
         */
        function (Controller, MessageBox) {
            "use strict";
    
            return Controller.extend("sapui5.com.employeesystem.controller.Main", {
    
                onBeforeRendering() {
                    //Get EmployeeDetails View
                    this._detailEmployeeView = this.getView().byId("employeeDetailView");
                },
    
                onInit: function () {
    
                    var oView = this.getView();
    
                    var oJSONModelEmpl = new sap.ui.model.json.JSONModel();
                    oJSONModelEmpl.loadData("./model/json/Employees.json");
                    oView.setModel(oJSONModelEmpl, "jsonEmployees");
    
                    var oJSONModelCountries = new sap.ui.model.json.JSONModel();
                    oJSONModelCountries.loadData("./model/json/Countries.json");
                    oView.setModel(oJSONModelCountries, "jsonCountries");
    
                    var oJSONModelLayout = new sap.ui.model.json.JSONModel();
                    oJSONModelLayout.loadData("./model/json/Layouts.json");
                    oView.setModel(oJSONModelLayout, "jsonLayout");
    
                    var oJSONModelConfig = new sap.ui.model.json.JSONModel({
                        visibleID: true,
                        visibleName: true,
                        visibleCountry: true,
                        visibleCity: false,
                        visibleBtnShowCity: true,
                        visibleBtnHideCity: false
    
                    });
    
                    oView.setModel(oJSONModelConfig, "jsonConfig");
    
                    this._bus = sap.ui.getCore().getEventBus();
                    this._bus.subscribe("flexible", "showEmployee", this.showEmployeeDetails, this);
                    this._bus.subscribe("incidence", "onSaveIncidence", this.saveODataIncidence, this);
                    this._bus.subscribe("incidence", "onDeleteIncidence", this.deleteODataIncidence, this);
    
                },
    
                showEmployeeDetails: function (sCategory, sEventName, sPath) {
    
                    //Show Employee Detail
                    var oDetailView = this.getView().byId("employeeDetailView");
                    oDetailView.bindElement("odataNorthwind>" + sPath);
                    this.getView().getModel("jsonLayout").setProperty("/ActiveKey", "TwoColumnsMidExpanded");
    
                    var oIncidenceModel = new sap.ui.model.json.JSONModel([]);
                    oDetailView.setModel(oIncidenceModel, "incidenceModel");
                    oDetailView.byId("tableIncidence").removeAllContent();
    
                    //Read employee incidences at show details
                    this.onReadOdataIncidente(this._detailEmployeeView.getBindingContext("odataNorthwind").getObject().EmployeeID);
    
                },
    
                saveODataIncidence: function (sChannelId, sEventName, OData) {
                    //Save Employee Incidence
    
                    var oi18n = this.getView().getModel("i18n").getResourceBundle();
                    var sEmployeeId = this._detailEmployeeView.getBindingContext("odataNorthwind").getObject().EmployeeID;
                    var oIncidenceModelData = this._detailEmployeeView.getModel("incidenceModel").getData();
                    var oDataService = this.getView().getModel("incidenceModel");
    
                    if (typeof oIncidenceModelData[OData.incidenceRow].IncidenceId === 'undefined') {
    
                        //Body or payload of the request
                        var oBody = {
                            SapId: this.getOwnerComponent().SapId,
                            EmployeeId: sEmployeeId.toString(),
                            CreationDate: oIncidenceModelData[OData.incidenceRow].CreationDate,
                            Type: oIncidenceModelData[OData.incidenceRow].Type,
                            Reason: oIncidenceModelData[OData.incidenceRow].Reason
                        };
    
                        oDataService.create("/IncidentsSet", oBody, {
                            success: function () {
    
                                MessageBox.success(oi18n.getText("odataSaveOk"));
                                //sap.m.MessageToast.show(oi18n.getText("odataSaveOk"));
    
                                //Read de incidents to refresh the view
                                this.onReadOdataIncidente(sEmployeeId);
    
                            }.bind(this),
                            error: function () {
                                sap.m.MessageToast.show(oi18n.getText("odataSaveKo"));
                            }.bind(this)
                        });
    
                    } else if (oIncidenceModelData[OData.incidenceRow].CreationDateX ||
                        oIncidenceModelData[OData.incidenceRow].ReasonX ||
                        oIncidenceModelData[OData.incidenceRow].TypeX) {
    
                        var oUpdateBody = {
                            CreationDate: oIncidenceModelData[OData.incidenceRow].CreationDate,
                            CreationDateX: oIncidenceModelData[OData.incidenceRow].CreationDateX,
                            Reason: oIncidenceModelData[OData.incidenceRow].Reason,
                            ReasonX: oIncidenceModelData[OData.incidenceRow].ReasonX,
                            Type: oIncidenceModelData[OData.incidenceRow].Type,
                            TypeX: oIncidenceModelData[OData.incidenceRow].TypeX
                        };
    
                        oDataService.update("/IncidentsSet(IncidenceId='" + oIncidenceModelData[OData.incidenceRow].IncidenceId +
                            "',SapId='" + this.getOwnerComponent().SapId +
                            "',EmployeeId='" + sEmployeeId.toString() + "')",
                            oUpdateBody, {
                            success: function () {
    
                                sap.m.MessageToast.show(oi18n.getText("odataUpdateOk"));
                                //Read de incidents to refresh the view
                                this.onReadOdataIncidente(sEmployeeId);
    
                            }.bind(this),
                            error: function () {
                                sap.m.MessageToast.show(oi18n.getText("odataUpdateKo"));
                            }.bind(this)
                        });
                    }
                    else {
                        sap.m.MessageToast.show(oi18n.getText("odataNoChanges"));
                    }
    
                },
    
                onReadOdataIncidente: function (employeeId) {
                    //Read incidences of the employee from OData Service
    
                    //Get tableincidence instance and remove all content
                    var oTableIncidence = this._detailEmployeeView.byId("tableIncidence");
                    oTableIncidence.removeAllContent();
    
                    var oi18n = this.getView().getModel("i18n").getResourceBundle();
    
                    var aFilters = [
                        new sap.ui.model.Filter("SapId", "EQ", this.getOwnerComponent().SapId),
                        new sap.ui.model.Filter("EmployeeId", "EQ", employeeId.toString())
                    ];
    
                    var oDataService = this.getView().getModel("incidenceModel");
    
                    oDataService.read("/IncidentsSet", {
                        filters: aFilters,
                        success: function (oData) {
    
                            var oIncidenceModel = this._detailEmployeeView.getModel("incidenceModel");
                            oIncidenceModel.setData(oData.results);
    
                            //If the employee do not have incidences, display a message and return
                            if (oData.results.length === 0) {
                                sap.m.MessageToast.show(oi18n.getText("employeeNoIncidents"));
                                return;
                            }
    
                            //Add new content to refresh the information of incidents in the view
                            for (var incidence in oData.results) {
    
                                //For control of CreationDate State - By default, when read the OData the status is true
                                oData.results[incidence]._ValidateDate = true;
                                oData.results[incidence].EnabledSave = false;
    
                                //Create de incidence fragment - Important, the controller must be the EmployeeDetails controller
                                var newIncidence = sap.ui.xmlfragment("sapui5.com.employeesystem.fragment.NewIncidence", this._detailEmployeeView.getController());
                                this._detailEmployeeView.addDependent(newIncidence);
                                newIncidence.bindElement("incidenceModel>/" + incidence);
                                oTableIncidence.addContent(newIncidence);
                            }
    
                        }.bind(this),
                        error: function (oError) {
                            sap.m.MessageToast.show(oi18n.getText("odataErrorGettingIncidents"));
                        }.bind(this)
                    });
    
                },
    
                deleteODataIncidence: function (sChannelId, sEventName, oData) {
                    //Delete employee incidence from backend and refresh the view
    
                    if (!oData.IncidenceId) {
                        //In this case, the incidence does not exist in the backend
                        oData.TableIncidence.removeContent(oData.RowIncidence);
                        return;
                    }
    
                    var oi18n = this.getView().getModel("i18n").getResourceBundle();
                    var oDataService = this.getView().getModel("incidenceModel");
    
                    oDataService.remove("/IncidentsSet(IncidenceId='" + oData.IncidenceId +
                        "',SapId='" + oData.SapId +
                        "',EmployeeId='" + oData.EmployeeId.toString() + "')", {
                        success: function () {
    
                            sap.m.MessageToast.show(oi18n.getText("odataDeleteOk"));
                            //Read de incidents to refresh the view
                            this.onReadOdataIncidente(oData.EmployeeId);
    
                        }.bind(this),
                        error: function () {
                            sap.m.MessageToast.show(oi18n.getText("odataDeleteKo"));
                        }.bind(this)
                    });
    
                }
    
            });
        });
        