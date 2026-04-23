import re

with open('docs/ppt/index.html', 'r') as f:
    content = f.read()

# 1. Replace the Deployment Details Slide
pattern_deployment = r"(<!-- ====== NEW SLIDE: DEPLOYMENT DETAILS ====== -->.*?)</section>"
match_dep = re.search(pattern_deployment, content, re.DOTALL)

new_deployment_slide = """      <!-- ====== NEW SLIDE: DEPLOYMENT DETAILS ====== -->
      <section data-background-color="#0a0000">
        <h2 class="slide-heading" style="margin-bottom: 10px !important;">Deployment Details</h2>
        <p class="slide-sub" style="margin-bottom: 30px;">Publicly accessible at: <a href="https://cushy-chanda-unmaltable.ngrok-free.dev/" target="_blank" style="color: var(--blue);">cushy-chanda-unmaltable.ngrok-free.dev</a></p>
        
        <div class="eco-layout" style="grid-template-columns: 1fr 1.2fr 2fr; align-items: center; gap: 20px; max-width: 1050px; margin: 0 auto;">
          
          <!-- Column 1: Public -->
          <div style="display: flex; justify-content: center;">
            <div class="arch-box arch-b-blue fragment fade-right" data-fragment-index="1" id="dep-public" style="width: 160px; z-index: 10;">
              <span class="arch-box-title">Public Internet</span>
              <span class="arch-box-desc">Global Access</span>
            </div>
          </div>
          
          <!-- Column 2: Ngrok -->
          <div style="display: flex; justify-content: center;">
            <div class="arch-box arch-b-green fragment fade-right" data-fragment-index="2" id="dep-ngrok" style="width: 180px; z-index: 10;">
              <span class="arch-box-title">Ngrok Tunnel</span>
              <span class="arch-box-desc">Bypasses Firewall</span>
            </div>
          </div>

          <!-- Column 3: IITK Server -->
          <div class="arch-docker-boundary fragment fade-in" data-fragment-index="3" style="display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 25px 15px 15px; min-height: auto;">
            <span class="arch-docker-label">IITK Server (Single Node)</span>
            
            <div class="arch-box arch-b-amber" id="dep-nginx" style="width: 100%; max-width: 280px; z-index: 10;">
              <span class="arch-box-tag">:80</span>
              <span class="arch-box-title">Nginx Reverse Proxy</span>
            </div>

            <div style="display: flex; gap: 15px; width: 100%; justify-content: center;">
              <div class="arch-box arch-b-red" id="dep-django" style="flex: 1; z-index: 10;">
                <span class="arch-box-title">Django API</span>
              </div>
              <div class="arch-box arch-b-purple" id="dep-data" style="flex: 1; z-index: 10;">
                <span class="arch-box-title">DB / Redis</span>
              </div>
              <div class="arch-box arch-b-blue" id="dep-front" style="flex: 1; z-index: 10;">
                <span class="arch-box-title">React PWA</span>
              </div>
            </div>
          </div>
          
          <svg class="arch-svg-overlay" id="depArrowsSvg" style="z-index: 5; pointer-events: none;"></svg>
        </div>

        <div class="fragment fade-up" data-fragment-index="4" style="font-size: 0.6em; color: #a0a0a0; max-width: 900px; margin: 30px auto 0; padding: 12px; border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px;">
          <span style="color: #ffd43b; font-weight: bold;">Note:</span> We originally configured Nginx for Render/Koyeb load balancing. We bypassed this multiservice approach and consolidated entirely on the IITK server for stability against campus firewall rules.
        </div>

        <script>
          (function() {
            function drawDepArrows() {
              var svg = document.getElementById('depArrowsSvg');
              if (!svg) return;
              var canvas = svg.closest('.eco-layout');
              if (!canvas) return;
              var cr = canvas.getBoundingClientRect();
              svg.innerHTML = '';
              
              var arrs = [
                {from: 'dep-public', to: 'dep-ngrok', color: '#4a9eff', side: 'right-left'},
                {from: 'dep-ngrok', to: 'dep-nginx', color: '#34d399', side: 'right-left'},
                {from: 'dep-nginx', to: 'dep-django', color: '#f59e0b', side: 'bottom-top'},
                {from: 'dep-nginx', to: 'dep-data', color: '#f59e0b', side: 'bottom-top'},
                {from: 'dep-nginx', to: 'dep-front', color: '#f59e0b', side: 'bottom-top'}
              ];
              
              arrs.forEach(function(a) {
                var f = document.getElementById(a.from);
                var t = document.getElementById(a.to);
                if(!f || !t || f.offsetParent === null || t.offsetParent === null) return;
                
                var fr = f.getBoundingClientRect();
                var tr = t.getBoundingClientRect();
                var x1, y1, x2, y2, d;
                
                if (a.side === 'bottom-top') {
                  x1 = (fr.left + fr.width/2) - cr.left;
                  y1 = fr.bottom - cr.top;
                  x2 = (tr.left + tr.width/2) - cr.left;
                  y2 = tr.top - cr.top;
                  var curY = Math.max(Math.abs(y2 - y1) / 2, Math.abs(x2 - x1) / 2);
                  if (Math.abs(x2 - x1) < 20) curY = Math.max(curY, 20);
                  d = 'M' + x1 + ',' + y1 + ' C' + x1 + ',' + (y1 + curY) + ' ' + x2 + ',' + (y2 - curY) + ' ' + x2 + ',' + y2;
                } else {
                  x1 = fr.right - cr.left;
                  y1 = (fr.top + fr.height/2) - cr.top;
                  x2 = tr.left - cr.left;
                  y2 = (tr.top + tr.height/2) - cr.top;
                  var curX = Math.max(Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2);
                  if (Math.abs(y2 - y1) < 20) curX = Math.max(curX, 20);
                  var cx1 = x1 + (x2 > x1 ? curX : -curX);
                  var cx2 = x2 - (x2 > x1 ? curX : -curX);
                  d = 'M' + x1 + ',' + y1 + ' C' + cx1 + ',' + y1 + ' ' + cx2 + ',' + y2 + ' ' + x2 + ',' + y2;
                }
                
                var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', d);
                path.setAttribute('stroke', a.color);
                path.setAttribute('stroke-width', '2');
                path.setAttribute('stroke-dasharray', '6,4');
                path.setAttribute('fill', 'none');
                path.setAttribute('opacity', '0.65');
                svg.appendChild(path);
                
                var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                if (a.side === 'bottom-top') {
                  arrow.setAttribute('points', x2 + ',' + y2 + ' ' + (x2 - 6) + ',' + (y2 - 8) + ' ' + (x2 + 6) + ',' + (y2 - 8));
                } else {
                  arrow.setAttribute('points', x2 + ',' + y2 + ' ' + (x2 - 8) + ',' + (y2 - 6) + ' ' + (x2 - 8) + ',' + (y2 + 6));
                }
                arrow.setAttribute('fill', a.color);
                arrow.setAttribute('opacity', '0.7');
                svg.appendChild(arrow);
              });
            }
            Reveal.on('fragmentshown', function() { setTimeout(drawDepArrows, 400); });
            Reveal.on('fragmenthidden', function() { setTimeout(drawDepArrows, 400); });
            Reveal.on('slidechanged', function() { setTimeout(drawDepArrows, 500); });
            window.addEventListener('resize', function() { setTimeout(drawDepArrows, 200); });
            setTimeout(drawDepArrows, 800);
          })();
        </script>
      </section>"""

if match_dep:
    content = content.replace(match_dep.group(0), new_deployment_slide)
else:
    print("Could not find Deployment slide")
    exit(1)

# 2. Extract sections to find slides 12 to 18
# split the content carefully on `<section` tags that are direct children of `<div class="slides">`
# Actually it's easier to use regex split/findall.
sections = re.findall(r"(<section data-background-color=.*?</section>\s*)", content, re.DOTALL)

# Let's rebuild the content inside the `.slides` div
pre_slides = content.split('<div class="slides">')[0] + '<div class="slides">\n'
post_slides = '\n    </div>\n  </div>' + content.split('    </div>\n  </div>')[1]

# We want to remove index 12 through 18 inclusive
new_sections = []
for i, sec in enumerate(sections):
    if i >= 12 and i <= 18:
        continue # delete this slide
    new_sections.append(sec)

final_content = pre_slides + "\n".join(new_sections) + post_slides

with open('docs/ppt/index.html', 'w') as f:
    f.write(final_content)

print("Updates applied.")
