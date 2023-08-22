sap.ui.define([
    "sapui5/com/employeesystem/controller/Base.controller",
    "sapui5/com/employeesystem/model/formatter",
    "sap/m/MessageBox"
],
 
    function (Base, formatter, MessageBox) {
        "use strict";

        return Base.extend("sapui5.com.employeesystem.controller.EmployeeDetails", {

            formatter: formatter,

            onInit: function () {

                //Event Bus
                this._bus = sap.ui.getCore().getEventBus();

            },

            onCreateIncidence: function () {

                var oTableIncidence = this.getView().byId("tableIncidence");
                var oNewIncidence = sap.ui.xmlfragment("sapui5.com.employeesystem.fragment.NewIncidence", this);
                var oIncidenceModel = this.getView().getModel("incidenceModel");

                var oIncidenceData = oIncidenceModel.getData();
                var iIndex = oIncidenceData.length;

                oIncidenceData.push({
                    index: iIndex + 1,
                    _ValidateDate: false,
                    EnabledSave: false
                });

                oIncidenceModel.refresh();
                oNewIncidence.bindElement("incidenceModel>/" + iIndex);
                oTableIncidence.addContent(oNewIncidence);

            },

            onDeleteIncidence: function (oEvent) {
                //Delete Incidence

                //New logic for delete with OData
                var oRowIncidence = oEvent.getSource().getParent().getParent();
                var oIncidenceContextObj = oRowIncidence.getBindingContext("incidenceModel").getObject();
                var oi18n = this.getView().getModel("i18n").getResourceBundle();

                MessageBox.confirm(oi18n.getText("confirmDeleteIncidence"), {
                    onClose: function (sAction) {
                        if (sAction === "OK") {
                            //Publish the event for delete in the Main controller
                            this._bus.publish("incidence", "onDeleteIncidence", {
                                IncidenceId: oIncidenceContextObj.IncidenceId,
                                SapId: oIncidenceContextObj.SapId,
                                EmployeeId: oIncidenceContextObj.EmployeeId,
                                TableIncidence: this.getView().byId("tableIncidence"),
                                RowIncidence: oRowIncidence
                            });
                        }
                    }.bind(this)
                });


                //Old logic for delete only in the view
                /*var oTableIncidence = this.getView().byId("tableIncidence");
                var oRowIncidence = oEvent.getSource().getParent().getParent();
                var oIncidenceModel = this.getView().getModel("incidenceModel");
                var oIncidenceData = oIncidenceModel.getData();
                var oIncidenceContextObj = oRowIncidence.getBindingContext("incidenceModel").getObject();

                oIncidenceData.splice(oIncidenceContextObj.index - 1, 1);

                for (var i in oIncidenceData) {
                    oIncidenceData[i].index = parseInt(i) + 1;
                }

                oIncidenceModel.refresh();
                oTableIncidence.removeContent(oRowIncidence);

                for (var j in oTableIncidence.getContent()) {
                    oTableIncidence.getContent()[j].bindElement("incidenceModel>/" + j);
                }*/

            },

            onSaveIncidence: function (oEvent) {
                //Save incidence - Publish event to save incidence in controller Main
                debugger;
                var oRowIncidence = oEvent.getSource().getParent().getParent();
                var oIncidenceContext = oRowIncidence.getBindingContext("incidenceModel");

                this._bus.publish("incidence", "onSaveIncidence", { incidenceRow: oIncidenceContext.sPath.replace("/", "") });

            },

            updateIncidenceCreationDate: function (oEvent) {
                //Update incidence creation date flag
                var oContext = oEvent.getSource().getBindingContext("incidenceModel");
                var oContextObj = oContext.getObject();

                var oi18n = this.getView().getModel("i18n").getResourceBundle();

                if (!oEvent.getSource().isValidValue()) {
                    //The date is not valid
                    oContextObj.CreationDateState = "Error";
                    oContextObj._ValidateDate = false;
                    oContextObj.CreationDateX = false;

                    //MessageBox to display error message
                    MessageBox.error(oi18n.getText("errorCreationDateValue"), {
                        title: oi18n.getText("errorTitle"),
                        onClose: null,
                        styleClass: "",
                        actions: sap.m.MessageBox.Action.Close,
                        emphatizedActon: null,
                        initialFocus: null,
                        textDirection: sap.ui.core.TextDirection.Inherit
                    });

                } else {
                    oContextObj.CreationDateState = "None";
                    oContextObj._ValidateDate = true;
                    oContextObj.CreationDateX = true;
                }

                if (oEvent.getSource().isValidValue() && oContextObj.Reason) {
                    oContextObj.EnabledSave = true;
                } else {
                    oContextObj.EnabledSave = false;
                }

                oContext.getModel().refresh();

            },

            updateIncidenceReason: function (oEvent) {
                //Update incidence reason flag
                var oContext = oEvent.getSource().getBindingContext("incidenceModel");
                var oContextObj = oContext.getObject();

                if (!oEvent.getSource().getValue()) {
                    //The Reason is not valid
                    oContextObj.ReasonState = "Error";
                    oContextObj.ReasonX = false;
                } else {
                    oContextObj.ReasonState = "None";
                    oContextObj.ReasonX = true;
                }

                if (oEvent.getSource().getValue() && oContextObj._ValidateDate) {
                    oContextObj.EnabledSave = true;
                } else {
                    oContextObj.EnabledSave = false;
                }

                oContext.getModel().refresh();

            },

            updateIncidenceType: function (oEvent) {
                //Update incidence type flag
                var oContext = oEvent.getSource().getBindingContext("incidenceModel");
                var oContextObj = oContext.getObject();

                if (oContextObj.Reason && oContextObj._ValidateDate) {
                    oContextObj.EnabledSave = true;
                } else {
                    oContextObj.EnabledSave = false;
                }

                oContextObj.TypeX = true;
            }

        });
    });