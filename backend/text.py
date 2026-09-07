import argparse
import pandas as pd
import json

def main():
    # Set up command-line argument parsing
    parser = argparse.ArgumentParser(description="Clean a CSV file and convert it to JSON.")
    parser.add_argument('--input', required=True, help="Path to the input CSV file")
    parser.add_argument('--output', required=True, help="Path to save the output JSON file")
    args = parser.parse_args()

    try:
        # 1. Read the CSV file into a pandas DataFrame
        df = pd.read_csv(args.input)
        
        # 2. Handle missing data dynamically by data type
        # Fill missing text/object columns with 'Unknown'
        text_cols = df.select_dtypes(include=['object', 'category']).columns
        df[text_cols] = df[text_cols].fillna("Unknown")
        
        # Fill missing numeric columns with 0
        num_cols = df.select_dtypes(include=['number']).columns
        df[num_cols] = df[num_cols].fillna(0)

        # 3. Write output to JSON file
        # 'records' orient creates a list of dictionaries (standard JSON array format)
        df.to_json(args.output, orient='records', indent=4)
        print(f"Success: Cleaned data successfully saved to {args.output}")

    except FileNotFoundError:
        print(f"Error: The input file '{args.input}' was not found.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == '__main__':
    main()
