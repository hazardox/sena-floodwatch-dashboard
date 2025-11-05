/*
 * 1. IMPORT FIREBASE LIBRARIES
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, query, onValue, limitToLast, orderByKey, startAt, off } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

/*
 * 2. PASTE YOUR FIREBASE CONFIG HERE
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
        labels: [],
        datasets: [
            {
                label: 'flood-monitor-03',
                data: [],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2,
                fill: true,
            },
            {
                label: 'flood-monitor-06',
                data: [],
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
            y: { title: { display: true, text: 'Distance (cm)' } },
            x: { title: { display: true, text: 'Time' } }
        },
        // This makes the chart redraws smoother
        animation: {
            duration: 250
        }
    }
});

/*
 * 4. NEW LOGIC: VARIABLES TO MANAGE LISTENERS
 */
const devices = [
    { id: 'flood-monitor-03', datasetIndex: 0 },
    { id: 'flood-monitor-06', datasetIndex: 1 }
];

// We need to store our active listeners so we can remove them later
let activeListeners = [];

// Get references to our new buttons
const btn20 = document.getElementById('btn-20');
const btn1h = document.getElementById('btn-1h');
const btn6h = document.getElementById('btn-6h');
const btn24h = document.getElementById('btn-24h');

/*
 * 5. NEW LOGIC: MAIN FUNCTION TO UPDATE THE CHART
 */
function updateDashboard(timeframe) {
    // A. First, remove all old listeners to prevent data leaks
    for (const listener of activeListeners) {
        off(listener.ref, listener.type, listener.callback);
    }
    activeListeners = []; // Clear the array

    // B. Clear the chart of old data
    myChart.data.labels = [];
    myChart.data.datasets.forEach(dataset => {
        dataset.data = [];
    });
    myChart.update();

    // C. Calculate our start time
    const now = new Date().getTime(); // e.g., 1730800000000
    let startTime = null;
    
    if (timeframe === '1h') {
        startTime = now - (1 * 60 * 60 * 1000); // 1 hour ago
    } else if (timeframe === '6h') {
        startTime = now - (6 * 60 * 60 * 1000); // 6 hours ago
    } else if (timeframe === '24h') {
        startTime = now - (24 * 60 * 60 * 1000); // 24 hours ago
    }

    // D. Loop through each device and create the correct query
    devices.forEach(device => {
        const path = `devices/${device.id}/readings`;
        let readingsRef;

        if (timeframe === '20r') {
            // --- Query for "Last 20 Readings" ---
            readingsRef = query(ref(db, path), limitToLast(20));
        } else {
            // --- Query for a time range ---
            // We order by key (which is our timestamp) and start at the calculated time
            readingsRef = query(
                ref(db, path),
                orderByKey(), // Order by the timestamp key
                startAt(startTime.toString()) // Get everything *after* this time
            );
        }

        // E. Create the new listener function
        const onDataChange = (snapshot) => {
            if (!snapshot.exists()) {
                console.log(`No data for ${device.id} in this range.`);
                return;
            }

            const readings = snapshot.val();
            const newLabels = [];
            const newData = [];

            for (const key in readings) {
                const reading = readings[key];
                // Check if 'reading.time' exists before formatting
                if (reading && reading.time) {
                    newLabels.push(new Date(reading.time).toLocaleTimeString());
                    newData.push(reading.distance);
                }
            }

            // Update the specific dataset for this device
            myChart.data.datasets[device.datasetIndex].data = newData;
            
            // Only update labels from the first device to avoid duplicates
            if (device.datasetIndex === 0) {
                myChart.data.labels = newLabels;
            }
            myChart.update();
        };

        // F. Attach the new listener
        onValue(readingsRef, onDataChange);

        // G. Store this new listener so we can remove it later
        activeListeners.push({ ref: readingsRef, type: 'value', callback: onDataChange });
    });
}

/*
 * 6. NEW LOGIC: BUTTON EVENT LISTENERS
 */
function handleButtonClick(e) {
    // Remove 'active' class from all buttons
    document.querySelectorAll('.filter-controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    // Add 'active' class to the one that was clicked
    e.target.classList.add('active');
}

btn20.addEventListener('click', (e) => {
    handleButtonClick(e);
    updateDashboard('20r'); // 20 readings
});

btn1h.addEventListener('click', (e) => {
    handleButtonClick(e);
    updateDashboard('1h'); // 1 hour
});

btn6h.addEventListener('click', (e) => {
    handleButtonClick(e);
    updateDashboard('6h'); // 6 hours
});

btn24h.addEventListener('click', (e) => {
    handleButtonClick(e);
    updateDashboard('24h'); // 24 hours
});

/*
 * 7. NEW LOGIC: LOAD THE INITIAL DASHBOARD VIEW
 */
// Load the "Last 20 Readings" view by default when the page opens
updateDashboard('20r');
