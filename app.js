(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
  let tool = 'brush', drawing = false, start, previous, base, pointerId;
  let history = [], index = -1;
  const palette = ['#1f2937','#64748b','#ffffff','#ef4444','#f97316','#facc15','#22c55e','#14b8a6','#2563eb','#7c3aed','#ec4899','#fda4af','#92400e','#fbbf24','#86efac','#93c5fd'];
  const snapshot = () => ctx.getImageData(0, 0, canvas.width, canvas.height);
  function buttons() { $('undo').disabled = index <= 0; $('redo').disabled = index >= history.length - 1; }
  function record() { history = history.slice(0, index + 1); history.push(snapshot()); if (history.length > 31) history.shift(); index = history.length - 1; buttons(); }
  function status(message) { $('status').textContent = message; }
  function blank() { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  function select(name) { tool = name; document.querySelectorAll('[data-tool]').forEach(b => { const selected = b.dataset.tool === name; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', selected); }); }
  function syncColor() { document.querySelectorAll('.swatch').forEach(b => {const selected = b.dataset.color === $('color').value; b.classList.toggle('active', selected); b.setAttribute('aria-pressed', selected);}); }
  palette.forEach(color => { const b = document.createElement('button'); b.className = 'swatch'; b.style.background = color; b.dataset.color = color; b.setAttribute('aria-label', `颜色 ${color}`); b.onclick = () => { $('color').value = color; syncColor(); }; $('palette').append(b); });
  $('color').oninput = syncColor; syncColor();
  document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => select(b.dataset.tool));
  $('size').oninput = () => $('size-value').value = `${$('size').value} px`;
  function point(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX-r.left)*canvas.width/r.width, y: (e.clientY-r.top)*canvas.height/r.height }; }
  function configure() { ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : $('color').value; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = Number($('size').value); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  function stroke(a,b) { configure(); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  function shape(p) { ctx.putImageData(base,0,0); configure(); ctx.beginPath(); if (tool === 'line') { ctx.moveTo(start.x,start.y); ctx.lineTo(p.x,p.y); } else if (tool === 'rectangle') { ctx.rect(start.x,start.y,p.x-start.x,p.y-start.y); } else { ctx.ellipse((start.x+p.x)/2,(start.y+p.y)/2,Math.abs(p.x-start.x)/2,Math.abs(p.y-start.y)/2,0,0,Math.PI*2); } if ($('fill').checked && tool !== 'line') ctx.fill(); else ctx.stroke(); }
  canvas.onpointerdown = e => { if (drawing || e.button !== 0) return; e.preventDefault(); drawing = true; pointerId = e.pointerId; canvas.setPointerCapture(pointerId); start = previous = point(e); base = snapshot(); if (tool === 'brush' || tool === 'eraser') { configure(); ctx.beginPath(); ctx.arc(start.x,start.y,ctx.lineWidth/2,0,Math.PI*2); ctx.fill(); } };
  canvas.onpointermove = e => { const p = point(e); $('position').textContent = `${Math.round(p.x)}, ${Math.round(p.y)} px`; if (!drawing || e.pointerId !== pointerId) return; if (tool === 'brush' || tool === 'eraser') stroke(previous,p); else shape(p); previous = p; };
  function finish(e) { if (!drawing || e.pointerId !== pointerId) return; if (e.type === 'pointercancel') ctx.putImageData(base,0,0); else { const p = point(e); if (tool === 'brush' || tool === 'eraser') stroke(previous,p); else shape(p); record(); status('已绘制 · 可撤销'); } drawing = false; if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId); }
  canvas.onpointerup = finish; canvas.onpointercancel = finish;
  function restore(delta) { if (drawing) return; const next = index + delta; if (next < 0 || next >= history.length) return; index = next; ctx.putImageData(history[index],0,0); buttons(); status(delta < 0 ? '已撤销' : '已重做'); }
  $('undo').onclick = () => restore(-1); $('redo').onclick = () => restore(1);
  $('clear').onclick = () => { if (!drawing && confirm('清空整个画布？清空后仍可撤销。')) { blank(); record(); status('已清空画布'); } };
  $('save').onclick = () => { if (drawing) return; canvas.toBlob(blob => { if (!blob) { status('保存失败，请重试'); return; } const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = '我的画作.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); status('已导出 PNG'); }, 'image/png'); };
  $('import').onclick = () => { if (!drawing) $('file').click(); };
  $('file').onchange = () => { const file = $('file').files[0]; if (!file) return; const url = URL.createObjectURL(file), img = new Image(); img.onload = () => { if (drawing) { status('请结束绘图后重新打开图片'); } else { blank(); const scale = Math.min(canvas.width/img.naturalWidth,canvas.height/img.naturalHeight); const w=img.naturalWidth*scale,h=img.naturalHeight*scale; ctx.drawImage(img,(canvas.width-w)/2,(canvas.height-h)/2,w,h); record(); document.querySelector('.filename').textContent = file.name; status('图片已打开 · 可撤销'); } URL.revokeObjectURL(url); $('file').value = ''; }; img.onerror = () => { status('无法打开此图片，请选择有效的图片文件'); URL.revokeObjectURL(url); $('file').value = ''; }; img.src = url; };
  document.addEventListener('keydown', e => { if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return; const key = e.key.toLowerCase(); if (e.ctrlKey || e.metaKey) { if (key === 'z') { e.preventDefault(); restore(e.shiftKey ? 1 : -1); } if (key === 'y') { e.preventDefault(); restore(1); } if (key === 's') { e.preventDefault(); $('save').click(); } return; } const shortcuts = { b:'brush',e:'eraser',l:'line',r:'rectangle',o:'ellipse' }; if (shortcuts[key] && !drawing) select(shortcuts[key]); });
  blank(); record();
})();
