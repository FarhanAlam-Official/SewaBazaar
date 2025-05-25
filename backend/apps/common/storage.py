import os
import uuid
import mimetypes
from django.conf import settings
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from supabase import create_client, Client

class SupabaseStorage(Storage):
    """
    Custom storage backend for Supabase
    """
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self.bucket_name = settings.SUPABASE_BUCKET
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        # Create bucket if it doesn't exist
        try:
            self.supabase.storage.get_bucket(self.bucket_name)
        except:
            self.supabase.storage.create_bucket(self.bucket_name, {'public': True})
    
    def _save(self, name, content):
        # Generate a unique filename to avoid collisions
        file_ext = os.path.splitext(name)[1]
        unique_name = f"{uuid.uuid4().hex}{file_ext}"
        
        # Get the folder path from the original name
        folder_path = os.path.dirname(name)
        if folder_path:
            unique_path = f"{folder_path}/{unique_name}"
        else:
            unique_path = unique_name
        
        # Get content type
        content_type = mimetypes.guess_type(name)[0]
        if not content_type:
            content_type = 'application/octet-stream'
        
        # Upload file to Supabase
        file_data = content.read()
        self.supabase.storage.from_(self.bucket_name).upload(
            unique_path, 
            file_data,
            {"content-type": content_type}
        )
        
        return unique_path
    
    def _open(self, name, mode='rb'):
        # Download file from Supabase
        response = self.supabase.storage.from_(self.bucket_name).download(name)
        return ContentFile(response)
    
    def exists(self, name):
        try:
            # Check if file exists in Supabase
            self.supabase.storage.from_(self.bucket_name).get_public_url(name)
            return True
        except:
            return False
    
    def url(self, name):
        # Get public URL for the file
        try:
            return self.supabase.storage.from_(self.bucket_name).get_public_url(name)
        except:
            return None
    
    def delete(self, name):
        # Delete file from Supabase
        try:
            self.supabase.storage.from_(self.bucket_name).remove([name])
        except:
            pass
    
    def get_available_name(self, name, max_length=None):
        # We're generating unique names in _save, so just return the name
        return name
