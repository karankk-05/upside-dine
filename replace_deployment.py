import re

with open('docs/ppt/index.html', 'r') as f:
    content = f.read()

# Find the old deployment details slide
pattern = r"(<!-- ====== NEW SLIDE: DEPLOYMENT DETAILS ====== -->.*?)</section>"
match = re.search(pattern, content, re.DOTALL)
if not match:
    print("Could not find Deployment slide")
    exit(1)

old_slide = match.group(0)

new_slide = """      <!-- ====== NEW SLIDE: DEPLOYMENT DETAILS ====== -->
      <section data-background-color="#0a0000">
        <h2 class="slide-heading">Deployment Details</h2>
        
        <div class="arch-canvas" style="max-width: 900px; justify-content: center; align-items: center; min-height: 450px; flex-direction: column; gap: 30px; position: relative;">
          
          <div class="arch-row" style="width: 100%; justify-content: center;">
            <div class="arch-box arch-b-blue fragment fade-down" data-fragment-index="1" id="dep-public" style="width: 180px; z-index: 10;">
              <span class="arch-box-title">Public Internet</span>
              <span class="arch-box-desc">Global access via URL</span>
            </div>
          </div>
          
          <div class="arch-row" style="width: 100%; justify-content: center;">
            <div class="arch-box arch-b-green fragment fade-down" data-fragment-index="2" id="dep-ngrok" style="width: 220px; z-index: 10;">
              <span class="arch-box-title">Ngrok Tunnel</span>
              <span class="arch-box-desc">Securely bypasses IITK Firewall</span>
            </div>
          </div>

          <div class="arch-docker-boundary fragment fade-in" data-fragment-index="3" style="width: 100%; max-width: 700px; display: flex; flex-direction: column; align-items: center; padding: 20px;">
            <span class="arch-docker-label">IITK Server (Primary Node)</span>
            
            <div class="arch-row" style="margin-top: 15px; width: 100%; justify-content: center;">
              <div class="arch-box arch-b-amber" id="dep-nginx" style="width: 280px; z-index: 10;">
                <span class="arch-box-tag">:80</span>
                <span class="arch-box-title">Nginx Reverse Proxy</span>
                <span class="arch-box-desc">Routes to internal containers</span>
              </div>
            </div>

            <div class="arch-row" style="margin-top: 35px; gap: 20px; width: 100%; justify-content: center;">
              <div class="arch-box arch-b-red" id="dep-django" style="width: 150px; z-index: 10;">
                <span class="arch-box-title">Django API</span>
              </div>
              <div class="arch-box arch-b-blue" id="dep-front" style="width: 150px; z-index: 10;">
                <span class="arch-box-title">React PWA</span>
              </div>
              <div class="arch-box arch-b-purple" id="dep-data" style="width: 150px; z-index: 10;">
                <span class="arch-box-title">Data Layer</span>
                <span class="arch-box-desc">Postgres & Redis</span>
              </div>
            </div>
          </div>

          <div class="fragment fade-up" data-fragment-index="4" style="font-size: 0.65em; color: #a0a0a0; max-width: 750px; text-align: center; margin-top: 5px; padding: 15px; border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px;">
            <span style="color: #ffd43b; font-weight: bold;">Note:</span> The <code>deployment_v4</code> codebase contains Nginx configs for a multiservice load-balanced architecture (Render/Koyeb). We bypassed this and deployed entirely on the IITK server for stability.
          </div>

          <svg class="arch-svg-overlay" id="depArrowsSvg" style="z-index: 5; pointer-events: none;"></svg>
        </div>

        <script>
          (function() {
            function drawDepArrows() {
              var svg = document.getElementById('depArrowsSvg');
              if (!svg) return;
              var canvas = svg.closest('.arch-canvas');
              if (!canvas) return;
              var cr = canvas.getBoundingClientRect();
              svg.innerHTML = '';
              
              var arrs = [
                {from: 'dep-public', to: 'dep-ngrok', color: '#4a9eff', side: 'bottom-top'},
                {from: 'dep-ngrok', to: 'dep-nginx', color: '#34d399', side: 'bottom-top'},
                {from: 'dep-nginx', to: 'dep-django', color: '#f59e0b', side: 'bottom-top'},
                {from: 'dep-nginx', to: 'dep-front', color: '#f59e0b', side: 'bottom-top'},
                {from: 'dep-nginx', to: 'dep-data', color: '#f59e0b', side: 'bottom-top'}
              ];
              
              arrs.forEach(function(a) {
                var f = document.getElementById(a.from);
                var t = document.getElementById(a.to);
                if(!f || !t || f.offsetParent === null || t.offsetParent === null) return;
                
                var fr = f.getBoundingClientRect();
                var tr = t.getBoundingClientRect();
                var x1 = (fr.left + fr.width/2) - cr.left;
                var y1 = fr.bottom - cr.top;
                var x2 = (tr.left + tr.width/2) - cr.left;
                var y2 = tr.top - cr.top;
                
                var curY = Math.max(Math.abs(y2 - y1) / 2, Math.abs(x2 - x1) / 2);
                if (Math.abs(x2 - x1) < 20) curY = Math.max(curY, 20);
                
                var d = 'M' + x1 + ',' + y1 + ' C' + x1 + ',' + (y1 + curY) + ' ' + x2 + ',' + (y2 - curY) + ' ' + x2 + ',' + y2;
                
                var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', d);
                path.setAttribute('stroke', a.color);
                path.setAttribute('stroke-width', '2');
                path.setAttribute('stroke-dasharray', '6,4');
                path.setAttribute('fill', 'none');
                path.setAttribute('opacity', '0.65');
                svg.appendChild(path);
                
                var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                arrow.setAttribute('points', x2 + ',' + y2 + ' ' + (x2 - 6) + ',' + (y2 - 8) + ' ' + (x2 + 6) + ',' + (y2 - 8));
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

content = content.replace(old_slide, new_slide)

with open('docs/ppt/index.html', 'w') as f:
    f.write(content)

print("Replaced deployment slide.")
