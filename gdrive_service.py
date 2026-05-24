import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io

SCOPES = ['https://www.googleapis.com/auth/drive']

def get_drive_service():
    """Authenticate and return the Google Drive service."""
    creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    
    if not creds_path or not os.path.exists(creds_path):
        print("Google Drive credentials not found. Please set GOOGLE_APPLICATION_CREDENTIALS in .env")
        return None
        
    try:
        creds = service_account.Credentials.from_service_account_file(
            creds_path, scopes=SCOPES)
        service = build('drive', 'v3', credentials=creds)
        return service
    except Exception as e:
        print(f"Error authenticating with Google Drive: {e}")
        return None

def ensure_folder(service, folder_name, parent_id=None):
    """Find a folder by name or create it if it doesn't exist."""
    query = f"mimeType='application/vnd.google-apps.folder' and name='{folder_name}' and trashed=false"
    if parent_id:
        query += f" and '{parent_id}' in parents"
        
    results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
    files = results.get('files', [])
    
    if files:
        return files[0].get('id')
    else:
        # Create the folder
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        if parent_id:
            file_metadata['parents'] = [parent_id]
            
        folder = service.files().create(body=file_metadata, fields='id').execute()
        return folder.get('id')

def upload_pdf_to_drive(file_stream, filename):
    """Uploads a PDF file to Google Drive in the Articles_PDFs folder."""
    service = get_drive_service()
    if not service:
        return None
        
    parent_folder_id = os.environ.get('GOOGLE_DRIVE_FOLDER_ID')
    if not parent_folder_id:
        print("GOOGLE_DRIVE_FOLDER_ID not set in .env")
        return None
        
    # Ensure the Articles_PDFs subfolder exists
    pdf_folder_id = ensure_folder(service, 'Articles_PDFs', parent_folder_id)
    
    # Reset stream position to beginning
    file_stream.seek(0)
    
    media = MediaIoBaseUpload(file_stream, mimetype='application/pdf', resumable=True)
    
    file_metadata = {
        'name': filename,
        'parents': [pdf_folder_id]
    }
    
    try:
        # Upload file
        file = service.files().create(
            body=file_metadata, 
            media_body=media, 
            fields='id, webViewLink, webContentLink'
        ).execute()
        
        file_id = file.get('id')
        
        # Make the file publicly accessible
        permission = {
            'type': 'anyone',
            'role': 'reader'
        }
        service.permissions().create(
            fileId=file_id,
            body=permission,
            fields='id'
        ).execute()
        
        # We can return either webViewLink (opens in drive viewer) or webContentLink (direct download)
        return file.get('webViewLink')
        
    except Exception as e:
        print(f"Error uploading to Google Drive: {e}")
        return None

def delete_from_drive(file_url):
    """Attempt to delete a file from Google Drive using its public URL."""
    # Extract file ID from URL (basic extraction)
    # Drive URLs usually look like: https://drive.google.com/file/d/FILE_ID/view
    import re
    match = re.search(r'/d/([a-zA-Z0-9_-]+)', file_url)
    if not match:
        return False
        
    file_id = match.group(1)
    service = get_drive_service()
    if not service:
        return False
        
    try:
        service.files().delete(fileId=file_id).execute()
        return True
    except Exception as e:
        print(f"Error deleting from Google Drive: {e}")
        return False
