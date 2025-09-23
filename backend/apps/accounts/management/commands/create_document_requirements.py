from django.core.management.base import BaseCommand
from apps.accounts.models import DocumentRequirement


class Command(BaseCommand):
    help = 'Create sample document requirements for provider verification'

    def handle(self, *args, **options):
        requirements_data = [
            {
                'name': 'Business Registration Certificate',
                'document_type': 'business_license',
                'description': 'Official business registration certificate from the Department of Industry or relevant authority. Must be valid and clearly show business name, registration number, and validity period.',
                'is_mandatory': True,
                'priority': 'critical',
                'max_file_size': 5242880,  # 5MB
                'allowed_file_types': ['application/pdf', 'image/jpeg', 'image/png'],
                'validity_period_days': 365,
                'order': 1
            },
            {
                'name': 'Professional Liability Insurance',
                'document_type': 'insurance_certificate',
                'description': 'Valid professional liability insurance certificate covering your service activities. Must include coverage amount, validity period, and policy number.',
                'is_mandatory': True,
                'priority': 'high',
                'max_file_size': 5242880,  # 5MB
                'allowed_file_types': ['application/pdf', 'image/jpeg', 'image/png'],
                'validity_period_days': 365,
                'order': 2
            },
            {
                'name': 'Professional Certification',
                'document_type': 'professional_certification',
                'description': 'Relevant professional certification or license for your service category. This could include trade licenses, skill certifications, or industry-specific qualifications.',
                'is_mandatory': True,
                'priority': 'high',
                'max_file_size': 5242880,  # 5MB
                'allowed_file_types': ['application/pdf', 'image/jpeg', 'image/png'],
                'validity_period_days': 730,  # 2 years
                'order': 3
            },
            {
                'name': 'National Identity Card',
                'document_type': 'identity_document',
                'description': 'Valid national identity card or passport for identity verification. Both front and back sides must be clearly visible.',
                'is_mandatory': True,
                'priority': 'critical',
                'max_file_size': 5242880,  # 5MB
                'allowed_file_types': ['image/jpeg', 'image/png', 'application/pdf'],
                'validity_period_days': 1825,  # 5 years
                'order': 4
            },
            {
                'name': 'Tax Registration Certificate',
                'document_type': 'tax_certificate',
                'description': 'Tax registration certificate (PAN) from the Inland Revenue Department. Required for tax compliance and payment processing.',
                'is_mandatory': True,
                'priority': 'high',
                'max_file_size': 5242880,  # 5MB
                'allowed_file_types': ['application/pdf', 'image/jpeg', 'image/png'],
                'validity_period_days': None,  # No expiry
                'order': 5
            },
            {
                'name': 'Bank Account Verification',
                'document_type': 'bank_statement',
                'description': 'Recent bank statement or account verification letter from your bank. Required for payment processing and verification of business account.',
                'is_mandatory': True,
                'priority': 'medium',
                'max_file_size': 5242880,  # 5MB
                'allowed_file_types': ['application/pdf', 'image/jpeg', 'image/png'],
                'validity_period_days': 90,  # 3 months
                'order': 6
            },
            {
                'name': 'Portfolio/Work Samples',
                'document_type': 'portfolio_certificate',
                'description': 'Portfolio showcasing your previous work, certifications, or testimonials. This helps customers understand your expertise and quality of work.',
                'is_mandatory': False,
                'priority': 'low',
                'max_file_size': 10485760,  # 10MB
                'allowed_file_types': ['application/pdf', 'image/jpeg', 'image/png'],
                'validity_period_days': None,  # No expiry
                'order': 7
            },
            {
                'name': 'Additional Certifications',
                'document_type': 'other',
                'description': 'Any additional certifications, awards, or documents that support your professional qualifications and expertise in your service area.',
                'is_mandatory': False,
                'priority': 'low',
                'max_file_size': 5242880,  # 5MB
                'allowed_file_types': ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                'validity_period_days': None,  # No expiry
                'order': 8
            }
        ]

        created_count = 0
        updated_count = 0

        for req_data in requirements_data:
            requirement, created = DocumentRequirement.objects.get_or_create(
                name=req_data['name'],
                document_type=req_data['document_type'],
                defaults=req_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created requirement: {requirement.name}')
                )
            else:
                # Update existing requirement
                for key, value in req_data.items():
                    setattr(requirement, key, value)
                requirement.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated requirement: {requirement.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDocument requirements setup complete!'
                f'\nCreated: {created_count} requirements'
                f'\nUpdated: {updated_count} requirements'
                f'\nTotal: {DocumentRequirement.objects.count()} requirements in database'
            )
        )