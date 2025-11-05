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
  measurementId: "G-QBX2C5EZ0M"
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
    // This query gets the LAST 20 readings from the 'readings' list
    const readingsRef = query(
        ref(db, `devices/${deviceId}/readings`),
        limitToLast(20) // IMPORTANT: Limits to 20 data points
    );

    // onValue() listens for any changes in real-time
    onValue(readingsRef, (snapshot) => {
        if (!snapshot.exists()) {
            console.log(`No data for ${deviceId}`);
            return;
        }

        const readings = snapshot.val(); // This is an object like {-M...: {dist, time}, -M...: {dist, time}}
        
        const newLabels = [];
        const newData = [];

        // Loop through the object of readings and put them in arrays
        for (const key in readings) {
            const reading = readings[key];
            newLabels.push(new Date(reading.time).toLocaleTimeString()); // Format time for X-axis
            newData.push(reading.distance); // Get distance for Y-axis
        }

        // Update the chart with the new data
        myChart.data.labels = newLabels; // Set the X-axis labels
        myChart.data.datasets[datasetIndex].data = newData; // Set the Y-axis data
        myChart.update(); // Re-draw the chart
    });
}


/*
 * 5. START LISTENING TO OUR DEVICES
 * We tell the chart which dataset to update for each device.
 */
listenToDevice('flood-monitor-03', 0); // Updates dataset 0 (blue)
listenToDevice('flood-monitor-06', 1); // Updates dataset 1 (red)
