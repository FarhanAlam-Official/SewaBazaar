from rest_framework import permissions

class IsCustomer(permissions.BasePermission):
    """
    Allows access only to customers.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'customer'

class IsProvider(permissions.BasePermission):
    """
    Allows access only to service providers.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'provider'

class IsAdmin(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to allow owners of an object or admins to edit it.
    Assumes the model instance has an `owner` attribute.
    """
    def has_object_permission(self, request, view, obj):
        # Admin permissions
        if request.user.is_authenticated and request.user.role == 'admin':
            return True
            
        # Instance must have an attribute named `owner` or `user`
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'provider'):
            return obj.provider == request.user
        elif hasattr(obj, 'customer'):
            return obj.customer == request.user
            
        return False
