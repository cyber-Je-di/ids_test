document.addEventListener('DOMContentLoaded', () => {
    // A single function to fetch alerts and delegate rendering
    async function updatePages() {
        try {
            const response = await fetch('/get_alerts');
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            const alerts = await response.json();

            // Check which page is active and call the correct renderer
            if (document.getElementById('threat-log')) {
                renderThreatLogPage(alerts);
            }
            if (document.getElementById('network-events')) {
                renderIntrusionPage(alerts);
            }

        } catch (error) {
            console.error("Failed to fetch or render threat data:", error);
        }
    }

    // --- Renderer for threat_logs.html ---
    function renderThreatLogPage(alerts) {
        const logContainer = document.getElementById('threat-log');
        if (!logContainer) return;

        if (alerts.length === 0) {
            logContainer.innerHTML = '<p class="text-center text-gray-400 p-4">No threat logs found.</p>';
            return;
        }

        // Simple table structure
        let tableHtml = `
            <table class="log-table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Attack Type</th>
                        <th>Source IP</th>
                        <th>Destination IP</th>
                        <th>ML Prediction</th>
                    </tr>
                </thead>
                <tbody>
        `;

        alerts.forEach(alert => {
            const isAttack = alert.ml_prediction === 'Attack';
            tableHtml += `
                <tr class="log-entry ${isAttack ? 'log-attack' : ''}">
                    <td>${new Date(alert.timestamp).toLocaleString()}</td>
                    <td>${alert.attack_type}</td>
                    <td class="font-mono">${alert.source_ip}</td>
                    <td class="font-mono">${alert.dest_ip}</td>
                    <td class="${isAttack ? 'text-red-400' : 'text-green-400'}">${alert.ml_prediction}</td>
                </tr>
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
