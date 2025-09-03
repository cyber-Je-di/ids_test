#from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np
from datetime import datetime
from threading import Lock
from flask import Flask, render_template, request, jsonify, send_from_directory
import requests
import tensorflow as tf
from keras.models import load_model
import pickle
import os
import re
from enum import Enum
import logging


app = Flask(__name__)
app.secret_key = "supersecretkey123!"  # <-- add this line

try:
    pipeline = joblib.load("models/xgboost_ids_pipeline.joblib")
    model = pipeline["model"]
    scaler = pipeline["scaler"]
    print("Model and scaler loaded successfully.")
except FileNotFoundError:
    print("Error: Model file not found.")
    model, scaler = None, None

confirmed_attacks = []
lock = Lock()
alert_id_counter = 0

#--------------------------
#Cyber System structures
#--------------------------
# --- Enums for Risk Levels and Languages ---
class RiskLevel(Enum):
    SAFE = "SAFE"
    SUSPICIOUS = "SUSPICIOUS"
    SCAM = "SCAM"

class Language(Enum):
    ENGLISH = "English"
    BEMBA = "Bemba"
    UNKNOWN = "Unknown"

# --- Model Loading ---
models = {}
phishing_models = {}
phishing_loaded = False  # ✅ declare global flag

# --- Global Counters ---
sms_stats = {
    "total": 0,
    "scam": 0,
    "genuine": 0,
    "bemba_messages": 0,
    "bemba_scams": 0
}

# --- Global Email Counters ---
email_stats = {
    "total": 0,
    "phishing": 0,
    "safe": 0
}

#---------- Login feature added---------#
from flask import session, redirect, url_for, flash

# Simple in-memory user store (for prototype)
USERS = {
    "admin@example.com": {"password": "adminpass", "role": "admin"},
    "analyst@example.com": {"password": "analystpass", "role": "analyst"},
    "user@example.com": {"password": "userpass", "role": "user"},
}

#------Protect Routes-----#
from functools import wraps
from flask import session, abort

def login_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if "user_email" not in session:
                return redirect(url_for("login"))
            if role and session.get("user_role") not in role:
                return abort(403)  # Forbidden
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# --- BEMBA-SPECIFIC SCAM DETECTION ---
BEMBA_SCAM_PATTERNS = [
    # Financial requests and money transfers
    (r'\b(tumako indalama|indalama shabalanda|magic money|send money|tumizani ndalama)\b', 0.4, "Requests money transfer"),
    (r'\b(ndalama|money|cash|payment|funds)\b', 0.2, "Mentions money"),
    (r'\b(k\d+,?\d*|kwacha|money amount)\b', 0.3, "Specific money amount mentioned"),
    
    # Prize and winning scams
    (r'\b(mwawina|wawina|winner|prize|you have won)\b', 0.5, "Prize/winning mention"),
    (r'\b(free|ya free|free offer|free gift)\b', 0.3, "Free offer mention"),
    (r'\b(congratulations|congrats|bally|bali)\b', 0.3, "Congratulations message"),
    
    # Urgency and pressure tactics
    (r'\b(bwangu|endesha|quick|fast|now|immediately|urgent)\b', 0.4, "Creates urgency"),
    (r'\b(lelo|leloline|ililine|apapene|today|now|right now)\b', 0.3, "Time pressure"),
    (r'\b(last chance|final opportunity|limited time)\b', 0.4, "Limited time offer"),
    
    # Phone numbers and contact requests
    (r'\b(numba|number|phone|contact|foni)\s*[\+\d]{8,}', 0.6, "Suspicious phone number"),
    (r'\b(call me|call us|tuma SMS|tuma phone|send SMS)\b', 0.3, "Request to call or SMS"),
    
    # Personal information requests
    (r'\b(password|pin|security|account|akaunti|bank details)\b', 0.5, "Requests personal info"),
    (r'\b(name yobe|your name|myna|ishina lyandi|ishina lyobe|ninebo doctor|my name)\b', 0.7, "Requests name"),
    (r'\b(address|location|place|inda|where you live)\b', 0.3, "Requests address"),
    
    # Bank and financial institution scams
    (r'\b(banki|bank|financial|finance|zanaco|stanbic|absa)\b', 0.4, "Bank-related mention"),
    (r'\b(banki yobe|your bank|bank account|akaunti yobe)\b', 0.5, "Your bank account mentioned"),
    (r'\b(naifwa na banki|banki yandi|bank problem|bank issue)\b', 0.6, "Bank emergency scam"),
    
    # Emergency and family scams
    (r'\b(umwana|child|baby|mwana)\b.*\b(chipatala|hospital|sick|emergency)\b', 0.7, "Fake emergency scam"),
    (r'\b(family|family member|relative|bashi|bamayo)\b.*\b(problem|issue|help)\b', 0.5, "Family emergency scam"),
    
    # Investment and business scams
    (r'\b(investment|business|bizness|opportunity|make money|naamangaya business)\b', 0.7, "Investment opportunity"),
    (r'\b(high return|quick money|easy money|fast cash|indalama bwangu|ukupanga indalama)\b', 0.5, "Get rich quick scheme"),
    
    # Suspicious links and websites
    (r'http[s]?://|www\.|\.com|\.org|\.net', 0.4, "Contains website link"),
    (r'\b(click here|visit|go to|website|site|webpage)\b', 0.3, "Directs to website"),
    
    # Specific Bemba scam phrases
    (r'\b(naifwa|I need|I have problem|I have issue)\b', 0.4, "Emergency situation claim"),
    (r'\b(tuma nomba|send number|give me your number)\b', 0.5, "Requests your number"),
    (r'\b(verify your account|confirm your details|update your information)\b', 0.6, "Verification scam"),(r'\b(ninebo|maomba|nimbwela|kusumbawanga)\b', 0.5, "Suspicious request terminology"),
    (r'\b(ndepanga|pali \d+:\d+hrs)\b', 0.6, "Specific amount with urgency"),
    (r'\b(naamangaya business|ndapela|pamo najigi ring|navimbi tuma)\b', 0.7, "Business plea with request"),
    (r'\b(k\d{3},\d{3}|k\d{6,})\b', 0.8, "Large money amount mentioned"),
    (r'\b(tuma \d+n|send \d+n)\b', 0.5, "Request to send something"),
    
    # Enhanced financial patterns
    (r'\b(doctor|dokotela|nurse|nasi)\b.*\b(maomba|requesting|needing)\b', 0.7, "Medical professional requesting help"),
    (r'\b(mu zambia|ku zambia|in zambia)\b', 0.3, "Mentions Zambia location"),
    
    # Enhanced urgency patterns
    (r'\b(pali \d+:\d+hrs|within \d+ hrs|by \d+:\d+)\b', 0.6, "Specific time pressure"),
]

