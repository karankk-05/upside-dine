import re

with open('docs/ppt/index.html', 'r') as f:
    content = f.read()

slides_to_restore = """
      <!-- ====== SLIDE 12: KEY ENGINEERING ====== -->
      <section data-background-color="#0a0000">
        <h2 class="slide-heading">Key Engineering Decisions</h2>
        <div class="eng-grid">
          <div class="eng-card">
            <div class="eng-title">Atomic Transactions</div>
            <div class="eng-desc"><code>select_for_update()</code> + <code>transaction.atomic()</code> for mess booking
              and order placement — zero race conditions on stock and balance</div>
          </div>
          <div class="eng-card">
            <div class="eng-title">Dual State Management</div>
            <div class="eng-desc">Server state via React Query (auto-cache, background refetch). Client state via
              Zustand (auth, cart, preferences)</div>
          </div>
          <div class="eng-card">
            <div class="eng-title">Real-Time Pipeline</div>
            <div class="eng-desc">Celery Beat triggers ML Service, results cached in Redis, pushed via Django Channels
              WebSocket to React hooks with exponential backoff</div>
          </div>
          <div class="eng-card">
            <div class="eng-title">Full Containerization</div>
            <div class="eng-desc">8 Docker services orchestrated via Compose — frontend, backend, db, redis, celery
              worker, celery beat, ml_service, nginx</div>
          </div>
        </div>
      </section>

      <!-- ====== SLIDE 13: COMPLETENESS ====== -->
      <section data-background-color="#0a0000">
        <h2 class="slide-heading">SRS Completeness</h2>
        <div class="comp-grid">
          <div class="comp-card c-done">
            <div class="comp-pct">100%</div>
            <div class="comp-label">User Auth &amp; RBAC</div>
            <div class="comp-sub">Register, OTP, Login, JWT, Roles, Rate Limit</div>
          </div>
          <div class="comp-card c-done">
            <div class="comp-pct">100%</div>
            <div class="comp-label">Mess System</div>
            <div class="comp-sub">Menu, Booking, QR, Balance, Manager, Worker</div>
          </div>
          <div class="comp-card c-done">
            <div class="comp-pct">100%</div>
            <div class="comp-label">Canteen &amp; Orders</div>
            <div class="comp-sub">Browse, Cart, Checkout, Track, Manager CRUD</div>
          </div>
          <div class="comp-card c-done">
            <div class="comp-pct">100%</div>
            <div class="comp-label">Crowd Monitoring</div>
            <div class="comp-sub">YOLOv8, Live Density, History, Recommendations</div>
          </div>
          <div class="comp-card c-done">
            <div class="comp-pct">100%</div>
            <div class="comp-label">Payments</div>
            <div class="comp-sub">Razorpay Create, Verify, Webhook, Refund</div>
          </div>
          <div class="comp-card c-planned">
            <div class="comp-pct">v2.0</div>
            <div class="comp-label">Delivery &amp; Notifications</div>
            <div class="comp-sub">Models defined, FCM integration planned</div>
          </div>
        </div>
      </section>

      <!-- ====== SLIDE 14: USER ROLES ====== -->
      <section data-background-color="#0a0000">
        <h2 class="slide-heading">Six User Roles</h2>
        <div class="roles-grid">
          <div class="role-card">
            <div class="role-name">Student</div>
            <div class="role-desc">Browse, order, book extras, track crowd</div>
          </div>
          <div class="role-card">
            <div class="role-name">Mess Manager</div>
            <div class="role-desc">Menu CRUD, inventory, bookings, statistics</div>
          </div>
          <div class="role-card">
            <div class="role-name">Canteen Manager</div>
            <div class="role-desc">Orders, menu management, revenue analytics</div>
          </div>
          <div class="role-card">
            <div class="role-name">Mess Worker</div>
            <div class="role-desc">QR scan and verify bookings at counter</div>
          </div>
          <div class="role-card">
            <div class="role-name">Delivery Person</div>
            <div class="role-desc">Accept runs, update delivery status</div>
          </div>
          <div class="role-card">
            <div class="role-name">Superadmin</div>
            <div class="role-desc">Create managers, full system control</div>
          </div>
        </div>
      </section>

      <!-- ====== SLIDE 15: DEPLOYMENT ====== -->
      <section data-background-color="#0a0000">
        <h2 class="slide-heading">Deployment Architecture</h2>
        <div class="deploy-grid">
          <div class="deploy-card">
            <div class="deploy-svc">Netlify</div>
            <div class="deploy-role">Frontend CDN</div>
            <div class="deploy-cost">Free</div>
          </div>
          <div class="deploy-card">
            <div class="deploy-svc">Render</div>
            <div class="deploy-role">Backend Node 1</div>
            <div class="deploy-cost">Free</div>
          </div>
          <div class="deploy-card">
            <div class="deploy-svc">Koyeb</div>
            <div class="deploy-role">Backend Node 2</div>
            <div class="deploy-cost">Free</div>
          </div>
          <div class="deploy-card">
            <div class="deploy-svc">Supabase</div>
            <div class="deploy-role">PostgreSQL</div>
            <div class="deploy-cost">Free</div>
          </div>
          <div class="deploy-card">
            <div class="deploy-svc">Upstash</div>
            <div class="deploy-role">Serverless Redis</div>
            <div class="deploy-cost">Free</div>
          </div>
          <div class="deploy-card">
            <div class="deploy-svc">IITK Server</div>
            <div class="deploy-role">Nginx + ML + Celery</div>
            <div class="deploy-cost">University</div>
          </div>
        </div>
        <p class="slide-footnote" style="font-size: 0.75em;">Load balanced across 2 cloud providers. Stateless API
          containers. Zero infrastructure cost.</p>
      </section>

      <!-- ====== SLIDE 16: FUTURE PLANS ====== -->
      <section data-background-color="#0a0000">
        <h2 class="slide-heading">Future Plans</h2>
        <div class="req-list">
          <div class="req-row fragment fade-up" data-fragment-index="1">
            <div class="req-num">01</div>
            <div class="req-body">
              <div class="req-title">Campus-Wide Scaling</div>
              <div class="req-sub">Expand from Hall 12 to all 20+ messes and canteens across the IITK campus.</div>
            </div>
          </div>
          <div class="req-row fragment fade-up" data-fragment-index="2">
            <div class="req-num">02</div>
            <div class="req-body">
              <div class="req-title">Multi-Canteen Support</div>
              <div class="req-sub">Cross-canteen ordering, combined delivery runs, unified cart experience.</div>
            </div>
          </div>
          <div class="req-row fragment fade-up" data-fragment-index="3">
            <div class="req-num">03</div>
            <div class="req-body">
              <div class="req-title">Kubernetes Auto-Scaling</div>
              <div class="req-sub">K8s deployment with HPA for peak-hour traffic spikes during lunch and dinner.</div>
            </div>
          </div>
          <div class="req-row fragment fade-up" data-fragment-index="4">
            <div class="req-num">04</div>
            <div class="req-body">
              <div class="req-title">PWA + Push Notifications</div>
              <div class="req-sub">Service worker for offline support, FCM push notifications, add-to-homescreen.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ====== SLIDE 17: LESSONS LEARNT ====== -->
      <section data-background-color="#0a0000">
        <h2 class="slide-heading">Lessons Learnt</h2>
        <div class="lesson-list">
          <div class="lesson-row">
            <div class="lesson-title">Managing an 8-Person Dev Team</div>
            <div class="lesson-desc">Feature-based modular architecture enabled parallel development with near-zero
              merge conflicts. Weekly sync meetings in Hall 12 kept everyone aligned.</div>
          </div>
          <div class="lesson-row">
            <div class="lesson-title">IITK Firewall Blocks Outgoing Database Requests</div>
            <div class="lesson-desc">We planned a multiservice architecture across Render/Koyeb and IITK, but the campus firewall strictly blocks outgoing database connections from internal servers. We had to pivot to deploying everything entirely on the IITK server.</div>
          </div>
          <div class="lesson-row">
            <div class="lesson-title">Git Conflicts Are Inevitable</div>
            <div class="lesson-desc">Strict branch naming (<code>name-feature</code>), feature-scoped directories, and
              mandatory PR reviews minimized integration pain.</div>
          </div>
          <div class="lesson-row">
            <div class="lesson-title">Making WebSockets Reliable</div>
            <div class="lesson-desc">Exponential backoff reconnection, heartbeat pings, and graceful degradation to
              polling when connections drop on campus WiFi.</div>
          </div>
        </div>
      </section>
"""

# Insert right before slide 18
if "<!-- ====== SLIDE 18: THANK YOU ====== -->" in content:
    content = content.replace("<!-- ====== SLIDE 18: THANK YOU ====== -->", slides_to_restore + "\n      <!-- ====== SLIDE 18: THANK YOU ====== -->")
else:
    print("Could not find Slide 18")

with open('docs/ppt/index.html', 'w') as f:
    f.write(content)

print("Restored slides.")
