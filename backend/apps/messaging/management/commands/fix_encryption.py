"""
Management command to fix encryption issues.

This command ensures all messages are properly encrypted and handles
any encryption/decryption issues.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from apps.messaging.models import Message
from apps.messaging.encryption import is_message_encrypted, encrypt_message_text, decrypt_message_text


class Command(BaseCommand):
    help = 'Fix encryption issues and ensure all messages are properly encrypted'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be fixed without making changes',
        )
        parser.add_argument(
            '--test-decryption',
            action='store_true',
            help='Test decryption of all encrypted messages',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        test_decryption = options['test_decryption']
        
        self.stdout.write(
            self.style.SUCCESS('Starting encryption fix process...')
        )
        
        # Get all messages with text content
        messages_with_text = Message.objects.exclude(text__isnull=True).exclude(text='')
        total_messages = messages_with_text.count()
        
        if total_messages == 0:
            self.stdout.write(
                self.style.WARNING('No messages with text content found.')
            )
            return
        
        self.stdout.write(f'Found {total_messages} messages with text content.')
        
        # Analyze message encryption status
        unencrypted_count = 0
        encrypted_count = 0
        decryption_errors = 0
        
        for message in messages_with_text:
            if message.text:
                if is_message_encrypted(message.text):
                    encrypted_count += 1
                    if test_decryption:
                        try:
                            decrypt_message_text(message.text)
                        except Exception as e:
                            decryption_errors += 1
                            self.stdout.write(
                                self.style.ERROR(f'Decryption error for message {message.id}: {e}')
                            )
                else:
                    unencrypted_count += 1
        
        self.stdout.write(f'Encryption status:')
        self.stdout.write(f'  - Encrypted: {encrypted_count}')
        self.stdout.write(f'  - Unencrypted: {unencrypted_count}')
        if test_decryption:
            self.stdout.write(f'  - Decryption errors: {decryption_errors}')
        
        if unencrypted_count == 0 and decryption_errors == 0:
            self.stdout.write(
                self.style.SUCCESS('All messages are properly encrypted!')
            )
            return
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN: No changes will be made.')
            )
            if unencrypted_count > 0:
                self.stdout.write('Messages that would be encrypted:')
                count = 0
                for message in messages_with_text:
                    if message.text and not is_message_encrypted(message.text):
                        count += 1
                        self.stdout.write(f'  {count}. Message ID {message.id}: {message.text[:50]}...')
                        if count >= 10:
                            self.stdout.write(f'  ... and {unencrypted_count - 10} more messages')
                            break
            return
        
        # Fix unencrypted messages
        if unencrypted_count > 0:
            confirm = input(f'Encrypt {unencrypted_count} unencrypted messages? (y/N): ')
            if confirm.lower() != 'y':
                self.stdout.write('Operation cancelled.')
                return
            
            processed = 0
            encrypted = 0
            errors = 0
            
            try:
                with transaction.atomic():
                    for message in messages_with_text:
                        try:
                            if message.text and not is_message_encrypted(message.text):
                                # Encrypt the message text
                                message.text = encrypt_message_text(message.text)
                                message.save(update_fields=['text'])
                                encrypted += 1
                            
                            processed += 1
                            
                            if processed % 100 == 0:
                                self.stdout.write(f'Processed {processed}/{total_messages} messages...')
                                
                        except Exception as e:
                            errors += 1
                            self.stdout.write(
                                self.style.ERROR(f'Error encrypting message {message.id}: {e}')
                            )
                            continue
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Encryption completed!\n'
                        f'Processed: {processed} messages\n'
                        f'Encrypted: {encrypted} messages\n'
                        f'Errors: {errors} messages'
                    )
                )
                
            except Exception as e:
                raise CommandError(f'Encryption failed: {e}')
        
        self.stdout.write(
            self.style.SUCCESS('Encryption fix completed!')
        )
