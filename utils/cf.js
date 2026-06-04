/* ══════════════════════════════════════════════════════
  CERTIFICATES PAGE JAVASCRIPT
══════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════
   SIGNATURE PADS — coordinate stroke storage
   getStrokes() returns [[{x,y},...], ...] for DB storage
══════════════════════════════════════════════════════ */
function _makeSigPad(canvasId, checkboxId, storageKey) {
    var canvas = null, ctx = null;
    var strokes = [], current = [], drawing = false, loaded = false;

    function color() {
        return getComputedStyle(document.documentElement)
               .getPropertyValue('--text-main').trim() || '#E4E4E8';
    }
    function redraw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = color(); ctx.lineWidth = 2;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        strokes.forEach(function(s) {
            if (s.length < 2) return;
            ctx.beginPath(); ctx.moveTo(s[0].x, s[0].y);
            for (var i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
            ctx.stroke();
        });
    }
    function pt(e) {
        var r = canvas.getBoundingClientRect();
        return {
            x: Math.round(((e.clientX - r.left) * (canvas.width  / r.width))  * 10) / 10,
            y: Math.round(((e.clientY - r.top)  * (canvas.height / r.height)) * 10) / 10
        };
    }
    function stop() {
        if (!drawing) return;
        drawing = false;
        if (current.length) strokes.push(current.slice());
        current = []; canvas.classList.remove('active');
    }
    return {
        init: function() {
            canvas = document.getElementById(canvasId);
            if (!canvas) return;
            canvas.width  = canvas.offsetWidth  || 500;
            canvas.height = canvas.offsetHeight || 140;
            ctx = canvas.getContext('2d');
            if (!loaded) {
                loaded = true;
                var saved = localStorage.getItem(storageKey);
                if (saved) { try { strokes = JSON.parse(saved); redraw(); } catch(e) {} }
            } else { redraw(); }
            if (canvas._sigBound) return;
            canvas._sigBound = true;
            canvas.addEventListener('mousedown', function(e) {
                drawing = true; current = [pt(e)]; canvas.classList.add('active');
            });
            canvas.addEventListener('mousemove', function(e) {
                if (!drawing) return;
                var p = pt(e); current.push(p);
                if (current.length >= 2) {
                    ctx.strokeStyle = color(); ctx.lineWidth = 2;
                    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                    ctx.beginPath();
                    ctx.moveTo(current[current.length-2].x, current[current.length-2].y);
                    ctx.lineTo(p.x, p.y); ctx.stroke();
                }
            });
            canvas.addEventListener('mouseup', stop);
            canvas.addEventListener('mouseleave', stop);
            canvas.addEventListener('touchstart', function(e) {
                e.preventDefault(); drawing = true; current = [pt(e.touches[0])];
                canvas.classList.add('active');
            }, { passive: false });
            canvas.addEventListener('touchmove', function(e) {
                e.preventDefault(); if (!drawing) return;
                var p = pt(e.touches[0]); current.push(p);
                if (current.length >= 2) {
                    ctx.strokeStyle = color(); ctx.lineWidth = 2;
                    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                    ctx.beginPath();
                    ctx.moveTo(current[current.length-2].x, current[current.length-2].y);
                    ctx.lineTo(p.x, p.y); ctx.stroke();
                }
            }, { passive: false });
            canvas.addEventListener('touchend', stop);
        },
        clear: function() {
            strokes = []; current = [];
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        getStrokes:    function() { return strokes.length ? strokes : null; },
        getDataUrl:    function() { return (strokes.length && canvas) ? canvas.toDataURL('image/png') : null; },
        saveIfChecked: function() {
            var cb = document.getElementById(checkboxId);
            if (cb && cb.checked && strokes.length)
                localStorage.setItem(storageKey, JSON.stringify(strokes));
        },
        /* Load strokes from DB data — called after init() when resuming a draft */
        loadStrokes: function(data) {
            if (!data) return;
            try {
                var parsed = typeof data === 'string' ? JSON.parse(data) : data;
                if (!Array.isArray(parsed) || !parsed.length) return;
                strokes = parsed;
                redraw();
            } catch(e) { console.warn('loadStrokes parse error:', e); }
        }
    };
}

var _certPad = _makeSigPad('cert-sig-canvas', 'save_signature',      'orro-sig-create');
var _efPad   = _makeSigPad('ef-sig-canvas',   'save_signature_edit', 'orro-sig-edit');

window.certSigInit          = function() { _certPad.init(); };
window.certSigClear         = function() { _certPad.clear(); };
window.certSigGetStrokes    = function() { return _certPad.getStrokes(); };
window.certSigGetDataUrl    = function() { return _certPad.getDataUrl(); };
window.certSigSaveIfChecked = function() { _certPad.saveIfChecked(); };
window.certSigLoadStrokes   = function(data) { _certPad.loadStrokes(data); };

window.efSigInit            = function() { _efPad.init(); };
window.efSigClear           = function() { _efPad.clear(); };
window.efSigGetStrokes      = function() { return _efPad.getStrokes(); };
window.efSigGetDataUrl      = function() { return _efPad.getDataUrl(); };
window.efSigSaveIfChecked   = function() { _efPad.saveIfChecked(); };
window.efSigLoadStrokes     = function(data) { _efPad.loadStrokes(data); };

/* ── Modal open/close ── */
function clearCertForm() {
    /* Reset text/textarea fields */
    ['cf-artwork-name','cf-artist-name','cf-description','cf-release-date','cf-genre'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) { el.value = ''; el.dispatchEvent(new Event('input')); }
    });
    /* Reset selects to their correct default values */
    var selectDefaults = { 'cf-category': 'digital', 'cf-format': 'pdf', 'cf-status': 'minted' };
    for (var sel in selectDefaults) {
        var selEl = document.getElementById(sel);
        if (!selEl) continue;
        for (var o = 0; o < selEl.options.length; o++) {
            if (selEl.options[o].value === selectDefaults[sel]) { selEl.selectedIndex = o; break; }
        }
    }
    /* Reset checkboxes — use .checked not .value */
    ['cf-agree-to-terms','cf-save-signature'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.checked = false;
    });
    /* Reset radio buttons to default */
    var radios = document.querySelectorAll('input[name="cf-type"]');
    radios.forEach(function(r) { r.checked = (r.value === 'standard'); });
    /* Private toggle */
    var track = document.getElementById('cf-private');
    var label = document.getElementById('cf-private-label');
    if (track) { track.classList.remove('on'); if (label) label.textContent = 'Public'; }
    /* Tags */
    _cfTags = [];
    if (typeof cfRenderTags === 'function') cfRenderTags();
    var hashInput = document.getElementById('cf-hashtag');
    if (hashInput) hashInput.value = '';
    /* Signature pad */
    if (window.certSigClear) certSigClear();
    window._resumingDbId = null;
}

function openCertModal(skipClear) {
    if (!skipClear) clearCertForm();
    document.getElementById('cf-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function() { if (window.certSigInit) window.certSigInit(); });
}
function closeCertModal() {
    document.getElementById('cf-backdrop').classList.remove('open');
    document.body.style.overflow = '';
}
function cfBackdropClick(e) {
    if (e.target === document.getElementById('cf-backdrop')) closeCertModal();
}
function openEditModal() {
    document.getElementById('ef-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function() { if (window.efSigInit) window.efSigInit(); });
}
function closeEditModal() {
    document.getElementById('ef-backdrop').classList.remove('open');
    document.body.style.overflow = '';
}
function efBackdropClick(e) {
    if (e.target === document.getElementById('ef-backdrop')) closeEditModal();
}
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { closeCertModal(); closeEditModal(); }
});

/* ── Drafts panel ── */
function draftCheckboxClick(e, item) {
    e.stopPropagation();
    item.classList.toggle('selected');
    var btn = document.getElementById('drafts-delete-btn');
    if (!btn) return;
    var anySelected = document.querySelectorAll('#drafts-list .draft-item.selected').length > 0;
    btn.disabled = !anySelected;
}

function draftsDelete() {
    var selected = document.querySelectorAll('#drafts-list .draft-item.selected');
    if (!selected.length) return;
    for (var i = 0; i < selected.length; i++) selected[i].remove();
    document.getElementById('drafts-delete-btn').disabled = true;
}

