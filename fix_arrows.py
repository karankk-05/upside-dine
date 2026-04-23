import re

with open('docs/ppt/index.html', 'r') as f:
    content = f.read()

# 1. Remove the inline script from the Deployment Details slide
script_pattern = r"(<script>\s*\(function\(\)\s*\{\s*function drawDepArrows\(\) \{.*?\n\s*\}\)\(\);\s*</script>)"
match = re.search(script_pattern, content, re.DOTALL)
if match:
    content = content.replace(match.group(1), "")
else:
    print("Could not find inline script")

# 2. Add the function to the bottom script block
# Find the end of the bottom script block
bottom_pattern = r"(\s*Reveal\.on\('fragmentshown', function \(\) \{ setTimeout\(refreshArchArrows, 400\); \}\);)"

dep_arrows_script = """
      function drawDepArrows() {
        var svg = document.getElementById('depArrowsSvg');
        if (!svg) return;
        var canvas = svg.closest('.eco-layout');
        if (!canvas) return;
        var cr = canvas.getBoundingClientRect();
        svg.innerHTML = '';
        
        var scale = Reveal.getScale() || 1;
        
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
            x1 = ((fr.left + fr.width/2) - cr.left) / scale;
            y1 = (fr.bottom - cr.top) / scale;
            x2 = ((tr.left + tr.width/2) - cr.left) / scale;
            y2 = (tr.top - cr.top) / scale;
            var curY = Math.max(Math.abs(y2 - y1) / 2, Math.abs(x2 - x1) / 2);
            if (Math.abs(x2 - x1) < 20) curY = Math.max(curY, 20);
            d = 'M' + x1 + ',' + y1 + ' C' + x1 + ',' + (y1 + curY) + ' ' + x2 + ',' + (y2 - curY) + ' ' + x2 + ',' + y2;
          } else {
            x1 = (fr.right - cr.left) / scale;
            y1 = ((fr.top + fr.height/2) - cr.top) / scale;
            x2 = (tr.left - cr.left) / scale;
            y2 = ((tr.top + tr.height/2) - cr.top) / scale;
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

"""

events = """      Reveal.on('fragmentshown', function () { setTimeout(drawDepArrows, 400); });
      Reveal.on('fragmenthidden', function () { setTimeout(drawDepArrows, 400); });
      Reveal.on('slidechanged', function () { setTimeout(drawDepArrows, 500); });
      window.addEventListener('resize', function () { setTimeout(drawDepArrows, 200); });
      setTimeout(drawDepArrows, 1000);
"""

if match:
    # insert the function before the events
    content = content.replace(bottom_pattern, dep_arrows_script + bottom_pattern + events)
else:
    print("Could not replace bottom pattern")

with open('docs/ppt/index.html', 'w') as f:
    f.write(content)

print("Arrows fixed.")
