from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from .models import (
    Profile, UserPreference, PortfolioProject, PortfolioMedia,
    ProviderDocument, DocumentVerificationHistory, DocumentRequirement
)

User = get_user_model()

class PortfolioMediaSerializer(serializers.ModelSerializer):
    """
    Serializer for PortfolioMedia model.
    
    Handles serialization of portfolio media files with URL generation
    for frontend display.
    """
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioMedia
        fields = ['id', 'media_type', 'file', 'file_url', 'order', 'caption', 'created_at']
        read_only_fields = ['created_at']
    
    def get_file_url(self, obj):
        """
        Get the absolute URL for the media file.
        
        Args:
            obj: The PortfolioMedia instance
            
        Returns:
            str or None: Absolute URL for the file or None if no file
        """
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return f"{settings.BACKEND_URL}{obj.file.url}"
        return None


class PortfolioProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for PortfolioProject model.
    
    Handles serialization of portfolio projects including related media files
    and computed properties for frontend display.
    """
    media_files = PortfolioMediaSerializer(many=True, read_only=True)
    primary_image_url = serializers.SerializerMethodField()
    media_count = serializers.ReadOnlyField()
    images_count = serializers.ReadOnlyField()
    videos_count = serializers.ReadOnlyField()
    
    class Meta:
        model = PortfolioProject
        fields = [
            'id', 'title', 'description', 'order', 'created_at', 'updated_at',
            'media_files', 'primary_image_url', 'media_count', 'images_count', 'videos_count'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_primary_image_url(self, obj):
        """
        Get the absolute URL for the primary image of the project.
        
        Args:
            obj: The PortfolioProject instance
            
        Returns:
            str or None: Absolute URL for the primary image or None if no primary image
        """
        primary_image = obj.primary_image
        if primary_image and primary_image.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_image.file.url)
            return f"{settings.BACKEND_URL}{primary_image.file.url}"
        return None

class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for Profile model.
    
    Handles serialization of user profile information including
    service areas and portfolio projects.
    """
    service_areas = serializers.StringRelatedField(many=True, read_only=True)
    portfolio_projects = PortfolioProjectSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'bio', 'address', 'city', 'date_of_birth', 'company_name', 'is_approved',
            'display_name', 'years_of_experience', 'certifications', 'location_city',
            'avg_rating', 'reviews_count', 'service_areas', 'portfolio_projects'
        ]
        read_only_fields = ['is_approved', 'avg_rating', 'reviews_count']

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    
    Handles serialization of user information including profile data
    and profile picture URL generation.
    """
    profile = ProfileSerializer(read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 
                  'phone', 'is_verified', 'profile_picture', 'profile_picture_url', 'profile', 'date_joined']
        read_only_fields = ['is_verified', 'date_joined']
        extra_kwargs = {
            'profile_picture': {'write_only': True}
        }

    def get_profile_picture_url(self, obj):
        """
        Get the absolute URL for the user's profile picture.
        
        Args:
            obj: The User instance
            
        Returns:
            str or None: Absolute URL for the profile picture or None if no picture
        """
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return f"{settings.BACKEND_URL}{obj.profile_picture.url}"
        return None

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    
    Handles validation and creation of new user accounts with
    password confirmation.
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password2', 'first_name', 'last_name', 'role', 'phone']
        
    def validate(self, attrs):
        """
        Validate that the two password fields match.
        
        Args:
            attrs: Dictionary of validated data
            
        Returns:
            dict: Validated data
            
        Raises:
            serializers.ValidationError: If passwords don't match
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
        
    def create(self, validated_data):
        """
        Create a new user instance.
        
        Args:
            validated_data: Dictionary of validated user data
            
        Returns:
            User: The newly created user instance
        """
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing user password.
    
    Handles validation of current password and creation of new password
    with proper validation.
    """
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    
    def validate_current_password(self, value):
        """
        Validate that the current password is correct.
        
        Args:
            value: The current password provided by the user
            
        Returns:
            str: The validated current password
            
        Raises:
            serializers.ValidationError: If current password is incorrect
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is not correct")
        return value

class UpdateProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile.
    
    Handles updating both user and profile information in a single request.
    """
    profile = ProfileSerializer()
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'profile_picture', 'profile']
        
    def update(self, instance, validated_data):
        """
        Update both user and profile information.
        
        Args:
            instance: The User instance to update
            validated_data: Dictionary of validated data
            
        Returns:
            User: The updated user instance
        """
        profile_data = validated_data.pop('profile', {})
        
        # Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update Profile fields
        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        
        return instance


class UserPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for UserPreference model.
    
    Handles serialization of user preference settings.
    """
    class Meta:
        model = UserPreference
        fields = ['theme', 'language', 'timezone']