/* ── Render drafts list from array ── */
function renderDrafts(drafts) {
    var list = document.getElementById('drafts-list');
    if (!list) return;
    list.innerHTML = '';
    var btn = document.getElementById('drafts-delete-btn');
    if (btn) btn.disabled = true;

    if (!drafts || !drafts.length) {
        var empty = document.createElement('div');
        empty.style.cssText = 'padding:0.75rem 0.25rem;font-size:0.75rem;color:var(--text-dim);opacity:0.5;';
        empty.textContent = 'No drafts yet.';
        list.appendChild(empty);
        return;
    }

    var tick = '<svg class="draft-checkbox-tick" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5 5 4 7.5 8.5 2"/></svg>';

    for (var i = 0; i < drafts.length; i++) {
        var d = drafts[i];
        var item = document.createElement('div');
        item.className = 'draft-item';
        item.setAttribute('onclick', 'openCertModal()');
        item.innerHTML =
            '<div class="draft-checkbox" onclick="draftCheckboxClick(event, this.closest(\'.draft-item\'))">' + tick + '</div>' +
            '<div class="draft-icfo">' +
                '<span class="draft-name">' + d.name + '</span>' +
                '<span class="draft-date">' + d.date + '<br>' + d.time + '</span>' +
                '<div class="draft-image"></div>' +
/*                '<span class="draft-image"><img class="draft-thumb" width="75" height="45" src="' + (d.thumb || '') + '" alt=""></span>' + */
            '</div>';
        list.appendChild(item);
    }
}

/* ── Load a project — build frags + timeline + drafts ── */
function loadProject(projectKey) {
    var data = PROJECT_DATA[projectKey];

    if (!projectKey || !data) {
        /* "Select a project..." chosen — clear everything */
        if (window.reloadCarousel) window.reloadCarousel([]);
        if (window.reloadTimeline) window.reloadTimeline([]);
        renderDrafts([]);
        return;
    }

    /* Build FRAGS array from status strings */
    var fragObjs = data.frags.map(function(s, i) { return { id: i + 1, status: s }; });

    if (window.reloadCarousel) window.reloadCarousel(fragObjs);
    if (window.reloadTimeline) window.reloadTimeline(fragObjs);
    renderDrafts(data.drafts);
}

document.addEventListener('DOMContentLoaded', function() {
    renderDrafts([]); /* start with empty drafts panel */
});

/* ── Certificate visibility toggle ── */
function certTogglePrivate() {
    var track = document.getElementById('cf-private');
    var label = document.getElementById('cf-private-label');
    if (!track) return;
    var on = track.classList.toggle('on');
    if (label) label.textContent = on ? 'Private' : 'Public';
}
function certEditTogglePrivate() {
    var track = document.getElementById('ef-private');
    var label = document.getElementById('ef-private-label');
    if (!track) return;
    var on = track.classList.toggle('on');
    if (label) label.textContent = on ? 'Private' : 'Public';
}

async function cfMountDrive() {
    console.log('[cfMount] button clicked');
    if (!window.showDirectoryPicker) {
        alert('Your browser does not support the File System Access API.\nPlease use Chrome or Edge.');
        return;
    }
    try {
        console.log('[cfMount] calling showDirectoryPicker...');
        var dirHandle = await window.showDirectoryPicker({ mode: 'read' });
        console.log('[cfMount] folder selected:', dirHandle.name);

        var label = document.getElementById('cf-mount-label');
        if (label) label.textContent = dirHandle.name;
        else console.warn('[cfMount] cf-mount-label not found');

        /* Remove any previously mounted local section */
        var prev = document.getElementById('cf-local-section');
        if (prev) prev.remove();

        var tree = document.getElementById('cf-fb-tree');
        console.log('[cfMount] cf-fb-tree:', tree);
        if (!tree) { console.error('[cfMount] cf-fb-tree not found — aborting'); return; }

        /* Collect image files using iter.next() */
        var imageExts = /\.(jpe?g|png|webp|gif|avif|bmp|tiff?)$/i;
        var mountedFiles = {};
        var fileNames = [];

        console.log('[cfMount] starting file iteration...');
        var iter = dirHandle.values();
        var next = await iter.next();
        var totalEntries = 0;
        while (!next.done) {
            var entry = next.value;
            totalEntries++;
            console.log('[cfMount] entry:', entry.kind, entry.name);
            if (entry.kind === 'file' && imageExts.test(entry.name)) {
                try {
                    var file = await entry.getFile();
                    mountedFiles[entry.name] = file;
                    fileNames.push(entry.name);
                    console.log('[cfMount] image found:', entry.name, file.size);
                } catch(e) {
                    console.warn('[cfMount] getFile failed for:', entry.name, e);
                }
            }
            next = await iter.next();
        }
        console.log('[cfMount] iteration done. total entries:', totalEntries, '| images:', fileNames.length);
        fileNames.sort();

        var section = document.createElement('div');
        section.id = 'cf-local-section';

        var sep = document.createElement('div');
        sep.style.cssText = 'height:1px;background:var(--border-subtle);margin:0.25rem 0;';
        section.appendChild(sep);

        if (!fileNames.length) {
            console.warn('[cfMount] no images found in folder');
            var empty = document.createElement('div');
            empty.className = 'cf-fb-row';
            empty.style.cssText = 'color:var(--text-dim);opacity:0.5;font-style:italic;cursor:default;padding-left:0.75rem;';
            empty.textContent = 'No images found in ' + dirHandle.name;
            section.appendChild(empty);
            tree.appendChild(section);
            return;
        }

        var FILE_SVG      = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/></svg>';
        var FOLDER_CLOSED = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/></svg>';
        var FOLDER_OPEN   = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M.513 1.513A1.75 1.75 0 0 1 1.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1H13a1 1 0 0 1 1 1v.5H2.75a.75.75 0 0 0 0 1.5h11.978a1 1 0 0 1 .994 1.117L15 13.25A1.75 1.75 0 0 1 13.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75c0-.464.184-.91.513-1.237Z"/></svg>';
        var CHEV_RIGHT    = '<svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor"><path d="M4.7 10c-.2 0-.4-.1-.5-.2-.3-.3-.3-.8 0-1.1L6.9 6 4.2 3.3c-.3-.3-.3-.8 0-1.1.3-.3.8-.3 1.1 0l3.3 3.2c.3.3.3.8 0 1.1L5.3 9.7c-.2.2-.4.3-.6.3Z"/></svg>';
        var CHEV_DOWN     = '<svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor"><path d="M6 8.825c-.2 0-.4-.1-.5-.2l-3.3-3.3c-.3-.3-.3-.8 0-1.1.3-.3.8-.3 1.1 0l2.7 2.7 2.7-2.7c.3-.3.8-.3 1.1 0 .3.3.3.8 0 1.1l-3.2 3.2c-.2.2-.4.3-.6.3Z"/></svg>';

        var folderRow = document.createElement('div');
        folderRow.className = 'cf-fb-row';
        folderRow.style.cursor = 'pointer';
        folderRow.innerHTML =
            '<span class="cf-fb-chevron">' + CHEV_RIGHT + '</span>' +
            '<span class="cf-fb-chevron-down" style="display:none">' + CHEV_DOWN + '</span>' +
            '<span class="cf-fb-icon">' + FOLDER_CLOSED + '</span>' +
            '<span class="cf-fb-name">' + dirHandle.name + '</span>' +
            '<span style="font-size:0.6875rem;color:var(--text-dim);margin-left:auto;padding-right:0.25rem;">' + fileNames.length + '</span>';

        var childrenDiv = document.createElement('div');
        childrenDiv.className = 'cf-fb-children';
        childrenDiv.style.display = 'none';

        folderRow.addEventListener('click', function() {
            var open = childrenDiv.style.display === 'none';
            childrenDiv.style.display = open ? 'block' : 'none';
            folderRow.querySelector('.cf-fb-chevron').style.display      = open ? 'none' : '';
            folderRow.querySelector('.cf-fb-chevron-down').style.display = open ? '' : 'none';
            folderRow.querySelector('.cf-fb-icon').innerHTML = open ? FOLDER_OPEN : FOLDER_CLOSED;
        });
        section.appendChild(folderRow);

        fileNames.forEach(function(name) {
            var row = document.createElement('div');
            row.className = 'cf-fb-row depth-1';
            row.style.cursor = 'pointer';
            row.innerHTML = '<span class="cf-fb-icon">' + FILE_SVG + '</span><span class="cf-fb-name">' + name + '</span>';
            row.addEventListener('click', (function(n) {
                return function() {
                    var rows = tree.querySelectorAll('.cf-fb-row');
                    for (var i = 0; i < rows.length; i++) rows[i].classList.remove('cf-selected');
                    row.classList.add('cf-selected');
                    var f = mountedFiles[n];
                    console.log('[cfMount] file clicked:', n, f);
                    if (f && window.cfLoadImgFile) window.cfLoadImgFile(f);
                    else console.warn('[cfMount] cfLoadImgFile missing or no file');
                };
            })(name));
            childrenDiv.appendChild(row);
        });

        section.appendChild(childrenDiv);
        tree.appendChild(section);
        console.log('[cfMount] section appended. fileNames:', fileNames);

    } catch (err) {
        if (err.name !== 'AbortError') console.error('[cfMount] ERROR:', err);
        else console.log('[cfMount] user cancelled picker');
    }
}

