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

    try:
        attack_vector_str = config.get("FeatureSimulation", "attack_vector")
        attack_vector = list(ast.literal_eval(attack_vector_str))
    except (configparser.NoSectionError, configparser.NoOptionError, SyntaxError) as e:
        print(f"Error parsing 'attack_vector' from config file: {e}")
        return None, None

    return config, attack_vector


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


def process_snort_alert(row, config, rule_priorities, attack_feature_vector):
    """Intelligently parses a log entry and sends it to the API if it meets the priority threshold."""
    try:
        is_preprocessor_alert = "GID" in row[1] or "(portscan)" in row[4]
        if is_preprocessor_alert:
            signature, protocol, src_ip, dst_ip = row[4].strip(), row[5], row[6], row[8]
        else:
            signature, protocol, src_ip, dst_ip = row[1], row[2], row[3], row[5]
    except IndexError:
        print(f"Skipping malformed log entry: {row}")
        return

    print(f"Snort Detected: {signature} | {src_ip} -> {dst_ip}")

    alert_priority = rule_priorities.get(signature)
    priority_threshold = config.getint("Filtering", "serious_priority_threshold")

    if is_preprocessor_alert or (
        alert_priority is not None and alert_priority <= priority_threshold
    ):
        display_priority = (
            "1 (Preprocessor)" if is_preprocessor_alert else alert_priority
        )
        print(
            f"[!] Alert '{signature}' has priority {display_priority}. Sending to ML model for verification..."
        )

        payload = {
            "source_ip": src_ip,
            "destination_ip": dst_ip,
            "protocol": protocol,
            "snort_alert_description": signature,
            "features": attack_feature_vector,
        }

        try:
            requests.post(config.get("API", "flask_url"), json=payload, timeout=3)
        except requests.exceptions.RequestException as e:
            print(f"Could not send alert to Flask API: {e}")
    else:
        print(f"[-] Ignoring low-priority alert (Priority: {alert_priority or 'N/A'}).")


if __name__ == "__main__":
    try:
        config, attack_vector = load_configuration()
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
                        last_position = f.tell()

                    for line in new_lines:
                        if line.strip():
                            parts = [
                                part.strip()
                                for part in line.strip().replace("\t", ",").split(",")
                            ]
                            process_snort_alert(
                                parts, config, rule_priorities_map, attack_vector
                            )
            except Exception as e:
                print(f"Error reading log file: {e}")

            time.sleep(2)

    except (FileNotFoundError, configparser.Error) as e:
        print(f"FATAL ERROR: {e}")
