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

# ===== NEW PROVIDER DASHBOARD PERMISSIONS =====

class IsProviderOwner(permissions.BasePermission):
    """
    NEW PERMISSION: Allows access only to providers who own the resource
    
    Purpose: Ensure providers can only access their own data
    Impact: New permission - enhances provider data security
    """
    def has_permission(self, request, view):
        """Check if user is authenticated provider"""
        return request.user.is_authenticated and request.user.role == 'provider'
    
    def has_object_permission(self, request, view, obj):
        """Check if provider owns the object"""
        # Admin can access everything
        if request.user.is_authenticated and request.user.role == 'admin':
            return True
        
        # Provider can only access their own data
        if request.user.role == 'provider':
            # Check various provider relationship patterns
            if hasattr(obj, 'provider'):
                return obj.provider == request.user
            elif hasattr(obj, 'user') and obj.user.role == 'provider':
                return obj.user == request.user
            elif hasattr(obj, 'service') and hasattr(obj.service, 'provider'):
                return obj.service.provider == request.user
            elif hasattr(obj, 'booking') and hasattr(obj.booking, 'service'):
                return obj.booking.service.provider == request.user
        
        return False


class IsProviderOrCustomer(permissions.BasePermission):
    """
    NEW PERMISSION: Allows access to both providers and customers
    
    Purpose: For endpoints that both providers and customers can access
    Impact: New permission - enables shared functionality
    """
    def has_permission(self, request, view):
        """Check if user is authenticated provider or customer"""
        return (
            request.user.is_authenticated and 
            request.user.role in ['provider', 'customer']
        )


class IsProviderOrAdmin(permissions.BasePermission):
    """
    NEW PERMISSION: Allows access to providers and admins only
    
    Purpose: For provider-specific endpoints that admins can also access
    Impact: New permission - enables admin oversight of provider data
    """
    def has_permission(self, request, view):
        """Check if user is authenticated provider or admin"""
        return (
            request.user.is_authenticated and 
            request.user.role in ['provider', 'admin']
        )


class CanManageProviderBookings(permissions.BasePermission):
    """
    NEW PERMISSION: Allows providers to manage their bookings
    
    Purpose: Specific permission for booking management operations
    Impact: New permission - enables provider booking management
    """
    def has_permission(self, request, view):
        """Check if user can manage provider bookings"""
        return request.user.is_authenticated and request.user.role in ['provider', 'admin']
    
    def has_object_permission(self, request, view, obj):
        """Check if provider can manage this specific booking"""
        # Admin can manage all bookings
        if request.user.role == 'admin':
            return True
        
        # Provider can only manage bookings for their services
        if request.user.role == 'provider':
            if hasattr(obj, 'service') and hasattr(obj.service, 'provider'):
                return obj.service.provider == request.user
            elif hasattr(obj, 'provider'):
                return obj.provider == request.user
        
        return False


class CanViewProviderData(permissions.BasePermission):
    """
    NEW PERMISSION: Allows viewing provider data with proper restrictions
    
    Purpose: Control access to provider analytics and sensitive data
    Impact: New permission - protects provider privacy
    """
    def has_permission(self, request, view):
        """Check if user can view provider data"""
        # Admins can view all provider data
        if request.user.is_authenticated and request.user.role == 'admin':
            return True
        
        # Providers can view their own data
        if request.user.is_authenticated and request.user.role == 'provider':
            return True
        
        # Customers can view limited public provider data
        if request.user.is_authenticated and request.user.role == 'customer':
            # This would be for public provider profiles, reviews, etc.
            return view.action in ['retrieve', 'list'] if hasattr(view, 'action') else False
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Check if user can view this specific provider data"""
        # Admin can view everything
        if request.user.role == 'admin':
            return True
        
        # Provider can view their own data
        if request.user.role == 'provider':
            if hasattr(obj, 'provider'):
                return obj.provider == request.user
            elif hasattr(obj, 'user') and obj.user.role == 'provider':
                return obj.user == request.user
        
        # Customers can view limited public data
        if request.user.role == 'customer':
            # Only allow viewing public provider information
            return view.action in ['retrieve'] if hasattr(view, 'action') else False
        
        return False


class CanManageProviderEarnings(permissions.BasePermission):
    """
    NEW PERMISSION: Allows managing provider earnings and payouts
    
    Purpose: Restrict access to financial data and payout operations
    Impact: New permission - protects financial information
    """
    def has_permission(self, request, view):
        """Check if user can manage earnings"""
        return request.user.is_authenticated and request.user.role in ['provider', 'admin']
    
    def has_object_permission(self, request, view, obj):
        """Check if user can manage this specific earning"""
        # Admin can manage all earnings
        if request.user.role == 'admin':
            return True
        
        # Provider can only view their own earnings (not modify)
        if request.user.role == 'provider':
            if hasattr(obj, 'provider'):
                # Providers can only view, not modify earnings
                return obj.provider == request.user and request.method in ['GET', 'HEAD', 'OPTIONS']
        
        return False


class CanManageProviderSchedule(permissions.BasePermission):
    """
    NEW PERMISSION: Allows managing provider schedules and availability
    
    Purpose: Control access to schedule management operations
    Impact: New permission - enables schedule management security
    """
    def has_permission(self, request, view):
        """Check if user can manage schedules"""
        return request.user.is_authenticated and request.user.role in ['provider', 'admin']
    
    def has_object_permission(self, request, view, obj):
        """Check if user can manage this specific schedule"""
        # Admin can manage all schedules
        if request.user.role == 'admin':
            return True
        
        # Provider can manage their own schedule
        if request.user.role == 'provider':
            if hasattr(obj, 'provider'):
                return obj.provider == request.user
        
        return False