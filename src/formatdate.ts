/**
* @author malaow3
* @file containts date foramtting functions
*/


/**
 * @description formats date string into mm/dd/yyyy hh:mmaa format
 * @export
 * @param {string} dateVal date string
 * @returns {*}  {string} formatted date string
 */
export function formatDate(dateVal: string): string {

    require('dotenv').config();
    let tz = process.env.tz;
    var newDate = new Date(dateVal);
    if (tz !== undefined) {
        newDate = convertTZ(newDate, tz);
    }

    var sMonth = padValue(newDate.getMonth() + 1);
    var sDay = padValue(newDate.getDate());
    var sYear = newDate.getFullYear();
    var sHour = newDate.getHours();
    var sMinute = padValue(newDate.getMinutes());
    var sAMPM = "AM";

    var iHourCheck = parseInt(sHour.toString());

    if (iHourCheck >= 12) {
        sAMPM = "PM";
        if (iHourCheck > 12) {
            sHour = iHourCheck - 12;
        }
    }
    else if (iHourCheck === 0) {
        sHour = 12;
    }

    let hourString = padValue(sHour);

    return sMonth + "-" + sDay + "-" + sYear + " " + hourString + ":" + sMinute + "" + sAMPM;
}

function padValue(value: number): string {
    return (value < 10) ? "0" + value : value.toString();
}

function convertTZ(date: Date, tzString: string) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));
}