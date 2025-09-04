document.addEventListener("DOMContentLoaded", () => {
  // Function to navigate to different pages
  window.navigateTo = (page) => {
    if (page === "sms-detection.html") {
      window.location.href = "/sms_detector";
    } else if (page === "phishing-detection.html") {
      window.location.href = "/phishing_detector";
    } else if (page === "awareness.html") {
      window.location.href = "/awareness";
    } else if (page === "threat-dashboard.html") {
      window.location.href = "/threat_dashboard";
    } else if (page === "ids_dashboard.html") {
      window.location.href = "/ids_dashboard";
    }
  };

  // --- Fetch Real Data ---
  function updateDashboard() {
    fetch("/api/dashboard_stats")
      .then((res) => res.json())
      .then((data) => {
        // ✅ Update SMS Stats
        document.getElementById("smsAnalyzed").textContent = data.sms.total;
        document.getElementById("scamsDetected").textContent = data.sms.scam;

        // ✅ Update Email Stats
        document.getElementById("emailsScanned").textContent = data.email.total;
        document.getElementById("spamBlocked").textContent =
          data.email.phishing;

        // ✅ Update Threat Preview Chart
        const ctx = document.getElementById("miniThreatChart").getContext("2d");
        if (window.threatChart) {
          window.threatChart.destroy();
        }
        window.threatChart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: [
              "Email Phishing",
              "Safe Emails",
              "SMS Scams",
              "Genuine SMS",
            ],
            datasets: [
              {
                label: "Threats",
                data: [
                  data.email.phishing,
                  data.email.safe,
                  data.sms.scam,
                  data.sms.genuine,
                ],
                backgroundColor: ["#f44336", "#4caf50", "#ff9800", "#2196f3"],
              },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
          },
        });
      })
      .catch((err) => console.error("Error fetching dashboard stats:", err));
  }

  // ==========================
  // 🔹 Chatbot Modal Controls
  // ==========================
  const chatModal = document.getElementById("chatModal");
  const openBtn = document.getElementById("openChatModal");
  const closeBtn = document.getElementById("closeChatModal");

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      chatModal.style.display = "flex"; // show modal
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      chatModal.style.display = "none"; // hide modal
    });
  }

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === chatModal) {
      chatModal.style.display = "none";
    }
  });

  // ==========================
  // 🔹 Chatbot Messaging Logic
  // ==========================
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatMessages = document.getElementById("chatMessages");

  if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // stop page reload

      const userMessage = chatInput.value.trim();
      if (!userMessage) return;

      // Add user message to chat
      chatMessages.innerHTML += `
                <div class="chat-user">
                    <div class="chat-bubble user-bubble">
                        <p>${userMessage}</p>
                    </div>
                </div>
            `;
      chatInput.value = "";
      chatMessages.scrollTop = chatMessages.scrollHeight;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
        });
        const data = await res.json();

        // Add assistant reply
        chatMessages.innerHTML += `
                    <div class="chat-assistant">
                        <div class="chat-bubble">
                            <img src="/static/mascot.png" alt="Mascot" class="chat-avatar">
                            <p>${data.reply}</p>
                        </div>
                    </div>
                `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } catch (err) {
        console.error("Chat error:", err);
        chatMessages.innerHTML += `
                    <div class="chat-assistant">
                        <div class="chat-bubble error">
                            <p>⚠️ Sorry, the assistant is unavailable right now.</p>
                        </div>
                    </div>
                `;
      }
    });
  }

  // Load Chart.js, then update dashboard
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/chart.js";
  script.onload = () => {
    updateDashboard();
    setInterval(updateDashboard, 3000); // refresh every 1.5s
  };
  document.head.appendChild(script);
});
