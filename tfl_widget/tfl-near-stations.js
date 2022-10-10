// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: subway;

// CONFIGURATION VARIABLES //////////////////////
const app_key = "API-TOKEN-HERE";
const stop_modes = ["tube", "elizabeth-line", "dlr"]; // StopPoint Modes: ["bus", "cable-car", "coach", "cycle", "cycle-hire", "dlr", "elizabeth-line", "interchange-keep-sitting", "interchange-secure", "national-rail", "overground", "replacement-bus", "river-bus", "river-tour", "taxi", "tram", "tube", "walking"]
const radius = 1000; // Radius in meteres from origin

// DEBUG VARIABLES //////////////////////
const wSize = config.widgetFamily || "medium"; // Set widget size for debug ["small", "medium", "large"]
let wTheme = "system"; // Set the theme for debug ["system", "light", "dark"]

// CONFIGURATION DEFINITIONS //////////////////////
class Configuration {
    fileManagerMode = 'ICLOUD'; // default is ICLOUD. If you don't use iCloud Drive use option LOCAL
    // logo is downloaded only the first time! It is saved in iCloud and then loaded from there everytime afterwards
    logoUrlLight = 'https://github.com/Kaputt4/scriptable_widgets/blob/main/tfl_widget/tfl-logo-light.png?raw=true';
    logoUrlDark = 'https://github.com/Kaputt4/scriptable_widgets/blob/main/tfl_widget/tfl-logo-dark.png?raw=true';
    tflLogoFileNameLight = Device.model() + 'tflLogoLight.png';
    tflLogoFileNameDark = Device.model() + 'tflLogoDark.png';
    requestTimeoutInterval = 4; // in seconds; If requests take longer, the script is stopped. Increase it if it doesn't work or you
    api_endpoint = "https://api.tfl.gov.uk"
    station_limit = 2; // Required for limiting view, for avoiding visualization issues
    defaultLocation = { latitude: 51.5080982, longitude: - 0.1282673 };
}

// WIDGET BEGGINING //////////////////////

let wBackground = new LinearGradient()
let errColor, wColor, tflColor;
setTheme()

let CONFIGURATION = new Configuration();

const location = await getLocation()
const tflDataStations = await fetchNearStations(location.latitude, location.longitude, "NaptanMetroStation", radius, stop_modes)

let widget = await createWidget() || null

if (!config.runsInWidget) {
    if (wSize == "large") { await widget.presentLarge() }
    else if (wSize == "medium") { await widget.presentMedium() }
    else { await widget.presentSmall() }
}

Script.setWidget(widget)
Script.complete()