async function efMountDrive() {
    console.log('[efMount] button clicked');
    if (!window.showDirectoryPicker) {
        alert('Your browser does not support the File System Access API.\nPlease use Chrome or Edge.');
        return;
    }
    try {
        console.log('[efMount] calling showDirectoryPicker...');
        var dirHandle = await window.showDirectoryPicker({ mode: 'read' });
        console.log('[efMount] folder selected:', dirHandle.name);

        var label = document.getElementById('ef-mount-label');
        if (label) label.textContent = dirHandle.name;
        else console.warn('[efMount] ef-mount-label not found');

        var prev = document.getElementById('ef-local-section');
        if (prev) { prev.remove(); console.log('[efMount] removed previous section'); }

        var tree = document.getElementById('ef-fb-tree');
        console.log('[efMount] ef-fb-tree:', tree);
        if (!tree) { console.error('[efMount] ef-fb-tree not found — aborting'); return; }

        var imageExts = /\.(jpe?g|png|webp|gif|avif|bmp|tiff?)$/i;
        var mountedFiles = {};
        var fileNames = [];

        console.log('[efMount] starting file iteration...');
        var iter = dirHandle.values();
        var next = await iter.next();
        var totalEntries = 0;
        while (!next.done) {
            var entry = next.value;
            totalEntries++;
            console.log('[efMount] entry:', entry.kind, entry.name);
            if (entry.kind === 'file' && imageExts.test(entry.name)) {
                try {
                    var file = await entry.getFile();
                    mountedFiles[entry.name] = file;
                    fileNames.push(entry.name);
                    console.log('[efMount] image found:', entry.name, file.size);
                } catch(e) {
                    console.warn('[efMount] getFile failed for:', entry.name, e);
                }
            }
            next = await iter.next();
        }
        console.log('[efMount] iteration done. total entries:', totalEntries, '| images:', fileNames.length);
        fileNames.sort();

        var section = document.createElement('div');
        section.id = 'ef-local-section';

        var sep = document.createElement('div');
        sep.style.cssText = 'height:1px;background:var(--border-subtle);margin:0.25rem 0;';
        section.appendChild(sep);

        if (!fileNames.length) {
            console.warn('[efMount] no images found in folder');
            var empty = document.createElement('div');
            empty.className = 'cf-fb-row';
            empty.style.cssText = 'color:var(--text-dim);opacity:0.5;font-style:italic;cursor:default;padding-left:0.75rem;';
            empty.textContent = 'No images found in ' + dirHandle.name;
            section.appendChild(empty);
            tree.appendChild(section);
            return;
        }

        var FILE_SVG      = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/></svg>';
        var FOLDER_CLOSED = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/></svg>';
        var FOLDER_OPEN   = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M.513 1.513A1.75 1.75 0 0 1 1.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1H13a1 1 0 0 1 1 1v.5H2.75a.75.75 0 0 0 0 1.5h11.978a1 1 0 0 1 .994 1.117L15 13.25A1.75 1.75 0 0 1 13.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75c0-.464.184-.91.513-1.237Z"/></svg>';
        var CHEV_RIGHT    = '<svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor"><path d="M4.7 10c-.2 0-.4-.1-.5-.2-.3-.3-.3-.8 0-1.1L6.9 6 4.2 3.3c-.3-.3-.3-.8 0-1.1.3-.3.8-.3 1.1 0l3.3 3.2c.3.3.3.8 0 1.1L5.3 9.7c-.2.2-.4.3-.6.3Z"/></svg>';
        var CHEV_DOWN     = '<svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor"><path d="M6 8.825c-.2 0-.4-.1-.5-.2l-3.3-3.3c-.3-.3-.3-.8 0-1.1.3-.3.8-.3 1.1 0l2.7 2.7 2.7-2.7c.3-.3.8-.3 1.1 0 .3.3.3.8 0 1.1l-3.2 3.2c-.2.2-.4.3-.6.3Z"/></svg>';

        var folderRow = document.createElement('div');
        folderRow.className = 'cf-fb-row';
        folderRow.style.cursor = 'pointer';
        folderRow.innerHTML =
            '<span class="cf-fb-chevron">' + CHEV_RIGHT + '</span>' +
            '<span class="cf-fb-chevron-down" style="display:none">' + CHEV_DOWN + '</span>' +
            '<span class="cf-fb-icon">' + FOLDER_CLOSED + '</span>' +
            '<span class="cf-fb-name">' + dirHandle.name + '</span>' +
            '<span style="font-size:0.6875rem;color:var(--text-dim);margin-left:auto;padding-right:0.25rem;">' + fileNames.length + '</span>';

        var childrenDiv = document.createElement('div');
        childrenDiv.className = 'cf-fb-children';
        childrenDiv.style.display = 'none';

        folderRow.addEventListener('click', function() {
            var open = childrenDiv.style.display === 'none';
            childrenDiv.style.display = open ? 'block' : 'none';
            folderRow.querySelector('.cf-fb-chevron').style.display      = open ? 'none' : '';
            folderRow.querySelector('.cf-fb-chevron-down').style.display = open ? '' : 'none';
            folderRow.querySelector('.cf-fb-icon').innerHTML = open ? FOLDER_OPEN : FOLDER_CLOSED;
        });
        section.appendChild(folderRow);

        fileNames.forEach(function(name) {
            var row = document.createElement('div');
            row.className = 'cf-fb-row depth-1';
            row.style.cursor = 'pointer';
            row.innerHTML = '<span class="cf-fb-icon">' + FILE_SVG + '</span><span class="cf-fb-name">' + name + '</span>';
            row.addEventListener('click', (function(n) {
                return function() {
                    var rows = tree.querySelectorAll('.cf-fb-row');
                    for (var i = 0; i < rows.length; i++) rows[i].classList.remove('cf-selected');
                    row.classList.add('cf-selected');
                    var f = mountedFiles[n];
                    console.log('[efMount] file clicked:', n, f);
                    if (f && window.efLoadImgFile) window.efLoadImgFile(f);
                    else console.warn('[efMount] efLoadImgFile missing or no file');
                };
            })(name));
            childrenDiv.appendChild(row);
        });

        section.appendChild(childrenDiv);
        tree.appendChild(section);
        console.log('[efMount] section appended to tree. fileNames:', fileNames);

    } catch (err) {
        if (err.name !== 'AbortError') console.error('[efMount] ERROR:', err);
        else console.log('[efMount] user cancelled picker');
    }
}

/* ══════════════════════════════════════════════════════
   CERTIFICATES — load from API, render cards + drafts
══════════════════════════════════════════════════════ */

var DL_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

/* ── Build one certificate card ── */
function buildCertCard(cert) {
    var isDraft   = cert.status === 'draft';
    var isPrivate = parseInt(cert.private) === 1;
    var thumbSrc  = cert.thumbnail_1 || cert.cover_image || '';
    var thumbHtml = thumbSrc
        ? '<img src="' + thumbSrc + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:4px;">'
        : '<div class="cert-thumb"></div>';

    /* Status badge — label map for display text */
    var statusLabels = {
        'draft':       'Work In Progress (Draft)',
        'minted':      'Minted (Active)',
        'disputed':    'Disputed (Under Review)',
        'revoked':     'Revoked (Null & Void)',
        'transferred': 'Transferred (Premium Only)',
        'burned':      'Burned (Premium Only)'
    };
    var statusKey   = (cert.status || 'draft').toLowerCase();
    var statusLabel = statusLabels[statusKey] || cert.status || 'Draft';
    var badge = '<span class="cert-status-badge ' + statusKey + '">' + statusLabel + '</span>';

    var visibility = isPrivate
        ? '<span class="red">Private</span>'
        : '<span class="green">Public</span>';

    var EDIT_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';

    var actions = isDraft
        ? '<button class="cert-download" onclick="certResumeDraft(\'' + cert.certificate_id + '\')" style="background:none;border:none;cursor:pointer;padding:0;">'
          + EDIT_SVG + ' Resume editing</button>'
        : '<button class="cert-download" onclick="certOpenEdit(window._certData.find(function(c){return c.certificate_id===\'' + cert.certificate_id + '\';}))" style="background:none;border:none;cursor:pointer;padding:0;">'
          + EDIT_SVG + ' Edit certificate</button>&nbsp;&nbsp;'
          + '<a href="#" class="cert-download">' + DL_SVG + 'Download certificate</a>&nbsp;';

    var card = document.createElement('div');
    card.className = 'cert-card';
    card.style.cursor = 'pointer';
    card.dataset.certId = cert.certificate_id;
    if (!isDraft) {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.cert-download')) return;
            certOpenEdit(cert);
        });
    }
    card.innerHTML =
        '<div class="cert-thumb-wrap"><div style="width:120px;height:80px;">' + thumbHtml + '</div></div>'
        + '<div class="cert-body">'
        +   badge
        +   '<div class="cert-title">' + (cert.name || '—') + '</div>'
        +   '<div class="cert-meta">'
        +     '<span class="cert-meta-row"><span class="cert-meta-label">Artist</span><span class="cert-meta-value">' + (cert.artist || '—') + '</span></span>'
        +     '<span class="cert-meta-row"><span class="cert-meta-label">Released</span><span class="cert-meta-value">' + (cert.release_date || '—') + '</span></span>'
        +     '<span class="cert-meta-row"><span class="cert-meta-label">Visibility</span><span class="cert-meta-value">' + visibility + '</span></span>'
        +     '<span class="cert-meta-row"><span class="cert-meta-label">Certificate ID</span><span class="cert-meta-value hex-key">' + (cert.certificate_id || '—') + '</span></span>'
        +     (cert.tx_id ? '<span class="cert-meta-row"><span class="cert-meta-label">Blockchain</span><span class="cert-meta-value hex-key">' + cert.tx_id + '</span></span>' : '')
        +   '</div>'
        +   '<div style="margin-top:0.5rem;">' + actions + '</div>'
        + '</div>';
    return card;
}