BEMBA_LANGUAGE_PATTERNS = [
    r'\b(na|uli|ninshi|fye|ukwaba|mwane|palifye|mwikateni|bushe)\b',
    r'\b(umwana|umukashi|umusango|icilanda|ukuposa|ukwipusha)\b',
    r'\b(mulishani|mwafya|nacili|tulelanda|ukutila|ukwishiba)\b',
    r'\b(ifyo|ilyo|nomba|ukwete|ukwishiba|ukupanga|ukuposa)\b',
    r'\b(eshili|nacitila|ukwaba|ukutila|ukuposa|ukwipusha)\b',
    r'\b(balefuma|balelandile|tulelanda|nacitila|ukutila)\b',
    r'\b(ninebo|maomba|nimbwela|kusumbawanga|ndepanga|naamangaya|ndapela|pamo|najigi|navimbi)\b',
    r'\b(mu zambia|ku zambia|pa zambia)\b',
]

def detect_bemba_language(text):
    """Detect if text is in Bemba language"""
    if not text or not isinstance(text, str):
        return False
        
    text = text.lower()
    bemba_score = 0
    
    for pattern in BEMBA_LANGUAGE_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        bemba_score += len(matches)
    
    return bemba_score >= 3  # At least 3 Bemba words detected

def detect_bemba_scam_patterns(message):
    """Detect scams in Bemba language using pattern matching"""
    if not message or not isinstance(message, str):
        return {
            "risk_level": RiskLevel.SAFE,
            "confidence": 0.0,
            "explanation": "No text provided for analysis",
            "language": Language.UNKNOWN.value,
            "is_bemba": False
        }
    
    text = message.lower()
    scam_score = 0
    reasons = []
    detected_patterns = []
    
    # Check all Bemba scam patterns
    for pattern, score, reason in BEMBA_SCAM_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            scam_score += score
            if reason not in reasons:
                reasons.append(reason)
            detected_patterns.append(pattern)
    
    # Additional scoring for multiple patterns
    pattern_count = len(detected_patterns)
    if pattern_count > 3:
        scam_score += min(0.2, pattern_count * 0.05)
    
    # Determine risk level
    if scam_score >= 0.7:
        risk_level = RiskLevel.SCAM
        confidence = min(0.95, scam_score)
    elif scam_score >= 0.4:
        risk_level = RiskLevel.SUSPICIOUS
        confidence = scam_score
    else:
        risk_level = RiskLevel.SAFE
        confidence = 1.0 - scam_score
    
    # Check if message is in Bemba
    is_bemba = detect_bemba_language(message)
    
    explanation = "Bemba pattern analysis: "
    if reasons:
        explanation += "Detected - " + "; ".join(reasons[:3])  # Show top 3 reasons
    else:
        explanation += "No scam patterns detected"
    
    if is_bemba:
        explanation += " | Language: Bemba"
    
    return {
        "risk_level": risk_level,
        "confidence": round(confidence, 2),
        "explanation": explanation,
        "language": Language.BEMBA.value if is_bemba else Language.UNKNOWN.value,
        "is_bemba": is_bemba,
        "pattern_count": pattern_count
    }

