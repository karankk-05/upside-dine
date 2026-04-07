import time
import random
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.users.models import Mess
from apps.crowd.models import CrowdMetric
from django.utils import timezone
from datetime import timedelta

def run():
    print("Finding Hall 1 Mess...")
    hall1 = Mess.objects.filter(name__icontains='Hall 1').first()
    if not hall1:
        print("Hall 1 Mess not found, using first mess")
        hall1 = Mess.objects.first()
    
    mess_id = hall1.id if hall1 else 1
    print(f"Using Mess ID {mess_id} ({hall1.name if hall1 else 'fallback'})")

    # Inject 10 minutes of initial historical data so charts aren't empty initially.
    print("Injecting historical data...")
    now = timezone.now()
    metrics = []
    # 60 points in the past
    for i in range(60, 0, -1):
        density = random.uniform(20.0, 80.0)
        level = 'low'
        if density > 40: level = 'moderate'
        if density > 75: level = 'high'
        
        m = CrowdMetric(
            mess_id=mess_id,
            density_percentage=density,
            estimated_count=int(density * 2),
            density_level=level,
            estimated_wait_minutes=density / 5,
        )
        metrics.append(m)
        
    CrowdMetric.objects.bulk_create(metrics)
    
    # Bulk create sets recorded_at to now, we manually override
    created_metrics = CrowdMetric.objects.filter(mess_id=mess_id).order_by('-id')[:60]
    for m, i in zip(reversed(created_metrics), range(60, 0, -1)):
        CrowdMetric.objects.filter(id=m.id).update(recorded_at=now - timedelta(seconds=i*10))
    print("Historical data injected.")

    # Generate live data continuously in the background
    print("Generating live data continuously...")
    while True:
        density = random.uniform(30.0, 95.0)
        level = 'low'
        if density > 40: level = 'moderate'
        if density > 75: level = 'high'
        
        CrowdMetric.objects.create(
            mess_id=mess_id,
            density_percentage=density,
            estimated_count=int(density * 3),
            density_level=level,
            estimated_wait_minutes=density / 4,
        )
        time.sleep(5)
        
if __name__ == "__main__":
    run()
