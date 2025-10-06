"""
Custom permissions for the messaging app.

This module contains Django REST Framework permission classes for controlling
access to messaging resources based on user roles and conversation participation.
"""

from rest_framework import permissions
from .models import Conversation


class IsConversationParticipant(permissions.BasePermission):
    """
    Permission to only allow conversation participants to access the conversation.
    
    This permission checks if the authenticated user is either the customer
    or provider in the conversation.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user is participant in the conversation."""
        if isinstance(obj, Conversation):
            user = request.user
            is_participant = user in [obj.customer, obj.provider]
            print(f"🔒 Permission check for conversation {obj.id}: User {user.id} ({user.role}) - Participant: {is_participant}")
            print(f"📋 Conversation participants: Customer {obj.customer.id}, Provider {obj.provider.id}")
            return is_participant
        
        # For messages, check conversation participation
        if hasattr(obj, 'conversation'):
            conversation = obj.conversation
            return request.user in [conversation.customer, conversation.provider]
        
        return False


class IsMessageSender(permissions.BasePermission):
    """
    Permission to only allow message sender to modify the message.
    
    This permission ensures that only the user who sent a message
    can edit or delete it.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user is the message sender."""
        return obj.sender == request.user


class IsCustomerRole(permissions.BasePermission):
    """
    Permission to only allow customers to perform certain actions.
    
    This permission is used for actions that should only be available
    to users with the 'customer' role.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated and has customer role."""
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'customer'
        )


class IsProviderRole(permissions.BasePermission):
    """
    Permission to only allow providers to perform certain actions.
    
    This permission is used for actions that should only be available
    to users with the 'provider' role.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated and has provider role."""
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'provider'
        )


class CanInitiateConversation(permissions.BasePermission):
    """
    Permission to control who can initiate conversations.
    
    Currently only customers can initiate conversations with providers.
    """
    
    def has_permission(self, request, view):
        """Check if user can initiate conversations."""
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'customer'
        )