async function createWidget() {
    // fileManagerMode must be LOCAL if you do not use iCloud drive
    let fm = CONFIGURATION.fileManagerMode === 'LOCAL' ? FileManager.local() : FileManager.iCloud();

    let w = new ListWidget()
    w.backgroundGradient = wBackground

    // LOGO AND HEADER //////////////////////
    let titleStack = w.addStack();
    // titleStack.size = new Size(maxLineWidth, normalLineHeight);
    const logo = await getTFLLogo(fm);
    const imgWidget = titleStack.addImage(logo);
    imgWidget.imageSize = new Size(40, 30);
    
    let headerText = titleStack.addText("  " + "Transport for London")
    headerText.font = Font.blackSystemFont(15)
    headerText.textColor = tflColor
    headerText.centerAlignText()
    // LOGO AND HEADER END //////////////////////

    // ERROR HANDLER //////////////////////
    if (tflDataStations == null) {
        w.addSpacer();
        let nullDataText = w.addText("Error fetching data. Please check your internet connection.")
        nullDataText.font = Font.mediumSystemFont(14)
        nullDataText.textColor = errColor
        // nullDataText.centerAlignText()
        w.addSpacer()
        return w
    }

    if (tflDataStations.hasOwnProperty("httpStatusCode")) {
        w.addSpacer();
        let nullDataText = w.addText(`${tflDataStations["httpStatusCode"]} ${tflDataStations["httpStatus"]}: ${tflDataStations["message"]}`)
        nullDataText.font = Font.mediumSystemFont(14)
        nullDataText.textColor = errColor
        // nullDataText.centerAlignText()
        w.addSpacer()
        return w
    }

    if (tflDataStations["stopPoints"].length == 0) {
        w.addSpacer();
        let emptyDataText = w.addText("No stations found in the set radius. Consider increasing it for better search")
        emptyDataText.font = Font.mediumSystemFont(14)
        emptyDataText.textColor = errColor
        // emptyDataText.centerAlignText()
        w.addSpacer()
        return w
    }
    // ERROR HANDLER END //////////////////////

    // WIDGET BUILD //////////////////////
    let linesCount = 0
    for (var i = 0; i < Math.min(tflDataStations["stopPoints"].length, CONFIGURATION.station_limit) && linesCount < 6; i++) { // Iterate through stations
        w.addSpacer();
        let stopPointId = tflDataStations["stopPoints"][i]["naptanId"]
        let stopPointName = tflDataStations["stopPoints"][i]["commonName"]

        console.log(`\n${stopPointName}`) // LOG MESSAGE

        stopPointName = stopPointName.replace(/( Underground Station)$/gm, "");
        let stopPointDistance = Math.round(tflDataStations["stopPoints"][i]["distance"])
        let stopPointDistanceUnit = "m"
        if (stopPointDistance >= 1000) {
            stopPointDistance = stopPointDistance / 1000
            stopPointDistanceUnit = "km"
        }
        let stationText = w.addText(`${stopPointName}: ${stopPointDistance}${stopPointDistanceUnit}`) // Add station
        stationText.font = Font.boldSystemFont(13)
        stationText.textColor = wColor
        // stationText.centerAlignText()

        // TODO: RECTANGLE DRAWING
        /* const context = new DrawContext()
        context.size = new Size(60, 15)
        context.opaque = false
        context.respectScreenScale = true
        context.setFillColor(errColor)

        const path = new Path()
        path.addRoundedRect(new Rect(20, 0, 60, 15), 5, 5)
        context.addPath(path)
        context.fillPath()

        let img = w.addImage(context.getImage())
        img.resizable = true
        img.imageSize = new Size(60, 15)
        img.centerAlignImage() */

        const tubeGroup = tflDataStations["stopPoints"][i]["lineModeGroups"].filter(obj => stop_modes.includes(obj["modeName"])) // Get only selected stop modes
        for (var j = 0; j < tubeGroup[0]["lineIdentifier"].length; j++) { // Iterate through stations lines
            const lineId = tubeGroup[0]["lineIdentifier"][j]
            const lineName = getLineName(lineId)
            const lineColor = getLineColor(lineId)

            console.log(`\tFound ${lineName} Line`) // LOG MESSAGE

            let tflDataNextInbound = await fetchNextTrain(lineId, stopPointId, "inbound")
            let tflDataNextOutbound = await fetchNextTrain(lineId, stopPointId, "outbound")
            
            stack = w.addStack() // Line stack
            // stack.centerAlignContent()
            stack.layoutHorizontally()
            stack.setPadding(0, 10, 0, 0)
            
            const lineNameStack = stack.addText(`🚃 ${lineName}`)
            lineNameStack.font = Font.mediumSystemFont(12)
            lineNameStack.textColor = lineColor
            // lineNameStack.centerAlignText()
            
            if (wSize != "small") {
                let lineText = ""
                if (tflDataNextInbound.length != 0) {
                    tflDataNextInbound = tflDataNextInbound.sort((a, b) => a.timeToStation - b.timeToStation);
                    const trainTime = Math.round(tflDataNextInbound[0]["timeToStation"] / 60)
                    // const trainDirection = tflDataNextInbound[0]["platformName"].replace(/( - Platform \d)$/gm, "")
                    const trainDirection = filterDirectionName(tflDataNextInbound[0]["towards"])
                    lineText += ` (${trainTime}m, ${trainDirection})`
                    console.log(`\t\tNext train in ${lineName} line to ${trainDirection} is in ${trainTime} minutes`) // LOG MESSAGE
                }
                if (tflDataNextOutbound.length != 0) {
                    tflDataNextOutbound = tflDataNextOutbound.sort((a, b) => a.timeToStation - b.timeToStation);
                    const trainTime = Math.round(tflDataNextOutbound[0]["timeToStation"] / 60)
                    // const trainDirection = tflDataNextOutbound[0]["platformName"].replace(/( - Platform \d)$/gm, "")
                    const trainDirection = filterDirectionName(tflDataNextOutbound[0]["towards"])
                    lineText += ` (${trainTime}m, ${trainDirection})`
                    console.log(`\t\tNext train in ${lineName} line to ${trainDirection} is in ${trainTime} minutes`) // LOG MESSAGE
                }
                if (lineText) {
                    const lineDirectionStack = stack.addText(lineText) // Add station line
                    lineDirectionStack.font = Font.mediumSystemFont(10)
                    lineDirectionStack.textColor = lineColor
                    // lineDirectionStack.centerAlignText()
                    linesCount += 1
                }
            }
        }
    }

    w.addSpacer()
    addTime(w)

    return w

}

async function fetchNearStations(lat, lon, stopTypes, radius, modes) {
    try {
        let req = new Request(CONFIGURATION.api_endpoint + `/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=${stopTypes}&radius=${radius}&modes=${modes}&app_key=${app_key}`);
        req.headers = { "Cache-Control": "no-cache"};
        req.timeoutInterval = CONFIGURATION.requestTimeoutInterval;
        let json = await req.loadJSON();
        return json;
    } catch(err) {
        console.error(err);
        return null;
    }
}

