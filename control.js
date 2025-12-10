// control.js

// YOUR ADAFRUIT IO CREDENTIALS (Must match the ESP32 code)
const AIO_USERNAME = "naterthacreator";
const AIO_KEY = "aio_hgeg007pyt5eeauywpR86J6tdFjX";
const AIO_SERVER = "io.adafruit.com";
const AIO_FEED_CONTROL = AIO_USERNAME + "/feeds/straw-dryer-control"; // naterthacreator/feeds/straw-dryer-control

// 1. MQTT Connection Setup
// Port 443 is used for secure MQTT over WebSockets (useSSL: true)
const client = new Paho.MQTT.Client(AIO_SERVER, 443, "/mqtt", "web-client-" + Math.random()); 

// Set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;
client.connect({ onSuccess: onConnect, useSSL: true, userName: AIO_USERNAME, password: AIO_KEY });

// 2. Event Handlers
function onConnect() {
    console.log("MQTT Connected!");
    // The web UI subscribes to the feed to know the current state (if the ESP32 was publishing, which is a future step)
    client.subscribe(AIO_FEED_CONTROL);
    // Initial UI state update (you can update status text here if needed)
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Connection Lost: " + responseObject.errorMessage);
    }
}

function onMessageArrived(message) {
    // This is where you would process status messages sent FROM the ESP32, if you add that capability later.
    console.log("Status Message Arrived on Topic " + message.destinationName + ": " + message.payloadString);
}

// 3. Command Sender Function (Called by your HTML buttons)
function sendCommand(command) {
    if (client.isConnected()) {
        const message = new Paho.MQTT.Message(command);
        message.destinationName = AIO_FEED_CONTROL; // This is the topic the ESP32 is listening to
        client.send(message);
        console.log(`Sent command: ${command}`);

        // OPTIONAL: Update UI instantly for faster visual feedback
        const statusElement = document.getElementById('statusText'); // Assuming your status element is id='statusText'
        if (statusElement) {
            if (command === 'ON') {
                statusElement.innerText = "SYSTEM ENGAGED (Sending ON command)";
            } else if (command === 'OFF') {
                statusElement.innerText = "SYSTEM STANDBY (Sending OFF command)";
            }
        }
    } else {
        console.error("MQTT client not connected! Please refresh the page.");
    }
}
