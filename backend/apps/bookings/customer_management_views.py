"""
Customer Management Views for Provider Dashboard
Handles all customer relationship management functionality for providers
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, Max, Min, Q, F
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import csv
import io
from django.http import HttpResponse

from .models import Booking, ProviderCustomerRelation
from .serializers import ProviderCustomerRelationSerializer, ProviderCustomerListSerializer
from apps.accounts.models import User
from apps.common.permissions import IsProvider
from apps.reviews.models import Review


class ProviderCustomerManagementViewSet(viewsets.ViewSet):
    """
    ViewSet for provider customer management functionality
    """
    permission_classes = [permissions.IsAuthenticated, IsProvider]

    @action(detail=False, methods=['get'])
    def customers(self, request):
        """
        Get provider's customer list and relationship data with comprehensive filtering and sorting
        
        GET /api/bookings/provider_dashboard/customers/
        Query parameters:
        - search: Search by customer name, email, or phone
        - status: Filter by customer status (new, returning, regular, favorite, blocked)
        - ordering: Sort by (name, total_bookings, total_spent, last_booking_date, average_rating)
        - page, page_size: Pagination
        """
        provider = request.user
        
        # Get query parameters
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', 'all')
        ordering = request.query_params.get('ordering', '-last_booking_date')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        try:
            # Get or create customer relations for all customers who have booked with this provider
            customer_bookings = Booking.objects.filter(
                service__provider=provider
            ).values('customer').annotate(
                total_bookings=Count('id'),
                total_spent=Sum('total_amount'),
                first_booking_date=Min('created_at'),
                last_booking_date=Max('created_at'),
                avg_rating=Avg('review__rating')  # Assuming reviews are linked to bookings
            ).order_by('customer')

            # Build comprehensive customer data
            customers_data = []
            
            for booking_data in customer_bookings:
                try:
                    customer = User.objects.get(id=booking_data['customer'])
                    
                    # Get or create customer relation
                    relation, created = ProviderCustomerRelation.objects.get_or_create(
                        provider=provider,
                        customer=customer,
                        defaults={
                            'total_bookings': booking_data['total_bookings'],
                            'total_spent': booking_data['total_spent'] or Decimal('0'),
                            'average_rating': booking_data['avg_rating'] or Decimal('0'),
                            'first_booking_date': booking_data['first_booking_date'],
                            'last_booking_date': booking_data['last_booking_date']
                        }
                    )
                    
                    # Update relation data if not created (existing relation)
                    if not created:
                        relation.total_bookings = booking_data['total_bookings']
                        relation.total_spent = booking_data['total_spent'] or Decimal('0')
                        relation.average_rating = booking_data['avg_rating'] or Decimal('0')
                        relation.first_booking_date = booking_data['first_booking_date']
                        relation.last_booking_date = booking_data['last_booking_date']
                        relation.save()

                    # Apply search filter
                    if search:
                        search_lower = search.lower()
                        if not any([
                            search_lower in customer.first_name.lower(),
                            search_lower in customer.last_name.lower(),
                            search_lower in customer.email.lower(),
                            search_lower in (customer.phone or '').lower()
                        ]):
                            continue

                    # Determine customer status
                    days_since_last = (timezone.now().date() - relation.last_booking_date.date()).days if relation.last_booking_date else 999
                    
                    if relation.is_blocked:
                        customer_status = 'blocked'
                    elif relation.is_favorite_customer:
                        customer_status = 'favorite'
                    elif relation.total_bookings >= 5:
                        customer_status = 'regular'
                    elif relation.total_bookings > 1:
                        customer_status = 'returning'
                    else:
                        customer_status = 'new'

                    # Apply status filter
                    if status_filter != 'all' and customer_status != status_filter:
                        continue

                    # Get last booking details
                    last_booking = Booking.objects.filter(
                        service__provider=provider,
                        customer=customer
                    ).select_related('service').order_by('-created_at').first()

                    # Build customer data
                    customer_data = {
                        'id': relation.id,
                        'customer': {
                            'id': customer.id,
                            'first_name': customer.first_name,
                            'last_name': customer.last_name,
                            'email': customer.email,
                            'phone': customer.phone or '',
                            'profile_picture': customer.profile_picture.url if hasattr(customer, 'profile_picture') and customer.profile_picture else None,
                            'city': getattr(customer, 'city', ''),
                            'date_joined': customer.date_joined.isoformat()
                        },
                        'total_bookings': relation.total_bookings,
                        'total_spent': float(relation.total_spent),
                        'average_rating': float(relation.average_rating),
                        'is_favorite_customer': relation.is_favorite_customer,
                        'is_blocked': relation.is_blocked,
                        'first_booking_date': relation.first_booking_date.isoformat() if relation.first_booking_date else None,
                        'last_booking_date': relation.last_booking_date.isoformat() if relation.last_booking_date else None,
                        'notes': relation.notes or '',
                        'customer_status': customer_status,
                        'days_since_last_booking': days_since_last if days_since_last < 999 else None,
                        'created_at': relation.created_at.isoformat(),
                        'updated_at': relation.updated_at.isoformat(),
                        'last_service': {
                            'title': last_booking.service.title if last_booking else '',
                            'date': last_booking.booking_date.isoformat() if last_booking and last_booking.booking_date else '',
                            'amount': float(last_booking.total_amount) if last_booking else 0
                        }
                    }

                    customers_data.append(customer_data)

                except User.DoesNotExist:
                    continue
                except Exception as e:
                    print(f"Error processing customer {booking_data['customer']}: {str(e)}")
                    continue

            # Apply sorting
            reverse_sort = ordering.startswith('-')
            sort_field = ordering.lstrip('-')
            
            if sort_field == 'name':
                customers_data.sort(
                    key=lambda x: f"{x['customer']['first_name']} {x['customer']['last_name']}".lower(),
                    reverse=reverse_sort
                )
            elif sort_field == 'total_bookings':
                customers_data.sort(key=lambda x: x['total_bookings'], reverse=reverse_sort)
            elif sort_field == 'total_spent':
                customers_data.sort(key=lambda x: x['total_spent'], reverse=reverse_sort)
            elif sort_field == 'average_rating':
                customers_data.sort(key=lambda x: x['average_rating'], reverse=reverse_sort)
            else:  # last_booking_date
                customers_data.sort(
                    key=lambda x: x['last_booking_date'] or '1900-01-01',
                    reverse=reverse_sort
                )

            # Paginate results
            total_count = len(customers_data)
            start = (page - 1) * page_size
            end = start + page_size
            paginated_data = customers_data[start:end]

            response_data = {
                'count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size,
                'results': paginated_data
            }

            return Response(response_data)

        except Exception as e:
            return Response(
                {'error': f'Failed to fetch customers: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['patch'])
    def update_relation(self, request, pk=None):
        """
        Update customer relationship data
        
        PATCH /api/bookings/provider_dashboard/customers/{relation_id}/
        """
        try:
            relation = ProviderCustomerRelation.objects.get(
                id=pk,
                provider=request.user
            )
            
            # Update allowed fields
            if 'is_favorite_customer' in request.data:
                relation.is_favorite_customer = request.data['is_favorite_customer']
            
            if 'is_blocked' in request.data:
                relation.is_blocked = request.data['is_blocked']
            
            if 'notes' in request.data:
                relation.notes = request.data['notes']
            
            relation.save()
            
            serializer = ProviderCustomerRelationSerializer(relation)
            return Response(serializer.data)
            
        except ProviderCustomerRelation.DoesNotExist:
            return Response(
                {'error': 'Customer relation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update customer relation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def customer_stats(self, request):
        """
        Get customer statistics for provider dashboard
        
        GET /api/bookings/provider_dashboard/customer_stats/
        """
        provider = request.user
        
        try:
            # Get all customer relations
            relations = ProviderCustomerRelation.objects.filter(provider=provider)
            
            # Calculate stats
            total_customers = relations.count()
            regular_customers = relations.filter(total_bookings__gte=5).count()
            favorite_customers = relations.filter(is_favorite_customer=True).count()
            blocked_customers = relations.filter(is_blocked=True).count()
            
            # New customers this month
            current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            new_customers_this_month = relations.filter(
                first_booking_date__gte=current_month
            ).count()
            
            # Average rating
            avg_rating = relations.aggregate(avg=Avg('average_rating'))['avg'] or 0
            
            # Active customers (booked in last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            active_customers = relations.filter(
                last_booking_date__gte=thirty_days_ago
            ).count()
            
            # Retention rate (customers who booked more than once)
            returning_customers = relations.filter(total_bookings__gt=1).count()
            retention_rate = (returning_customers / max(total_customers, 1)) * 100
            
            stats = {
                'total_customers': total_customers,
                'regular_customers': regular_customers,
                'new_customers_this_month': new_customers_this_month,
                'active_customers': active_customers,
                'favorite_customers': favorite_customers,
                'blocked_customers': blocked_customers,
                'average_rating': float(avg_rating),
                'retention_rate': float(retention_rate)
            }
            
            return Response(stats)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch customer stats: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def recent_customer_activity(self, request):
        """
        Get recent customer activity for provider dashboard
        
        GET /api/bookings/provider_dashboard/recent_customer_activity/
        """
        provider = request.user
        limit = int(request.query_params.get('limit', 10))
        
        try:
            activities = []
            
            # Recent bookings
            recent_bookings = Booking.objects.filter(
                service__provider=provider
            ).select_related('customer', 'service').order_by('-created_at')[:limit]
            
            for booking in recent_bookings:
                activities.append({
                    'id': f'booking_{booking.id}',
                    'type': 'booking',
                    'customer_name': booking.customer.get_full_name(),
                    'customer_id': booking.customer.id,
                    'title': 'New Booking',
                    'description': f'Booked {booking.service.title}',
                    'timestamp': booking.created_at.isoformat(),
                    'status': booking.status,
                    'amount': float(booking.total_amount)
                })
            
            # Recent reviews
            recent_reviews = Review.objects.filter(
                provider=provider
            ).select_related('customer').order_by('-created_at')[:limit//2]
            
            for review in recent_reviews:
                activities.append({
                    'id': f'review_{review.id}',
                    'type': 'review',
                    'customer_name': review.customer.get_full_name(),
                    'customer_id': review.customer.id,
                    'title': 'New Review',
                    'description': f'Left a {review.rating}-star review',
                    'timestamp': review.created_at.isoformat(),
                    'rating': review.rating
                })
            
            # Sort all activities by timestamp
            activities.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return Response({'activities': activities[:limit]})
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch recent activity: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Export customer data as CSV
        
        GET /api/bookings/provider_dashboard/customers/export/?format=csv
        """
        provider = request.user
        export_format = request.query_params.get('format', 'csv')
        
        try:
            # Get all customer relations
            relations = ProviderCustomerRelation.objects.filter(
                provider=provider
            ).select_related('customer').order_by('-last_booking_date')
            
            if export_format == 'csv':
                # Create CSV response
                response = HttpResponse(content_type='text/csv')
                response['Content-Disposition'] = f'attachment; filename="customers_{timezone.now().strftime("%Y%m%d")}.csv"'
                
                writer = csv.writer(response)
                writer.writerow([
                    'Customer Name', 'Email', 'Phone', 'Total Bookings', 
                    'Total Spent', 'Average Rating', 'Customer Status',
                    'First Booking', 'Last Booking', 'Is Favorite', 'Is Blocked', 'Notes'
                ])
                
                for relation in relations:
                    # Determine customer status
                    if relation.is_blocked:
                        customer_status = 'Blocked'
                    elif relation.is_favorite_customer:
                        customer_status = 'Favorite'
                    elif relation.total_bookings >= 5:
                        customer_status = 'Regular'
                    elif relation.total_bookings > 1:
                        customer_status = 'Returning'
                    else:
                        customer_status = 'New'
                    
                    writer.writerow([
                        relation.customer.get_full_name(),
                        relation.customer.email,
                        relation.customer.phone or '',
                        relation.total_bookings,
                        float(relation.total_spent),
                        float(relation.average_rating),
                        customer_status,
                        relation.first_booking_date.strftime('%Y-%m-%d') if relation.first_booking_date else '',
                        relation.last_booking_date.strftime('%Y-%m-%d') if relation.last_booking_date else '',
                        'Yes' if relation.is_favorite_customer else 'No',
                        'Yes' if relation.is_blocked else 'No',
                        relation.notes or ''
                    ])
                
                return response
            
            else:
                return Response(
                    {'error': 'Unsupported export format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Failed to export customer data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def booking_history(self, request, pk=None):
        """
        Get booking history for a specific customer
        
        GET /api/bookings/provider_dashboard/customers/{customer_id}/bookings/
        """
        try:
            relation = ProviderCustomerRelation.objects.get(
                id=pk,
                provider=request.user
            )
            
            # Get booking history
            bookings = Booking.objects.filter(
                service__provider=request.user,
                customer=relation.customer
            ).select_related('service', 'payment').order_by('-created_at')
            
            # Apply pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            start = (page - 1) * page_size
            end = start + page_size
            
            booking_data = []
            for booking in bookings[start:end]:
                booking_data.append({
                    'id': booking.id,
                    'service': booking.service.title,
                    'date': booking.booking_date.isoformat() if booking.booking_date else '',
                    'time': booking.booking_time.strftime('%H:%M') if booking.booking_time else '',
                    'status': booking.status,
                    'amount': float(booking.total_amount),
                    'payment_status': booking.payment.status if hasattr(booking, 'payment') and booking.payment else 'pending',
                    'created_at': booking.created_at.isoformat()
                })
            
            return Response({
                'count': bookings.count(),
                'page': page,
                'page_size': page_size,
                'results': booking_data
            })
            
        except ProviderCustomerRelation.DoesNotExist:
            return Response(
                {'error': 'Customer relation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch booking history: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """
        Send message to customer (placeholder for future messaging system)
        
        POST /api/bookings/provider_dashboard/customers/{customer_id}/send_message/
        """
        try:
            relation = ProviderCustomerRelation.objects.get(
                id=pk,
                provider=request.user
            )
            
            message = request.data.get('message', '')
            subject = request.data.get('subject', '')
            
            if not message:
                return Response(
                    {'error': 'Message content is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # TODO: Implement actual messaging system
            # For now, just return success
            
            return Response({
                'success': True,
                'message': 'Message sent successfully',
                'recipient': relation.customer.get_full_name()
            })
            
        except ProviderCustomerRelation.DoesNotExist:
            return Response(
                {'error': 'Customer relation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to send message: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )