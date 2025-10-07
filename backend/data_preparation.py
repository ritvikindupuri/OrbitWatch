import requests
import pandas as pd
import numpy as np

# --- Configuration ---
DATA_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
OUTPUT_CSV_PATH = "backend/satellite_data_processed.csv"
ANOMALY_FRACTION = 0.05  # Percentage of data to be turned into anomalies

# --- Data Acquisition ---
def download_tle_data(url: str) -> str:
    """Downloads the TLE dataset from the given URL."""
    print(f"Downloading TLE data from {url}...")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        print("Download successful.")
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error downloading data: {e}")
        return ""

def parse_tle_data(tle_text: str) -> pd.DataFrame:
    """Parses raw TLE text into a structured DataFrame."""
    lines = tle_text.strip().split('\n')
    satellites = []

    if len(lines) < 3:
        return pd.DataFrame()

    for i in range(0, len(lines) - 2, 3):
        name = lines[i].strip()
        line1 = lines[i+1].strip()
        line2 = lines[i+2].strip()

        try:
            satellites.append({
                'name': name,
                'norad_cat_id': int(line1[2:7]),
                'classification': line1[7],
                'int_designator': line1[9:17].strip(),
                'epoch_year': int(line1[18:20]),
                'epoch_day': float(line1[20:32]),
                'first_derivative_mean_motion': float(line1[33:43]),
                'second_derivative_mean_motion': float(line1[44:50]) * 10**(-float(line1[50:52])),
                'bstar_drag': float(line1[53:59]) * 10**(-float(line1[59:61])),
                'ephemeris_type': int(line1[62]),
                'element_set_number': int(line1[64:68]),
                'inclination': float(line2[8:16]),
                'raan': float(line2[17:25]),
                'eccentricity': float("." + line2[26:33]),
                'arg_of_perigee': float(line2[34:42]),
                'mean_anomaly': float(line2[43:51]),
                'mean_motion': float(line2[52:63]),
                'rev_number': int(line2[63:68]),
            })
        except (ValueError, IndexError) as e:
            print(f"Skipping malformed TLE entry for '{name}': {e}")
            continue

    return pd.DataFrame(satellites)

# --- Synthetic Anomaly Generation ---
def create_synthetic_anomalies(df: pd.DataFrame, fraction: float) -> pd.DataFrame:
    """
    Introduces synthetic anomalies into the dataset and adds a label.
    - Anomaly = 1, Normal = 0
    """
    df_copy = df.copy()
    df_copy['anomaly_label'] = 0

    num_anomalies = int(len(df_copy) * fraction)
    if num_anomalies == 0:
        return df_copy

    anomaly_indices = np.random.choice(df_copy.index, size=num_anomalies, replace=False)

    print(f"Generating {num_anomalies} synthetic anomalies...")
    for idx in anomaly_indices:
        df_copy.loc[idx, 'anomaly_label'] = 1

        # Select a random parameter to modify
        param_to_alter = np.random.choice(['inclination', 'eccentricity', 'bstar_drag', 'mean_motion'])

        original_value = df_copy.loc[idx, param_to_alter]

        if param_to_alter == 'inclination':
            # Small change in inclination (0.1 to 0.5 degrees)
            change = np.random.uniform(0.1, 0.5)
            df_copy.loc[idx, param_to_alter] += change
        elif param_to_alter == 'eccentricity':
            # Increase eccentricity
            df_copy.loc[idx, param_to_alter] *= np.random.uniform(1.5, 3.0)
        elif param_to_alter == 'bstar_drag':
            # Significant change in BSTAR drag term
            df_copy.loc[idx, param_to_alter] *= np.random.uniform(5, 10)
        elif param_to_alter == 'mean_motion':
            # Slight change in mean motion
            change = np.random.uniform(0.001, 0.005)
            df_copy.loc[idx, param_to_alter] += change

    print("Anomaly generation complete.")
    return df_copy

# --- Main Execution ---
def main():
    """Main function to run the data preparation pipeline."""
    # 1. Acquire Data
    raw_tle_data = download_tle_data(DATA_URL)
    if not raw_tle_data:
        print("Halting execution due to download failure.")
        return

    # 2. Parse Data
    sat_df = parse_tle_data(raw_tle_data)
    if sat_df.empty:
        print("Halting execution due to parsing failure.")
        return
    print(f"Successfully parsed {len(sat_df)} satellite entries.")

    # 3. Generate Anomalies
    final_df = create_synthetic_anomalies(sat_df, ANOMALY_FRACTION)

    # 4. Save to CSV
    try:
        final_df.to_csv(OUTPUT_CSV_PATH, index=False)
        print(f"Processed data saved to {OUTPUT_CSV_PATH}")
    except IOError as e:
        print(f"Failed to save data to CSV: {e}")

if __name__ == "__main__":
    main()