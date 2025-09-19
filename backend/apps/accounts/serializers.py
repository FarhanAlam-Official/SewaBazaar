from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from .models import Profile, UserPreference, PortfolioMedia

User = get_user_model()

class PortfolioMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioMedia
        fields = ['id', 'media_type', 'file', 'file_url', 'title', 'description', 'order', 'created_at']
        read_only_fields = ['created_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return f"{settings.BACKEND_URL}{obj.file.url}"
        return None

class ProfileSerializer(serializers.ModelSerializer):
    service_areas = serializers.StringRelatedField(many=True, read_only=True)
    portfolio_media = PortfolioMediaSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'bio', 'address', 'city', 'date_of_birth', 'company_name', 'is_approved',
            'display_name', 'years_of_experience', 'certifications', 'location_city',
            'avg_rating', 'reviews_count', 'service_areas', 'portfolio_media'
        ]
        read_only_fields = ['is_approved', 'avg_rating', 'reviews_count']

class UserSerializer(serializers.ModelSerializer):
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
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return f"{settings.BACKEND_URL}{obj.profile_picture.url}"
        return None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password2', 'first_name', 'last_name', 'role', 'phone']
        
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
        
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is not correct")
        return value

class UpdateProfileSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'profile_picture', 'profile']
        
    def update(self, instance, validated_data):
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
    class Meta:
        model = UserPreference
        fields = ['theme', 'language', 'timezone']

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    password = serializers.CharField(required=True, validators=[validate_password])


class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, min_length=4, max_length=8)


class PasswordResetWithOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, min_length=4, max_length=8)
    password = serializers.CharField(required=True, validators=[validate_password])