// control.js - SIMPLIFIED TO TALK TO CLOUDFLARE WORKER

// *** CRITICAL: REPLACE THIS WITH YOUR CLOUDFLARE WORKER'S URL ***
// Example: https://straw-dryer-proxy.naterthacreator.workers.dev
const WORKER_URL = "YOUR_CLOUDFLARE_WORKER_URL_HERE"; 

// --- UI Elements ---
const blades = document.getElementById('fanBlades');
const label = document.getElementById('statusLabel');
const dot = document.getElementById('connDot');
const timeReadout = document.getElementById('timeReadout'); 
const slider = document.getElementById('slider'); 

// --- Timer Variables ---
let countdownInterval = null;
let timeLeftSeconds = 0;

// Set initial UI state
document.addEventListener('DOMContentLoaded', setStandbyUI);

// 1. Command Sender Function (Called by your HTML buttons)
function sendCommand(command) {
    dot.classList.remove('connected'); // Show connection activity immediately
    label.innerText = `SENDING ${command}...`;
    label.style.color = "var(--primary)";

    // Append the command to the Worker's URL
    const fetchURL = `${WORKER_URL}?command=${command}`;
    
    fetch(fetchURL)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return response.text();
        })
        .then(() => {
            // Success: Update UI instantly and manage timer
            dot.classList.add('connected');
            if (command === 'ON') {
                const durationMinutes = parseInt(slider.value); 
                setRunningUI(durationMinutes);
            } else if (command === 'OFF') {
                setStandbyUI();
            }
        })
        .catch(error => {
            // Failure: Show error state
            dot.classList.remove('connected');
            label.innerText = `ERROR: ${error.message}`;
            label.style.color = "var(--danger)";
            blades.classList.remove('spinning');
            stopCountdown();
        });
}

// 2. UI State Management Functions
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

// 3. Countdown Logic
function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        timeLeftSeconds--;

        if (timeLeftSeconds <= 0) {
            clearInterval(countdownInterval);
            timeLeftSeconds = 0;
            // Send the OFF command to ensure the ESP32 turns off when the timer expires
            sendCommand('OFF'); 
            // Note: sendCommand calls setStandbyUI on success
            return;
        }

        const minutes = Math.floor(timeLeftSeconds / 60);
        const seconds = timeLeftSeconds % 60;
        
        // Format the time as M:SS
        label.innerText = `ENGAGED - ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    }, 1000);
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}