/* ── Build one draft row for the right panel ── */
function buildDraftRow(cert) {
    var tick = '<svg class="draft-checkbox-tick" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5 5 4 7.5 8.5 2"/></svg>';
    var item = document.createElement('div');
    item.className = 'draft-item';
    item.dataset.certId = cert.certificate_id;
    item.addEventListener('click', function() { certResumeDraft(cert.certificate_id); });
    item.innerHTML =
        '<div class="draft-checkbox" onclick="draftCheckboxClick(event, this.closest(\'.draft-item\'))">' + tick + '</div>'
        + '<div class="draft-info">'
        +   '<span class="draft-name">' + (cert.name || 'Draft') + '</span>'
        +   '<span class="draft-date">' + (cert.created_at || '').slice(0,10) + '</span>'
        +   '<div class="draft-image"></div>'
/*        +   '<span class="draft-image"><img class="draft-thumb" width="75" height="45" src="' + (cert.thumbnail_1 || '') + '" alt=""></span>' */
        + '</div>';
    return item;
}

/* ── Populate the page from the API response ── */
function renderCertificates(records) {
    var grid      = document.getElementById('centre-grid');
    var draftList = document.getElementById('drafts-list');
    var loading   = document.getElementById('cert-loading');

    if (loading)   loading.remove();
    if (grid)      grid.innerHTML      = '';
    if (draftList) draftList.innerHTML = '';

    if (!records || !records.length) {
        if (grid) {
            var empty = document.createElement('div');
            empty.style.cssText = 'padding:3rem;text-align:center;color:var(--text-dim);font-size:0.875rem;opacity:0.5;width:100%;';
            empty.textContent = 'No certificates yet. Click + Create to get started.';
            grid.appendChild(empty);
        }
        return;
    }

    var hasDrafts = false;
    records.forEach(function(cert) {
        /* Main grid card */
        if (grid) grid.appendChild(buildCertCard(cert));

        /* Draft panel row — only for status === 'draft' */
        if (cert.status === 'draft' && draftList) {
            draftList.appendChild(buildDraftRow(cert));
            hasDrafts = true;
        }
    });

    /* Enable delete button if there are drafts */
    var delBtn = document.getElementById('drafts-delete-btn');
    if (delBtn && !hasDrafts) delBtn.disabled = true;
}

/* ── Resume a draft — pre-populate the CREATE modal so user can continue ── */
function certResumeDraft(certId) {
    var cert = (window._certData || []).find(function(c) { return c.certificate_id === certId; });
    if (!cert) { openCertModal(); return; }

    /* Clear form first — this nulls _resumingDbId */
    clearCertForm();

    /* Now set the id AFTER the clear so it isn't wiped */
    window._resumingDbId = cert.id;

    openCertModal(true); /* true = skip the clear inside openCertModal */

    /* Populate after the modal is visible */
    requestAnimationFrame(function() {

        /* Text fields */
        var fields = {
            'cf-artwork-name': cert.name         || '',
            'cf-artist-name':  cert.artist       || '',
            'cf-release-date': cert.release_date || '',
            'cf-genre':        cert.genre        || '',
            'cf-description':  cert.description  || '',
        };
        for (var id in fields) {
            var el = document.getElementById(id);
            if (el) { el.value = fields[id]; el.dispatchEvent(new Event('input')); }
        }

        /* Category select */
        var categoryEl = document.getElementById('cf-category');
        if (categoryEl && cert.category) {
            var categoryVal = cert.category.toLowerCase();
            for (var i = 0; i < categoryEl.options.length; i++) {
                if (categoryEl.options[i].value === categoryVal) { categoryEl.selectedIndex = i; break; }
            }
        }

        /* Format select */
        var formatEl = document.getElementById('cf-format');
        if (formatEl && cert.format) {
            for (var j = 0; j < formatEl.options.length; j++) {
                if (formatEl.options[j].value === cert.format) { formatEl.selectedIndex = j; break; }
            }
        }

        /* Status select */
        var statusEl = document.getElementById('cf-status');
        if (statusEl && cert.status) {
            for (var k = 0; k < statusEl.options.length; k++) {
                if (statusEl.options[k].value === cert.status) { statusEl.selectedIndex = k; break; }
            }
        }

        /* Product type radio
        var productType = cert.product_type || 'standard';
        document.querySelectorAll('input[name="cf-type"]').forEach(function(r) {
            r.checked = (r.value === productType);
        }); */

        /* Type radio buttons */
        var type = (cert.type || 'standard').toLowerCase();
        var typeRadios = document.querySelectorAll('input[name="ef-type"]');
        typeRadios.forEach(function(r) { r.checked = (r.value === type); });

        /* Private toggle */
        var track = document.getElementById('cf-private');
        var label = document.getElementById('cf-private-label');
        if (track) {
            if (parseInt(cert.private) === 1) {
                track.classList.add('on');
                if (label) label.textContent = 'Private';
            } else {
                track.classList.remove('on');
                if (label) label.textContent = 'Public';
            }
        }

        /* Agree to terms */
        var agreeEl = document.getElementById('cf-agree-to-terms');
        if (agreeEl) agreeEl.checked = parseInt(cert.agree_to_terms) === 1;

        /* Save signature */
        var signatureEl = document.getElementById('cf-save-signature');
        if (signatureEl) signatureEl.checked = parseInt(cert.save_signature) === 1;

        /* Tags */
        _cfTags = [];
        if (cert.tags) {
            try {
                var parsed = typeof cert.tags === 'string' ? JSON.parse(cert.tags) : cert.tags;
                if (Array.isArray(parsed)) _cfTags = parsed;
            } catch(e) { _cfTags = []; }
        }
        if (typeof cfRenderTags === 'function') cfRenderTags();

        /* Signature — load from DB strokes, one extra frame after init */
        if (cert.signature_strokes && window.certSigLoadStrokes) {
            requestAnimationFrame(function() {
                certSigLoadStrokes(cert.signature_strokes);
            });
        }

    });
}

