/*
 * 1. IMPORT FIREBASE LIBRARIES
 * We are importing them from the web (CDN)
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, query, onValue, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";


/*
 * 2. PASTE YOUR FIREBASE CONFIG HERE
 * Get this from your Firebase Project Settings:
 * Go to Firebase > Project Settings (gear icon) > General tab
 * Scroll down to "Your apps"
 * Click the "Web" app (</>)
 * Find the 'firebaseConfig' object and copy-paste it here.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCwbt6Ftkw5TMjeIwRkms-72TiOy7vwc4g",
  authDomain: "sena-floodwatch.firebaseapp.com",
  databaseURL: "https://sena-floodwatch-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sena-floodwatch",
  storageBucket: "sena-floodwatch.firebasestorage.app",
  messagingSenderId: "653451923693",
  appId: "1:653451923693:web:23c6eb7c80491ec122bce4",
};

/*
 * 3. INITIALIZE FIREBASE AND CHART
 */
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const ctx = document.getElementById('waterLevelChart').getContext('2d');

const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // X-axis labels (times)
        datasets: [
            {
                label: 'flood-monitor-03',
                data: [], // Y-axis data (distances)
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2,
                fill: true,
            },
            {
                label: 'flood-monitor-06',
                data: [], // Y-axis data (distances)
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2,
                fill: true,
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                title: { display: true, text: 'Distance (cm)' }
            },
            x: {
                title: { display: true, text: 'Time' }
            }
        }
    }
});


/*
 * 4. FUNCTION TO LISTEN FOR DATA
 * This function will listen for a specific device and update the chart.
 */
function listenToDevice(deviceId, datasetIndex) {
    
    // --- DEBUG CHECKPOINT 1 ---
    // First, let's see if this function is even being called correctly.
    const path = `devices/${deviceId}/readings`;
    console.log(`Attempting to listen to: ${path}`);

    const readingsRef = query(
        ref(db, path),
        limitToLast(20) // IMPORTANT: Limits to 20 data points
    );

    // onValue() listens for any changes in real-time
    onValue(readingsRef, (snapshot) => {
        
        // --- DEBUG CHECKPOINT 2 ---
        // Does the data exist at that path?
        console.log(`Snapshot for ${deviceId} exists?`, snapshot.exists());
        
        if (!snapshot.exists()) {
            return; // This is probably what's happening
        }

        // --- DEBUG CHECKPOINT 3 ---
        // If it exists, WHAT is the data?
        console.log(`Data received for ${deviceId}:`, snapshot.val());

        const readings = snapshot.val();
        
        const newLabels = [];
        const newData = [];

        for (const key in readings) {
            const reading = readings[key];
            newLabels.push(new Date(reading.time).toLocaleTimeString());
            newData.push(reading.distance);
        }

        myChart.data.labels = newLabels;
        myChart.data.datasets[datasetIndex].data = newData;
        myChart.update();
    });
}


/*
 * 5. START LISTENING TO OUR DEVICES
 * We tell the chart which dataset to update for each device.
 */
listenToDevice('flood-monitor-03', 0); // Updates dataset 0 (blue)
listenToDevice('flood-monitor-06', 1); // Updates dataset 1 (red)