class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset request.
    
    Handles validation of email for password reset requests.
    """
    email = serializers.EmailField(required=True)

class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation.
    
    Handles validation of token and new password for password reset.
    """
    token = serializers.CharField(required=True)
    password = serializers.CharField(required=True, validators=[validate_password])


class OTPRequestSerializer(serializers.Serializer):
    """
    Serializer for OTP request.
    
    Handles validation of email for OTP requests.
    """
    email = serializers.EmailField(required=True)


class OTPVerifySerializer(serializers.Serializer):
    """
    Serializer for OTP verification.
    
    Handles validation of email and OTP code for verification.
    """
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, min_length=4, max_length=8)


class PasswordResetWithOTPSerializer(serializers.Serializer):
    """
    Serializer for password reset with OTP.
    
    Handles validation of email, OTP, and new password for password reset.
    """
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, min_length=4, max_length=8)
    password = serializers.CharField(required=True, validators=[validate_password])


# Document Management Serializers

class DocumentVerificationHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for DocumentVerificationHistory model.
    
    Handles serialization of document verification history with
    additional computed fields for display.
    """
    changed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentVerificationHistory
        fields = [
            'id', 'previous_status', 'new_status', 'changed_by', 'changed_by_name',
            'change_reason', 'notes', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_changed_by_name(self, obj):
        """
        Get the name of the user who made the change.
        
        Args:
            obj: The DocumentVerificationHistory instance
            
        Returns:
            str: Name of the user who made the change or "System"
        """
        if obj.changed_by:
            return f"{obj.changed_by.first_name} {obj.changed_by.last_name}".strip() or obj.changed_by.email
        return "System"


class DocumentRequirementSerializer(serializers.ModelSerializer):
    """
    Serializer for DocumentRequirement model.
    
    Handles serialization of document requirements with formatted
    file size information.
    """
    max_file_size_formatted = serializers.ReadOnlyField()
    
    class Meta:
        model = DocumentRequirement
        fields = [
            'id', 'name', 'document_type', 'description', 'is_mandatory',
            'priority', 'max_file_size', 'max_file_size_formatted',
            'allowed_file_types', 'validity_period_days', 'order', 'is_active'
        ]


class ProviderDocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for ProviderDocument model.
    
    Handles serialization of provider documents with URL generation,
    formatted file sizes, and verification information.
    """
    file_url = serializers.SerializerMethodField()
    file_size_formatted = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    can_be_renewed = serializers.ReadOnlyField()
    verification_progress = serializers.ReadOnlyField()
    verification_history = DocumentVerificationHistorySerializer(many=True, read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProviderDocument
        fields = [
            'id', 'document_type', 'title', 'description', 'file', 'file_url',
            'file_size', 'file_size_formatted', 'file_type', 'status', 'priority',
            'is_required', 'is_featured', 'expiry_date', 'issue_date',
            'issuing_authority', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'review_notes', 'rejection_reason', 'order', 'tags', 'metadata',
            'is_expired', 'days_until_expiry', 'can_be_renewed',
            'verification_progress', 'verification_history', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'file_size', 'file_type', 'reviewed_by', 'reviewed_at',
            'review_notes', 'created_at', 'updated_at'
        ]
    
    def get_file_url(self, obj):
        """
        Get the absolute URL for the document file.
        
        Args:
            obj: The ProviderDocument instance
            
        Returns:
            str or None: Absolute URL for the document file or None if no file
        """
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return f"{settings.BACKEND_URL}{obj.file.url}"
        return None
    
    def get_reviewed_by_name(self, obj):
        """
        Get the name of the reviewer.
        
        Args:
            obj: The ProviderDocument instance
            
        Returns:
            str or None: Name of the reviewer or None if not reviewed
        """
        if obj.reviewed_by:
            return f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip() or obj.reviewed_by.email
        return None
    
    def validate_file(self, value):
        """
        Validate uploaded file size and type.
        
        Args:
            value: The uploaded file
            
        Returns:
            file: The validated file
            
        Raises:
            serializers.ValidationError: If file validation fails
        """
        if not value:
            return value
        
        # Check file size (5MB limit by default)
        max_size = 5 * 1024 * 1024  # 5MB
        if value.size > max_size:
            raise serializers.ValidationError(f"File size cannot exceed {max_size // (1024*1024)}MB")
        
        # Check file type
        allowed_types = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        
        if hasattr(value, 'content_type') and value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Unsupported file type. Please upload PDF, DOC, DOCX, or image files."
            )
        
        return value


class ProviderDocumentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new provider documents.
    
    Handles validation and creation of new provider documents with
    required file validation.
    """
    
    class Meta:
        model = ProviderDocument
        fields = [
            'document_type', 'title', 'description', 'file',
            'is_required', 'is_featured', 'expiry_date', 'issue_date',
            'issuing_authority', 'priority', 'tags', 'metadata'
        ]
    
    def validate_file(self, value):
        """
        Validate uploaded file for creation.
        
        Args:
            value: The uploaded file
            
        Returns:
            file: The validated file
            
        Raises:
            serializers.ValidationError: If file validation fails
        """
        if not value:
            raise serializers.ValidationError("File is required")
        
        # Check file size (5MB limit by default)
        max_size = 5 * 1024 * 1024  # 5MB
        if value.size > max_size:
            raise serializers.ValidationError(f"File size cannot exceed {max_size // (1024*1024)}MB")
        
        # Check file type
        allowed_types = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        
        if hasattr(value, 'content_type') and value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Unsupported file type. Please upload PDF, DOC, DOCX, or image files."
            )
        
        return value
    
    def create(self, validated_data):
        """
        Create a new provider document and set the provider.
        
        Args:
            validated_data: Dictionary of validated document data
            
        Returns:
            ProviderDocument: The newly created document instance
        """
        # Set provider from request user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['provider'] = request.user.profile
        
        return super().create(validated_data)


class ProviderDocumentUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing provider documents.
    
    Handles validation and updating of existing provider documents.
    """
    
    class Meta:
        model = ProviderDocument
        fields = [
            'title', 'description', 'file', 'is_featured',
            'expiry_date', 'issue_date', 'issuing_authority',
            'priority', 'tags', 'metadata'
        ]
    
    def validate_file(self, value):
        """
        Validate uploaded file if provided during update.
        
        Args:
            value: The uploaded file
            
        Returns:
            file: The validated file or None if no file provided
            
        Raises:
            serializers.ValidationError: If file validation fails
        """
        if not value:
            return value
        
        # Check file size (5MB limit by default)
        max_size = 5 * 1024 * 1024  # 5MB
        if value.size > max_size:
            raise serializers.ValidationError(f"File size cannot exceed {max_size // (1024*1024)}MB")
        
        # Check file type
        allowed_types = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        
        if hasattr(value, 'content_type') and value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Unsupported file type. Please upload PDF, DOC, DOCX, or image files."
            )
        
        return value


class DocumentStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating document verification status (admin only).
    
    Handles validation and updating of document status by administrators.
    """
    
    class Meta:
        model = ProviderDocument
        fields = ['status', 'review_notes', 'rejection_reason']
    
    def validate(self, attrs):
        """
        Validate status update requirements.
        
        Args:
            attrs: Dictionary of validated data
            
        Returns:
            dict: Validated data
            
        Raises:
            serializers.ValidationError: If validation requirements are not met
        """
        status = attrs.get('status')
        
        # If rejecting, require rejection reason
        if status == 'rejected' and not attrs.get('rejection_reason'):
            raise serializers.ValidationError({
                'rejection_reason': 'Rejection reason is required when rejecting a document.'
            })
        
        # If resubmission required, require review notes
        if status == 'resubmission_required' and not attrs.get('review_notes'):
            raise serializers.ValidationError({
                'review_notes': 'Review notes are required when requesting resubmission.'
            })
        
        return attrs
    
    def update(self, instance, validated_data):
        """
        Update document status and create verification history entry.
        
        Args:
            instance: The ProviderDocument instance to update
            validated_data: Dictionary of validated data
            
        Returns:
            ProviderDocument: The updated document instance
        """
        # Track status change in history
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        # Update the document
        instance = super().update(instance, validated_data)
        
        # Set review metadata
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            instance.reviewed_by = request.user
            from django.utils import timezone
            instance.reviewed_at = timezone.now()
            instance.save()
        
        # Create history entry if status changed
        if old_status != new_status:
            DocumentVerificationHistory.objects.create(
                document=instance,
                previous_status=old_status,
                new_status=new_status,
                changed_by=request.user if request and request.user.is_authenticated else None,
                change_reason=validated_data.get('review_notes', ''),
                notes=validated_data.get('rejection_reason', '')
            )
        
        return instance


class ProviderDocumentStatsSerializer(serializers.Serializer):
    """
    Serializer for provider document statistics.
    
    Handles serialization of document statistics for provider dashboard.
    """
    total_documents = serializers.IntegerField()
    pending_documents = serializers.IntegerField()
    approved_documents = serializers.IntegerField()
    rejected_documents = serializers.IntegerField()
    expired_documents = serializers.IntegerField()
    verification_progress = serializers.FloatField()
    required_documents_count = serializers.IntegerField()
    completed_requirements = serializers.IntegerField()
    missing_requirements = serializers.ListField(child=serializers.CharField())