/* ── Open edit modal and pre-populate fields ── */
function certOpenEdit(cert) {
    if (!cert) return;
    window._currentCertId = cert.certificate_id;

    /* Text/textarea fields */
    var fields = {
        'ef-artist-name':  cert.artist       || '',
        'ef-artwork-name': cert.name         || '',
        'ef-release-date': cert.release_date || '',
        'ef-genre':        cert.genre        || '',
        'ef-description':  cert.description  || '',
    };
    for (var id in fields) {
        var el = document.getElementById(id);
        if (el) { el.value = fields[id]; el.dispatchEvent(new Event('input')); }
    }

    /* Category select */
    var categoryEl = document.getElementById('ef-category');
    if (categoryEl && cert.category) {
        var categoryVal = cert.category.toLowerCase();
        for (var i = 0; i < categoryEl.options.length; i++) {
            if (categoryEl.options[i].value === categoryVal) { categoryEl.selectedIndex = i; break; }
        }
    }

    /* Format select */
    var formatEl = document.getElementById('ef-format');
    if (formatEl && cert.format) {
        for (var j = 0; j < formatEl.options.length; j++) {
            if (formatEl.options[j].value === cert.format) { formatEl.selectedIndex = j; break; }
        }
    }

    /* Status select */
    var statusEl = document.getElementById('ef-status');
    if (statusEl && cert.status) {
        for (var j = 0; j < statusEl.options.length; j++) {
            if (statusEl.options[j].value === cert.status) { statusEl.selectedIndex = j; break; }
        }
    }

    /* Type radio buttons */
    var type = (cert.type || 'standard').toLowerCase();
    var typeRadios = document.querySelectorAll('input[name="ef-type"]');
    typeRadios.forEach(function(r) { r.checked = (r.value === type); });

    /* Tags */
    _efTags = [];
    if (cert.tags) {
        try {
            var parsed = typeof cert.tags === 'string' ? JSON.parse(cert.tags) : cert.tags;
            if (Array.isArray(parsed)) _efTags = parsed;
        } catch(e) { _efTags = []; }
    }
    if (typeof efRenderTags === 'function') efRenderTags();

    /* Agree to terms checkbox */
    var agreeEl = document.getElementById('ef-agree-to-terms');
    if (agreeEl) agreeEl.checked = parseInt(cert.agree_to_terms) === 1;

    /* Save signature checkbox */
    var signatureEl = document.getElementById('ef-save-signature');
    if (signatureEl) signatureEl.checked = parseInt(cert.save_signature) === 1;

    /* Private toggle */
    var track = document.getElementById('ef-private');
    var label = document.getElementById('ef-private-label');
    if (track) {
        if (parseInt(cert.private) === 1) {
            track.classList.add('on');
            if (label) label.textContent = 'Private';
        } else {
            track.classList.remove('on');
            if (label) label.textContent = 'Public';
        }
    }

    openEditModal();

    /* Load signature from DB strokes after the canvas is initialised */
    if (cert.signature_strokes && window.efSigLoadStrokes) {
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                efSigLoadStrokes(cert.signature_strokes);
            });
        });
    }
}
function loadCertificates() {
    fetch('http://localhost:3001/api/certificates?user_id=' + encodeURIComponent(CURRENT_USER))
        .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(function(data) {
            window._certData = data;
            renderCertificates(data);
        })
        .catch(function(err) {
            console.warn('[loadCertificates] API unavailable, using local fallback:', err.message);
            /* ── LOCAL FALLBACK — CSV data baked in for dev/testing ──
            var fallback = [
                {certificate_id:'cert_001',name:'GLITCH-STASIS',artist:'ORRO_Artist',release_date:'2026-08-15',status:'draft',private:0,category:'Generative',type:'Hybrid',genre:'Abstract',description:'Generative video loop',series_no:'001',thumbnail_1:'',cover_image:'',tx_id:'ih4shu5DBb8bN3EezWLRmDwDQmHnTdBULvu4LrPtgi8ySBuimLFYGZGKm4quTb8aUyuT9cpjKPqRVWsmR6Dr6fo',created_at:'2026-06-03 08:18:21'},
                {certificate_id:'cert_002',name:'SYNTH-CORE 01',artist:'ORRO_Artist',release_date:'2026-09-01',status:'draft',private:1,category:'Generative',type:'Hybrid',genre:'3D',description:'Base skeleton layer',series_no:'002',thumbnail_1:'',cover_image:'',tx_id:'ih4shu5DBb8bN3EezWLRmDwDQmHnTdBULvu4LrPtgi8ySBuimLFYGZGKm4quTb8aUyuT9cpjKPqRVWsmR6Dr6fo',created_at:'2026-06-03 08:18:21'},
                {certificate_id:'cert_003',name:'VOID-PROVENANCE',artist:'ORRO_Artist',release_date:'2026-10-10',status:'draft',private:1,category:'Generative',type:'Hybrid',genre:'Crypto',description:'Digital fingerprint',series_no:'003',thumbnail_1:'',cover_image:'',tx_id:'ih4shu5DBb8bN3EezWLRmDwDQmHnTdBULvu4LrPtgi8ySBuimLFYGZGKm4quTb8aUyuT9cpjKPqRVWsmR6Dr6fo',created_at:'2026-06-03 08:18:21'},
                {certificate_id:'cert_004',name:'HYBRID-FLUX',artist:'ORRO_Artist',release_date:'2026-11-20',status:'draft',private:0,category:'Generative',type:'Hybrid',genre:'Mixed',description:'Ink and pixel blend',series_no:'004',thumbnail_1:'',cover_image:'',tx_id:'ih4shu5DBb8bN3EezWLRmDwDQmHnTdBULvu4LrPtgi8ySBuimLFYGZGKm4quTb8aUyuT9cpjKPqRVWsmR6Dr6fo',created_at:'2026-06-03 08:18:21'},
                {certificate_id:'cert_005',name:'ECHO-MEMO',artist:'ORRO_Artist',release_date:'2027-01-05',status:'draft',private:0,category:'Generative',type:'Hybrid',genre:'Transaction',description:'Event transaction ID',series_no:'005',thumbnail_1:'',cover_image:'',tx_id:'',created_at:'2026-06-03 08:18:21'},
                {certificate_id:'cert_006',name:'ARTIFACT-SIGIL',artist:'ORRO_Artist',release_date:'2027-02-14',status:'draft',private:1,category:'Generative',type:'Hybrid',genre:'Symbol',description:'Cryptographic watermark',series_no:'006',thumbnail_1:'',cover_image:'',tx_id:'',created_at:'2026-06-03 08:18:21'},
                {certificate_id:'cert_007',name:'DATA-SAPIENS',artist:'ORRO_Artist',release_date:'2027-03-22',status:'draft',private:0,category:'Generative',type:'Hybrid',genre:'Portrait',description:'Biometric noise map',series_no:'007',thumbnail_1:'',cover_image:'',tx_id:'',created_at:'2026-06-03 08:18:21'},
                {certificate_id:'cert_008',name:'PROTOCOL-ALPHA',artist:'ORRO_Artist',release_date:'2027-04-30',status:'draft',private:1,category:'Generative',type:'Hybrid',genre:'Setup',description:'Initial script parameters',series_no:'008',thumbnail_1:'',cover_image:'',tx_id:'',created_at:'2026-06-03 08:18:21'},
                {certificate_id:'cert_009',name:'PSEUDO-REALM',artist:'ORRO_Artist',release_date:'2027-06-12',status:'draft',private:0,category:'Generative',type:'Hybrid',genre:'Landscape',description:'Hyper-real impossible space',series_no:'009',thumbnail_1:'',cover_image:'',tx_id:'',created_at:'2026-06-03 08:18:21'},
                {certificate_id:'cert_010',name:'TERMINUS-POINT',artist:'ORRO_Artist',release_date:'2027-08-01',status:'draft',private:0,category:'Generative',type:'Hybrid',genre:'Final',description:'Series conclusion certificate',series_no:'010',thumbnail_1:'',cover_image:'',tx_id:'',created_at:'2026-06-03 08:18:21'},
            ];
            window._certData = fallback;
            renderCertificates(fallback); */
        });
}

/* Kick off on page load */
document.addEventListener('DOMContentLoaded', loadCertificates);

