from django.core.management.base import BaseCommand
from apps.mess.models import Mess
from apps.canteen.models import Canteen


class Command(BaseCommand):
    help = "Seed all messes (one per hall) and all canteens/outlets for the campus."

    def handle(self, *args, **options):
        # ── Seed Messes ──
        INITIAL_HALLS = [
            "Hall 1", "Hall 2", "Hall 3", "Hall 4", "Hall 5",
            "Hall 6", "Hall 7", "Hall 8", "Hall 9", "Hall 10",
            "Hall 11", "Hall 12", "Hall 13", "Hall 14", "Girls Hostel 1",
            "Girls Hostel Tower 2"
        ]
        
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== Seeding Messes ==="))
        for hall_name in INITIAL_HALLS:
            mess, created = Mess.objects.get_or_create(
                hall_name=hall_name,
                defaults={"is_active": True},
            )
            status = "CREATED" if created else "already exists"
            self.stdout.write(f"  {mess.name} — {status}")

        # ── Seed Canteens / Outlets ──
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== Seeding Canteens & Outlets ==="))
        canteens = [
            # Hall Canteens
            {"name": "Hall 1 Canteen", "location": "Hall-I"},
            {"name": "Hall 2 Canteen", "location": "Hall-II"},
            {"name": "Hall 3 Canteen", "location": "Hall-III"},
            {"name": "Hall 4 Canteen", "location": "Hall-IV"},
            {"name": "Hall 5 Canteen", "location": "Hall-V"},
            {"name": "Hall 6 Canteen", "location": "Hall-VI"},
            {"name": "Hall 7 Canteen", "location": "Hall-VII"},
            {"name": "Hall 8 Canteen", "location": "Hall-VIII"},
            {"name": "Hall 9 Canteen", "location": "Hall-IX"},
            {"name": "Hall 10 Canteen", "location": "Hall-X"},
            {"name": "Hall 11 Canteen", "location": "Hall-XI"},
            {"name": "Hall 12 Canteen", "location": "Hall-XII"},
            {"name": "Hall 13 Canteen", "location": "Hall-XIII"},
            {"name": "GH-1 Canteen", "location": "GH-I"},
            {"name": "GHT-2 Canteen", "location": "GHT-II"},
            # Academic Area
            {"name": "CSE Canteen", "location": "Academic Area"},
            {"name": "DoAA Canteen", "location": "Academic Area"},
            {"name": "Southern Lab Canteen", "location": "Academic Area"},
            # New Student Activity Centre
            {"name": "Kathi Rolls", "location": "New SAC"},
            {"name": "North Indian Cuisine Outlet", "location": "New SAC"},
            {"name": "Dominos", "location": "New SAC"},
            # Campus Restaurants
            {"name": "CCD", "location": "Faculty Lounge, Academic Area"},
            {"name": "Nescafe", "location": "New Core Lab"},
            {"name": "Fast Food Outlet (AVR Foods)", "location": "New Shopping Centre"},
            # Chowpati Area
            {"name": "Petra Cafe (Non-Veg)", "location": "Chowpati Area"},
            {"name": "Ice Cream & Shakes", "location": "Chowpati Area"},
            {"name": "South Indian Food", "location": "Chowpati Area"},
        ]

        for c in canteens:
            canteen, created = Canteen.objects.get_or_create(
                name=c["name"],
                defaults={
                    "location": c["location"],
                    "is_active": True,
                },
            )
            status = "CREATED" if created else "already exists"
            self.stdout.write(f"  {canteen.name} — {status}")

        self.stdout.write(self.style.SUCCESS("\n✅ Seeding complete!"))
