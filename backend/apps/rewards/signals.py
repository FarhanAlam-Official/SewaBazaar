"""
Django Signals for Rewards System

This module contains signal handlers that automatically trigger rewards
system actions based on events in other parts of the application.

Phase 1 Signals:
- Auto-create reward accounts for new users
- Award points when bookings are completed
- Handle user-related cleanup

Future Phases will add:
- Tier upgrade notifications
- Points expiry handling  
- Referral tracking
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal

from .models import RewardAccount, RewardsConfig

User = get_user_model()


@receiver(post_save, sender=User)
def create_reward_account(sender, instance, created, **kwargs):
    """
    Automatically create a reward account when a new user is created.
    
    This ensures every user has a reward account ready for their first
    points earning activity. The account is created with default values.
    
    Args:
        sender (Model): The User model class
        instance (User): The User instance that was saved
        created (bool): Boolean indicating if this is a new user
        **kwargs: Additional signal arguments
    """
    if created:
        RewardAccount.objects.create(
            user=instance,
            current_balance=0,
            total_points_earned=0,
            total_points_redeemed=0,
            tier_level='bronze',
            lifetime_value=Decimal('0.00')
        )


@receiver(post_save, sender='bookings.Booking')  
def award_booking_points(sender, instance, created, **kwargs):
    """
    Award points when a booking is completed.
    
    This signal listens for booking status changes and awards points
    when a booking reaches 'completed' status. Points are calculated
    based on the booking amount and user's tier multiplier.
    
    Args:
        sender (Model): The Booking model class
        instance (Booking): The Booking instance that was saved
        created (bool): Boolean indicating if this is a new booking
        **kwargs: Additional signal arguments
    """
    # Only process existing bookings that changed status to completed
    if not created and instance.status == 'completed':
        
        # Check if points were already awarded for this booking
        if hasattr(instance, 'points_transactions') and instance.points_transactions.exists():
            return  # Points already awarded
        
        try:
            # Get user's reward account
            reward_account = instance.customer.reward_account
            
            # Get current rewards configuration
            config = RewardsConfig.get_active_config()
            
            # Skip if rewards system is in maintenance mode
            if config.maintenance_mode:
                return
            
            # Calculate base points from booking amount
            booking_amount = instance.total_amount
            base_points = int(booking_amount * config.points_per_rupee)
            
            # Apply tier multiplier
            tier_multiplier = reward_account.calculate_tier_multiplier()
            final_points = int(base_points * tier_multiplier)
            
            # Determine transaction type and description
            transaction_type = 'earned_booking'
            description = f"Points earned from booking #{instance.id}"
            
            # Check for special bonuses
            bonus_points = 0
            bonus_descriptions = []
            
            # First booking bonus
            if not instance.customer.bookings.filter(
                status='completed'
            ).exclude(id=instance.id).exists():
                bonus_points += config.first_booking_bonus
                bonus_descriptions.append("First booking bonus")
            
            # Weekend booking bonus (Saturday=5, Sunday=6)
            if instance.booking_date.weekday() in [5, 6]:
                bonus_points += config.weekend_booking_bonus
                bonus_descriptions.append("Weekend booking bonus")
            
            # Add main points
            if final_points > 0:
                reward_account.add_points(
                    points=final_points,
                    transaction_type=transaction_type,
                    description=description,
                    related_booking=instance
                )
            
            # Add bonus points if any
            if bonus_points > 0:
                bonus_description = f"Bonus points: {', '.join(bonus_descriptions)}"
                reward_account.add_points(
                    points=bonus_points,
                    transaction_type='earned_special',
                    description=bonus_description,
                    related_booking=instance
                )
            
            # Update booking with total points earned
            total_earned = final_points + bonus_points
            instance.points_earned = total_earned
            instance.save(update_fields=['points_earned'])
            
        except RewardAccount.DoesNotExist:
            # Create reward account if it doesn't exist (shouldn't happen with auto-creation)
            create_reward_account(User, instance.customer, True)
            
            # Retry awarding points
            award_booking_points(sender, instance, False, **kwargs)
            
        except Exception as e:
            # Log error but don't break the booking process
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error awarding points for booking {instance.id}: {str(e)}")


@receiver(post_delete, sender=User)
def cleanup_reward_account(sender, instance, **kwargs):
    """
    Clean up reward account when a user is deleted.
    
    This is mainly for data integrity and cleanup purposes.
    In production, user deletion should be rare and carefully handled.
    
    Args:
        sender (Model): The User model class
        instance (User): The User instance that was deleted
        **kwargs: Additional signal arguments
    """
    try:
        # The reward account should be automatically deleted due to CASCADE,
        # but we can add any additional cleanup logic here if needed
        pass
    except Exception as e:
        # Log any cleanup errors
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error cleaning up reward account for user {instance.id}: {str(e)}")


# Future signal handlers for Phase 2 and beyond:

@receiver(post_save, sender='reviews.Review')
def award_review_points(sender, instance, created, **kwargs):
    """
    Award points for writing reviews (Phase 2).
    
    This signal listens for review creation and awards points
    to the customer who wrote the review.
    
    Args:
        sender (Model): The Review model class
        instance (Review): The Review instance that was saved
        created (bool): Boolean indicating if this is a new review
        **kwargs: Additional signal arguments
    """
    # Only create reward notification for new reviews
    if created and not instance.is_reward_claimed:
        try:
            # Get user's reward account
            reward_account = instance.customer.reward_account
            
            # Get current rewards configuration
            config = RewardsConfig.get_active_config()
            
            # Skip if rewards system is in maintenance mode
            if config.maintenance_mode:
                return
            
            # Don't automatically award points - let user claim them manually
            # The frontend will show a notification to claim the reward
            # Points will be awarded when user claims the reward via the claim_reward endpoint
            pass
            
        except RewardAccount.DoesNotExist:
            # Create reward account if it doesn't exist (shouldn't happen with auto-creation)
            create_reward_account(User, instance.customer, True)
            
        except Exception as e:
            # Log error but don't break the review process
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error setting up reward for review {instance.id}: {str(e)}")


# @receiver(post_save, sender=User)  
# def award_referral_points(sender, instance, created, **kwargs):
#     """Award referral points when referred user completes first booking (Phase 3)"""
#     pass

# @receiver(post_save, sender=RewardAccount)
# def send_tier_upgrade_notification(sender, instance, **kwargs):
#     """Send notification when user's tier is upgraded (Phase 3)"""
#     pass