/* ── Image pan/crop ── */
(function() {
    var _panX = 0, _panY = 0;
    var _cropR = 16/9;           /* current crop ratio */
    var _imgNatW = 0, _imgNatH = 0;
    var _drag = false, _sx = 0, _sy = 0, _spx = 0, _spy = 0;

    /* Crop ratios sorted by value for nearest-match detection */
    var RATIOS = [
        { label:'9:16', val:9/16  },
        { label:'2:3',  val:2/3   },
        { label:'3:4',  val:3/4   },
        { label:'1:1',  val:1     },
        { label:'4:3',  val:4/3   },
        { label:'3:2',  val:3/2   },
        { label:'16:9', val:16/9  }
    ];

    function zone()     { return document.getElementById('cf-img-zone'); }
    function preview()  { return document.getElementById('cf-img-preview'); }
    function boundary() { return document.getElementById('cf-crop-boundary'); }

    /* ── Find nearest standard ratio to the image's natural ratio ── */
    function nearestRatio(natW, natH) {
        var imgR = natW / natH;
        var best = RATIOS[0], bestDiff = Infinity;
        for (var i = 0; i < RATIOS.length; i++) {
            var d = Math.abs(RATIOS[i].val - imgR);
            if (d < bestDiff) { bestDiff = d; best = RATIOS[i]; }
        }
        return best;
    }

    /* ── Activate a crop button by label ── */
    function activateCropBtn(label) {
        var btns = document.querySelectorAll('.cf-crop-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.remove('cf-active');
            if (btns[i].textContent.trim() === label) btns[i].classList.add('cf-active');
        }
    }

    /* ── Layout: fit image to fill zone, apply crop boundary ── */
    function applyLayout() {
        var z   = zone();
        var img = preview();
        var bnd = boundary();
        if (!z || !img) return;

        var zW = z.offsetWidth;
        var zH = z.offsetHeight;

        /* Scale image so it fills the zone edge-to-edge at natural ratio */
        var natR = _imgNatW / _imgNatH;
        var imgW, imgH;
        if (natR >= zW / zH) {
            /* wide image — fit to zone height */
            imgH = zH; imgW = zH * natR;
        } else {
            /* tall image — fit to zone width */
            imgW = zW; imgH = zW / natR;
        }

        /* Crop frame dimensions based on selected ratio */
        var cropW, cropH;
        if (_cropR >= zW / zH) {
            cropW = zW; cropH = zW / _cropR;
        } else {
            cropH = zH; cropW = zH * _cropR;
        }
        /* Ensure crop frame never exceeds zone */
        if (cropW > zW) { cropW = zW; cropH = cropW / _cropR; }
        if (cropH > zH) { cropH = zH; cropW = cropH * _cropR; }

        /* Scale image up so it at minimum covers the crop frame */
        var scale = Math.max(cropW / imgW, cropH / imgH);
        imgW *= scale; imgH *= scale;

        /* Pan limits — image must always cover the crop frame */
        var maxPanX = (imgW - cropW) / 2;
        var maxPanY = (imgH - cropH) / 2;

        /* Constrain pan to the axis where cropping occurs */
        var panAxisX = imgW > cropW + 1;   /* cropped on sides */
        var panAxisY = imgH > cropH + 1;   /* cropped top/bottom */
        if (!panAxisX) _panX = 0;
        if (!panAxisY) _panY = 0;
        _panX = Math.max(-maxPanX, Math.min(maxPanX, _panX));
        _panY = Math.max(-maxPanY, Math.min(maxPanY, _panY));

        /* Position image — centred around the pan offset */
        img.style.width  = Math.round(imgW) + 'px';
        img.style.height = Math.round(imgH) + 'px';
        img.style.left   = Math.round((zW - imgW) / 2 + _panX) + 'px';
        img.style.top    = Math.round((zH - imgH) / 2 + _panY) + 'px';

        /* Position crop boundary frame — clamp so border never clips on zone edge */
        if (bnd) {
            var bndW = Math.min(Math.round(cropW), zW - 2);
            var bndH = Math.min(Math.round(cropH), zH - 2);
            var bndL = Math.round((zW - cropW) / 2);
            var bndT = Math.round((zH - cropH) / 2);
            /* Push inward if touching zone edge */
            if (bndL <= 0) bndL = 1;
            if (bndT <= 0) bndT = 1;
            if (bndL + bndW >= zW) bndW = zW - bndL - 1;
            if (bndT + bndH >= zH) bndH = zH - bndT - 1;
            bnd.style.width  = bndW + 'px';
            bnd.style.height = bndH + 'px';
            bnd.style.left   = bndL + 'px';
            bnd.style.top    = bndT + 'px';
        }
    }

    /* ── Load from URL ── */
    function loadUrl(url) {
        var img = preview();
        if (!img) return;
        img.onload = function() {
            _imgNatW = img.naturalWidth;
            _imgNatH = img.naturalHeight;
            _panX = 0; _panY = 0;

            var z = zone();
            if (!z) return;

            /* Auto-select nearest crop ratio */
            var nearest = nearestRatio(_imgNatW, _imgNatH);
            _cropR = nearest.val;
            activateCropBtn(nearest.label);

            z.classList.add('has-image');
            var ic = document.getElementById('cf-zone-icon');
            var lb = document.getElementById('cf-zone-label');
            if (ic) ic.style.display = 'none';
            if (lb) lb.style.display = 'none';

            requestAnimationFrame(function() {
                applyLayout();
            });
        };
        img.src = url;
    }

    /* ── Load from File ── */
    function loadFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        var r = new FileReader();
        r.onload = function(ev) { loadUrl(ev.target.result); };
        r.readAsDataURL(file);
    }

    window.cfLoadImgUrl  = loadUrl;
    window.cfLoadImgFile = loadFile;

    /* ── Crop button ── */
    window.cfSetCrop = function(btn, ratio) {
        var btns = document.querySelectorAll('.cf-crop-btn');
        for (var i = 0; i < btns.length; i++) btns[i].classList.remove('cf-active');
        btn.classList.add('cf-active');
        var p = ratio.split(':');
        _cropR = parseFloat(p[0]) / parseFloat(p[1]);
        _panX = 0; _panY = 0;
        var z = zone();
        if (z && z.classList.contains('has-image')) applyLayout();
    };

    /* ── Remove ── */
    window.cfImgRemove = function(e) {
        e.stopPropagation();
        var img = preview(); var z = zone(); var bnd = boundary();
        if (!img || !z) return;
        /* Reset all inline styles set during load */
        img.src = '';
        img.style.cssText = '';
        _panX = 0; _panY = 0; _imgNatW = 0; _imgNatH = 0;
        z.classList.remove('has-image');
        /* Hide boundary box */
        if (bnd) {
            bnd.style.width = '0';
            bnd.style.height = '0';
        }
        var ic = document.getElementById('cf-zone-icon');
        var lb = document.getElementById('cf-zone-label');
        if (ic) ic.style.display = '';
        if (lb) lb.style.display = '';
        var fi = document.getElementById('cf-img-file');
        if (fi) fi.value = '';
    };

    /* ── File input / drop ── */
    window.cfImgSelect = function(e) { loadFile(e.target.files[0]); };
    window.cfImgDrop   = function(e) {
        e.preventDefault();
        loadFile(e.dataTransfer.files[0]);
    };

    /* ── Pan: only on axes where image extends beyond crop frame ── */
    window.cfImgPanStart = function(e) {
        var z = zone();
        if (!z || !z.classList.contains('has-image') || e.button !== 0) return;
        if (e.target.closest && e.target.closest('.cf-img-remove')) return;
        e.preventDefault();
        _drag = true; _sx = e.clientX; _sy = e.clientY; _spx = _panX; _spy = _panY;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    };
    document.addEventListener('mousemove', function(e) {
        if (!_drag) return;
        _panX = _spx + (e.clientX - _sx);
        _panY = _spy + (e.clientY - _sy);
        applyLayout();
    });
    document.addEventListener('mouseup', function() {
        if (!_drag) return;
        _drag = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
    window.addEventListener('resize', function() {
        var z = zone();
        if (z && z.classList.contains('has-image')) applyLayout();
    });
})();

/* ── Edit modal image pan/crop (mirrors cf but uses ef- IDs) ── */
(function() {
    var _panX = 0, _panY = 0, _cropR = 16/9;
    var _imgNatW = 0, _imgNatH = 0;
    var _drag = false, _sx = 0, _sy = 0, _spx = 0, _spy = 0;

    var RATIOS = [
        { label:'9:16', val:9/16 }, { label:'2:3', val:2/3 },
        { label:'3:4',  val:3/4  }, { label:'1:1', val:1   },
        { label:'4:3',  val:4/3  }, { label:'3:2', val:3/2 },
        { label:'5:4',  val:5/4  }, { label:'4:5', val:4/5 },
        { label:'16:9', val:16/9 }
    ];

    function zone()     { return document.getElementById('ef-img-zone'); }
    function preview()  { return document.getElementById('ef-img-preview'); }
    function boundary() { return document.getElementById('ef-crop-boundary'); }

    function nearestRatio(w, h) {
        var r = w / h, best = RATIOS[0], bestD = Infinity;
        for (var i = 0; i < RATIOS.length; i++) {
            var d = Math.abs(RATIOS[i].val - r);
            if (d < bestD) { bestD = d; best = RATIOS[i]; }
        }
        return best;
    }

    function activateCropBtn(label) {
        var btns = document.querySelectorAll('#ef-backdrop .cf-crop-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.remove('cf-active');
            if (btns[i].textContent.trim() === label) btns[i].classList.add('cf-active');
        }
    }

    function applyLayout() {
        var img = preview(), z = zone(), bnd = boundary();
        if (!z || !img) return;
        var zW = z.offsetWidth, zH = z.offsetHeight;
        if (!zW || !zH) return;
        var natR = _imgNatW / _imgNatH;
        var imgW, imgH;
        if (natR >= zW / zH) { imgH = zH; imgW = zH * natR; }
        else                  { imgW = zW; imgH = zW / natR; }
        var cropW, cropH;
        if (_cropR >= zW / zH) { cropW = zW; cropH = zW / _cropR; }
        else                    { cropH = zH; cropW = zH * _cropR; }
        if (cropW > zW) { cropW = zW; cropH = cropW / _cropR; }
        if (cropH > zH) { cropH = zH; cropW = cropH * _cropR; }
        var scale = Math.max(cropW / imgW, cropH / imgH);
        imgW *= scale; imgH *= scale;
        var maxPanX = (imgW - cropW) / 2, maxPanY = (imgH - cropH) / 2;
        if (imgW <= cropW + 1) _panX = 0;
        if (imgH <= cropH + 1) _panY = 0;
        _panX = Math.max(-maxPanX, Math.min(maxPanX, _panX));
        _panY = Math.max(-maxPanY, Math.min(maxPanY, _panY));
        img.style.width  = Math.round(imgW) + 'px';
        img.style.height = Math.round(imgH) + 'px';
        img.style.left   = Math.round((zW - imgW) / 2 + _panX) + 'px';
        img.style.top    = Math.round((zH - imgH) / 2 + _panY) + 'px';
        if (bnd) {
            var bW = Math.min(Math.round(cropW), zW - 2);
            var bH = Math.min(Math.round(cropH), zH - 2);
            var bL = Math.round((zW - cropW) / 2); if (bL <= 0) bL = 1;
            var bT = Math.round((zH - cropH) / 2); if (bT <= 0) bT = 1;
            if (bL + bW >= zW) bW = zW - bL - 1;
            if (bT + bH >= zH) bH = zH - bT - 1;
            bnd.style.width = bW + 'px'; bnd.style.height = bH + 'px';
            bnd.style.left  = bL + 'px'; bnd.style.top    = bT + 'px';
        }
    }

    function loadUrl(url) {
        var img = preview();
        if (!img) return;
        img.onload = function() {
            _imgNatW = img.naturalWidth; _imgNatH = img.naturalHeight;
            _panX = 0; _panY = 0;
            var z = zone(); if (!z) return;
            var nearest = nearestRatio(_imgNatW, _imgNatH);
            _cropR = nearest.val;
            activateCropBtn(nearest.label);
            z.classList.add('has-image');
            var ic = document.getElementById('ef-zone-icon');
            var lb = document.getElementById('ef-zone-label');
            if (ic) ic.style.display = 'none';
            if (lb) lb.style.display = 'none';
            requestAnimationFrame(applyLayout);
        };
        img.src = url;
    }

    function loadFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        var r = new FileReader();
        r.onload = function(ev) { loadUrl(ev.target.result); };
        r.readAsDataURL(file);
    }

    window.efLoadImgUrl  = loadUrl;
    window.efLoadImgFile = loadFile;

    window.efSetCrop = function(btn, ratio) {
        var btns = document.querySelectorAll('#ef-backdrop .cf-crop-btn');
        for (var i = 0; i < btns.length; i++) btns[i].classList.remove('cf-active');
        btn.classList.add('cf-active');
        var p = ratio.split(':');
        _cropR = parseFloat(p[0]) / parseFloat(p[1]);
        _panX = 0; _panY = 0;
        var z = zone();
        if (z && z.classList.contains('has-image')) applyLayout();
    };

    window.efImgRemove = function(e) {
        e.stopPropagation();
        var img = preview(), z = zone(), bnd = boundary();
        if (!img || !z) return;
        img.src = ''; img.style.cssText = '';
        _panX = 0; _panY = 0; _imgNatW = 0; _imgNatH = 0;
        z.classList.remove('has-image');
        if (bnd) { bnd.style.width = '0'; bnd.style.height = '0'; }
        var ic = document.getElementById('ef-zone-icon');
        var lb = document.getElementById('ef-zone-label');
        if (ic) ic.style.display = '';
        if (lb) lb.style.display = '';
        var fi = document.getElementById('ef-img-file');
        if (fi) fi.value = '';
    };

    window.efImgSelect  = function(e) { loadFile(e.target.files[0]); };
    window.efImgDrop    = function(e) { e.preventDefault(); loadFile(e.dataTransfer.files[0]); };
    window.efImgPanStart = function(e) {
        var z = zone();
        if (!z || !z.classList.contains('has-image') || e.button !== 0) return;
        if (e.target.closest && e.target.closest('.cf-img-remove')) return;
        e.preventDefault();
        _drag = true; _sx = e.clientX; _sy = e.clientY; _spx = _panX; _spy = _panY;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    };
    document.addEventListener('mousemove', function(e) {
        if (!_drag) return;
        _panX = _spx + (e.clientX - _sx); _panY = _spy + (e.clientY - _sy);
        applyLayout();
    });
    document.addEventListener('mouseup', function() {
        if (!_drag) return;
        _drag = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
    window.addEventListener('resize', function() {
        var z = zone();
        if (z && z.classList.contains('has-image')) applyLayout();
    });
})();

/* ══════════════════════════════════════════════════════
   TAGS — create modal
══════════════════════════════════════════════════════ */
var _cfTags = [];

function cfRenderTags() {
    var wrap    = document.getElementById('cf-tag-wrap');
    var input   = document.getElementById('cf-hashtag');
    var counter = document.getElementById('cf-tags-counter');
    if (!wrap) return;
    wrap.querySelectorAll('.cf-tag-pill').forEach(function(p) { p.remove(); });
    _cfTags.forEach(function(tag) {
        var pill = document.createElement('span');
        pill.className = 'cf-tag-pill';
        var text = document.createElement('span');
        text.className = 'cf-tag-text';
        text.textContent = '#' + tag;
        var btn = document.createElement('button');
        btn.className = 'cf-tag-remove';
        btn.textContent = '\u00d7';
        btn.setAttribute('data-tag', tag);
        btn.addEventListener('click', function() { cfRemoveTag(this.getAttribute('data-tag')); });
        pill.appendChild(text);
        pill.appendChild(btn);
        wrap.insertBefore(pill, input);
    });
    if (counter) counter.textContent = _cfTags.length + ' / 10';
}
function cfAddTag(raw) {
    var tag = raw.replace(/^#+/, '').trim().toLowerCase();
    if (!tag || _cfTags.includes(tag) || _cfTags.length >= 10) return;
    _cfTags.push(tag);
    cfRenderTags();
}

function cfRemoveTag(tag) {
    _cfTags = _cfTags.filter(function(t) { return t !== tag; });
    cfRenderTags();
}

function cfTagKeydown(e) {
    var input = document.getElementById('cf-hashtag');
    if (!input) return;
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        cfAddTag(input.value);
        input.value = '';
        cfAutoGrow(input);
    } else if (e.key === 'Backspace' && input.value === '' && _cfTags.length > 0) {
        cfRemoveTag(_cfTags[_cfTags.length - 1]);
    }
}

function cfAutoGrow(el) {
    var min = parseInt(el.getAttribute('data-min-width')) || 95;
    var max = parseInt(el.getAttribute('data-max-width')) || 250;
    var tmp = document.createElement('span');
    tmp.style.cssText = 'visibility:hidden;position:absolute;white-space:pre;font-size:' + getComputedStyle(el).fontSize;
    tmp.textContent = el.value || el.placeholder;
    document.body.appendChild(tmp);
    el.style.width = Math.min(max, Math.max(min, tmp.offsetWidth + 20)) + 'px';
    document.body.removeChild(tmp);
}

/* ══════════════════════════════════════════════════════
   TAGS — edit modal
══════════════════════════════════════════════════════ */
var _efTags = [];

function efRenderTags() {
    var wrap    = document.getElementById('ef-tag-wrap');
    var input   = document.getElementById('ef-hashtag');
    var counter = document.getElementById('ef-tags-counter');
    if (!wrap) return;
    wrap.querySelectorAll('.cf-tag-pill').forEach(function(p) { p.remove(); });
    _efTags.forEach(function(tag) {
        var pill = document.createElement('span');
        pill.className = 'cf-tag-pill';
        var text = document.createElement('span');
        text.className = 'cf-tag-text';
        text.textContent = '#' + tag;
        var btn = document.createElement('button');
        btn.className = 'cf-tag-remove';
        btn.textContent = '\u00d7';
        btn.setAttribute('data-tag', tag);
        btn.addEventListener('click', function() { efRemoveTag(this.getAttribute('data-tag')); });
        pill.appendChild(text);
        pill.appendChild(btn);
        wrap.insertBefore(pill, input);
    });
    if (counter) counter.textContent = _efTags.length + ' / 10';
}
function efAddTag(raw) {
    var tag = raw.replace(/^#+/, '').trim().toLowerCase();
    if (!tag || _efTags.includes(tag) || _efTags.length >= 10) return;
    _efTags.push(tag);
    efRenderTags();
}

function efRemoveTag(tag) {
    _efTags = _efTags.filter(function(t) { return t !== tag; });
    efRenderTags();
}

function efTagKeydown(e) {
    var input = document.getElementById('ef-hashtag');
    if (!input) return;
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        efAddTag(input.value);
        input.value = '';
        efAutoGrow(input);
    } else if (e.key === 'Backspace' && input.value === '' && _efTags.length > 0) {
        efRemoveTag(_efTags[_efTags.length - 1]);
    }
}

function efAutoGrow(el) {
    var min = parseInt(el.getAttribute('data-min-width')) || 95;
    var max = parseInt(el.getAttribute('data-max-width')) || 250;
    var tmp = document.createElement('span');
    tmp.style.cssText = 'visibility:hidden;position:absolute;white-space:pre;font-size:' + getComputedStyle(el).fontSize;
    tmp.textContent = el.value || el.placeholder;
    document.body.appendChild(tmp);
    el.style.width = Math.min(max, Math.max(min, tmp.offsetWidth + 20)) + 'px';
    document.body.removeChild(tmp);
}

/* ══════════════════════════════════════════════════════
   CERTIFICATE FORM ACTIONS
══════════════════════════════════════════════════════ */
var API = 'http://localhost:3001';

function _collectCertForm() {
    var cropState = (typeof cfGetCropState === 'function') ? cfGetCropState() : {};

    var productRadios = document.querySelectorAll('input[name="cf-type"]');
    var selectedProduct = 'standard';
    productRadios.forEach(function(r) { if (r.checked) selectedProduct = r.value; });

    return {
        user_id:           CURRENT_USER,
        item_type:         'certificate',
        item_id:           '',
        name:              (document.getElementById('cf-artwork-name')   || {}).value || '',
        artist:            (document.getElementById('cf-artist-name')    || {}).value || '',
        artwork:           (document.getElementById('cf-artwork-name')   || {}).value || '',
        release_date:      (document.getElementById('cf-release-date')   || {}).value || '',
        category:          (document.getElementById('cf-category')       || {}).value || '',
        genre:             (document.getElementById('cf-genre')          || {}).value || '',
        description:       (document.getElementById('cf-description')    || {}).value || '',
        type:              selectedProduct,
        status:            (document.getElementById('cf-status')         || {}).value || '',
        format:            (document.getElementById('cf-format')         || {}).value || '',
        tags:              JSON.stringify(_cfTags),
        private:           document.getElementById('cf-private') &&
                           document.getElementById('cf-private').classList.contains('on') ? 1 : 0,
        agree_to_terms:    (document.getElementById('cf-agree-to-terms') || {}).checked ? 1 : 0,
        save_signature:    (document.getElementById('cf-save-signature') || {}).checked ? 1 : 0,
        signature_strokes: (function() {
            var s = window.certSigGetStrokes ? certSigGetStrokes() : null;
            return s ? JSON.stringify(s) : null;
        })(),
        aspect_ratio:      cropState.aspect_ratio  || '',
        reposition_x:      cropState.reposition_x  || 0.0,
        reposition_y:      cropState.reposition_y  || 0.0,
        crop_x1:           cropState.crop_x1       || 0.0,
        crop_y1:           cropState.crop_y1       || 0.0,
        crop_x2:           cropState.crop_x2       || 0.0,
        crop_y2:           cropState.crop_y2       || 0.0,
    };
}

function _collectEditForm() {
    var cropState = (typeof efGetCropState === 'function') ? efGetCropState() : {};

    var productRadios = document.querySelectorAll('input[name="ef-type"]');
    var selectedProduct = 'standard';
    productRadios.forEach(function(r) { if (r.checked) selectedProduct = r.value; });

    return {
        name:              (document.getElementById('ef-artwork-name')   || {}).value || '',
        artist:            (document.getElementById('ef-artist-name')    || {}).value || '',
        artwork:           (document.getElementById('ef-artwork-name')   || {}).value || '',
        release_date:      (document.getElementById('ef-release-date')   || {}).value || '',
        category:          (document.getElementById('ef-category')       || {}).value || '',
        genre:             (document.getElementById('ef-genre')          || {}).value || '',
        description:       (document.getElementById('ef-description')    || {}).value || '',
        type:              selectedProduct,
        status:            (document.getElementById('ef-status')         || {}).value || 'draft',
        format:            (document.getElementById('ef-format')         || {}).value || '',
        tags:              JSON.stringify(_efTags),
        private:           document.getElementById('ef-private') &&
                           document.getElementById('ef-private').classList.contains('on') ? 1 : 0,
        agree_to_terms:    (document.getElementById('ef-agree-to-terms') || {}).checked ? 1 : 0,
        save_signature:    (document.getElementById('ef-save-signature') || {}).checked ? 1 : 0,
        signature_strokes: (function() {
            var s = window.efSigGetStrokes ? efSigGetStrokes() : null;
            return s ? JSON.stringify(s) : null;
        })(),
        aspect_ratio:      cropState.aspect_ratio  || '',
        reposition_x:      cropState.reposition_x  || 0.0,
        reposition_y:      cropState.reposition_y  || 0.0,
        crop_x1:           cropState.crop_x1       || 0.0,
        crop_y1:           cropState.crop_y1       || 0.0,
        crop_x2:           cropState.crop_x2       || 0.0,
        crop_y2:           cropState.crop_y2       || 0.0,
    };
}

/* ── Save Draft ── */
function saveProjDraft() {
    var existingId = window._resumingDbId || null;
    certSigSaveIfChecked();
    var data    = _collectCertForm();
    data.status = 'draft';

    var url    = existingId
        ? API + '/api/certificates/id/' + encodeURIComponent(existingId)
        : API + '/api/certificates';
    var method = existingId ? 'PUT' : 'POST';

    console.log('[saveProjDraft]', method, url, 'db id:', existingId);

    fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function(result) {
            console.log('[saveProjDraft] saved:', result);
            if (method === 'POST' && result.id) {
                window._resumingDbId = result.id;
            }
            closeCertModal();
            window._resumingDbId = null;
            loadCertificates();
        })
        .catch(function(e) {
            console.error('[saveProjDraft] failed:', e.message);
        });
}

/* ── Create Certificate ── */
function createProj() {
    var name = document.getElementById('cf-artwork-name');
    if (!name || !name.value.trim()) {
        name.style.borderColor = 'var(--red)';
        name.focus();
        setTimeout(function() { name.style.borderColor = ''; }, 2000);
        return;
    }
    var agree = document.getElementById('cf-agree-to-terms');
    if (agree && !agree.checked) {
        var wrap = agree.closest('.cert-checkbox-wrap');
        if (wrap) { wrap.style.outline = '1px solid var(--red)'; setTimeout(function() { wrap.style.outline = ''; }, 2000); }
        return;
    }

    var existingId = window._resumingDbId || null;
    certSigSaveIfChecked();
    var data = _collectCertForm();
    /* Status comes from the form's cf-status select — no override */

    var url    = existingId
        ? API + '/api/certificates/' + encodeURIComponent(existingId)
        : API + '/api/certificates';
    var method = existingId ? 'PUT' : 'POST';

    console.log('[createProj]', method, url, 'existingId:', existingId);

    closeCertModal();
    window._resumingDbId = null;

    fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function(result) { console.log('[createProj] saved:', result); loadCertificates(); })
        .catch(function(e) { console.error('[createProj] failed:', e.message); });
}

