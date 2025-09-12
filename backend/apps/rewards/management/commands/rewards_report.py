"""
Management command to generate comprehensive rewards system report.

This command generates detailed analytics and reports about:
1. User engagement and activity
2. Points earning and redemption patterns  
3. Tier progression analysis
4. System performance metrics
5. Financial impact assessment

Usage: python manage.py rewards_report [--export] [--date-range DAYS]
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta, datetime
import json
from decimal import Decimal

from apps.rewards.models import RewardsConfig, RewardAccount, PointsTransaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Generate comprehensive rewards system analytics report'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--export',
            action='store_true',
            help='Export report to JSON file',
        )
        parser.add_argument(
            '--date-range',
            type=int,
            default=30,
            help='Number of days to analyze (default: 30)',
        )
        parser.add_argument(
            '--output-file',
            type=str,
            default=None,
            help='Output file path for export (default: rewards_report_YYYY-MM-DD.json)',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('📊 Generating SewaBazaar Rewards Analytics Report...\n')
        )
        
        self.date_range = options['date_range']
        self.start_date = timezone.now() - timedelta(days=self.date_range)
        
        # Generate report sections
        report_data = {}
        
        report_data['system_overview'] = self.generate_system_overview()
        report_data['user_engagement'] = self.generate_user_engagement_report()
        report_data['points_analytics'] = self.generate_points_analytics()
        report_data['tier_analysis'] = self.generate_tier_analysis()
        report_data['transaction_patterns'] = self.generate_transaction_patterns()
        report_data['financial_impact'] = self.generate_financial_impact()
        report_data['recommendations'] = self.generate_recommendations(report_data)
        
        # Display report
        self.display_report(report_data)
        
        # Export if requested
        if options['export']:
            self.export_report(report_data, options['output_file'])
        
        self.stdout.write(
            self.style.SUCCESS('\n✅ Report generation completed!')
        )
    
    def generate_system_overview(self):
        """Generate system overview statistics."""
        self.stdout.write('🔍 Analyzing system overview...')
        
        config = RewardsConfig.objects.filter(is_active=True).first()
        
        overview = {
            'report_date': timezone.now().isoformat(),
            'analysis_period_days': self.date_range,
            'system_status': {
                'configuration_active': bool(config),
                'maintenance_mode': config.maintenance_mode if config else False,
                'total_users': User.objects.count(),
                'users_with_rewards': RewardAccount.objects.count(),
                'adoption_rate': 0
            }
        }
        
        if overview['system_status']['total_users'] > 0:
            overview['system_status']['adoption_rate'] = (
                overview['system_status']['users_with_rewards'] / 
                overview['system_status']['total_users'] * 100
            )
        
        return overview
    
    def generate_user_engagement_report(self):
        """Generate user engagement analytics."""
        self.stdout.write('👥 Analyzing user engagement...')
        
        # Active users (users with transactions in period)
        active_users = PointsTransaction.objects.filter(
            created_at__gte=self.start_date
        ).values('user').distinct().count()
        
        # Top users by activity
        top_users = PointsTransaction.objects.filter(
            created_at__gte=self.start_date
        ).values('user__username', 'user__email').annotate(
            transaction_count=Count('id'),
            total_points=Sum('points')
        ).order_by('-transaction_count')[:10]
        
        # Engagement by tier
        tier_engagement = RewardAccount.objects.values('tier_level').annotate(
            user_count=Count('id'),
            avg_balance=Avg('current_balance'),
            avg_earned=Avg('total_points_earned'),
            avg_redeemed=Avg('total_points_redeemed')
        )
        
        return {
            'active_users_period': active_users,
            'engagement_rate': (active_users / RewardAccount.objects.count() * 100) if RewardAccount.objects.count() > 0 else 0,
            'top_users': list(top_users),
            'tier_engagement': list(tier_engagement)
        }
    
    def generate_points_analytics(self):
        """Generate points earning and redemption analytics."""
        self.stdout.write('💰 Analyzing points flow...')
        
        # Points statistics for the period
        period_stats = PointsTransaction.objects.filter(
            created_at__gte=self.start_date
        ).aggregate(
            total_earned=Sum('points', filter=Q(transaction_type__in=['earned_booking', 'earned_review', 'earned_referral', 'bonus_first_booking', 'bonus_weekend', 'bonus_tier_upgrade'])),
            total_redeemed=Sum('points', filter=Q(transaction_type__in=['redeemed_voucher', 'redeemed_discount'])),
            transaction_count=Count('id'),
            avg_transaction=Avg('points')
        )
        
        # Transaction types breakdown
        transaction_types = PointsTransaction.objects.filter(
            created_at__gte=self.start_date
        ).values('transaction_type').annotate(
            count=Count('id'),
            total_points=Sum('points')
        ).order_by('-total_points')
        
        # Daily trends
        daily_trends = []
        for i in range(self.date_range):
            date = self.start_date + timedelta(days=i)
            day_stats = PointsTransaction.objects.filter(
                created_at__date=date.date()
            ).aggregate(
                earned=Sum('points', filter=Q(transaction_type__in=['earned_booking', 'earned_review', 'earned_referral', 'bonus_first_booking', 'bonus_weekend', 'bonus_tier_upgrade'])),
                redeemed=Sum('points', filter=Q(transaction_type__in=['redeemed_voucher', 'redeemed_discount'])),
                count=Count('id')
            )
            daily_trends.append({
                'date': date.date().isoformat(),
                'earned': float(day_stats['earned'] or 0),
                'redeemed': float(day_stats['redeemed'] or 0),
                'net_flow': float((day_stats['earned'] or 0) - abs(day_stats['redeemed'] or 0)),
                'transaction_count': day_stats['count']
            })
        
        return {
            'period_summary': {
                'total_earned': float(period_stats['total_earned'] or 0),
                'total_redeemed': float(abs(period_stats['total_redeemed'] or 0)),
                'net_points_flow': float((period_stats['total_earned'] or 0) - abs(period_stats['total_redeemed'] or 0)),
                'transaction_count': period_stats['transaction_count'],
                'avg_transaction_amount': float(period_stats['avg_transaction'] or 0)
            },
            'transaction_sources': list(transaction_types),
            'daily_trends': daily_trends
        }
    
    def generate_tier_analysis(self):
        """Generate tier progression and distribution analysis."""
        self.stdout.write('🏆 Analyzing tier distribution...')
        
        # Current tier distribution
        tier_distribution = RewardAccount.objects.values('tier_level').annotate(
            count=Count('id'),
            avg_balance=Avg('current_balance'),
            avg_earned=Avg('total_points_earned'),
            avg_lifetime_value=Avg('lifetime_value')
        )
        
        # Users close to tier upgrade
        config = RewardsConfig.objects.filter(is_active=True).first()
        tier_progression = {}
        
        if config and config.tier_thresholds:
            thresholds = config.tier_thresholds
            
            # Bronze to Silver
            bronze_users = RewardAccount.objects.filter(tier_level='bronze')
            bronze_close_to_silver = bronze_users.filter(
                total_points_earned__gte=thresholds['silver'] * 0.8
            ).count()
            
            # Silver to Gold  
            silver_users = RewardAccount.objects.filter(tier_level='silver')
            silver_close_to_gold = silver_users.filter(
                total_points_earned__gte=thresholds['gold'] * 0.8
            ).count()
            
            # Gold to Platinum
            gold_users = RewardAccount.objects.filter(tier_level='gold')
            gold_close_to_platinum = gold_users.filter(
                total_points_earned__gte=thresholds['platinum'] * 0.8
            ).count()
            
            tier_progression = {
                'bronze_to_silver_candidates': bronze_close_to_silver,
                'silver_to_gold_candidates': silver_close_to_gold,
                'gold_to_platinum_candidates': gold_close_to_platinum
            }
        
        return {
            'distribution': list(tier_distribution),
            'progression_candidates': tier_progression
        }
    
    def generate_transaction_patterns(self):
        """Generate transaction pattern analysis."""
        self.stdout.write('📈 Analyzing transaction patterns...')
        
        # For SQLite, we'll use Python to extract time patterns
        transactions = PointsTransaction.objects.filter(
            created_at__gte=self.start_date
        ).values_list('created_at', flat=True)
        
        # Initialize hourly and daily patterns
        hourly_pattern = {i: 0 for i in range(24)}
        weekly_pattern = {i: 0 for i in range(7)}  # 0=Monday, 6=Sunday
        
        # Count transactions by hour and day of week
        for created_at in transactions:
            hourly_pattern[created_at.hour] += 1
            weekly_pattern[created_at.weekday()] += 1
        
        # Convert to format expected by report
        hourly_distribution = [{'hour': hour, 'count': count} for hour, count in hourly_pattern.items()]
        weekly_distribution = [{'day_of_week': day, 'count': count} for day, count in weekly_pattern.items()]
        
        return {
            'hourly_distribution': hourly_distribution,
            'weekly_distribution': weekly_distribution
        }
    
    def generate_financial_impact(self):
        """Generate financial impact analysis."""
        self.stdout.write('💵 Analyzing financial impact...')
        
        config = RewardsConfig.objects.filter(is_active=True).first()
        
        if not config:
            return {'error': 'No active configuration found'}
        
        # Calculate financial metrics
        total_points_outstanding = RewardAccount.objects.aggregate(
            total=Sum('current_balance')
        )['total'] or 0
        
        total_points_redeemed_period = PointsTransaction.objects.filter(
            created_at__gte=self.start_date,
            transaction_type__in=['redeemed_voucher', 'redeemed_discount']
        ).aggregate(
            total=Sum('points')
        )['total'] or 0
        
        # Convert points to monetary values
        outstanding_liability = float(total_points_outstanding * config.rupees_per_point)
        period_redemption_cost = float(abs(total_points_redeemed_period) * config.rupees_per_point)
        
        return {
            'outstanding_points': float(total_points_outstanding),
            'outstanding_liability_inr': outstanding_liability,
            'period_redemption_points': float(abs(total_points_redeemed_period)),
            'period_redemption_cost_inr': period_redemption_cost,
            'points_to_inr_rate': float(config.rupees_per_point)
        }
    
    def generate_recommendations(self, report_data):
        """Generate actionable recommendations based on analytics."""
        recommendations = []
        
        # Check adoption rate
        adoption_rate = report_data['system_overview']['system_status']['adoption_rate']
        if adoption_rate < 80:
            recommendations.append({
                'type': 'adoption',
                'priority': 'high',
                'message': f'Rewards adoption rate is {adoption_rate:.1f}%. Consider implementing onboarding incentives.'
            })
        
        # Check engagement rate
        engagement_rate = report_data['user_engagement']['engagement_rate']
        if engagement_rate < 50:
            recommendations.append({
                'type': 'engagement',
                'priority': 'medium',
                'message': f'User engagement is {engagement_rate:.1f}%. Consider introducing time-limited promotions.'
            })
        
        # Check points redemption ratio
        points_data = report_data['points_analytics']['period_summary']
        if points_data['total_earned'] > 0:
            redemption_ratio = points_data['total_redeemed'] / points_data['total_earned']
            if redemption_ratio < 0.2:
                recommendations.append({
                    'type': 'redemption',
                    'priority': 'medium',
                    'message': f'Low redemption rate ({redemption_ratio:.1%}). Consider adding more redemption options or lower minimum thresholds.'
                })
        
        # Check tier progression
        tier_data = report_data['tier_analysis']['progression_candidates']
        total_candidates = sum(tier_data.values()) if tier_data else 0
        if total_candidates > 10:
            recommendations.append({
                'type': 'tier_progression',
                'priority': 'low',
                'message': f'{total_candidates} users are close to tier upgrades. Consider targeted campaigns to encourage progression.'
            })
        
        return recommendations
    
    def display_report(self, report_data):
        """Display the formatted report."""
        
        # System Overview
        self.stdout.write(self.style.SUCCESS('\n📋 SYSTEM OVERVIEW'))
        overview = report_data['system_overview']['system_status']
        self.stdout.write(f'   Total Users: {overview["total_users"]:,}')
        self.stdout.write(f'   Users with Rewards: {overview["users_with_rewards"]:,}')
        self.stdout.write(f'   Adoption Rate: {overview["adoption_rate"]:.1f}%')
        
        # User Engagement
        self.stdout.write(self.style.SUCCESS('\n👥 USER ENGAGEMENT'))
        engagement = report_data['user_engagement']
        self.stdout.write(f'   Active Users ({self.date_range}d): {engagement["active_users_period"]:,}')
        self.stdout.write(f'   Engagement Rate: {engagement["engagement_rate"]:.1f}%')
        
        # Points Analytics
        self.stdout.write(self.style.SUCCESS('\n💰 POINTS ANALYTICS'))
        points = report_data['points_analytics']['period_summary']
        self.stdout.write(f'   Points Earned: {points["total_earned"]:,.0f}')
        self.stdout.write(f'   Points Redeemed: {points["total_redeemed"]:,.0f}')
        self.stdout.write(f'   Net Flow: {points["net_points_flow"]:,.0f}')
        self.stdout.write(f'   Total Transactions: {points["transaction_count"]:,}')
        
        # Financial Impact
        self.stdout.write(self.style.SUCCESS('\n💵 FINANCIAL IMPACT'))
        financial = report_data['financial_impact']
        if 'error' not in financial:
            self.stdout.write(f'   Outstanding Liability: ₹{financial["outstanding_liability_inr"]:,.2f}')
            self.stdout.write(f'   Period Redemption Cost: ₹{financial["period_redemption_cost_inr"]:,.2f}')
        
        # Recommendations
        self.stdout.write(self.style.SUCCESS('\n🎯 RECOMMENDATIONS'))
        recommendations = report_data['recommendations']
        if recommendations:
            for rec in recommendations:
                priority_color = self.style.ERROR if rec['priority'] == 'high' else self.style.WARNING if rec['priority'] == 'medium' else self.style.SUCCESS
                self.stdout.write(f'   {priority_color(rec["priority"].upper())}: {rec["message"]}')
        else:
            self.stdout.write('   ✅ No immediate recommendations - system performing well!')
    
    def export_report(self, report_data, output_file=None):
        """Export report data to JSON file."""
        if not output_file:
            timestamp = datetime.now().strftime('%Y-%m-%d')
            output_file = f'rewards_report_{timestamp}.json'
        
        # Convert Decimal objects to float for JSON serialization
        def decimal_converter(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            raise TypeError(f'Object of type {type(obj)} is not JSON serializable')
        
        try:
            with open(output_file, 'w') as f:
                json.dump(report_data, f, indent=2, default=decimal_converter)
            
            self.stdout.write(
                self.style.SUCCESS(f'\n📁 Report exported to: {output_file}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'\n❌ Export failed: {str(e)}')
            )
