import re

with open('docs/ppt/index.html', 'r') as f:
    content = f.read()

# Find all <section> tags that are direct children of <div class="slides">
# Using a simple regex to extract them
sections = re.findall(r"(<section data-background-color=.*?</section>)", content, re.DOTALL)

for i, sec in enumerate(sections):
    # Print the first line or heading to identify it
    heading = re.search(r"<h2.*?>(.*?)</h2>", sec)
    title = heading.group(1) if heading else "No heading"
    if title == "No heading":
        if "div class=\"phase-label\"" in sec:
            phase = re.search(r"<div class=\"phase-heading\">(.*?)</div>", sec)
            title = "PHASE: " + (phase.group(1) if phase else "")
        elif "group-name" in sec:
            title = "Group Intro"
        elif "vhs-topbar" in sec:
            title = "Video Slide"
        elif "logo-reveal-slide" in sec:
            title = "Logo Reveal"
        elif "thankyou" in sec:
            title = "Thank You"
    
    print(f"Slide Index {i}: {title}")
