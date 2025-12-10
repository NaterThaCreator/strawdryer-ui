// control.js - SECURE SENDER WITH HEALTH AND STATUS CHECKS

// *** CRITICAL: YOUR DEPLOYED CLOUDFLARE WORKER URL ***
const WORKER_URL = "https://rapid-star-f817.fieldsnathanj.workers.dev"; 

// --- STATUS FEED (READ-ONLY) ---
const AIO_USERNAME = "naterthacreator";
const AIO_FEED_STATUS_URL = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/straw-dryer-status/data/last`;

// --- UI Elements ---
const blades = document.getElementById('fanBlades');
const label = document.getElementById('statusLabel');
const workerDot = document.getElementById('workerDot'); 
const deviceDot = document.getElementById('deviceDot'); 
const timeReadout = document.getElementById('timeReadout'); 
const slider = document.getElementById('slider'); 

// --- Timer Variables ---
let countdownInterval = null;
let timeLeftSeconds = 0;

// 1. Worker Health Check (Periodic, non-blocking)
function pollWorkerHealth() {
    fetch(WORKER_URL + '?command=HEALTH_CHECK') 
        .then(response => {
            if (response.ok) {
                workerDot.classList.add('connected');
            } else {
                workerDot.classList.remove('connected');
            }
        })
        .catch(() => {
            workerDot.classList.remove('connected');
        });
}

// 2. ESP32 Device Health Check (LWT Status)
function pollDeviceStatus() {
    fetch(AIO_FEED_STATUS_URL) 
        .then(response => response.json())
        .then(data => {
            const status = data.value;
            if (status === "ONLINE") {
                deviceDot.classList.add('connected');
                if (label.innerText === "NETWORK ERROR" || label.innerText === "DEVICE OFFLINE" || label.innerText === "LOADING STATUS...") {
                    setStandbyUI();
                }
            } else if (status === "OFFLINE") {
                deviceDot.classList.remove('connected');
                blades.classList.remove('spinning');
                stopCountdown();
                label.innerText = "DEVICE OFFLINE";
                label.style.color = "var(--danger)";
            }
        })
        .catch(() => {
            deviceDot.classList.remove('connected');
        });
}

// 3. Command Sender Function
function sendCommand(command) {
    if (!workerDot.classList.contains('connected')) {
        label.innerText = "PROXY OFFLINE - CANNOT SEND";
        label.style.color = "var(--danger)";
        return;
    }
    
    // Check if the ESP32 is online before sending command
    if (command === 'ON' && !deviceDot.classList.contains('connected')) {
        alert("The ESP32 is currently OFFLINE. Please check the device before engaging.");
        return;
    }

    const fetchURL = `${WORKER_URL}?command=${command}`;
    
    fetch(fetchURL)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        })
        .then(() => {
            // Success: Update UI instantly and manage timer
            if (command === 'ON') {
                const durationMinutes = parseInt(slider.value); 
                setRunningUI(durationMinutes);
            } else if (command === 'OFF') {
                setStandbyUI();
            }
        })
        .catch(error => {
            // Failure: Show error state
            label.innerText = `SEND FAILED: ${error.message}`;
            label.style.color = "var(--danger)";
            blades.classList.remove('spinning');
            stopCountdown();
        });
}

// 4. UI State and Countdown Logic
function setRunningUI(durationMinutes) {
    blades.classList.add('spinning');
    label.innerText = "SYSTEM ENGAGED";
    label.style.color = "var(--primary)";

    timeLeftSeconds = durationMinutes * 60;
    startCountdown();
}

function setStandbyUI() {
    blades.classList.remove('spinning');
    label.innerText = "SYSTEM STANDBY";
    label.style.color = "var(--text)";

    stopCountdown();
    const minutes = parseInt(slider.value);
    timeReadout.innerText = minutes + "m";
}

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        timeLeftSeconds--;

        if (timeLeftSeconds <= 0) {
            clearInterval(countdownInterval);
            timeLeftSeconds = 0;
            sendCommand('OFF'); 
            return;
        }

        const minutes = Math.floor(timeLeftSeconds / 60);
        const seconds = timeLeftSeconds % 60;
        
        label.innerText = `ENGAGED - ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    }, 1000);
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// 5. Initial Setup and Continuous Polling
setInterval(pollWorkerHealth, 5000);   // Check Worker every 5 seconds
setInterval(pollDeviceStatus, 5000);   // Check Device LWT every 5 seconds
document.addEventListener('DOMContentLoaded', () => {
    pollWorkerHealth(); 
    pollDeviceStatus();
    setStandbyUI();
});
