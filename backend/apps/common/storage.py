import os
import uuid
import mimetypes
from django.conf import settings
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from supabase import create_client, Client


class SupabaseStorage(Storage):
    """
    Custom storage backend for Supabase.
    
    This storage backend integrates with Supabase storage to handle
    file uploads, downloads, and management. It automatically generates
    unique filenames to avoid collisions and handles content type detection.
    
    Attributes:
        supabase_url (str): The Supabase project URL
        supabase_key (str): The Supabase API key
        bucket_name (str): The name of the storage bucket
        supabase (Client): The Supabase client instance
    """
    def __init__(self):
        """
        Initialize the Supabase storage backend.
        
        Sets up the Supabase client and ensures the storage bucket exists.
        """
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
        """
        Save a file to Supabase storage.
        
        Generates a unique filename to avoid collisions and uploads
        the file to the configured Supabase bucket.
        
        Args:
            name (str): The original filename
            content (File): The file content to save
            
        Returns:
            str: The unique path of the saved file
        """
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
        """
        Open a file from Supabase storage.
        
        Downloads a file from Supabase storage and returns it as a ContentFile.
        
        Args:
            name (str): The name of the file to open
            mode (str): The mode to open the file in (default: 'rb')
            
        Returns:
            ContentFile: The downloaded file content
        """
        # Download file from Supabase
        response = self.supabase.storage.from_(self.bucket_name).download(name)
        return ContentFile(response)
    
    def exists(self, name):
        """
        Check if a file exists in Supabase storage.
        
        Args:
            name (str): The name of the file to check
            
        Returns:
            bool: True if the file exists, False otherwise
        """
        try:
            # Check if file exists in Supabase
            self.supabase.storage.from_(self.bucket_name).get_public_url(name)
            return True
        except:
            return False
    
    def url(self, name):
        """
        Get the public URL for a file in Supabase storage.
        
        Args:
            name (str): The name of the file
            
        Returns:
            str: The public URL of the file, or None if an error occurs
        """
        # Get public URL for the file
        try:
            return self.supabase.storage.from_(self.bucket_name).get_public_url(name)
        except:
            return None
    
    def delete(self, name):
        """
        Delete a file from Supabase storage.
        
        Args:
            name (str): The name of the file to delete
        """
        # Delete file from Supabase
        try:
            self.supabase.storage.from_(self.bucket_name).remove([name])
        except:
            pass
    
    def get_available_name(self, name, max_length=None):
        """
        Get an available filename in Supabase storage.
        
        Since we're generating unique names in _save, this method
        simply returns the original name.
        
        Args:
            name (str): The original filename
            max_length (int): The maximum length of the filename (optional)
            
        Returns:
            str: The available filename
        """
        # We're generating unique names in _save, so just return the name
        return name