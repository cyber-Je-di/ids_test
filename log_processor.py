import configparser
import re
import os
import time
import requests
import ast


def load_configuration(config_file="config.ini"):
    """Reads settings from the config.ini file."""
    print("Loading configuration...")
    config = configparser.ConfigParser()
    if not os.path.exists(config_file):
        raise FileNotFoundError(f"Configuration file '{config_file}' not found.")

    config.read(config_file)
    # No longer loading a static attack vector
    return config


def generate_features_from_log(log_parts, protocol_str):
    """
    Generates a 15-feature vector based on the NSL-KDD feature set.
    Since Snort logs don't provide most of these features, we simulate them.
    """
    # Feature names (for reference):
    # duration, protocol_type, service, flag, src_bytes, dst_bytes,
    # wrong_fragment, hot, logged_in, num_compromised, count, srv_count,
    # serror_rate, srv_serror_rate, rerror_rate

    # 1. Map protocol_type string to a number
    protocol_map = {"TCP": 1, "UDP": 2, "ICMP": 3}
    protocol_type = protocol_map.get(protocol_str.upper(), 0) # Default to 0 if not found

    # 2. Create the 15-feature vector with defaults
    # We can only reliably get protocol_type. The rest are set to 0.0 as a plausible default.
    feature_vector = [
        0.0,            # duration
        protocol_type,  # protocol_type
        0.0,            # service
        0.0,            # flag
        0.0,            # src_bytes
        0.0,            # dst_bytes
        0.0,            # wrong_fragment
        0.0,            # hot
        0.0,            # logged_in
        0.0,            # num_compromised
        0.0,            # count
        0.0,            # srv_count
        0.0,            # serror_rate
        0.0,            # srv_serror_rate
        0.0             # rerror_rate
    ]
    return feature_vector


def load_rule_priorities(rule_file_path):
    """Parses a Snort rule file to map alert messages to their priorities."""
    print(f"Loading rule priorities from {rule_file_path}...")
    priorities = {}
    rule_pattern = re.compile(r'msg:"([^"]+)";.*priority:(\d+);')

    try:
        with open(rule_file_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if line.strip().startswith("#") or not line.strip():
                    continue
                match = rule_pattern.search(line)
                if match:
                    priorities[match.group(1)] = int(match.group(2))
    except FileNotFoundError:
        print(f"ERROR: Rule file not found at {rule_file_path}.")
        return None

    print(f"Successfully loaded {len(priorities)} rule priorities.")
    return priorities


def process_snort_alert(row, config, rule_priorities):
    """Intelligently parses a log entry, generates a feature vector, and sends it to the API."""
    try:
        is_preprocessor_alert = "GID" in row[1] or "(portscan)" in row[4]
        if is_preprocessor_alert:
            signature, protocol, src_ip, dst_ip = row[4].strip(), row[5], row[6], row[8]
        else:
            signature, protocol, src_ip, dst_ip = row[1], row[2], row[3], row[5]
    except IndexError:
        print(f"Skipping malformed log entry: {row}")
        return

    print(f"Snort Detected: {signature} | Protocol: {protocol} | {src_ip} -> {dst_ip}")

    alert_priority = rule_priorities.get(signature)
    priority_threshold = config.getint("Filtering", "serious_priority_threshold")

    if is_preprocessor_alert or (
        alert_priority is not None and alert_priority <= priority_threshold
    ):
        display_priority = (
            "1 (Preprocessor)" if is_preprocessor_alert else alert_priority
        )
        print(
            f"[!] Alert '{signature}' has priority {display_priority}. Generating features and sending for verification..."
        )

        # Generate feature vector from the log entry
        print(f"[DEBUG] Generating features for log: {row}")
        feature_vector = generate_features_from_log(row, protocol)
        print(f"[DEBUG] Generated feature vector: {feature_vector}")


        payload = {
            "source_ip": src_ip,
            "destination_ip": dst_ip,
            "protocol": protocol,
            "snort_alert_description": signature,
            "features": feature_vector,
        }
        print(f"[DEBUG] Sending payload to API: {payload}")

        try:
            response = requests.post(config.get("API", "flask_url"), json=payload, timeout=3)
            print(f"[DEBUG] API Response Status: {response.status_code}")
            print(f"[DEBUG] API Response Body: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"[DEBUG] API request failed: {e}")
    else:
        print(f"[-] Ignoring low-priority alert (Priority: {alert_priority or 'N/A'}).")


if __name__ == "__main__":
    try:
        config = load_configuration()
        if config is None:
            exit()

        rule_priorities_map = load_rule_priorities(
            config.get("Paths", "community_rules_file")
        )
        if rule_priorities_map is None:
            exit()

        print("\nStarting Snort Log Processor...")
        snort_log_file = config.get("Paths", "snort_log_file")
        last_position = 0

        while True:
            try:
                if (
                    os.path.exists(snort_log_file)
                    and os.path.getsize(snort_log_file) > last_position
                ):
                    with open(snort_log_file, "r") as f:
                        f.seek(last_position)
                        new_lines = f.readlines()
                        if new_lines:
                            print(f"[DEBUG] Detected {len(new_lines)} new lines in log file.")
                        last_position = f.tell()

                    for line in new_lines:
                        if line.strip():
                            parts = [
                                part.strip()
                                for part in line.strip().replace("\t", ",").split(",")
                            ]
                            process_snort_alert(
                                parts, config, rule_priorities_map
                            )
            except Exception as e:
                print(f"Error reading log file: {e}")

            time.sleep(2)

    except (FileNotFoundError, configparser.Error) as e:
        print(f"FATAL ERROR: {e}")
