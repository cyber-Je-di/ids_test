document.addEventListener('DOMContentLoaded', () => {
    // A single function to fetch alerts and delegate rendering
    async function updatePages() {
        try {
            const response = await fetch('/get_alerts');
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            const alerts = await response.json();
            `;
        });

        tableHtml += '</tbody></table>';
        logContainer.innerHTML = tableHtml;
    }

    // --- Renderer for threat_intrusion.html ---
    function renderIntrusionPage(alerts) {
        const networkEventsEl = document.getElementById('network-events');
        const anomaliesEl = document.getElementById('anomalies');
        const responseTimeEl = document.getElementById('response-time');

        if (networkEventsEl) {
            networkEventsEl.textContent = alerts.length;
        }
        // Data for anomalies and response time is not available in the alerts object.
        // We will display 0 instead of random numbers.
        if (anomaliesEl) {
            anomaliesEl.textContent = '0';
        }
        if (responseTimeEl) {
            responseTimeEl.textContent = 'N/A';
        }
    }

    // Initial load
    updatePages();

    // Set an interval to refresh the data periodically
    setInterval(updatePages, 5000); // Refresh every 5 seconds
});

// Note: The filterLogs function from the original HTML is not implemented
// as the severity data is not available in the alert objects.
// This could be a future enhancement.
function filterLogs(severity) {
    console.log(`Filtering by ${severity} is not yet implemented.`);
    // To make this work, the alert objects from /get_alerts would need a 'severity' property.
}