# Load models at startup
try:
    # Use relative paths from the project root
    models['lstm'] = load_model('models/LSTM_Spam_Detection.h5')
    models['dense'] = load_model('models/Dense_Spam_Detection.h5')
    print("All models loaded successfully!")
except Exception as e:
    print(f"Error loading models: {e}")

# -------------------------------
# Load phishing model
# -------------------------------
def load_phishing_model():
    global phishing_models, phishing_loaded
    try:
        model_path = os.path.join(os.getcwd(), 'models', 'new_email_detector.joblib')
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at: {model_path}")
        phishing_models['phish'] = joblib.load(model_path)
        phishing_loaded = True
        print(f"Phishing model loaded successfully from: {model_path}")
    except Exception as e:
        phishing_models = {}
        phishing_loaded = False
        print(f"Error loading phishing model: {e}")

# Load the phishing model at startup
load_phishing_model()
        
# --- SMS Detector Functions ---
def preprocess_message(message):
    message = message.lower()
    # In a real app, you would load a pre-trained tokenizer
    tokenizer = tf.keras.preprocessing.text.Tokenizer(num_words=10000)
    tokenizer.fit_on_texts([message])
    sequence = tokenizer.texts_to_sequences([message])
    padded_sequence = tf.keras.preprocessing.sequence.pad_sequences(sequence, maxlen=50)
    return padded_sequence

def get_ensemble_prediction(processed_message, weights=None):
    if weights is None:
        weights = {'lstm': 0.3, 'dense': 0.8}
    
    predictions = {}
    total_weight = sum(weights.values())
    
    for model_name, model in models.items():
        try:
            pred = model.predict(processed_message, verbose=0)
            predictions[model_name] = {
                'prediction': float(pred[0][0]),
                'weight': weights.get(model_name, 0.0)
            }
        except Exception as e:
            print(f"Error with {model_name} prediction: {e}")
            continue
    
    if not predictions:
        return 0.5, {}  # Neutral prediction if all models fail
    
    weighted_sum = 0
    for model_name, pred_data in predictions.items():
        weighted_sum += pred_data['prediction'] * pred_data['weight']
    
    final_prediction = weighted_sum / total_weight
    return final_prediction, predictions


# -------------------------------
# Phishing Detector Function
# -------------------------------

def get_phishing_prediction(input_data):
    if not phishing_loaded:
        return None, "Phishing model not loaded."

    try:
        model_package = phishing_models['phish']
        model = model_package['model']
        vectorizer = model_package['vectorizer']

        X_vec = vectorizer.transform([input_data])
        prob = model.predict_proba(X_vec)[0]  # [ham_prob, spam_prob]

        ml_label = "PHISHING" if prob[1] > 0.5 else "SAFE"
        ml_confidence = float(prob[1] if ml_label == "PHISHING" else prob[0])

        explanation_text = ""
        if ml_label == "PHISHING":
            if ml_confidence > 0.8:
                explanation_text = "This content shows strong indicators of a phishing attempt, such as suspicious links, urgent language, or unusual sender information. Avoid clicking any links or providing personal information."
            else:
                explanation_text = "This content contains elements commonly found in phishing attacks. Please proceed with extreme caution."
        else: # SAFE
            if ml_confidence > 0.8:
                explanation_text = "Our model did not find any common signs of phishing in this content. It appears to be safe."
            else:
                explanation_text = "This content seems safe, but always be cautious with unexpected links or requests for information."

        result = {
            "final_pred": ml_confidence,
            "is_phishing": ml_label == "PHISHING",
            "ml_label": ml_label,
            "ml_confidence": ml_confidence,
            "confidence": round(abs(ml_confidence - 0.5) * 2, 3),
            "rule_suspicious": False,
            "rule_reasons": [],
            "result_text": ml_label,
            "explanation": explanation_text
        }

        return result, None
    except Exception as e:
        return None, f"Error during prediction: {e}"

