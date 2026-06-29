"""
One-time script to generate Google Drive OAuth2 refresh token.

Prerequisites:
  1. Create an OAuth2 Desktop Client ID in Google Cloud Console
  2. Download the JSON and save it as:
     credentials/gdrive-oauth-client.json

Usage:
  cd src/backend
  python generate_gdrive_token.py

This will open a browser for you to authorize with your Google account.
A token file will be saved at: credentials/gdrive-token.json
"""

import os
import json
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/drive.file"]
CLIENT_SECRET_PATH = os.path.join(os.path.dirname(__file__), "credentials", "gdrive-oauth-client.json")
TOKEN_PATH = os.path.join(os.path.dirname(__file__), "credentials", "gdrive-token.json")


def main():
    if not os.path.exists(CLIENT_SECRET_PATH):
        print(f"ERROR: OAuth client file not found at:\n  {CLIENT_SECRET_PATH}")
        print("\nPlease download it from Google Cloud Console:")
        print("  APIs & Services -> Credentials -> OAuth 2.0 Client IDs -> Download JSON")
        return

    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_PATH, SCOPES)
    creds = flow.run_local_server(port=8091, prompt="consent")

    token_data = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes),
    }

    with open(TOKEN_PATH, "w") as f:
        json.dump(token_data, f, indent=2)

    print(f"\nToken saved to: {TOKEN_PATH}")
    print("You can now start the backend — Drive uploads will work.")


if __name__ == "__main__":
    main()
