import re

with open('docs/ppt/index.html', 'r') as f:
    content = f.read()

# Extract all <section> elements that are direct children of .slides
# It's safer to just split by <section data-background-color=
sections = re.findall(r"(<section data-background-color=.*?</section>\s*)", content, re.DOTALL)

pre_slides = content.split('<div class="slides">')[0] + '<div class="slides">\n'
post_slides = '\n    </div>\n  </div>' + content.split('    </div>\n  </div>')[1]

# Current indices:
# 8: Demo Plan
# 9: System Architecture
# 10: Deployment Details
# 11: PHASE: Architecture & Reflection

if len(sections) > 11:
    slide_11 = sections[11] # The PHASE: Architecture & Reflection slide
    
    # Check if slide 11 is indeed the phase divider
    if "Architecture &amp; Reflection" in slide_11:
        # Remove slide 11 from its current position
        sections.pop(11)
        # Insert it before slide 9 (System Architecture)
        sections.insert(9, slide_11)
        
        final_content = pre_slides + "".join(sections) + post_slides
        
        with open('docs/ppt/index.html', 'w') as f:
            f.write(final_content)
        print("Slide moved successfully.")
    else:
        print("Slide 11 does not seem to be the Architecture & Reflection phase divider.")
else:
    print("Not enough slides found.")
