from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db import transaction

# Import from installed app path (as used elsewhere in the project)
from apps.bookings.models import Booking, ServiceDelivery


class Command(BaseCommand):
    help = (
        "Backfill ServiceDelivery history for bookings so customer confirmation can proceed.\n"
        "Creates a ServiceDelivery record for any booking with status 'service_delivered'\n"
        "that is missing one. Optionally target a specific booking by ID."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--booking",
            type=int,
            help="Booking ID to backfill. If omitted, processes all eligible bookings.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run without making changes; shows what would be created.",
        )
        parser.add_argument(
            "--fix-status",
            action="store_true",
            help=(
                "If provided, also set booking status to 'service_delivered' when it is currently "
                "'confirmed' and no delivery record exists."
            ),
        )

    def handle(self, *args, **options):
        booking_id = options.get("booking")
        dry_run = options.get("dry_run", False)
        fix_status = options.get("fix_status", False)

        # Eligible base queryset
        qs = Booking.objects.all()
        if booking_id is not None:
            qs = qs.filter(id=booking_id)

        # Prefetch relateds
        qs = qs.select_related("service", "customer")

        if booking_id is not None and not qs.exists():
            raise CommandError(f"No booking with id={booking_id} found.")

        created_count = 0
        skipped_count = 0
        status_fixed_count = 0

        now = timezone.now()

        @transaction.atomic
        def process_booking(booking: Booking):
            nonlocal created_count, skipped_count, status_fixed_count

            # Ensure proper state for confirmation if requested
            if fix_status and booking.status == "confirmed":
                # Promote to service_delivered if delivery record will be backfilled
                if not hasattr(booking, "service_delivery"):
                    if dry_run:
                        status_fixed_count += 1
                        self.stdout.write(
                            self.style.WARNING(
                                f"DRY-RUN Booking {booking.id}: would set status -> 'service_delivered'"
                            )
                        )
                    else:
                        booking.status = "service_delivered"
                        booking.booking_step = "service_delivered"
                        booking.save(update_fields=["status", "booking_step"])
                        status_fixed_count += 1
                        self.stdout.write(
                            self.style.NOTICE(
                                f"Booking {booking.id}: status set to 'service_delivered'"
                            )
                        )

            # Only create ServiceDelivery for bookings currently in service_delivered
            if booking.status != "service_delivered":
                self.stdout.write(
                    self.style.NOTICE(
                        f"Booking {booking.id}: status='{booking.status}' != 'service_delivered' -> skip"
                    )
                )
                skipped_count += 1
                return

            # If ServiceDelivery already exists, skip
            try:
                _ = booking.service_delivery
                self.stdout.write(
                    self.style.NOTICE(
                        f"Booking {booking.id}: ServiceDelivery already present -> skip"
                    )
                )
                skipped_count += 1
                return
            except ServiceDelivery.DoesNotExist:
                pass

            # Choose delivered_at: use scheduled time if in past; else now
            delivered_at = None
            try:
                if booking.booking_date and booking.booking_time:
                    scheduled_dt = timezone.make_aware(
                        timezone.datetime.combine(booking.booking_date, booking.booking_time)
                    )
                    delivered_at = scheduled_dt if scheduled_dt <= now else now
            except Exception:
                delivered_at = now

            if delivered_at is None:
                delivered_at = now

            if dry_run:
                created_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"DRY-RUN Booking {booking.id}: would create ServiceDelivery(delivered_at={delivered_at.isoformat()})"
                    )
                )
                return

            ServiceDelivery.objects.create(
                booking=booking,
                delivered_at=delivered_at,
                delivered_by=getattr(booking.service, "provider", None),
                delivery_notes="Backfilled: provider delivery recorded via admin/manual status",
                delivery_photos=[],
            )
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"Booking {booking.id}: ServiceDelivery created (delivered_at={delivered_at.isoformat()})"
                )
            )

        self.stdout.write(self.style.MIGRATE_HEADING("Backfilling ServiceDelivery records..."))

        for booking in qs.iterator():
            process_booking(booking)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created: {created_count}, Skipped: {skipped_count}, Status fixed: {status_fixed_count}"
            )
        )


