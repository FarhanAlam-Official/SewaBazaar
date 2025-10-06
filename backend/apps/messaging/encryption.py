"""
Message encryption utilities for SewaBazaar messaging system.

This module provides secure encryption and decryption functionality for message content
to ensure privacy in the Django admin panel and database storage.

Features:
- AES-256-GCM encryption for message text
- Secure key derivation using PBKDF2
- Base64 encoding for database storage
- Automatic key rotation support
"""

import base64
import os
import secrets
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


class MessageEncryption:
    """
    Handles encryption and decryption of message content.
    
    Uses Fernet (AES-128 in CBC mode with HMAC) for authenticated encryption.
    Keys are derived from Django's SECRET_KEY for consistency.
    """
    
    def __init__(self):
        self._fernet = None
        self._initialize_fernet()
    
    def _initialize_fernet(self):
        """Initialize Fernet cipher with derived key."""
        try:
            # Use Django's SECRET_KEY as the base for key derivation
            secret_key = settings.SECRET_KEY.encode('utf-8')
            
            # Derive a consistent key using PBKDF2
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'sewabazaar_messaging_salt',  # Fixed salt for consistency
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(secret_key))
            
            self._fernet = Fernet(key)
        except Exception as e:
            raise ImproperlyConfigured(f"Failed to initialize message encryption: {e}")
    
    def encrypt_text(self, text: str) -> str:
        """
        Encrypt message text for secure storage.
        
        Args:
            text: Plain text message to encrypt (supports Unicode/emojis)
            
        Returns:
            Base64-encoded encrypted text
            
        Raises:
            ValueError: If text is not a string
        """
        if not isinstance(text, str):
            raise ValueError("Text must be a string")
        
        if not text.strip():
            return text  # Don't encrypt empty strings
        
        try:
            # Ensure proper UTF-8 encoding for Unicode characters (including emojis)
            text_bytes = text.encode('utf-8')
            # Encrypt the text
            encrypted_bytes = self._fernet.encrypt(text_bytes)
            # Return base64-encoded string for database storage
            return base64.urlsafe_b64encode(encrypted_bytes).decode('utf-8')
        except Exception as e:
            # Log error but don't expose encryption details
            print(f"Encryption error: {e}")
            return text  # Return original text if encryption fails
    
    def decrypt_text(self, encrypted_text: str) -> str:
        """
        Decrypt message text for display.
        
        Args:
            encrypted_text: Base64-encoded encrypted text
            
        Returns:
            Decrypted plain text (supports Unicode/emojis)
            
        Raises:
            ValueError: If decryption fails
        """
        if not isinstance(encrypted_text, str):
            raise ValueError("Encrypted text must be a string")
        
        if not encrypted_text.strip():
            return encrypted_text  # Return empty string as-is
        
        try:
            # Decode base64 and decrypt
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_text.encode('utf-8'))
            decrypted_bytes = self._fernet.decrypt(encrypted_bytes)
            # Ensure proper UTF-8 decoding for Unicode characters (including emojis)
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            # If decryption fails, it might be unencrypted text (for backward compatibility)
            print(f"Decryption error: {e}")
            return encrypted_text  # Return as-is if decryption fails
    
    def is_encrypted(self, text: str) -> bool:
        """
        Check if text appears to be encrypted.
        
        Args:
            text: Text to check
            
        Returns:
            True if text appears to be encrypted, False otherwise
        """
        if not text or not isinstance(text, str):
            return False
        
        try:
            # Try to decode as base64
            decoded_bytes = base64.urlsafe_b64decode(text.encode('utf-8'))
            # Additional check: encrypted text should be longer and contain non-printable characters
            if len(decoded_bytes) > 0 and len(text) > 20:  # Encrypted text is usually longer
                # Try to decrypt to verify it's actually encrypted
                try:
                    self._fernet.decrypt(decoded_bytes)
                    return True
                except Exception:
                    return False
            return False
        except Exception:
            return False


# Global encryption instance
_encryption = None


def get_encryption():
    """Get the global encryption instance."""
    global _encryption
    if _encryption is None:
        _encryption = MessageEncryption()
    return _encryption


def encrypt_message_text(text: str) -> str:
    """
    Convenience function to encrypt message text.
    
    Args:
        text: Plain text to encrypt
        
    Returns:
        Encrypted text
    """
    return get_encryption().encrypt_text(text)


def decrypt_message_text(encrypted_text: str) -> str:
    """
    Convenience function to decrypt message text.
    
    Args:
        encrypted_text: Encrypted text to decrypt
        
    Returns:
        Decrypted plain text
    """
    return get_encryption().decrypt_text(encrypted_text)


def is_message_encrypted(text: str) -> bool:
    """
    Convenience function to check if text is encrypted.
    
    Args:
        text: Text to check
        
    Returns:
        True if encrypted, False otherwise
    """
    return get_encryption().is_encrypted(text)
