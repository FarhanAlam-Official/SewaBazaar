from rest_framework import permissions


class IsCustomer(permissions.BasePermission):
    """
    Permission class that allows access only to customers.
    
    This permission checks if the authenticated user has the 'customer' role.
    It's used to restrict access to endpoints that should only be available
    to registered customers.
    
    Methods:
        has_permission: Check if the user is an authenticated customer
    """
    def has_permission(self, request, view):
        """
        Check if the user is an authenticated customer.
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            
        Returns:
            bool: True if the user is an authenticated customer, False otherwise
        """
        return request.user.is_authenticated and request.user.role == 'customer'


class IsProvider(permissions.BasePermission):
    """
    Permission class that allows access only to service providers.
    
    This permission checks if the authenticated user has the 'provider' role.
    It's used to restrict access to endpoints that should only be available
    to registered service providers.
    
    Methods:
        has_permission: Check if the user is an authenticated provider
    """
    def has_permission(self, request, view):
        """
        Check if the user is an authenticated provider.
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            
        Returns:
            bool: True if the user is an authenticated provider, False otherwise
        """
        return request.user.is_authenticated and request.user.role == 'provider'


class IsAdmin(permissions.BasePermission):
    """
    Permission class that allows access only to admin users.
    
    This permission checks if the authenticated user has the 'admin' role.
    It's used to restrict access to endpoints that should only be available
    to administrative users.
    
    Methods:
        has_permission: Check if the user is an authenticated admin
    """
    def has_permission(self, request, view):
        """
        Check if the user is an authenticated admin.
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            
        Returns:
            bool: True if the user is an authenticated admin, False otherwise
        """
        return request.user.is_authenticated and request.user.role == 'admin'


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to allow owners of an object or admins to edit it.
    
    This permission checks if the authenticated user is either an admin or
    the owner of the object being accessed. It assumes the model instance
    has an `owner`, `user`, `provider`, or `customer` attribute.
    
    Methods:
        has_object_permission: Check if the user owns the object or is an admin
    """
    def has_object_permission(self, request, view, obj):
        """
        Check if the user owns the object or is an admin.
        
        This method checks various possible ownership relationships:
        - owner attribute
        - user attribute
        - provider attribute
        - customer attribute
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            obj (Model): The object being accessed
            
        Returns:
            bool: True if the user is an admin or owns the object, False otherwise
        """
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
    NEW PERMISSION: Allows access only to providers who own the resource.
    
    This permission ensures that providers can only access their own data
    and prevents unauthorized access to other providers' information.
    
    Purpose: Ensure providers can only access their own data
    Impact: New permission - enhances provider data security
    
    Methods:
        has_permission: Check if user is authenticated provider
        has_object_permission: Check if provider owns the object
    """
    def has_permission(self, request, view):
        """
        Check if user is authenticated provider.
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            
        Returns:
            bool: True if the user is an authenticated provider, False otherwise
        """
        return request.user.is_authenticated and request.user.role == 'provider'
    
    def has_object_permission(self, request, view, obj):
        """
        Check if provider owns the object.
        
        This method checks various possible provider relationship patterns:
        - provider attribute
        - user attribute with provider role
        - service with provider attribute
        - booking with service that has provider attribute
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            obj (Model): The object being accessed
            
        Returns:
            bool: True if the user is an admin or owns the object, False otherwise
        """
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
    NEW PERMISSION: Allows access to both providers and customers.
    
    This permission enables shared functionality between providers and
    customers by allowing both roles to access specific endpoints.
    
    Purpose: For endpoints that both providers and customers can access
    Impact: New permission - enables shared functionality
    
    Methods:
        has_permission: Check if user is authenticated provider or customer
    """
    def has_permission(self, request, view):
        """
        Check if user is authenticated provider or customer.
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            
        Returns:
            bool: True if the user is an authenticated provider or customer, False otherwise
        """
        """Check if user is authenticated provider or customer"""
        return (
            request.user.is_authenticated and 
            request.user.role in ['provider', 'customer']
        )


class IsProviderOrAdmin(permissions.BasePermission):
    """
    NEW PERMISSION: Allows access to providers and admins only.
    
    This permission restricts access to provider-specific endpoints while
    still allowing admin oversight of provider data.
    
    Purpose: For provider-specific endpoints that admins can also access
    Impact: New permission - enables admin oversight of provider data
    
    Methods:
        has_permission: Check if user is authenticated provider or admin
    """
    def has_permission(self, request, view):
        """
        Check if user is authenticated provider or admin.
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            
        Returns:
            bool: True if the user is an authenticated provider or admin, False otherwise
        """
        """Check if user is authenticated provider or admin"""
        return (
            request.user.is_authenticated and 
            request.user.role in ['provider', 'admin']
        )


class CanManageProviderBookings(permissions.BasePermission):
    """
    NEW PERMISSION: Allows providers to manage their bookings.
    
    This permission provides specific access control for booking
    management operations, ensuring providers can only manage
    bookings for their own services.
    
    Purpose: Specific permission for booking management operations
    Impact: New permission - enables provider booking management
    
    Methods:
        has_permission: Check if user can manage provider bookings
        has_object_permission: Check if provider can manage this specific booking
    """
    def has_permission(self, request, view):
        """
        Check if user can manage provider bookings.
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            
        Returns:
            bool: True if the user can manage provider bookings, False otherwise
        """
        """Check if user can manage provider bookings"""
        return request.user.is_authenticated and request.user.role in ['provider', 'admin']
    
    def has_object_permission(self, request, view, obj):
        """
        Check if provider can manage this specific booking.
        
        This method ensures that providers can only manage bookings
        for services they provide, while admins can manage all bookings.
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            obj (Model): The booking object being accessed
            
        Returns:
            bool: True if the user can manage this booking, False otherwise
        """
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
    NEW PERMISSION: Allows viewing provider data with proper restrictions.
    
    This permission controls access to provider analytics and sensitive
    data, ensuring that different user roles have appropriate levels
    of access to provider information.
    
    Purpose: Control access to provider analytics and sensitive data
    Impact: New permission - protects provider privacy
    
    Methods:
        has_permission: Check if user can view provider data
        has_object_permission: Check if user can view this specific provider data
    """
    def has_permission(self, request, view):
        """
        Check if user can view provider data.
        
        This method implements different access levels based on user role:
        - Admins can view all provider data
        - Providers can view their own data
        - Customers can view limited public provider data
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            
        Returns:
            bool: True if the user can view provider data, False otherwise
        """
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
        """
        Check if user can view this specific provider data.
        
        This method implements object-level access control for provider data:
        - Admin can view everything
        - Provider can view their own data
        - Customers can view limited public data
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            obj (Model): The provider data object being accessed
            
        Returns:
            bool: True if the user can view this provider data, False otherwise
        """
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
    NEW PERMISSION: Allows managing provider earnings and payouts.
    
    This permission restricts access to financial data and payout operations,
    ensuring that sensitive financial information is properly protected.
    
    Purpose: Restrict access to financial data and payout operations
    Impact: New permission - protects financial information
    
    Methods:
        has_permission: Check if user can manage earnings
        has_object_permission: Check if user can manage this specific earning
    """
    def has_permission(self, request, view):
        """
        Check if user can manage earnings.
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            
        Returns:
            bool: True if the user can manage earnings, False otherwise
        """
        """Check if user can manage earnings"""
        return request.user.is_authenticated and request.user.role in ['provider', 'admin']
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can manage this specific earning.
        
        This method ensures that providers can only view their own earnings
        but not modify them, while admins can manage all earnings.
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            obj (Model): The earning object being accessed
            
        Returns:
            bool: True if the user can manage this earning, False otherwise
        """
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
    NEW PERMISSION: Allows managing provider schedules and availability.
    
    This permission controls access to schedule management operations,
    ensuring that providers can only manage their own schedules.
    
    Purpose: Control access to schedule management operations
    Impact: New permission - enables schedule management security
    
    Methods:
        has_permission: Check if user can manage schedules
        has_object_permission: Check if user can manage this specific schedule
    """
    def has_permission(self, request, view):
        """
        Check if user can manage schedules.
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            
        Returns:
            bool: True if the user can manage schedules, False otherwise
        """
        """Check if user can manage schedules"""
        return request.user.is_authenticated and request.user.role in ['provider', 'admin']
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can manage this specific schedule.
        
        This method ensures that providers can only manage their own schedules
        while admins can manage all schedules.
        
        Args:
            request (Request): The HTTP request object
            view (View): The view being accessed
            obj (Model): The schedule object being accessed
            
        Returns:
            bool: True if the user can manage this schedule, False otherwise
        """
        """Check if user can manage this specific schedule"""
        # Admin can manage all schedules
        if request.user.role == 'admin':
            return True
        
        # Provider can manage their own schedule
        if request.user.role == 'provider':
            if hasattr(obj, 'provider'):
                return obj.provider == request.user
        
        return False