#-----------------------------
import imaplib
import email
from email.header import decode_header

def fetch_gmail_emails(user_email, app_password, max_emails=10):
    """
    Fetches the latest emails from Gmail inbox using IMAP.
    Returns a list of dictionaries with sender, subject, date, and body.
    """
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user_email, app_password)
        mail.select("inbox")

        # Get the total number of messages in the inbox
        status, message_count_data = mail.status("inbox", "(MESSAGES)")
        if status != "OK":
            return [], "Failed to get message count"
        
        message_count = int(message_count_data[0].decode().split()[2].strip(")"))

        # Calculate the range for the latest emails
        start_id = max(1, message_count - max_emails + 1)
        end_id = message_count

        emails_data = []

        for mail_id in reversed(range(start_id, end_id + 1)):
            status, msg_data = mail.fetch(str(mail_id), "(RFC822)")
            if status != "OK":
                continue

            msg = email.message_from_bytes(msg_data[0][1])

            # --- Decode email headers ---
            raw_subject = msg.get("Subject", "No Subject")
            subject, encoding = decode_header(raw_subject)[0]
            if isinstance(subject, bytes):
                subject = subject.decode(encoding or "utf-8", errors="ignore")

            raw_from = msg.get("From", "Unknown Sender")
            sender, encoding = decode_header(raw_from)[0]
            if isinstance(sender, bytes):
                sender = sender.decode(encoding or "utf-8", errors="ignore")

            date = msg.get("Date", "Unknown Date")

            # --- Get plain text body ---
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain" and "attachment" not in str(part.get("Content-Disposition")):
                        charset = part.get_content_charset() or "utf-8"
                        body += part.get_payload(decode=True).decode(charset, errors="ignore")
            else:
                charset = msg.get_content_charset() or "utf-8"
                body = msg.get_payload(decode=True).decode(charset, errors="ignore")

            emails_data.append({
                "sender": sender,
                "subject": subject,
                "date": date,
                "body": body,
                "snippet": body[:200] + ("..." if len(body) > 200 else "")
            })

        mail.logout()
        return emails_data, None

    except imaplib.IMAP4.error as e:
        return [], f"IMAP login failed: {e}"
    except Exception as e:
        return [], f"Error fetching emails: {e}"
#-----------------------------
    
#-------------------------------
#ENDS HERE
#-------------------------------



#-------------------------------
# Flask Routes
#-------------------------------

@app.route('/')
def home():
    return render_template('index.html')

@app.route("/ids_dashboard")
@login_required(role=["admin", "analyst"])
def ids_dashboard():
    return render_template("ids_dashboard.html")


