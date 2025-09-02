

        // Simulated data and functionality
        let threatData = {
            activeThreats: 0,
            blockedAttempts: 0,
            uniqueIPs: 0,
            logs: [],
            stats: {
                phishing: 45,
                malware: 32,
                spam: 28,
                ddos: 15,
                bruteforce: 8
            }
        };

        let charts = {};
        let currentFilter = 'all';
        let isLiveMode = true;

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initializeCharts();
            generateInitialData();
            startRealTimeSimulation();
        });

        function initializeCharts() {
            // Threat Type Chart
            const threatCtx = document.getElementById('threatTypeChart').getContext('2d');
            charts.threatType = new Chart(threatCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Phishing', 'Malware', 'Spam', 'DDoS', 'Brute Force'],
                    datasets: [{
                        data: [45, 32, 28, 15, 8],
                        backgroundColor: [
                            '#ff6b6b',
                            '#ffa726',
                            '#ffee58',
                            '#66bb6a',
                            '#42a5f5'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });

            // Timeline Chart
            const timelineCtx = document.getElementById('timelineChart').getContext('2d');
            charts.timeline = new Chart(timelineCtx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                    datasets: [{
                        label: 'Threats Detected',
                        data: generateTimelineData(),
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        function generateTimelineData() {
            return Array.from({length: 24}, () => Math.floor(Math.random() * 50));
        }

        function generateInitialData() {
            // Generate initial threat data
            threatData.activeThreats = Math.floor(Math.random() * 15) + 5;
            threatData.blockedAttempts = Math.floor(Math.random() * 200) + 100;
            threatData.uniqueIPs = Math.floor(Math.random() * 50) + 25;

            // Generate initial logs
            for (let i = 0; i < 20; i++) {
                addThreatLog();
            }

            updateDashboard();
        }

        function addThreatLog() {
            const threatTypes = ['Phishing Attempt', 'Malware Detection', 'Spam Email', 'DDoS Attack', 'Brute Force'];
            const severityLevels = ['critical', 'high', 'medium', 'low', 'info'];
            const ipAddresses = [
                '192.168.1.100', '10.0.0.45', '172.16.0.23', '203.45.67.89', 
                '45.123.78.90', '178.89.45.67', '91.234.56.78', '145.67.89.12'
            ];

            const log = {
                id: Date.now() + Math.random(),
                type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
                severity: severityLevels[Math.floor(Math.random() * severityLevels.length)],
                ip: ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
                timestamp: new Date().toLocaleTimeString(),
                details: `Detected suspicious activity from IP address`
            };

            threatData.logs.unshift(log);
            if (threatData.logs.length > 100) {
                threatData.logs.pop();
            }

            return log;
        }

        function updateDashboard() {
            // Update overview cards
            document.getElementById('active-threats').textContent = threatData.activeThreats;
            document.getElementById('blocked-attempts').textContent = threatData.blockedAttempts.toLocaleString();
            document.getElementById('unique-ips').textContent = threatData.uniqueIPs;

            // Update threat log
            updateThreatLog();
            updateAttackSources();
            updateIntrusionStats();
        }

        function updateThreatLog() {
            const logContainer = document.getElementById('threat-log');
            const filteredLogs = currentFilter === 'all' 
                ? threatData.logs 
                : threatData.logs.filter(log => log.severity === currentFilter);

            logContainer.innerHTML = filteredLogs.slice(0, 15).map(log => `
                <div class="log-entry log-${log.severity}" onclick="showLogDetails('${log.id}')">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <span class="font-mono text-xs text-gray-400">${log.timestamp}</span>
                            <span class="font-semibold">${log.type}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs bg-white/10 px-2 py-1 rounded">${log.ip}</span>
                            <span class="text-xs uppercase font-bold">${log.severity}</span>
                        </div>
                    </div>
                    <p class="text-sm text-gray-300 mt-1">${log.details} ${log.ip}</p>
                </div>
            `).join('');
        }

        function updateAttackSources() {
            const sources = [
                { country: 'Russia', count: 45, flag: '🇷🇺' },
                { country: 'China', count: 38, flag: '🇨🇳' },
                { country: 'North Korea', count: 22, flag: '🇰🇵' },
                { country: 'Iran', count: 18, flag: '🇮🇷' },
                { country: 'Unknown', count: 12, flag: '🌐' }
            ];

            const sourcesContainer = document.getElementById('attack-sources');
            sourcesContainer.innerHTML = sources.map(source => {
                const percentage = Math.round((source.count / 135) * 100);
                return `
                    <div class="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <div class="flex items-center space-x-2">
                            <span class="text-lg">${source.flag}</span>
                            <span class="font-medium text-sm">${source.country}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="w-16 bg-gray-600 rounded-full h-2">
                                <div class="bg-red-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                            </div>
                            <span class="text-xs font-bold text-red-400">${source.count}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function updateSMSStats() {
    fetch('/api/sms_stats')
        .then(res => res.json())
        .then(data => {
            document.getElementById('sms-total').textContent = data.total;
            document.getElementById('sms-scam').textContent = data.scam;
            document.getElementById('sms-genuine').textContent = data.genuine;
        })
        .catch(err => console.error("Error fetching SMS stats:", err));
}

function updateEmailStats() {
    fetch('/api/email_stats')
        .then(res => res.json())
        .then(data => {
            document.getElementById('email-total').textContent = data.total;
            document.getElementById('email-phishing').textContent = data.phishing;
            document.getElementById('email-safe').textContent = data.safe;
        })
        .catch(err => console.error("Error fetching Email stats:", err));
}

// Refresh every 3 seconds
setInterval(updateEmailStats, 3000);

// Run once on load
document.addEventListener('DOMContentLoaded', updateEmailStats);

// Refresh every 3 seconds
setInterval(updateSMSStats, 3000);

// Run once on load
document.addEventListener('DOMContentLoaded', updateSMSStats);


        function updateIntrusionStats() {
            document.getElementById('network-events').textContent = Math.floor(Math.random() * 50) + 20;
            document.getElementById('anomalies').textContent = Math.floor(Math.random() * 15) + 5;
            document.getElementById('response-time').textContent = Math.floor(Math.random() * 100) + 50 + 'ms';
        }

        function startRealTimeSimulation() {
            if (!isLiveMode) return;

            setInterval(() => {
                // Simulate new threats
                if (Math.random() < 0.3) {
                    const newLog = addThreatLog();
                    threatData.activeThreats++;
                    
                    // Show notification for critical threats
                    if (newLog.severity === 'critical') {
                        showNotification('Critical Threat Detected!', `${newLog.type} from ${newLog.ip}`);
                        showAlert(`Critical threat detected: ${newLog.type} from ${newLog.ip}`);
                    }
                }

                // Update blocked attempts
                if (Math.random() < 0.5) {
                    threatData.blockedAttempts += Math.floor(Math.random() * 3) + 1;
                }

                // Update unique IPs
                if (Math.random() < 0.2) {
                    threatData.uniqueIPs += Math.floor(Math.random() * 2);
                }

                updateDashboard();
            }, 3000);

            // Update charts periodically
            setInterval(() => {
                if (charts.timeline) {
                    const newData = generateTimelineData();
                    charts.timeline.data.datasets[0].data = newData;
                    charts.timeline.update('none');
                }
            }, 30000);
        }

        function filterLogs(severity) {
            currentFilter = severity;
            
            // Update active tab
            document.querySelectorAll('.filter-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector(`[data-filter="${severity}"]`).classList.add('active');
            
            updateThreatLog();
        }

        function refreshLogs() {
            const refreshIcon = document.getElementById('refresh-icon');
            refreshIcon.innerHTML = '<div class="loading-spinner"></div>';
            
            setTimeout(() => {
                // Add some new logs
                for (let i = 0; i < 5; i++) {
                    addThreatLog();
                }
                updateThreatLog();
                refreshIcon.innerHTML = '🔄';
            }, 1000);
        }

        function showLogDetails(logId) {
            const log = threatData.logs.find(l => l.id == logId);
            if (!log) return;

            const modal = document.getElementById('threat-modal');
            const modalContent = document.getElementById('modal-content');
            
            modalContent.innerHTML = `
                <div class="space-y-6">
                    <div class="bg-gray-50 p-4 rounded-xl">
                        <h3 class="font-bold text-lg mb-3">Threat Details</h3>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-semibold text-gray-600">Threat Type</label>
                                <p class="text-lg">${log.type}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-gray-600">Severity Level</label>
                                <p class="text-lg capitalize">
                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                                        ${log.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                          log.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                          log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                          log.severity === 'low' ? 'bg-green-100 text-green-800' :
                                          'bg-blue-100 text-blue-800'}">
                                        ${log.severity.toUpperCase()}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-gray-600">Source IP</label>
                                <p class="text-lg font-mono">${log.ip}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-gray-600">Timestamp</label>
                                <p class="text-lg">${log.timestamp}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-xl">
                        <h3 class="font-bold text-lg mb-3">Recommended Actions</h3>
                        <ul class="space-y-2">
                            <li class="flex items-center space-x-2">
                                <span class="text-green-600">✓</span>
                                <span>Block IP address ${log.ip}</span>
                            </li>
                            <li class="flex items-center space-x-2">
                                <span class="text-green-600">✓</span>
                                <span>Update firewall rules</span>
                            </li>
                            <li class="flex items-center space-x-2">
                                <span class="text-green-600">✓</span>
                                <span>Monitor for similar patterns</span>
                            </li>
                            <li class="flex items-center space-x-2">
                                <span class="text-green-600">✓</span>
                                <span>Generate incident report</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="flex space-x-4">
                        <button class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                            Block IP
                        </button>
                        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Create Report
                        </button>
                        <button class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors" onclick="closeModal('threat-modal')">
                            Close
                        </button>
                    </div>
                </div>
            `;
            
            modal.style.display = 'block';
        }

        function openLogModal() {
            const modal = document.getElementById('threat-modal');
            const modalContent = document.getElementById('modal-content');
            
            modalContent.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-xl">
                        <h3 class="font-bold text-lg mb-4">Complete Threat Log</h3>
                        <div class="max-h-96 overflow-y-auto space-y-2">
                            ${threatData.logs.map(log => `
                                <div class="bg-white p-3 rounded-lg border-l-4 border-${log.severity === 'critical' ? 'red' : log.severity === 'high' ? 'orange' : log.severity === 'medium' ? 'yellow' : log.severity === 'low' ? 'green' : 'blue'}-500">
                                    <div class="flex items-center justify-between">
                                        <span class="font-semibold">${log.type}</span>
                                        <span class="text-xs text-gray-500">${log.timestamp}</span>
                                    </div>
                                    <div class="flex items-center justify-between mt-1">
                                        <span class="text-sm text-gray-600">${log.ip}</span>
                                        <span class="text-xs uppercase font-bold text-${log.severity === 'critical' ? 'red' : log.severity === 'high' ? 'orange' : log.severity === 'medium' ? 'yellow' : log.severity === 'low' ? 'green' : 'blue'}-600">
                                            ${log.severity}
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" onclick="exportLogs()">
                        Export Logs
                    </button>
                </div>
            `;
            
            modal.style.display = 'block';
        }

        function openIntrusionModal() {
            document.getElementById('intrusion-modal').style.display = 'block';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        function showNotification(title, message) {
            const toast = document.getElementById('notification-toast');
            document.getElementById('toast-title').textContent = title;
            document.getElementById('toast-message').textContent = message;
            
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 5000);
        }

        function showAlert(message) {
            const alertBanner = document.getElementById('alert-banner');
            const alertText = document.getElementById('alert-text');
            
            alertText.textContent = message;
            alertBanner.classList.remove('hidden');
            
            // Auto-dismiss after 10 seconds
            setTimeout(() => {
                dismissAlert();
            }, 10000);
        }

        function dismissAlert() {
            document.getElementById('alert-banner').classList.add('hidden');
        }

        function exportLogs() {
            const logs = threatData.logs.map(log => ({
                timestamp: log.timestamp,
                type: log.type,
                severity: log.severity,
                ip: log.ip,
                details: log.details
            }));
            
            const dataStr = JSON.stringify(logs, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `threat_logs_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Export Complete', 'Threat logs have been exported successfully');
        }

        // Close modals when clicking outside
        window.onclick = function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
                dismissAlert();
            }
            if (e.key === 'r' && e.ctrlKey) {
                e.preventDefault();
                refreshLogs();
            }
        });

        // Handle toast click to dismiss
        document.getElementById('notification-toast').addEventListener('click', function() {
            this.classList.remove('show');
        });

        // Simulate system status updates
        setInterval(() => {
            const statuses = ['SECURE', 'MONITORING', 'ALERT', 'PROTECTED'];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const statusElement = document.getElementById('system-status');
            statusElement.textContent = status;
            
            // Change card color based on status
            const statusCard = statusElement.closest('.card');
            statusCard.className = statusCard.className.replace(/\b(safe-card|threat-card|warning-card|info-card)\b/g, '');
            
            if (status === 'SECURE' || status === 'PROTECTED') {
                statusCard.classList.add('safe-card');
            } else if (status === 'ALERT') {
                statusCard.classList.add('threat-card');
            } else {
                statusCard.classList.add('warning-card');
            }
        }, 15000);
    