import re

with open('docs/ppt/index.html', 'r') as f:
    content = f.read()

# 1. Extract System Architecture slide (lines 273-328)
# We find it by matching <!-- ====== SLIDE 8: SYSTEM ARCHITECTURE ====== --> to </section>
sys_arch_pattern = r"(\s*<!-- ====== SLIDE 8: SYSTEM ARCHITECTURE ====== -->\s*<section data-background-color=\"#0a0000\">\s*<h2 class=\"slide-heading\">System Architecture</h2>.*?</section>\s*)"
match = re.search(sys_arch_pattern, content, re.DOTALL)
if not match:
    print("Could not find System Architecture slide")
    exit(1)

sys_arch_content = match.group(1)

# Remove it from its original place
content = content.replace(sys_arch_content, "", 1)

# 2. Find the Demo Plan slide to insert after
demo_plan_pattern = r"(<!-- ====== SLIDE 7: DEMO PLAN \(Single Page\) ====== -->.*?</section>\s*)"
match2 = re.search(demo_plan_pattern, content, re.DOTALL)
if not match2:
    print("Could not find Demo Plan slide")
    exit(1)

demo_plan_content = match2.group(1)

deployment_details_slide = """
      <!-- ====== NEW SLIDE: DEPLOYMENT DETAILS ====== -->
      <section data-background-color="#0a0000">
        <h2 class="slide-heading">Deployment Details</h2>
        <div class="deploy-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 900px; margin: 0 auto; text-align: left;">
          <div class="deploy-card" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <div class="deploy-svc" style="font-size: 1.4em; font-weight: bold; color: #4dabf7;">IITK Server</div>
            <div class="deploy-role" style="font-size: 1.1em; color: #fff; margin-top: 5px;">Primary Deployment Node</div>
            <div class="deploy-desc" style="font-size: 0.9em; margin-top: 10px; color: #a0a0a0; line-height: 1.4;">Hosts the complete Docker Compose stack instead of a multiservice architecture to ensure simplicity and reliability.</div>
          </div>
          <div class="deploy-card" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <div class="deploy-svc" style="font-size: 1.4em; font-weight: bold; color: #69db7c;">Ngrok</div>
            <div class="deploy-role" style="font-size: 1.1em; color: #fff; margin-top: 5px;">Public Tunneling</div>
            <div class="deploy-desc" style="font-size: 0.9em; margin-top: 10px; color: #a0a0a0; line-height: 1.4;">Securely exposes the local IITK server to the public internet, making it fully accessible from anywhere.</div>
          </div>
          <div class="deploy-card" style="grid-column: span 2; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <div class="deploy-svc" style="font-size: 1.4em; font-weight: bold; color: #ffd43b;">Nginx Load Balancing Note</div>
            <div class="deploy-role" style="font-size: 1.1em; color: #fff; margin-top: 5px;">Original Plan vs Reality</div>
            <div class="deploy-desc" style="font-size: 0.9em; margin-top: 10px; color: #a0a0a0; line-height: 1.4;">
              While the <code>deployment_v4</code> codebase contains Nginx configurations designed to load balance between Render and Koyeb backends, we ultimately bypassed the multiservice approach and deployed entirely on the IITK server for maximum stability.
            </div>
          </div>
        </div>
      </section>
"""

# Insert System Architecture and Deployment Details after Demo Plan
replacement = demo_plan_content + sys_arch_content + deployment_details_slide
content = content.replace(demo_plan_content, replacement, 1)

# 3. Remove Slides 12-17
# From <!-- ====== SLIDE 12: KEY ENGINEERING ====== --> down to the end of <!-- ====== SLIDE 17: LESSONS LEARNT ====== --> </section>
remove_pattern = r"(\s*<!-- ====== SLIDE 12: KEY ENGINEERING ====== -->.*<!-- ====== SLIDE 17: LESSONS LEARNT ====== -->.*?</section>\s*)"
match3 = re.search(remove_pattern, content, re.DOTALL)
if not match3:
    print("Could not find Slides 12-17 to remove")
    exit(1)

content = content.replace(match3.group(1), "\n\n")

with open('docs/ppt/index.html', 'w') as f:
    f.write(content)

print("Modifications successful.")
