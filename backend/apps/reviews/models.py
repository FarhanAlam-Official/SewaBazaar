from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.services.models import Service
from django.db.models.signals import post_save
from django.dispatch import receiver

class Review(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='reviews'
    )
    service = models.ForeignKey(
        Service, 
        on_delete=models.CASCADE, 
        related_name='reviews'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Review by {self.customer.email} for {self.service.title}"
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['customer', 'service']

@receiver(post_save, sender=Review)
def update_service_rating(sender, instance, **kwargs):
    """
    Update the average rating and reviews count for a service when a review is created or updated
    """
    service = instance.service
    reviews = Review.objects.filter(service=service)
    service.reviews_count = reviews.count()
    
    if service.reviews_count > 0:
        total_rating = sum(review.rating for review in reviews)
        service.average_rating = total_rating / service.reviews_count
    else:
        service.average_rating = 0
        
    service.save()