@app.route("/predict", methods=["POST"])
def predict():
    global alert_id_counter
    if not model or not scaler:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.get_json()
    if not data or "features" not in data:
        return jsonify({"error": "Invalid input data"}), 400

    try:
        feature_vector = np.array(data["features"]).reshape(1, -1)
        scaled_features = scaler.transform(feature_vector)
        prediction = model.predict(scaled_features)
        ml_prediction_text = "Attack" if prediction[0] == 0 else "Normal"

        # For demonstration purposes, we will add all alerts processed by the log_processor
        # to the dashboard, regardless of the ML prediction. The prediction is stored for context.
        with lock:
            alert_id_counter += 1
            alert_info = {
                "id": alert_id_counter,
                "timestamp": datetime.now().isoformat(),
                "source_ip": data.get("source_ip", "N/A"),
                "dest_ip": data.get("destination_ip", "N/A"),
                "attack_type": data.get("snort_alert_description", "Unknown Event"),
                "ml_prediction": ml_prediction_text,
            }
            confirmed_attacks.insert(0, alert_info)
            if len(confirmed_attacks) > 100:
                confirmed_attacks.pop()

        return jsonify({"status": "processed", "prediction": ml_prediction_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/get_alerts", methods=["GET"])
def get_alerts():
    with lock:
        return jsonify(confirmed_attacks)

#-------------------------------
#CYBER SYSTEM ROUTES APP.PY
#-------------------------------
@app.route('/dashboard')
@login_required(role=["admin", "analyst"])
def dashboard():
    return render_template('dashboard.html')

@app.route('/awareness')
@login_required(role=["admin", "analyst", "user"])
def awareness_page():
    return render_template('awareness.html')

@app.route('/models/<path:filename>')
def get_model_file(filename):
    return send_from_directory('models', filename)

@app.route('/sms_detector', methods=['GET', 'POST'])
@login_required(role=["admin", "analyst", "user"])
def sms_detector():
    prediction_result = None
    individual_preds = None
    message = ""
    error = None

    if request.method == 'POST':
        message = request.form.get('message', '')
        if message:
            try:
                # First check if it's Bemba and use pattern detection
                bemba_result = detect_bemba_scam_patterns(message)
                
                if bemba_result['is_bemba']:
                    # Use Bemba pattern detection for Bemba messages
                    is_spam = bemba_result["risk_level"] in [RiskLevel.SCAM, RiskLevel.SUSPICIOUS]
                    prediction_result = {
                        'final_pred': bemba_result["confidence"] if is_spam else 1 - bemba_result["confidence"],
                        'is_spam': is_spam,
                        'confidence': bemba_result["confidence"],
                        'language': bemba_result["language"],
                        'explanation': bemba_result["explanation"],
                        'method': 'bemba_pattern'
                    }
                    
                    # Update Bemba-specific stats
                    sms_stats["bemba_messages"] += 1
                    if is_spam:
                        sms_stats["bemba_scams"] += 1
                        
                else:
                    # Use existing ML models for non-Bemba messages
                    processed_message = preprocess_message(message)
                    final_pred, individual_preds = get_ensemble_prediction(processed_message)
                    
                    is_spam = final_pred > 0.5
                    confidence = abs(final_pred - 0.5) * 2

                    explanation_text = ""
                    if is_spam:
                        if confidence > 0.8:
                            explanation_text = "This message shows strong characteristics of a scam, based on our AI model's analysis of its content and structure."
                        else:
                            explanation_text = "This message contains patterns often seen in scam messages. Please be cautious with any links or requests."
                    else:
                        if confidence > 0.8:
                            explanation_text = "This message appears to be safe. Our AI model found no common signs of a scam."
                        else:
                            explanation_text = "This message seems safe, but always remember to be careful with unexpected messages."

                    prediction_result = {
                        'final_pred': float(final_pred),
                        'is_spam': is_spam,
                        'confidence': confidence,
                        'language': Language.ENGLISH.value,
                        'explanation': explanation_text,
                        'method': 'ml_model'
                    }

                # Update general SMS stats
                sms_stats["total"] += 1
                if prediction_result['is_spam']:
                    sms_stats["scam"] += 1
                else:
                    sms_stats["genuine"] += 1

            except Exception as e:
                error = f"Error processing message: {str(e)}"
                print(f"Detection error: {e}")
        else:
            error = "Please enter a message to analyze."
    
    return render_template('sms_detector.html', 
                           message=message, 
                           result=prediction_result, 
                           individual_preds=individual_preds,
                           error=error)


# --- Phishing Detector Route ---
# -------------------------------
# Flask Route
# -------------------------------
@app.route('/phishing_detector', methods=['GET', 'POST'])
@login_required(role=["admin", "analyst", "user"])
def phishing_detector():
    prediction_result = None
    input_data = ""
    error = None
    scanned_emails = []

    if request.method == 'POST':
        # Inbox scan workflow
        if "scan_inbox" in request.form:
            user_email = request.form.get('email')
            app_password = request.form.get('app_password')

            emails, fetch_error = fetch_gmail_emails(user_email, app_password)
            if fetch_error:
                error = fetch_error
            else:
                scanned_emails = []
                for msg in emails:
                    result, _ = get_phishing_prediction(msg["body"])
                    scanned_emails.append({
                        "sender": msg["sender"],
                        "subject": msg["subject"],
                        "date": msg["date"],
                        "snippet": msg["snippet"],
                        "result": result
                    })
                    # Update email stats
                    email_stats["total"] += 1
                    if result and result["is_phishing"]:
                        email_stats["phishing"] += 1
                    elif result:
                        email_stats["safe"] += 1

        # Manual input workflow
        elif "input_data" in request.form:
            input_data = request.form.get('input_data', '').strip()
            if not input_data:
                error = "No input provided. Please enter a URL or email content."
            else:
                prediction_result, error = get_phishing_prediction(input_data)
                if prediction_result:
                    email_stats["total"] += 1
                    if prediction_result["is_phishing"]:
                        email_stats["phishing"] += 1
                    else:
                        email_stats["safe"] += 1

    return render_template(
        'phishing_detector.html',
        input_data=input_data,
        result=prediction_result,
        scanned_emails=scanned_emails,
        error=error
    )


    
# Admin + analyst
@app.route("/threat_dashboard")
@login_required(role=["admin", "analyst"])
def threat_dashboard():
    return render_template("threat_dashboard.html")

@app.route('/api/sms_stats')
def get_sms_stats():
    return sms_stats

@app.route('/api/email_stats')
def get_email_stats():
    return email_stats

@app.route('/api/dashboard_stats')
def get_dashboard_stats():
    return {
        "sms": sms_stats,
        "email": email_stats
    }

@app.route('/api/bemba_samples')
def get_bemba_samples():
    """API endpoint to get Bemba scam samples for testing"""
    samples = {
        "scam_messages": [
            "Mwabuka shani! Naifwa na banki yobe. Nomba ulandile prize ya K10,000. Tumako imali ya K500 ku +260955123456 ukalande prize yobe.",
            "BWANGU BWANGU! Umwana obe alibeleka mu chipatala. Tumako imali ya K2,000 ku +260966789012 ukamusunge. Naleta ifyo ukwete nomba.",
            "Congratulations! Uliwina umupati wa MTN. Landa free airtime ya K500. Tumako imali ya K100 ku +260977345678 ukalande.",
            "ninebo doctor maomba nimbwela  kusumbawanga naliisa muzambia ndepanga k550,000 pali 1:30hrs, naamangaya business ndapela, pamo najigi ring, navimbi tuma 4n."
        ],
        "safe_messages": [
            "Mwaisa shani? Tulelanda ukucila ifyakucita pa weekend? Naleta ifyo wishiba na ifyo ufwaya ukucita.",
            "Umwana wesu alibeleka bwino. Tapali icipuba. Twalumba ukumona pa Saturday. Mwaisa bonse?",
            "Naishiba ukuti ufwaya ukuteka ifya kwikala. Naleta ifintu ifisuma pa mtengo uwafiliba. Ishente uko?"
        ]
    }
    return samples

@app.route("/threats/logs")
def threat_logs():
    return render_template("threat_logs.html")

@app.route("/threats/analytics")
def threat_analytics():
    return render_template("threat_analytics.html")

@app.route("/threats/intrusion")
def intrusion_view():
    return render_template("threat_intrusion.html")

@app.route("/threats/comm")
def comm_view():
    return render_template("threat_comm.html")

from flask import session, redirect, url_for, request, render_template

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        # Fetch user from USERS dict
        user = USERS.get(email)

        if user and password == user['password']:  # simple check for prototype
            session['user_email'] = email
            session['user_role'] = user['role']  # e.g., 'admin', 'analyst', 'user'
            return redirect(url_for('home'))
        else:
            error = "Invalid credentials"
            return render_template('login.html', error=error)

    return render_template('login.html')



@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))



