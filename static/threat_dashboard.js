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

document.addEventListener("DOMContentLoaded", function () {
  const threatLogBody = document.querySelector("#threat-log-table tbody");
  const loadingMessage = document.getElementById("loading-message");
  const searchInput = document.getElementById("searchInput");

  // --- Mock Data ---
  // In a real application, this would come from an API
  const mockThreats = [
    {
      timestamp: new Date().toISOString(),
      source_ip: "203.0.113.45",
      type: "SQL Injection",
      severity: "High",
      action: "Blocked",
    },
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      source_ip: "198.51.100.12",
      type: "DDoS",
      severity: "Critical",
      action: "Rate Limited",
    },
    {
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      source_ip: "192.0.2.88",
      type: "Malware",
      severity: "High",
      action: "Quarantined",
    },
    {
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      source_ip: "203.0.113.101",
      type: "XSS",
      severity: "Medium",
      action: "Sanitized",
    },
    {
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      source_ip: "198.51.100.200",
      type: "Phishing",
      severity: "Low",
      action: "Logged",
    },
    {
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      source_ip: "192.0.2.15",
      type: "Brute Force",
      severity: "Medium",
      action: "Blocked",
    },
    {
      timestamp: new Date(Date.now() - 90000000).toISOString(),
      source_ip: "203.0.113.50",
      type: "SQL Injection",
      severity: "High",
      action: "Blocked",
    },
  ];

  const getSeverityClass = (severity) => {
    switch (severity.toLowerCase()) {
      case "low":
        return "severity-low";
      case "medium":
        return "severity-medium";
      case "high":
        return "severity-high";
      case "critical":
        return "severity-critical";
      default:
        return "bg-gray-700 text-gray-300";
    }
  };

  const populateTable = (threats) => {
    if (!threatLogBody) return;
    threatLogBody.innerHTML = ""; // Clear existing logs

    if (threats.length === 0) {
      threatLogBody.innerHTML =
        '<tr><td colspan="5" class="text-center text-gray-400 p-4">No threats found.</td></tr>';
      return;
    }

    threats.forEach((threat) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td class="py-3 px-4 text-sm text-gray-400">${moment(
                  threat.timestamp
                ).format("YYYY-MM-DD HH:mm:ss")}</td>
                <td class="py-3 px-4 text-sm font-mono">${threat.source_ip}</td>
                <td class="py-3 px-4 text-sm">${threat.type}</td>
                <td class="py-3 px-4 text-sm">
                    <span class="severity-indicator ${getSeverityClass(
                      threat.severity
                    )}">
                        ${threat.severity}
                    </span>
                </td>
                <td class="py-3 px-4 text-sm">${threat.action}</td>
            `;
      threatLogBody.appendChild(row);
    });
  };

  const filterLogs = () => {
    const query = searchInput.value.toLowerCase();
    const filteredThreats = mockThreats.filter(
      (threat) =>
        threat.source_ip.toLowerCase().includes(query) ||
        threat.type.toLowerCase().includes(query) ||
        threat.severity.toLowerCase().includes(query) ||
        threat.action.toLowerCase().includes(query)
    );
    populateTable(filteredThreats);
  };

  // --- Initial Load ---
  setTimeout(() => {
    // Simulate network delay
    if (loadingMessage) loadingMessage.style.display = "none";
    populateTable(mockThreats);

    // Store data for other pages
    localStorage.setItem("threatData", JSON.stringify(mockThreats));
  }, 1500);

  // --- Event Listeners ---
  if (searchInput) {
    searchInput.addEventListener("keyup", filterLogs);
  }

  // --- Charting Logic for analytics.html ---
  if (document.getElementById("threatTypeChart")) {
    const threatData = JSON.parse(localStorage.getItem("threatData")) || [];

    // Threat Types Chart (Doughnut)
    const threatTypes = threatData.reduce((acc, threat) => {
      acc[threat.type] = (acc[threat.type] || 0) + 1;
      return acc;
    }, {});

    new Chart(document.getElementById("threatTypeChart"), {
      type: "doughnut",
      data: {
        labels: Object.keys(threatTypes),
        datasets: [
          {
            label: "Threat Types",
            data: Object.values(threatTypes),
            backgroundColor: [
              "#ef4444",
              "#f97316",
              "#f59e0b",
              "#84cc16",
              "#22c55e",
              "#10b981",
            ],
            borderColor: "#1f2937",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top", labels: { color: "#d1d5db" } } },
      },
    });

    // Timeline Chart (Line)
    const timelineData = threatData.reduce((acc, threat) => {
      const hour = moment(threat.timestamp).startOf("hour").format("HH:00");
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    const sortedTimeline = Object.entries(timelineData).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    new Chart(document.getElementById("timelineChart"), {
      type: "line",
      data: {
        labels: sortedTimeline.map((item) => item[0]),
        datasets: [
          {
            label: "Threats per Hour",
            data: sortedTimeline.map((item) => item[1]),
            fill: true,
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56, 189, 248, 0.2)",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { ticks: { color: "#d1d5db" } },
          y: { ticks: { color: "#d1d5db" } },
        },
        plugins: { legend: { display: false } },
      },
    });

    // Attack Sources
    const attackSourcesContainer = document.getElementById("attack-sources");
    const sourceCounts = threatData.reduce((acc, { source_ip }) => {
      acc[source_ip] = (acc[source_ip] || 0) + 1;
      return acc;
    }, {});

    Object.entries(sourceCounts).forEach(([ip, count]) => {
      const sourceEl = document.createElement("div");
      sourceEl.className =
        "flex justify-between items-center bg-gray-700 p-3 rounded-lg";
      sourceEl.innerHTML = `<span class="font-mono text-sky-400">${ip}</span><span class="font-bold text-lg">${count}</span>`;
      if (attackSourcesContainer) attackSourcesContainer.appendChild(sourceEl);
    });
  }

  // --- Logic for intrusion.html ---
  if (document.getElementById("network-events")) {
    const threatData = JSON.parse(localStorage.getItem("threatData")) || [];
    document.getElementById("network-events").textContent = threatData.length;
  }
});

