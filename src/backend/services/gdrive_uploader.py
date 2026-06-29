import os
import json
import requests as http_requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from config import GDRIVE_FOLDER_ID

SCOPES = ["https://www.googleapis.com/auth/drive.file"]
TOKEN_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "credentials", "gdrive-token.json")


def _get_credentials():
    """Load and return valid OAuth2 credentials, refreshing if needed."""
    if not os.path.exists(TOKEN_PATH):
        raise FileNotFoundError(
            f"Google Drive token not found at {TOKEN_PATH}. "
            "Run 'python generate_gdrive_token.py' first."
        )

    with open(TOKEN_PATH, "r") as f:
        token_data = json.load(f)

    creds = Credentials(
        token=token_data["token"],
        refresh_token=token_data["refresh_token"],
        token_uri=token_data["token_uri"],
        client_id=token_data["client_id"],
        client_secret=token_data["client_secret"],
        scopes=token_data.get("scopes", SCOPES),
    )

    # Always refresh — loaded credentials don't track expiry correctly
    if creds.refresh_token:
        creds.refresh(Request())
        token_data["token"] = creds.token
        with open(TOKEN_PATH, "w") as f:
            json.dump(token_data, f, indent=2)

    return creds


def _get_drive_service():
    """Build and return an authenticated Google Drive service."""
    return build("drive", "v3", credentials=_get_credentials())


def create_resumable_upload_url(file_name: str, mime_type: str = "video/webm") -> dict:
    """
    Create a resumable upload session URI that the browser can upload to directly.
    This is a lightweight call — no file data is sent, just metadata.

    Returns:
        dict with 'uploadUrl' (resumable session URI) and 'accessToken' for the browser.
    """
    creds = _get_credentials()

    metadata = json.dumps({
        "name": file_name,
        "parents": [GDRIVE_FOLDER_ID],
    })

    resp = http_requests.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
        headers={
            "Authorization": f"Bearer {creds.token}",
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": mime_type,
        },
        data=metadata,
    )

    if resp.status_code != 200:
        raise Exception(f"Failed to create resumable upload: {resp.status_code} {resp.text}")

    upload_url = resp.headers.get("Location")
    if not upload_url:
        raise Exception("No Location header in resumable upload response")

    return {
        "uploadUrl": upload_url,
        "accessToken": creds.token,
    }


def set_file_permission_and_get_link(file_id: str) -> str:
    """
    Make a Drive file publicly readable and return its view link.
    """
    service = _get_drive_service()

    service.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"},
    ).execute()

    file_info = service.files().get(
        fileId=file_id,
        fields="webViewLink",
    ).execute()

    return file_info.get("webViewLink", f"https://drive.google.com/file/d/{file_id}/view")


def upload_to_drive(file_path: str, file_name: str, mime_type: str = "video/webm") -> str:
    """
    Upload a file to Google Drive and return a shareable view link.
    (Legacy — used by the old server-side upload endpoint)
    """
    service = _get_drive_service()

    file_metadata = {
        "name": file_name,
        "parents": [GDRIVE_FOLDER_ID],
    }

    media = MediaFileUpload(file_path, mimetype=mime_type, resumable=True)

    uploaded = service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id, webViewLink",
    ).execute()

    service.permissions().create(
        fileId=uploaded["id"],
        body={"type": "anyone", "role": "reader"},
    ).execute()

    return uploaded.get("webViewLink", f"https://drive.google.com/file/d/{uploaded['id']}/view")
