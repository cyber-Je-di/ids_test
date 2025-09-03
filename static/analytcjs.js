document.addEventListener('DOMContentLoaded', () => {

    /* ======= Top Threat Types Chart ======= */
    const ctx1 = document.getElementById('threatTypeChart').getContext('2d');
    new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Malware', 'Phishing', 'Spam', 'Ransomware', 'Others'],
            datasets: [{
                data: [25, 20, 15, 10, 30],
                backgroundColor: ['#FF2D95', '#00D8FF', '#3A5FFF', '#FF6B6B', '#00FFA3'],
                borderColor: '#0A1F44',
                borderWidth: 2,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#EAEAEA', font: { size: 14 } }
                },
                tooltip: { backgroundColor: '#081731', titleColor: '#00D8FF', bodyColor: '#EAEAEA' }
            }
        }
    });

    /* ======= 24-Hour Threat Timeline ======= */
    const ctx2 = document.getElementById('timelineChart').getContext('2d');
    new Chart(ctx2, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Detected Threats',
                data: Array.from({length: 24}, () => Math.floor(Math.random() * 20)),
                borderColor: '#00D8FF',
                backgroundColor: 'rgba(0,216,255,0.2)',
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#FF2D95'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#EAEAEA' } },
                tooltip: { backgroundColor: '#081731', titleColor: '#00D8FF', bodyColor: '#EAEAEA' }
            },
            scales: {
                x: { ticks: { color: '#EAEAEA' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { ticks: { color: '#EAEAEA' }, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
        }
    });

    /* ======= Attack Sources List ======= */
    const attackSources = [
        { source: '192.168.1.45', attacks: 12 },
        { source: '10.0.0.23', attacks: 9 },
        { source: '172.16.5.9', attacks: 7 },
        { source: '203.0.113.77', attacks: 15 },
        { source: '198.51.100.33', attacks: 5 }
    ];

    const container = document.getElementById('attack-sources');
    attackSources.forEach((item, index) => {
        const div = document.createElement('div');
        div.style.animationDelay = `${index * 0.15}s`;
        div.innerHTML = `<span>${item.source}</span><span>${item.attacks} attacks</span>`;
        container.appendChild(div);
    });

});