/* ── Save Changes (edit modal) ── */
function saveEditCert() {
    var certId = window._currentCertId || '';
    efSigSaveIfChecked();
    var data = _collectEditForm();

    console.log('[saveEditCert] PUT certificate_id:', certId);

    closeEditModal();
    window._currentCertId = null;

    fetch(API + '/api/certificates/' + encodeURIComponent(certId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(result) { console.log('[saveEditCert] saved:', result); loadCertificates(); })
    .catch(function(e) { console.error('[saveEditCert] failed:', e.message); });
}

/* ══════════════════════════════════════════════════════
   certSaveDraft()
   Handles both creating a new draft and updating an
   existing one. Status is always forced to 'draft'
   regardless of what the user has selected — draft
   status is transparent to the user and managed by
   this function only.
   Uses _resumingDbId (integer primary key) for updates
   so there is no ambiguity about which row to update.
══════════════════════════════════════════════════════ */
function certSaveDraft() {
    /* Capture the existing row id BEFORE anything clears it */
    var existingId = window._resumingDbId || null;

    /* Save reusable signature to localStorage if checkbox is ticked */
    if (window.certSigSaveIfChecked) certSigSaveIfChecked();

    /* Collect all form fields */
    var data = _collectCertForm();

    /* Force status to draft — user never sets this directly */
    data.status = 'draft';

    /* Decide route — PUT to existing row by integer id, or POST new record */
    var url    = existingId
        ? API + '/api/certificates/id/' + encodeURIComponent(existingId)
        : API + '/api/certificates';
    var method = existingId ? 'PUT' : 'POST';

    console.log('[certSaveDraft]', method, url, '| db id:', existingId);

    fetch(url, {
        method:  method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data)
    })
    .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
    })
    .then(function(result) {
        console.log('[certSaveDraft] saved:', result);

        /* After a POST, store the returned integer id so the next
           Save Draft in this session does a PUT on the same row */
        if (method === 'POST' && result.id) {
            window._resumingDbId = result.id;
        }

        closeCertModal();
        window._resumingDbId = null;
        loadCertificates();
    })
    .catch(function(e) {
        console.error('[certSaveDraft] failed:', e.message);
    });
}