async function fetchNextTrain(line, stopPointId, direction) {
    if (direction != "inbound" && direction != "outbound") {
        console.error("Wrong travel direction");
        return null;
    }
    try {
        let req = new Request(CONFIGURATION.api_endpoint + `/Line/${line}/Arrivals/${stopPointId}?direction=${direction}&app_key=${app_key}`);
        req.headers = { "Cache-Control": "no-cache" };
        req.timeoutInterval = CONFIGURATION.requestTimeoutInterval;
        let json = await req.loadJSON();
        return json;
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function getLocation() {
    let location
    try {
        Location.setAccuracyToThreeKilometers();
        location = await Location.current();
    } catch (error) {
        location = CONFIGURATION.defaultLocation;
    }
    return location
}

async function getTFLLogo(fm) {
    let path = wTheme == "dark" ? getFilePath(CONFIGURATION.tflLogoFileNameDark, fm) : getFilePath(CONFIGURATION.tflLogoFileNameLight, fm);

    if (fm.fileExists(path)) {
        const fileDownloaded = await fm.isFileDownloaded(path);
        if (!fileDownloaded) {
            await fm.downloadFileFromiCloud(path);
        }
        return fm.readImage(path);
    } else {
        // logo did not exist -> download it and save it for the next time the widget runs
        let logo = wTheme == "dark" ? await loadImage(CONFIGURATION.logoUrlDark) : await loadImage(CONFIGURATION.logoUrlLight);
        fm.writeImage(path, logo);
        return logo;
    }
}

function getFilePath(fileName, fm) {
    let dirPath = fm.joinPath(fm.documentsDirectory(), 'tflStatus');
    if (!fm.fileExists(dirPath)) {
        fm.createDirectory(dirPath);
    }
    return fm.joinPath(dirPath, fileName);
}

async function loadImage(imgUrl) {
    let req = new Request(imgUrl);
    req.timeoutInterval = CONFIGURATION.requestTimeoutInterval;
    let image = await req.loadImage();
    return image;
}

function getLineColor(lineId) {
    switch (lineId) {
        case "central":
            return new Color("#c6201c")
        case "tram":
            return new Color("#50a100")
        case "bakerloo":
            return new Color("#7b4620")
        case "circle":
            return new Color("#ffce00")
        case "district":
            return new Color("#006625")
        case "hammersmith-city":
            return new Color("#c1899d")
        case "jubilee":
            return new Color("#5f666c")
        case "metropolitan":
            return new Color("#751056")
        case "northern":
            return wTheme == "dark" ? new Color("#ffffff") : new Color("#000000")
        case "piccadilly":
            return new Color("#001697")
        case "victoria":
            return new Color("#0090cb")
        case "waterloo-city":
            return new Color("#6abbaa")
        case "london-overground":
            return new Color("#d05f0e")
        case "elizabeth":
            return new Color("#5e4891")
        case "dlr":
            return new Color("#009d9b")
        default:
            return wColor
    }
}

function getLineName(lineId) {
    switch (lineId) {
        case "central":
            return "Central"
        case "tram":
            return "Tram"
        case "bakerloo":
            return "Bakerloo"
        case "circle":
            return "Circle"
        case "district":
            return "District"
        case "hammersmith-city":
            // return "Hammersmith & City"
            return "Hamm. & City"
        case "jubilee":
            return "Jubilee"
        case "metropolitan":
            return "Metropolitan"
        case "northern":
            return "Northern"
        case "piccadilly":
            return "Piccadilly"
        case "victoria":
            return "Victoria"
        case "waterloo-city":
            // return "Waterloo & City"
            return "Waterloo"
        case "london-overground":
            return "London Overground"
        case "elizabeth":
            return "Elizabeth line"
        case "dlr":
            return "DLR"
        default:
            return lineId.charAt(0).toUpperCase() + lineId.slice(1);
    }
}

function filterDirectionName(directionFullName) {
    directionFullName = directionFullName.replace(/(Heathrow T123 \+ 5)$/gm, "LHR T123 + 5");
    directionFullName = directionFullName.replace(/(Heathrow via T4 Loop)$/gm, "LHR T4");
    directionFullName = directionFullName.replace(/( \(Circle\))$/gm, "");
    return directionFullName.replace(/( via )([A-Za-z ]+)$/gm, "");
}

function setTheme() {
    wBackground.locations = [0, 1]
    errColor = Color.red()

    if (wTheme == "system") {
        if (Device.isUsingDarkAppearance()) {
            wTheme = "dark"
        } else {
            wTheme = "light"
        }
    }
    if (wTheme == "dark") {
        wBackground.colors = [
            new Color("#113b92"),
            new Color("#113b92e6")
        ]
        wColor = new Color("#ffffff")
        tflColor = new Color("#eeeeee")
    } else {
        wBackground.colors = [
            new Color("#f5f5f5"),
            new Color("#ffffff")
        ]
        wColor = new Color("#000000")
        tflColor = new Color("#113b92")
    }
}

function addTime(w) {
    let layoutStack = w.addStack()
    layoutStack.centerAlignContent()

    const timeFormatter = new DateFormatter();
    timeFormatter.dateFormat = 'dd.MM.yyyy HH:mm:ss'
    layoutStack.addSpacer()
    let timeText = layoutStack.addText('t: ' + timeFormatter.string(new Date()))
    timeText.font = Font.thinSystemFont(9)
    timeText.textColor = wColor
    layoutStack.addSpacer()
}