"""
Unit tests for messaging models.

This module contains comprehensive tests for the messaging system models to ensure
proper functionality, data integrity, and business logic validation.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
import tempfile
import os

from apps.messaging.models import Conversation, Message, MessageReadStatus
from apps.services.models import Service, ServiceCategory, City

User = get_user_model()


class ConversationModelTest(TestCase):
    """Test cases for Conversation model."""
    
    def setUp(self):
        """Set up test data."""
        # Create users
        self.customer = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            role='customer',
            first_name='John',
            last_name='Doe'
        )
        
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider',
            first_name='Jane',
            last_name='Smith'
        )
        
        # Create service category and city
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            slug='test-category'
        )
        
        self.city = City.objects.create(name='Test City')
        
        # Create service
        self.service = Service.objects.create(
            title='Test Service',
            description='Test service description',
            price=100.00,
            duration='1 hour',
            category=self.category,
            provider=self.provider
        )
        self.service.cities.add(self.city)
    
    def test_conversation_creation(self):
        """Test creating a conversation."""
        conversation = Conversation.objects.create(
            service=self.service,
            provider=self.provider,
            customer=self.customer
        )
        
        self.assertEqual(conversation.service, self.service)
        self.assertEqual(conversation.provider, self.provider)
        self.assertEqual(conversation.customer, self.customer)
        self.assertTrue(conversation.is_active)
        self.assertFalse(conversation.provider_archived)
        self.assertFalse(conversation.customer_archived)
        self.assertEqual(conversation.unread_count_provider, 0)
        self.assertEqual(conversation.unread_count_customer, 0)
    
    def test_conversation_str_representation(self):
        """Test conversation string representation."""
        conversation = Conversation.objects.create(
            service=self.service,
            provider=self.provider,
            customer=self.customer
        )
        
        expected = f"Conversation: {self.customer.full_name} ↔ {self.provider.full_name} about {self.service.title}"
        self.assertEqual(str(conversation), expected)
    
    def test_unique_conversation_constraint(self):
        """Test that only one conversation per service-customer-provider is allowed."""
        # Create first conversation
        Conversation.objects.create(
            service=self.service,
            provider=self.provider,
            customer=self.customer
        )
        
        # Attempt to create duplicate conversation should raise IntegrityError
        with self.assertRaises(IntegrityError):
            Conversation.objects.create(
                service=self.service,
                provider=self.provider,
                customer=self.customer
            )
    
    def test_get_unread_count_for_user(self):
        """Test getting unread count for a specific user."""
        conversation = Conversation.objects.create(
            service=self.service,
            provider=self.provider,
            customer=self.customer,
            unread_count_provider=5,
            unread_count_customer=3
        )
        
        self.assertEqual(conversation.get_unread_count_for_user(self.provider), 5)
        self.assertEqual(conversation.get_unread_count_for_user(self.customer), 3)
        
        # Test with user not in conversation
        other_user = User.objects.create_user(
            email='other@test.com',
            username='other',
            password='testpass123',
            role='customer'
        )
        self.assertEqual(conversation.get_unread_count_for_user(other_user), 0)
    
    def test_mark_as_read_for_user(self):
        """Test marking conversation as read for a specific user."""
        conversation = Conversation.objects.create(
            service=self.service,
            provider=self.provider,
            customer=self.customer,
            unread_count_provider=5,
            unread_count_customer=3
        )
        
        # Mark as read for provider
        conversation.mark_as_read_for_user(self.provider)
        conversation.refresh_from_db()
        self.assertEqual(conversation.unread_count_provider, 0)
        self.assertEqual(conversation.unread_count_customer, 3)  # Should remain unchanged
        
        # Mark as read for customer
        conversation.mark_as_read_for_user(self.customer)
        conversation.refresh_from_db()
        self.assertEqual(conversation.unread_count_customer, 0)


class MessageModelTest(TestCase):
    """Test cases for Message model."""
    
    def setUp(self):
        """Set up test data."""
        # Create users
        self.customer = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            role='customer',
            first_name='John',
            last_name='Doe'
        )
        
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider',
            first_name='Jane',
            last_name='Smith'
        )
        
        # Create service and conversation
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            slug='test-category'
        )
        
        self.city = City.objects.create(name='Test City')
        
        self.service = Service.objects.create(
            title='Test Service',
            description='Test service description',
            price=100.00,
            duration='1 hour',
            category=self.category,
            provider=self.provider
        )
        self.service.cities.add(self.city)
        
        self.conversation = Conversation.objects.create(
            service=self.service,
            provider=self.provider,
            customer=self.customer
        )
    
    def test_message_creation(self):
        """Test creating a text message."""
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.customer,
            text='Hello, I am interested in your service.'
        )
        
        self.assertEqual(message.conversation, self.conversation)
        self.assertEqual(message.sender, self.customer)
        self.assertEqual(message.text, 'Hello, I am interested in your service.')
        self.assertEqual(message.message_type, 'text')
        self.assertEqual(message.status, 'sent')
        self.assertFalse(message.is_flagged)
    
    def test_message_str_representation(self):
        """Test message string representation."""
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.customer,
            text='This is a test message for string representation testing.'
        )
        
        # The __str__ method truncates at 50 characters and adds "..."
        expected = f"Message from {self.customer.full_name}: This is a test message for string representation t..."
        self.assertEqual(str(message), expected)
    
    def test_message_updates_conversation_metadata(self):
        """Test that creating a message updates conversation metadata."""
        # Check initial state
        self.assertIsNone(self.conversation.last_message_at)
        self.assertEqual(self.conversation.last_message_preview, '')
        self.assertEqual(self.conversation.unread_count_provider, 0)
        self.assertEqual(self.conversation.unread_count_customer, 0)
        
        # Create message from customer to provider
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.customer,
            text='Hello provider!'
        )
        
        # Refresh conversation from database
        self.conversation.refresh_from_db()
        
        # Check updated metadata
        self.assertEqual(self.conversation.last_message_at, message.created_at)
        self.assertEqual(self.conversation.last_message_preview, 'Hello provider!')
        self.assertEqual(self.conversation.unread_count_provider, 1)  # Provider has unread
        self.assertEqual(self.conversation.unread_count_customer, 0)  # Customer sent it
    
    def test_message_with_image_attachment(self):
        """Test creating a message with image attachment."""
        # Create a simple test image file
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        
        image_file = SimpleUploadedFile(
            name='test_image.png',
            content=image_content,
            content_type='image/png'
        )
        
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.customer,
            attachment=image_file
        )
        
        self.assertEqual(message.message_type, 'image')
        self.assertTrue(message.attachment.name.endswith('.png'))
    
    def test_message_with_file_attachment(self):
        """Test creating a message with file attachment."""
        file_content = b'This is a test PDF file content'
        
        pdf_file = SimpleUploadedFile(
            name='test_document.pdf',
            content=file_content,
            content_type='application/pdf'
        )
        
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.customer,
            attachment=pdf_file
        )
        
        self.assertEqual(message.message_type, 'file')
        self.assertTrue(message.attachment.name.endswith('.pdf'))
    
    def test_soft_delete_functionality(self):
        """Test soft delete functionality for messages."""
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.customer,
            text='This message will be deleted.'
        )
        
        # Initially not deleted for anyone
        self.assertFalse(message.is_deleted_for_user(self.customer))
        self.assertFalse(message.is_deleted_for_user(self.provider))
        
        # Delete for customer
        message.delete_for_user(self.customer)
        self.assertTrue(message.is_deleted_for_user(self.customer))
        self.assertFalse(message.is_deleted_for_user(self.provider))
        
        # Delete for provider
        message.delete_for_user(self.provider)
        self.assertTrue(message.is_deleted_for_user(self.customer))
        self.assertTrue(message.is_deleted_for_user(self.provider))


class MessageReadStatusModelTest(TestCase):
    """Test cases for MessageReadStatus model."""
    
    def setUp(self):
        """Set up test data."""
        # Create users
        self.customer = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123',
            role='customer'
        )
        
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider',
            password='testpass123',
            role='provider'
        )
        
        # Create service and conversation
        self.category = ServiceCategory.objects.create(
            title='Test Category',
            slug='test-category'
        )
        
        self.city = City.objects.create(name='Test City')
        
        self.service = Service.objects.create(
            title='Test Service',
            description='Test service description',
            price=100.00,
            duration='1 hour',
            category=self.category,
            provider=self.provider
        )
        self.service.cities.add(self.city)
        
        self.conversation = Conversation.objects.create(
            service=self.service,
            provider=self.provider,
            customer=self.customer
        )
        
        self.message = Message.objects.create(
            conversation=self.conversation,
            sender=self.customer,
            text='Test message'
        )
    
    def test_message_read_status_creation(self):
        """Test creating a message read status."""
        read_status = MessageReadStatus.objects.create(
            message=self.message,
            user=self.provider
        )
        
        self.assertEqual(read_status.message, self.message)
        self.assertEqual(read_status.user, self.provider)
        self.assertIsNotNone(read_status.read_at)
    
    def test_unique_constraint(self):
        """Test that one user can only read a message once."""
        # Create first read status
        MessageReadStatus.objects.create(
            message=self.message,
            user=self.provider
        )
        
        # Attempt to create duplicate should raise IntegrityError
        with self.assertRaises(IntegrityError):
            MessageReadStatus.objects.create(
                message=self.message,
                user=self.provider
            )
    
    def test_str_representation(self):
        """Test string representation of MessageReadStatus."""
        read_status = MessageReadStatus.objects.create(
            message=self.message,
            user=self.provider
        )
        
        expected = f"{self.provider.full_name} read message at {read_status.read_at}"
        self.assertEqual(str(read_status), expected)


# API Tests  
class ConversationAPITestCase(APITestCase):
    """Test cases for Conversation API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        # Create test users
        self.customer = User.objects.create_user(
            email='customer@test.com',
            username='customer_api',
            password='testpass123',
            first_name='Test',
            last_name='Customer',
            role='customer'
        )
        self.provider = User.objects.create_user(
            email='provider@test.com',
            username='provider_api',
            password='testpass123',
            first_name='Test',
            last_name='Provider',
            role='provider'
        )
        
        # Create test service
        self.service = Service.objects.create(
            title='Test Service',
            description='A test service',
            price=100.00,
            provider=self.provider,
            category=ServiceCategory.objects.create(title='Test Category', slug='test-category')
        )
        
        # Create test conversation
        self.conversation = Conversation.objects.create(
            customer=self.customer,
            provider=self.provider,
            service=self.service
        )
        
        # Create test message
        self.message = Message.objects.create(
            conversation=self.conversation,
            sender=self.customer,
            text='Hello provider!'
        )
    
    def test_conversation_list_customer(self):
        """Test conversation list for customer."""
        self.client.force_authenticate(user=self.customer)
        
        response = self.client.get('/api/messaging/conversations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # API uses pagination, so check the results key
        if 'results' in response.data:
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['service']['title'], 'Test Service')
        else:
            # Fallback for non-paginated response
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]['service']['title'], 'Test Service')
    
    def test_conversation_list_provider(self):
        """Test conversation list for provider."""
        self.client.force_authenticate(user=self.provider)
        
        response = self.client.get('/api/messaging/conversations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # API uses pagination, so check the results key
        if 'results' in response.data:
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['service']['title'], 'Test Service')
        else:
            # Fallback for non-paginated response
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]['service']['title'], 'Test Service')
    
    def test_conversation_create(self):
        """Test conversation creation."""
        # Create another service for new conversation
        new_service = Service.objects.create(
            title='New Test Service',
            description='Another test service',
            price=150.00,
            provider=self.provider,
            category=self.service.category
        )
        
        self.client.force_authenticate(user=self.customer)
        
        data = {
            'provider': self.provider.id,
            'service': new_service.id,
            'initial_message': 'Hello, I need help with your service.'
        }
        
        response = self.client.post('/api/messaging/conversations/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Conversation.objects.count(), 2)  # Original + new
        
        # Check that initial message was created
        new_conversation = Conversation.objects.get(service=new_service)
        self.assertEqual(new_conversation.messages.count(), 1)
        self.assertEqual(new_conversation.messages.first().text, 'Hello, I need help with your service.')
    
    def test_conversation_mark_as_read(self):
        """Test marking conversation messages as read."""
        self.client.force_authenticate(user=self.provider)
        
        response = self.client.post(f'/api/messaging/conversations/{self.conversation.id}/mark_as_read/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
    
    def test_conversation_unread_count(self):
        """Test getting unread conversation count."""
        self.client.force_authenticate(user=self.provider)
        
        response = self.client.get('/api/messaging/conversations/unread_count/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('unread_count', response.data)
        self.assertEqual(response.data['user_role'], 'provider')
    
    def test_unauthorized_access(self):
        """Test unauthorized access to conversations."""
        response = self.client.get('/api/messaging/conversations/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MessageAPITestCase(APITestCase):
    """Test cases for Message API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        # Create test users
        self.customer = User.objects.create_user(
            email='customer2@test.com',
            username='customer_api2',
            password='testpass123',
            first_name='Test',
            last_name='Customer',
            role='customer'
        )
        self.provider = User.objects.create_user(
            email='provider2@test.com',
            username='provider_api2',
            password='testpass123',
            first_name='Test',
            last_name='Provider',
            role='provider'
        )
        
        # Create test service
        self.service = Service.objects.create(
            title='Test Service',
            description='A test service',
            price=100.00,
            provider=self.provider,
            category=ServiceCategory.objects.create(title='Test Category', slug='test-category')
        )
        
        # Create test conversation
        self.conversation = Conversation.objects.create(
            customer=self.customer,
            provider=self.provider,
            service=self.service
        )
        
        # Create test message
        self.message = Message.objects.create(
            conversation=self.conversation,
            sender=self.customer,
            text='Hello provider!'
        )
    
    def test_message_list(self):
        """Test message list endpoint."""
        self.client.force_authenticate(user=self.customer)
        
        response = self.client.get('/api/messaging/messages/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['text'], 'Hello provider!')
    
    def test_message_create(self):
        """Test message creation."""
        self.client.force_authenticate(user=self.provider)
        
        data = {
            'conversation': self.conversation.id,
            'text': 'Hello customer!',
            'message_type': 'text'
        }
        
        response = self.client.post('/api/messaging/messages/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.count(), 2)  # Original + new
        
        # Check conversation was updated
        self.conversation.refresh_from_db()
        self.assertEqual(self.conversation.last_message_preview, 'Hello customer!')
    
    def test_message_mark_as_read(self):
        """Test marking message as read."""
        self.client.force_authenticate(user=self.provider)
        
        response = self.client.post(f'/api/messaging/messages/{self.message.id}/mark_as_read/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        # Check read status was created
        read_status = MessageReadStatus.objects.get(message=self.message, user=self.provider)
        self.assertTrue(read_status.is_read)
    
    def test_conversation_messages(self):
        """Test getting messages for specific conversation."""
        self.client.force_authenticate(user=self.customer)
        
        response = self.client.get(
            '/api/messaging/messages/conversation_messages/',
            {'conversation_id': self.conversation.id}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['messages']), 1)
        self.assertEqual(response.data['conversation_id'], str(self.conversation.id))
    
    def test_message_flag(self):
        """Test flagging a message."""
        self.client.force_authenticate(user=self.provider)
        
        data = {
            'reason': 'Inappropriate content'
        }
        
        response = self.client.post(f'/api/messaging/messages/{self.message.id}/flag/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check message was flagged
        self.message.refresh_from_db()
        self.assertTrue(self.message.is_flagged)
        self.assertEqual(self.message.flag_reason, 'Inappropriate content')
        self.assertEqual(self.message.flagged_by, self.provider)
