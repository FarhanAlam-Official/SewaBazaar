from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.bookings.models import Booking
from apps.reviews.models import Review
from .models import Notification


@receiver(post_save, sender=Booking)
def create_booking_notification(sender, instance, created, **kwargs):
    """
    Create notifications when a booking is created or its status changes.
    
    This signal handler creates appropriate notifications for different
    booking events:
    - New booking requests
    - Booking confirmations
    - Booking rejections
    - Booking cancellations
    - Booking completions
    
    Args:
        sender (Model): The model class that sent the signal
        instance (Booking): The booking instance that was saved
        created (bool): Whether the instance was created or updated
        **kwargs: Arbitrary keyword arguments
    """
    """
    Create notifications when a booking is created or its status changes
    """
    if created:
        # Notify the service provider about a new booking
        provider = instance.service.provider
        Notification.objects.create(
            user=provider,
            title="New Booking Request",
            message=f"You have received a new booking request for {instance.service.title}",
            notification_type="booking",
            related_id=instance.id
        )
    else:
        # Status change notifications
        if instance.status == 'confirmed':
            # Notify the customer that their booking is confirmed
            Notification.objects.create(
                user=instance.customer,
                title="Booking Confirmed",
                message=f"Your booking for {instance.service.title} has been confirmed",
                notification_type="booking",
                related_id=instance.id
            )
        elif instance.status == 'rejected':
            # Notify the customer that their booking is rejected
            Notification.objects.create(
                user=instance.customer,
                title="Booking Rejected",
                message=f"Your booking for {instance.service.title} has been rejected: {instance.rejection_reason}",
                notification_type="booking",
                related_id=instance.id
            )
        elif instance.status == 'cancelled':
            # Notify the provider that a booking was cancelled
            provider = instance.service.provider
            Notification.objects.create(
                user=provider,
                title="Booking Cancelled",
                message=f"A booking for {instance.service.title} has been cancelled by the customer",
                notification_type="booking",
                related_id=instance.id
            )
        elif instance.status == 'completed':
            # Notify the customer that their booking is completed
            Notification.objects.create(
                user=instance.customer,
                title="Booking Completed",
                message=f"Your booking for {instance.service.title} has been marked as completed",
                notification_type="booking",
                related_id=instance.id
            )


@receiver(post_save, sender=Review)
def create_review_notification(sender, instance, created, **kwargs):
    """
    Create a notification when a new review is posted.
    
    This signal handler creates a notification for service providers
    when a new review is posted for their service.
    
    Args:
        sender (Model): The model class that sent the signal
        instance (Review): The review instance that was saved
        created (bool): Whether the instance was created or updated
        **kwargs: Arbitrary keyword arguments
    """
    """
    Create a notification when a new review is posted
    """
    if created:
        # Notify the service provider about the new review
        # Reviews are now linked to bookings, not services directly
        provider = instance.provider
        service_title = instance.booking.service.title if instance.booking and instance.booking.service else "a service"
        Notification.objects.create(
            user=provider,
            title="New Review",
            message=f"You have received a new {instance.rating}-star review for {service_title}",
            notification_type="review",
            related_id=instance.id
        )