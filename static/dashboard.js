document.addEventListener('DOMContentLoaded', () => {
    // Function to navigate to different pages
    window.navigateTo = (page) => {
        if (page === 'sms-detection.html') {
            window.location.href = '/sms_detector';
        } else if (page === 'phishing-detection.html') {
            window.location.href = '/phishing_detector';
        } else if (page === 'awareness.html') {
            window.location.href = '/awareness';
        } else if (page === 'threat-dashboard.html') {
            window.location.href = '/threat_dashboard';
        }  else if (page === 'ids_dashboard.html') {
            window.location.href = '/ids_dashboard';
        }
    };

    // --- Fetch Real Data ---
    function updateDashboard() {
        fetch('/api/dashboard_stats')
            .then(res => res.json())
            .then(data => {
                // ✅ Update SMS Stats
                document.getElementById('smsAnalyzed').textContent = data.sms.total;
                document.getElementById('scamsDetected').textContent = data.sms.scam;

                // ✅ Update Email Stats
                document.getElementById('emailsScanned').textContent = data.email.total;
                document.getElementById('spamBlocked').textContent = data.email.phishing;

                // ✅ Update "Last Update" timestamp
                document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();

                // ✅ Update Threat Preview Chart
                const ctx = document.getElementById('miniThreatChart').getContext('2d');
                if (window.threatChart) {
                    window.threatChart.destroy();
                }
                window.threatChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Email Phishing', 'Safe Emails', 'SMS Scams', 'Genuine SMS'],
                        datasets: [{
                            label: 'Threats',
                            data: [
                                data.email.phishing,
                                data.email.safe,
                                data.sms.scam,
                                data.sms.genuine
                            ],
                            backgroundColor: ['#f44336', '#4caf50', '#ff9800', '#2196f3']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            })
            .catch(err => console.error("Error fetching dashboard stats:", err));
    }

    // Load Chart.js, then update dashboard
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
        updateDashboard();
        setInterval(updateDashboard, 5000); // refresh every 5s
    };
    document.head.appendChild(script);
});

