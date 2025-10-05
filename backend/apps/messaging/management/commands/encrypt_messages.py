"""
Management command to encrypt existing messages.

This command encrypts all existing unencrypted messages in the database
to ensure privacy in the Django admin panel.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from apps.messaging.models import Message
from apps.messaging.encryption import is_message_encrypted, encrypt_message_text


class Command(BaseCommand):
    help = 'Encrypt all existing unencrypted messages for privacy'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be encrypted without making changes',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of messages to process in each batch (default: 100)',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch_size']
        
        self.stdout.write(
            self.style.SUCCESS('Starting message encryption process...')
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
        
        # Count unencrypted messages
        unencrypted_count = 0
        for message in messages_with_text:
            if message.text and not is_message_encrypted(message.text):
                unencrypted_count += 1
        
        if unencrypted_count == 0:
            self.stdout.write(
                self.style.SUCCESS('All messages are already encrypted.')
            )
            return
        
        self.stdout.write(f'Found {unencrypted_count} unencrypted messages.')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN: No changes will be made.')
            )
            self.stdout.write('Messages that would be encrypted:')
            
            count = 0
            for message in messages_with_text:
                if message.text and not is_message_encrypted(message.text):
                    count += 1
                    self.stdout.write(f'  {count}. Message ID {message.id}: {message.text[:50]}...')
                    if count >= 10:  # Show only first 10 for dry run
                        self.stdout.write(f'  ... and {unencrypted_count - 10} more messages')
                        break
            return
        
        # Confirm before proceeding
        confirm = input(f'Encrypt {unencrypted_count} messages? (y/N): ')
        if confirm.lower() != 'y':
            self.stdout.write('Operation cancelled.')
            return
        
        # Process messages in batches
        processed = 0
        encrypted = 0
        errors = 0
        
        try:
            with transaction.atomic():
                for i in range(0, total_messages, batch_size):
                    batch = messages_with_text[i:i + batch_size]
                    
                    for message in batch:
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
