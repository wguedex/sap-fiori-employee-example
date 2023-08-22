sap.ui.define([], function () {

    "use strict";

    return {

        dateFormat: function (oDate) {
            //Format date to: Yesterday, Today, Tomorrow

            var iTimeDay = 24 * 60 * 60 * 1000;

            if (oDate) {

                //Resource Bundle
                var oi18n = this.getView().getModel("i18n").getResourceBundle();

                //Actual Date
                var oDateNow = new Date();

                var oDateFormat = sap.ui.core.format.DateFormat.getInstance({ pattern: "yyyy/MM/dd" });
                var oDateNowFormat = new Date(oDateFormat.format(oDateNow));

                switch (true) {
                    case oDate.getTime() === oDateNowFormat.getTime(): //Today
                        return " - " + oi18n.getText("today");

                    case oDate.getTime() === oDateNowFormat.getTime() + iTimeDay: //Tomorrow
                        return " - " + oi18n.getText("tomorrow");

                    case oDate.getTime() === oDateNowFormat.getTime() - iTimeDay: //Yesterday
                        return " - " + oi18n.getText("yesterday");

                    default:
                        return "";
                }

            }

        }

    };


});