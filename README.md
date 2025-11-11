# Cyber Security Awareness System

## Project Overview

This project is a comprehensive cybersecurity awareness system designed to detect and mitigate various online threats, including phishing, SMS scams, and network intrusions. It features a user-friendly web interface that provides real-time alerts, detailed analytics, and educational resources to help users stay informed about potential risks. The system leverages machine learning models to identify threats and includes specialized support for detecting scams in both English and Bemba.

## Features

- **Real-Time Intrusion Detection System (IDS):** Monitors network traffic for suspicious activity and displays alerts on a dedicated dashboard.
- **SMS Scam Detection:** Utilizes machine learning models and pattern matching to identify malicious SMS messages in both English and Bemba.
- **Phishing Detection:** Analyzes URLs and email content to detect and flag potential phishing attempts.
- **User Authentication:** A role-based authentication system (admin, analyst, user) to control access to different features.
- **Threat Analytics:** Visualizes threat data to help users understand trends and patterns.
- **AI-Powered Chatbot:** Provides users with cybersecurity tips and information in a conversational format.
- **Educational Resources:** Offers an awareness page with information on common cyber threats and how to avoid them.

## Technical Stack

- **Backend:** Python, Flask
- **Machine Learning:** TensorFlow/Keras, scikit-learn, joblib, pandas, numpy
- **Frontend:** HTML, CSS, JavaScript
- **Real-time IDS:** Snort

## Setup and Installation

1.  **Prerequisites:**
    *   Python 3.8+
    *   Snort (or a CSV file with Snort logs)

2.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/cyber-security-awareness-system.git
    cd cyber-security-awareness-system
    ```

3.  **Set up a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configure the application:**
    *   **Snort Paths:** Open `config.ini` and update the paths to your Snort log file and community rules file.
    *   **API Keys:** Create a file named `.env` in the root directory and add your GitHub API token for the chatbot:
        ```
        GITHUB_TOKEN=your_github_api_token
        ```

6.  **Run the application:**
    ```bash
    python app.py
    ```

7.  **Run the log processor (for IDS):**
    ```bash
    python log_processor.py
    ```

## Usage

1.  **Login:** Access the web interface and log in with one of the following default credentials:
    *   **Admin:** `admin@example.com` / `adminpass`
    *   **Analyst:** `analyst@example.com` / `analystpass`
    *   **User:** `user@example.com` / `userpass`

2.  **Navigate the Dashboards:**
    *   **IDS Dashboard:** View real-time alerts from the Intrusion Detection System.
    *   **Threat Dashboard:** Analyze SMS and email threat statistics.

3.  **Use the Detectors:**
    *   **SMS Detector:** Enter a message to check if it's a potential scam.
    *   **Phishing Detector:** Input a URL or email content to analyze for phishing risks.

4.  **Interact with the Chatbot:**
    *   Open the chat modal and ask questions about cybersecurity.

5.  **Visit the Awareness Page:**
    *   Read educational materials on various cyber threats.

## Project Structure

```
cyber-security-awareness-system/
├── models/                 # Contains pre-trained machine learning models.
├── static/                 # Static files (CSS, JavaScript, images).
├── templates/              # HTML templates for the web interface.
├── .env                    # Environment variables (API keys).
├── .gitignore              # Git ignore file.
├── app.py                  # Main Flask application file.
├── config.ini              # Configuration for the log processor.
├── log_processor.py        # Script to process Snort logs.
├── README.md               # This file.
└── requirements.txt        # Python dependencies.
```

## Disclaimer

This project is a prototype and is intended for educational and demonstration purposes only. It is not suitable for use in a production environment.
