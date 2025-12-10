// control.js

// --- YOUR ADAFRUIT IO CREDENTIALS (MUST MATCH ESP32) ---
const AIO_USERNAME = "naterthacreator";
const AIO_KEY = "aio_hgeg007pyt5eeauywpR86J6tdFjX";
const AIO_SERVER = "io.adafruit.com";
const AIO_FEED_CONTROL = AIO_USERNAME + "/feeds/straw-dryer-control";

// --- UI Elements ---
const blades = document.getElementById('fanBlades');
const label = document.getElementById('statusLabel');
const dot = document.getElementById('connDot');

// 1. MQTT Connection Setup
// Use port 443 for secure WebSocket connection
const client = new Paho.MQTT.Client(AIO_SERVER, 443, "/mqtt", "web-client-" + Math.random()); 

// Set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived; // Not used for control, but kept for future status updates
client.connect({ onSuccess: onConnect, useSSL: true, userName: AIO_USERNAME, password: AIO_KEY });

// 2. MQTT Event Handlers
function onConnect() {
    console.log("MQTT Connected!");
    dot.classList.add('connected');
    label.innerText = "STANDBY";
    label.style.color = "var(--text)";
    
    // Subscribe is not needed unless the ESP32 is sending data back, but harmless to leave.
    client.subscribe(AIO_FEED_CONTROL); 
}

function onConnectionLost(responseObject) {
    console.error("Connection Lost: " + responseObject.errorMessage);
    dot.classList.remove('connected');
    label.innerText = "DISCONNECTED";
    label.style.color = "var(--danger)";
}

function onMessageArrived(message) {
    // This function would be used if the ESP32 published its state (e.g., "Timer Finished")
}

// 3. Command Sender Function (Called by your HTML buttons)
function sendCommand(command) {
    if (client.isConnected()) {
        const message = new Paho.MQTT.Message(command);
        message.destinationName = AIO_FEED_CONTROL; // Topic for the ESP32
        client.send(message);
        console.log(`Sent command: ${command}`);

        // Update UI instantly for instant feedback
        if (command === 'ON') {
            blades.classList.add('spinning');
            label.innerText = "SYSTEM ENGAGED";
            label.style.color = "var(--primary)";
        } else if (command === 'OFF') {
            blades.classList.remove('spinning');
            label.innerText = "SYSTEM STANDBY";
            label.style.color = "var(--text)";
        }
    } else {
        console.error("MQTT client not connected! Please check console for details.");
        label.innerText = "ERROR: NOT CONNECTED";
        label.style.color = "var(--danger)";
    }
}