# --- Chat API Endpoint for Dashboard Chat Modal ---
from dotenv import load_dotenv
load_dotenv()
import openai

@app.route('/api/chat', methods=['POST'])
def chat_api():
    data = request.get_json()
    user_message = data.get('message', '')
    # System prompt for cybersecurity context
    system_prompt = (
        "You are a cybersecurity assistant for a security dashboard. "
        "Give users practical tips on security, social engineering, and protection. "
        "Always provide actionable advice and explain why each tip matters. "
        "If asked about the system, mention it monitors threats, phishing, and scams."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]
    # Read token and endpoint from .env
    token = os.getenv("GITHUB_TOKEN")
    endpoint = "https://models.github.ai/inference"
    model = "openai/gpt-4.1"
    try:
        client = openai.OpenAI(base_url=endpoint, api_key=token)
        response = client.chat.completions.create(
            messages=messages,
            temperature=0.7,
            top_p=1.0,
            model=model
        )
        reply = response.choices[0].message.content
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[OpenAI API Error] {e}\n{error_details}")
        reply = f"Sorry, there was an error connecting to the assistant. Details: {str(e)}"
    return jsonify({"reply": reply})

if __name__ == "__main__":
    print("🚀 Starting Enhanced Scam Detection System")
    print("✅ Bemba language patterns loaded:", len(BEMBA_SCAM_PATTERNS))
    print("✅ Bemba language detection patterns:", len(BEMBA_LANGUAGE_PATTERNS))
    app.run(host="0.0.0.0", port=5000, debug=True)
