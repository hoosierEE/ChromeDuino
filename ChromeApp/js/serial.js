// serial.js
// serial device connection utils

//// move data through serial port using ArrayBuffer containers /////{{{
// Interprets an ArrayBuffer as UTF-8 encoded string data.
var ab2str = function(buf) {
    var bufView = new Uint8Array(buf)
    var encodedString = String.fromCharCode.apply(null, bufView)
    return decodeURIComponent(escape(encodedString))
}

// Converts a string to UTF-8 encoding in a Uint8Array returns the array buffer.
var str2ab = function(str) {
    var encodedString = unescape(encodeURIComponent(str))
    var bytes = new Uint8Array(encodedString.length)
    for (var i = 0; i < encodedString.length; ++i) {
        bytes[i] = encodedString.charCodeAt(i)
    }
    return bytes.buffer
}
//}}}

//// SerialConnection interface object //////{{{
var SerialConnection = function() {
    this.connectionId = -1
    this.lineBuffer = ""
    this.boundOnReceive = this.onReceive.bind(this)
    this.boundOnReceiveError = this.onReceiveError.bind(this)
    this.onConnect = new chrome.Event()
    this.onReadLine = new chrome.Event()
    this.onError = new chrome.Event()
}

SerialConnection.prototype.onConnectComplete = function(connectionInfo) {
    if (!connectionInfo) {
        statusBar("Connection failed.")
        return
    }
    this.connectionId = connectionInfo.connectionId
    chrome.serial.onReceive.addListener(this.boundOnReceive)
    chrome.serial.onReceiveError.addListener(this.boundOnReceiveError)
    this.onConnect.dispatch()
}

SerialConnection.prototype.onReceive = function(receiveInfo) {
    if (receiveInfo.connectionId !== this.connectionId) {
        return
    }
    this.lineBuffer += ab2str(receiveInfo.data)
    var index
    while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
        var line = this.lineBuffer.substr(0, index + 1)
        this.onReadLine.dispatch(line)
        this.lineBuffer = this.lineBuffer.substr(index + 1)
    }
}

SerialConnection.prototype.onReceiveError = function(errorInfo) {
    if (errorInfo.connectionId === this.connectionId) {
        this.onError.dispatch(errorInfo.error)
    }
}

SerialConnection.prototype.getDevices = function(callback) {
    chrome.serial.getDevices(callback)
}

SerialConnection.prototype.connect = function(path) {
    chrome.serial.connect(path, this.onConnectComplete.bind(this))
}

SerialConnection.prototype.send = function(msg) {
    if (this.connectionId < 0) {
        throw 'Invalid connection'
    }
    chrome.serial.send(this.connectionId, str2ab(msg), function(){})
}

SerialConnection.prototype.disconnect = function() {
    if (this.connectionId < 0) {
        throw 'Invalid connection'
    }
    this.lineBuffer = ""
}
//}}}

//// FUNCTIONS //////{{{
function log(msg) {
    var buffer = document.querySelector('#textAreaId')
    buffer.value += msg
}
function statusBar(msg) {
    var bar = document.querySelector('output')
    bar.innerHTML = msg
}//}}}

//// instance of serial connection object ////
var connection = new SerialConnection()

connection.onConnect.addListener(function() {
    statusBar('connected to device ID ' + connection.connectionId)
    startExperimentButton.disabled = false
})

// capture incoming serial data and put it somewhere
connection.onReadLine.addListener(function(line) {
    if (!/,/.test(line))
        log("wow\n")
    else
        log(line)
})

// Populate the list of available devices//{{{
function populateDeviceList() {
    connection.getDevices(function(ports) {
        dropDown.innerHTML = ""
        ports.forEach(function (port) {
            var displayName = port["displayName"]
            if (!displayName) {
                displayName = port.path
            }
            var newOption = document.createElement("option")
            newOption.text = displayName
            newOption.value = port.path
            dropDown.appendChild(newOption)
        })
    })
}
// Populate the list when the app loads
populateDeviceList()//}}}


//// Interact with elements on the page //////{{{
var dropDown = document.querySelector('#port_list')
var connectButton = document.querySelector('#connect_button')
var disconnectButton = document.querySelector('#disconnect_button')
var startExperimentButton = document.querySelector('#start_experiment_button')
var stopExperimentButton = document.querySelector('#stop_experiment_button')//}}}

// Handle drop-down menu events//{{{
dropDown.addEventListener('click', function() {
    populateDeviceList()
    statusBar("refreshing port list")
})
dropDown.addEventListener('change', function() {
    statusBar("selected " + dropDown.options[dropDown.selectedIndex].value)
})//}}}

// Disconnect//{{{
disconnectButton.addEventListener('click', function() {
    var devicePath = dropDown.options[dropDown.selectedIndex].value
    statusBar("disconnecting from " + devicePath)
    connection.disconnect(devicePath)
    startExperimentButton.disabled = true
    connectButton.disabled = false
    disconnectButton.disabled = true
})//}}}

// Connect to the chosen device//{{{
connectButton.addEventListener('click', function() {
    var devicePath = dropDown.options[dropDown.selectedIndex].value
    connection.connect(devicePath)
    statusBar("connecting to " + devicePath)
    connectButton.disabled = true
    disconnectButton.disabled = false
})//}}}

// Start Experiment//{{{
startExperimentButton.addEventListener('click', beginExperimentFn)
function beginExperimentFn() {
    // "BLEEEEEEEEEEP!"
    connection.send("b") // begin
    startExperimentButton.disabled = true
    stopExperimentButton.disabled = false
}//}}}

// Stop Experiment//{{{
stopExperimentButton.addEventListener('click', function() {
    // connectButton.disabled = false
    connection.send("s") // stop
    startExperimentButton.disabled = false
    stopExperimentButton.disabled = true
})//}}}
