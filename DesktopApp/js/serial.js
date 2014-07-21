// serial.js
// utilities for connecting to a serial device

const serial = chrome.serial;

//////////////////////////////////////////////////////////////////
/// move data through serial port using ArrayBuffer containers ///
//
// Interprets an ArrayBuffer as UTF-8 encoded string data.
var ab2str = function(buf) {
  var bufView = new Uint8Array(buf);
  var encodedString = String.fromCharCode.apply(null, bufView);
  return decodeURIComponent(escape(encodedString));
};

// Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer.
var str2ab = function(str) {
  var encodedString = unescape(encodeURIComponent(str));
  var bytes = new Uint8Array(encodedString.length);
  for (var i = 0; i < encodedString.length; ++i) {
    bytes[i] = encodedString.charCodeAt(i);
  }
  return bytes.buffer;
};
////////////////////////////////////////////////////////


////////////////////////////////////////////////////////
/// SerialConnection interface object //////////////////
//
var SerialConnection = function() {
  this.connectionId = -1;
  this.lineBuffer = "";
  this.boundOnReceive = this.onReceive.bind(this);
  this.boundOnReceiveError = this.onReceiveError.bind(this);
  this.onConnect = new chrome.Event();
  this.onReadLine = new chrome.Event();
  this.onError = new chrome.Event();
};

SerialConnection.prototype.onConnectComplete = function(connectionInfo) {
  if (!connectionInfo) {
    statusBar("Connection failed.");
    return;
  }
  this.connectionId = connectionInfo.connectionId;
  serial.onReceive.addListener(this.boundOnReceive);
  serial.onReceiveError.addListener(this.boundOnReceiveError);
  this.onConnect.dispatch();
};

SerialConnection.prototype.onReceive = function(receiveInfo) {
  if (receiveInfo.connectionId !== this.connectionId) {
    return;
  }
  this.lineBuffer += ab2str(receiveInfo.data);
  var index;
  while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
    var line = this.lineBuffer.substr(0, index + 1);
    this.onReadLine.dispatch(line);
    this.lineBuffer = this.lineBuffer.substr(index + 1);
  }
};

SerialConnection.prototype.onReceiveError = function(errorInfo) {
  if (errorInfo.connectionId === this.connectionId) {
    this.onError.dispatch(errorInfo.error);
  }
};

SerialConnection.prototype.getDevices = function(callback) {
  serial.getDevices(callback)
};

SerialConnection.prototype.connect = function(path) {
  serial.connect(path, this.onConnectComplete.bind(this))
};

SerialConnection.prototype.send = function(msg) {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.send(this.connectionId, str2ab(msg), function() {});
};

SerialConnection.prototype.disconnect = function() {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
};
////////////////////////////////////////////////////////

////////////////////////////////////////////////////////

function log(msg) {
  var buffer = document.querySelector('#textAreaId');
  buffer.value += msg;
}

function statusBar(msg) {
  var bar = document.querySelector('output');
  bar.innerHTML = msg;
}

var connection = new SerialConnection();

connection.onConnect.addListener(function() {
  statusBar('connected to device ID ' + connection.connectionId);
});

// capture incoming serial data and put it somewhere
connection.onReadLine.addListener(function(line) {
  log(line);
});

// Populate the list of available devices
function getDevicesFn() {
  connection.getDevices(function(ports) {
    // get drop-down port selector
    var dropDown = document.querySelector('#port_list');
    dropDown.innerHTML = "";  // clear existing options
    ports.forEach(function (port) { // add new options
      var displayName = port["displayName"]; // + "("+port.path+")";
      if (!displayName) displayName = port.path;
      var newOption = document.createElement("option");
      newOption.text = displayName;
      newOption.value = port.path;
      dropDown.appendChild(newOption);
    });
  });
}
getDevicesFn(); // populate the list when the app loads

function refreshDevices() {
  getDevicesFn();
  statusBar("refreshing port list");
}

function disconnectDevice() {
  chrome.serial.disconnect(connection.connectionId, function(result) {
    connection.lineBuffer = ""; // clear the buffer
    statusBar("disconnected from " + connection.connectionId);
  });
}

//////////////////////////////////////////////////
/// Interact with elements on the page ///////////
//
var dropDown = document.querySelector('#port_list');
var connectButton = document.querySelector('#connect_button');
var startExperiment = document.querySelector('#start_experiment_button');
var stopExperiment = document.querySelector('#stop_experiment_button');

// repopulate the drop-down if it is clicked
dropDown.addEventListener('click', refreshDevices);

// disconnect if changed TODO: not sure if 'change' is correct
//dropDown.addEventListener('change', disconnectDevice);

// Connect to the chosen device
connectButton.addEventListener('click', function() {
  var devicePath = dropDown.options[dropDown.selectedIndex].value; // the chosen one
  statusBar("Connecting to "+devicePath);
  connection.connect(devicePath);
  startExperiment.disabled = false;
});

// Start Experiment
startExperiment.addEventListener('click', function() {
  connection.send("b"); // "BLEEEEEEEEEEP!"
  connectButton.disabled = true;
  startExperiment.disabled = true;
  stopExperiment.disabled = false;
});

// Stop Experiment
stopExperiment.addEventListener('click', function() {
  disconnectDevice();
  connectButton.disabled = false;
  startExperiment.disabled = false;
  stopExperiment.disabled = true;
});