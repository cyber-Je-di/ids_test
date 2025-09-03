document.addEventListener('DOMContentLoaded', () => {

    // --- Chart instances ---
    let threatTypeChart = null;
    let timelineChart = null;

    /**
     * Fetches alert data from the API and updates all visualizations.
     */
    async function updateAnalyticsDashboard() {
        try {
            const response = await fetch('/get_alerts');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const alerts = await response.json();

            // Clear existing charts before redrawing
            if (threatTypeChart) threatTypeChart.destroy();
            if (timelineChart) timelineChart.destroy();

            if (alerts && alerts.length > 0) {
                renderTopThreatTypes(alerts);
                renderThreatTimeline(alerts);
                renderAttackSources(alerts);
            } else {
                renderEmptyState();
            }
        } catch (error) {
            console.error("Failed to fetch or render analytics data:", error);
            renderEmptyState("Error loading data.");
        }
    }

    /**
     * Processes data and renders the "Top Threat Types" doughnut chart.
     * @param {Array} alerts - The list of alert objects from the API.
     */
    function renderTopThreatTypes(alerts) {
        const threatCounts = alerts.reduce((acc, alert) => {
            const type = alert.attack_type || "Unknown";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(threatCounts);
        const data = Object.values(threatCounts);

        const ctx = document.getElementById('threatTypeChart').getContext('2d');
        threatTypeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#FF2D95', '#00D8FF', '#3A5FFF', '#FF6B6B', '#00FFA3', '#FFC300'],
                    borderColor: '#0A1F44',
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#EAEAEA', font: { size: 14 } } },
                    tooltip: { backgroundColor: '#081731', titleColor: '#00D8FF', bodyColor: '#EAEAEA' }
                }
            }
        });
    }

    /**
     * Processes data and renders the "24-Hour Threat Timeline" line chart.
     * @param {Array} alerts - The list of alert objects from the API.
     */
    function renderThreatTimeline(alerts) {
        // Initialize 24 hours with 0 alerts
        const hourlyCounts = Array(24).fill(0);

        alerts.forEach(alert => {
            const hour = new Date(alert.timestamp).getHours();
            if (hour >= 0 && hour < 24) {
                hourlyCounts[hour]++;
            }
        });

        const ctx = document.getElementById('timelineChart').getContext('2d');
        timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Detected Threats',
                    data: hourlyCounts,
                    borderColor: '#00D8FF',
                    backgroundColor: 'rgba(0, 216, 255, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#EAEAEA' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    y: { ticks: { color: '#EAEAEA' }, grid: { color: 'rgba(255,255,255,0.1)' }, beginAtZero: true }
                }
            }
        });
    }

    /**
     * Processes data and renders the "Attack Sources" list.
     * @param {Array} alerts - The list of alert objects from the API.
     */
    function renderAttackSources(alerts) {
        const sourceCounts = alerts.reduce((acc, alert) => {
            const source = alert.source_ip || "Unknown";
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});

        // Sort by count descending and take top 5
        const sortedSources = Object.entries(sourceCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        const container = document.getElementById('attack-sources');
        container.innerHTML = ''; // Clear previous entries

        if (sortedSources.length === 0) {
            container.innerHTML = '<p class="text-gray-400">No attack sources detected yet.</p>';
            return;
        }

        sortedSources.forEach(([ip, count], index) => {
            const div = document.createElement('div');
            div.className = 'attack-source-item';
            div.style.animationDelay = `${index * 0.1}s`;
            div.innerHTML = `
                <span class="font-mono bg-gray-700 px-2 py-1 rounded">${ip}</span>
                <span class="font-bold text-red-400">${count} alerts</span>
            `;
            container.appendChild(div);
        });
    }

    /**
     * Renders an empty state for all charts when no data is available.
     * @param {string} [message="No alerts detected yet."] - Optional message to display.
     */
    function renderEmptyState(message = "No alerts detected yet.") {
        const charts = ['threatTypeChart', 'timelineChart'];
        charts.forEach(id => {
            const ctx = document.getElementById(id).getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#374151'] }] },
                options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: message, color: '#9CA3AF' } } }
            });
        });
        document.getElementById('attack-sources').innerHTML = `<p class="text-gray-400">${message}</p>`;
    }

    // Initial load and periodic refresh
    updateAnalyticsDashboard();
    setInterval(updateAnalyticsDashboard, 15000); // Refresh every 15 seconds
});
