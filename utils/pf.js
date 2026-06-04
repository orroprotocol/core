/* ══════════════════════════════════════════════════════
  POST PAGE JAVASCRIPT
══════════════════════════════════════════════════════ */

/* FONT SELECTOR */

function updateFontPreview() {
    const fontSelector = document.getElementById('font-selector');
    const previewText = document.getElementById('palette-preview-text');
    const nameInput = document.getElementById('settings-display-name');

    if (previewText && fontSelector) {
        // Apply the chosen font to the preview
        previewText.style.fontFamily = fontSelector.value;
        
        // Sync the preview text with the Display Name input
        if (nameInput && nameInput.value.trim() !== "") {
            previewText.textContent = nameInput.value;
        } else {
            previewText.textContent = "Preview Text";
        }
    }
}

/* CHAR COUNTERS */
function updateCounter(id, cid, max) {
    const v = document.getElementById(id).value.length;
    document.getElementById(cid).textContent = v.toLocaleString() + ' / ' + max.toLocaleString();
}

/* AUTHORS */
let authorCount = 1;
function addAuthor() {
    if (authorCount >= 5) return;
    authorCount++;
    const row = document.createElement('div');
    row.className = 'author-row';
    row.innerHTML = `<input class="form-input" type="text" placeholder="Author name or @handle" style="max-width:320px"><button class="author-remove" onclick="removeAuthor(this)" title="Remove">×</button>`;
    document.getElementById('authorList').appendChild(row);
    if (authorCount >= 5) document.getElementById('addAuthorBtn').disabled = true;
}
function removeAuthor(btn) {
    if (document.querySelectorAll('#authorList .author-row').length <= 1) return;
    btn.closest('.author-row').remove();
    authorCount--;
    document.getElementById('addAuthorBtn').disabled = false;
}

/* PANEL TOGGLE */
function togglePanel(id) { document.getElementById(id).classList.toggle('open'); }
function toggleMenu(id)  { document.getElementById(id).classList.toggle('open'); }

/* PUBLIC TOGGLE */
function togglePublic() {
    const t = document.getElementById('publicToggle');
    t.classList.toggle('on');
    document.getElementById('publicLabel').textContent = t.classList.contains('on') ? 'Yes' : 'No';
}

/* SCROLL SPY */
const spy=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
        if(e.isIntersecting){
            document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
            const a=document.querySelector('.nav-link[href="#'+e.target.id+'"]');
            if(a)a.classList.add('active');
        }
    });
},{rootMargin:'-20% 0px -70% 0px'});
document.querySelectorAll('.form-section[id]').forEach(s=>spy.observe(s));
document.querySelectorAll('.nav-link').forEach(l=>{
    l.addEventListener('click',e=>{
        const h=l.getAttribute('href');
        if(h && h.startsWith('#')){e.preventDefault();const t=document.querySelector(h);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});}
    });
});

requestAnimationFrame(()=>{ if(typeof initCoverCanvas === "function") initCoverCanvas(); });

/* ── Color Swatch Picker + Preview ── */
var swatchState = { bg: null, font: null };

function updatePreview() {
  var preview  = document.getElementById('palette-preview');
  var textEl   = document.getElementById('palette-preview-text');
  var hintEl   = document.getElementById('palette-preview-hint');
  var inputEl  = document.getElementById('palette-text-input');
  if (!preview || !textEl) return;

  var typed = inputEl ? inputEl.value.trim() : '';

  /* background */
  preview.style.background = swatchState.bg || '';

  /* font color */
  textEl.style.color = swatchState.font || 'var(--text-main)';

  /* show typed text or hint */
  if (typed) {
    textEl.textContent  = typed;
    textEl.style.display = '';
    if (hintEl) hintEl.style.display = 'none';
  } else if (swatchState.bg || swatchState.font) {
    textEl.textContent   = 'Preview Text';
    textEl.style.display = '';
    if (hintEl) hintEl.style.display = 'none';
  } else {
    textEl.textContent   = '';
    textEl.style.display = 'none';
    if (hintEl) hintEl.style.display = '';
  }

  /* dashed border tint */
  preview.style.borderColor = swatchState.font
    ? swatchState.font + '66'
    : '';
}

function selectSwatch(el, paletteId) {
  var color = el.getAttribute('data-color');
  var name  = el.getAttribute('title');
  document.querySelectorAll('[data-palette="' + paletteId + '"]').forEach(function(s) {
    s.classList.remove('selected');
  });
  el.classList.add('selected');
  swatchState[paletteId] = color;
  updatePreview();
}

function clearSwatch(paletteId) {
  document.querySelectorAll('[data-palette="' + paletteId + '"]').forEach(function(s) {
    s.classList.remove('selected');
  });
  swatchState[paletteId] = null;
  updatePreview();
}

/* ── Post Composer ── */
function autoGrowComposer(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function submitPost() {
  var title = document.getElementById('post-title');
  var desc  = document.getElementById('post-desc');
  if (!title || !title.value.trim()) {
    title.focus();
    return;
  }
  /* TODO: wire up to backend / post feed */
  console.log('Post:', { title: title.value, description: desc.value });
  title.value = '';
  desc.value  = '';
  desc.style.height = 'auto';
}

/* ════════════════════════════════════════════════════════
   POST COMPOSER
   ════════════════════════════════════════════════════════ */

/* ── State ── */
var composerState = {
  bgColor:   null,
  fontColor: null,
  font:      null,
  imageData: null
};

/* ── Color palette (15 colors + 1 clear) ── */
var COMPOSER_COLORS = [
  { hex: '#FF2F2A', name: 'Red'    },
  { hex: '#EB7629', name: 'Orange' },
  { hex: '#FADE24', name: 'Yellow' },
  { hex: '#8DDB45', name: 'Lime'   },
  { hex: '#30BF3F', name: 'Green'  },
  { hex: '#18A390', name: 'Teal'   },
  { hex: '#01B8CC', name: 'Cyan'   },
  { hex: '#0078DB', name: 'Blue'   },
  { hex: '#5214F0', name: 'Indigo' },
  { hex: '#7926F0', name: 'Purple' },
  { hex: '#E341CD', name: 'Pink'   },
  { hex: '#775849', name: 'Brown'  },
  { hex: '#F8F8FC', name: 'White'  },
  { hex: '#7E7E82', name: 'Grey'   },
  { hex: '#0A0A0C', name: 'Black'  }
];

/* ── Emoji list ── */
var COMPOSER_EMOJIS = [
  '😀','😃','😄','😁','😆','😅',
  '🤣','😂','🙂','🙃','😉','😊',
  '😇','🥰','😍','🤩','😘','😗',
  '😚','😙','😋','😛','😜','🤪',
  '😝','🤑','🤗','🤭','🤫','🤔',
  '🤐','🤨','😐','😑','😶','😏',
  '😒','🙄','😬','🤥','😌','😔',
  '😪','🤤','😴','😷','🤒','🤕',
  '🤢','🤮','🤧','🥵','🥶','🥴',
  '😵','🤯','🤠','🥳','😎','🤓',
  '👍','👎','❤️','🔥','⭐','✨',
  '🎉','🙌','👏','💯','🚀','💡'
];

/* ── Helper: close all composer popups ── */
function composerCloseAllPopups(except) {
  var popups = ['composerEmojiPicker','composerBgColorPopup','composerFontColorPopup','composerFontPopup'];
  popups.forEach(function(id) {
    if (id !== except) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('show');
    }
  });
}

/* ── Helper: position popup near button ── */
function composerPositionPopup(popup, btn) {
  var rect = btn.getBoundingClientRect();
  var pw = popup.offsetWidth || 200;
  var ph = popup.offsetHeight || 150;
  var left = rect.left;
  var top  = rect.top - ph - 8;
  if (left + pw > window.innerWidth - 10) left = window.innerWidth - pw - 10;
  if (top < 10) top = rect.bottom + 8;
  popup.style.left = left + 'px';
  popup.style.top  = top  + 'px';
}

/* ── Close popups on outside click ── */
document.addEventListener('click', function(e) {
  var popups = ['composerEmojiPicker','composerBgColorPopup','composerFontColorPopup','composerFontPopup'];
  var triggers = ['composerEmojiBtn','composerBgBtn','composerFontColorBtn','composerFontTypeBtn'];
  var clickedTrigger = triggers.some(function(id) {
    var el = document.getElementById(id);
    return el && el.contains(e.target);
  });
  if (!clickedTrigger) {
    popups.forEach(function(id) {
      var popup = document.getElementById(id);
      if (popup && !popup.contains(e.target)) popup.classList.remove('show');
    });
  }
});

/* ══════════════════════════════
   1. EMOJI PICKER
══════════════════════════════ */
function composerToggleEmoji(btn) {
  var picker = document.getElementById('composerEmojiPicker');
  var grid   = document.getElementById('composerEmojiGrid');
  var isOpen = picker.classList.contains('show');
  composerCloseAllPopups('composerEmojiPicker');

  if (!isOpen) {
    /* Build grid once */
    if (grid.children.length === 0) {
      COMPOSER_EMOJIS.forEach(function(emoji) {
        var span = document.createElement('span');
        span.className = 'emoji-item';
        span.innerText = emoji;
        span.onclick = function() {
          var ta = document.getElementById('post-desc');
          var start = ta.selectionStart;
          var end   = ta.selectionEnd;
          ta.value = ta.value.slice(0, start) + emoji + ta.value.slice(end);
          ta.selectionStart = ta.selectionEnd = start + emoji.length;
          ta.focus();
          autoGrowComposer(ta);
          picker.classList.remove('show');
        };
        grid.appendChild(span);
      });
    }
    picker.classList.add('show');
    composerPositionPopup(picker, btn);
  }
}

/* ══════════════════════════════
   2. IMAGE UPLOAD
══════════════════════════════ */
function composerHandleImage(input) {
  var file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { alert('Please select an image file.'); input.value = ''; return; }
  if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB.'); input.value = ''; return; }

  var reader = new FileReader();
  reader.onload = function(e) {
    composerState.imageData = e.target.result;
    var preview    = document.getElementById('composerImagePreview');
    var previewImg = document.getElementById('composerImagePreviewImg');
    previewImg.src = e.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function composerRemoveImage() {
  composerState.imageData = null;
  document.getElementById('composerImagePreview').style.display = 'none';
  document.getElementById('composerImagePreviewImg').src = '';
  document.getElementById('composerImageInput').value = '';
}

/* ══════════════════════════════
   3 & 4. BACKGROUND + FONT COLOR
══════════════════════════════ */
function composerBuildColorGrid(gridId, type) {
  var grid = document.getElementById(gridId);
  if (grid.children.length > 0) return; /* already built */

  COMPOSER_COLORS.forEach(function(c) {
    var swatch = document.createElement('div');
    swatch.className = 'composer-swatch';
    swatch.style.background = c.hex;
    swatch.title = c.name;
    swatch.onclick = function() {
      /* deselect others in this grid */
      grid.querySelectorAll('.composer-swatch, .composer-swatch-clear').forEach(function(s) { s.classList.remove('active'); });
      swatch.classList.add('active');
      if (type === 'bg') {
        composerState.bgColor = c.hex;
        composerApplyStyles();
      } else {
        composerState.fontColor = c.hex;
        composerApplyStyles();
      }
    };
    grid.appendChild(swatch);
  });

  /* Clear button */
  var clear = document.createElement('div');
  clear.className = 'composer-swatch-clear';
  clear.title = 'Clear';
  clear.onclick = function() {
    grid.querySelectorAll('.composer-swatch, .composer-swatch-clear').forEach(function(s) { s.classList.remove('active'); });
    clear.classList.add('active');
    if (type === 'bg') { composerState.bgColor = null; }
    else                { composerState.fontColor = null; }
    composerApplyStyles();
    setTimeout(function() { clear.classList.remove('active'); }, 300);
  };
  grid.appendChild(clear);
}

function composerToggleColorPicker(btn, type) {
  var popupId = type === 'bg' ? 'composerBgColorPopup' : 'composerFontColorPopup';
  var gridId  = type === 'bg' ? 'composerBgColorGrid'  : 'composerFontColorGrid';
  var popup   = document.getElementById(popupId);
  var isOpen  = popup.classList.contains('show');
  composerCloseAllPopups(popupId);

  if (!isOpen) {
    composerBuildColorGrid(gridId, type);
    popup.classList.add('show');
    /* position after making visible so offsetWidth is available */
    requestAnimationFrame(function() { composerPositionPopup(popup, btn); });
  }
}

function composerApplyStyles() {
  var body  = document.querySelector('.post-composer-body');
  var title = document.getElementById('post-title');
  var desc  = document.getElementById('post-desc');
  if (!body) return;
  body.style.background   = composerState.bgColor   || '';
  title.style.color       = composerState.fontColor  || '';
  title.style.fontFamily  = composerState.font        || '';
  desc.style.color        = composerState.fontColor  || '';
  desc.style.fontFamily   = composerState.font        || '';
}

/* ══════════════════════════════
   5. FONT TYPE
══════════════════════════════ */
function composerToggleFontPicker(btn) {
  var popup  = document.getElementById('composerFontPopup');
  var isOpen = popup.classList.contains('show');
  composerCloseAllPopups('composerFontPopup');

  if (!isOpen) {
    popup.classList.add('show');
    requestAnimationFrame(function() { composerPositionPopup(popup, btn); });
  }
}

function composerSetFont(btn, fontVal) {
  /* deselect all options */
  document.querySelectorAll('.composer-font-option').forEach(function(o) { o.classList.remove('active'); });
  btn.classList.add('active');
  composerState.font = fontVal === 'inherit' ? null : fontVal;
  composerApplyStyles();
  document.getElementById('composerFontPopup').classList.remove('show');
}

/* ══════════════════════════════
   LIST FORMATTING (from old composer)
══════════════════════════════ */
var activeListMode = null;
var orderedListCounter = 1;

function toggleListMode(type, bulletBtnId, orderedBtnId) {
  var ta = document.getElementById('post-desc');
  bulletBtnId  = bulletBtnId  || 'composerBulletBtn';
  orderedBtnId = orderedBtnId || 'composerOrderedBtn';
  var bulletBtn  = document.getElementById(bulletBtnId);
  var orderedBtn = document.getElementById(orderedBtnId);
  var v = ta.value;
  var selStart = ta.selectionStart;
  var selEnd   = ta.selectionEnd;

  /* Find the range of lines covered by the selection */
  var blockStart = v.lastIndexOf('\n', selStart - 1) + 1;
  var blockEnd   = v.indexOf('\n', selEnd);
  if (blockEnd === -1) blockEnd = v.length;
  var block = v.slice(blockStart, blockEnd);
  var lines = block.split('\n');

  /* Detect if ALL selected lines already have this list prefix */
  var bulletPfx  = /^• /;
  var orderedPfx = /^\d+\. /;
  var checkPfx   = type === 'bullet' ? bulletPfx : orderedPfx;
  var nonEmptyLines = lines.filter(function(l) { return l.trim() !== ''; });
  var allHavePrefix = nonEmptyLines.length > 0 && nonEmptyLines.every(function(l) { return checkPfx.test(l); });

  if (allHavePrefix) {
    /* ── REMOVE: strip the prefix from every line ── */
    var counter = 1;
    var newLines = lines.map(function(l) {
      if (type === 'bullet')  return l.replace(/^• /, '');
      return l.replace(/^\d+\. /, '');
    });
    var newBlock = newLines.join('\n');
    ta.value = v.slice(0, blockStart) + newBlock + v.slice(blockEnd);
    ta.selectionStart = blockStart;
    ta.selectionEnd   = blockStart + newBlock.length;
    activeListMode = null; orderedListCounter = 1;
    if (bulletBtn)  bulletBtn.classList.remove('active');
    if (orderedBtn) orderedBtn.classList.remove('active');

  } else {
    /* ── ADD: prefix every non-empty line ── */
    var counter = 1;
    var newLines = lines.map(function(l) {
      if (l.trim() === '') return l;
      /* Strip any existing list prefix first */
      l = l.replace(/^• /, '').replace(/^\d+\. /, '');
      if (type === 'bullet') return '• ' + l;
      return (counter++) + '. ' + l;
    });
    var newBlock = newLines.join('\n');
    ta.value = v.slice(0, blockStart) + newBlock + v.slice(blockEnd);
    ta.selectionStart = blockStart;
    ta.selectionEnd   = blockStart + newBlock.length;
    activeListMode = type;
    orderedListCounter = counter;
    if (bulletBtn)  bulletBtn.classList.toggle('active', type === 'bullet');
    if (orderedBtn) orderedBtn.classList.toggle('active', type === 'ordered');
    /* Insert first prefix on blank line if nothing was prefixed */
    if (nonEmptyLines.length === 0) {
      var prefix = type === 'bullet' ? '• ' : '1. ';
      ta.value = v.slice(0, selStart) + prefix + v.slice(selStart);
      ta.selectionStart = ta.selectionEnd = selStart + prefix.length;
      if (type === 'ordered') orderedListCounter = 2;
    }
  }

  ta.focus();
  autoGrowComposer(ta);
}

function handleListKeydown(e) {
  if (!activeListMode) return;
  var ta = document.getElementById('post-desc');
  if (e.key === 'Enter') {
    e.preventDefault();
    var pos = ta.selectionStart;
    var before = ta.value.slice(0, pos);
    var after  = ta.value.slice(pos);
    var lines  = before.split('\n');
    var currentLine = lines[lines.length - 1];
    var isBlankBullet  = currentLine === '• ';
    var isBlankOrdered = /^\d+\.\s$/.test(currentLine);
    if (isBlankBullet || isBlankOrdered) {
      var newBefore = lines.slice(0, -1).join('\n') + (lines.length > 1 ? '\n' : '');
      ta.value = newBefore + after;
      ta.selectionStart = ta.selectionEnd = newBefore.length;
      activeListMode = null; orderedListCounter = 1;
      document.querySelectorAll('.composer-icon-btn.active').forEach(function(b) { b.classList.remove('active'); });
      return;
    }
    var prefix = activeListMode === 'bullet' ? '• ' : orderedListCounter + '. ';
    if (activeListMode === 'ordered') orderedListCounter++;
    ta.value = before + '\n' + prefix + after;
    ta.selectionStart = ta.selectionEnd = pos + 1 + prefix.length;
    autoGrowComposer(ta);
  }
  if (e.key === 'Escape') {
    activeListMode = null; orderedListCounter = 1;
    document.querySelectorAll('.composer-icon-btn.active').forEach(function(b) { b.classList.remove('active'); });
  }
}

/* Wire list keydown to textarea */
document.addEventListener('DOMContentLoaded', function() {
  var ta = document.getElementById('post-desc');
  if (ta) ta.addEventListener('keydown', handleListKeydown);
});

/* ══ MARKDOWN FORMATTING ══════════════════════════════════════ */

function composerWrapInline(type, btn) {
  var markers = {bold:'**', italic:'_', strike:'~~', code:'`'};
  var m  = markers[type];
  var ta = document.getElementById('post-desc');
  var s  = ta.selectionStart, e = ta.selectionEnd;
  var v  = ta.value, sel = v.slice(s, e);
  var before = v.slice(s - m.length, s);
  var after  = v.slice(e, e + m.length);
  if (before === m && after === m) {
    ta.value = v.slice(0, s - m.length) + sel + v.slice(e + m.length);
    ta.selectionStart = s - m.length;
    ta.selectionEnd   = s - m.length + sel.length;
    btn.classList.remove('active');
  } else if (sel.length > 0) {
    ta.value = v.slice(0, s) + m + sel + m + v.slice(e);
    ta.selectionStart = s + m.length;
    ta.selectionEnd   = s + m.length + sel.length;
    btn.classList.add('active');
  } else {
    ta.value = v.slice(0, s) + m + m + v.slice(s);
    ta.selectionStart = ta.selectionEnd = s + m.length;
    btn.classList.add('active');
  }
  ta.focus(); autoGrowComposer(ta);
}

function composerWrapBlock(type, btn) {
  var prefixes = {h1:'# ', h2:'## ', h3:'### '};
  var prefix = prefixes[type];
  var ta  = document.getElementById('post-desc');
  var pos = ta.selectionStart, v = ta.value;
  var lineStart = v.lastIndexOf('\n', pos - 1) + 1;
  var lineEnd   = v.indexOf('\n', pos);
  if (lineEnd === -1) lineEnd = v.length;
  var line     = v.slice(lineStart, lineEnd);
  var stripped = line.replace(/^#{1,3} /, '');
  var existing = line.match(/^(#{1,3} )/);
  var newLine;
  if (existing && existing[0] === prefix) {
    newLine = stripped;
    ['h1','h2','h3'].forEach(function(t) {
      var b = document.getElementById('composerH' + t[1].toUpperCase() + 'Btn');
      if (b) b.classList.remove('active');
    });
  } else {
    newLine = prefix + stripped;
    ['h1','h2','h3'].forEach(function(t) {
      var b = document.getElementById('composerH' + t[1].toUpperCase() + 'Btn');
      if (b) b.classList.toggle('active', t === type);
    });
  }
  ta.value = v.slice(0, lineStart) + newLine + v.slice(lineEnd);
  ta.selectionStart = ta.selectionEnd = lineStart + Math.min(pos - lineStart, newLine.length);
  ta.focus(); autoGrowComposer(ta);
}

/* ══ MODE SWITCHER ════════════════════════════════════════════ */
var composerMode = 'md';

function composerSetMode(mode) {
  composerMode = mode;
  var body         = document.getElementById('composerBody');
  var toolbar      = document.querySelector('.post-composer-toolbar');
  var previewPanel = document.getElementById('composerPreviewPanel');
  var helpPanel    = document.getElementById('composerHelpPanel');
  ['composerMdBtn','composerPreviewBtn','composerHelpBtn'].forEach(function(id) {
    var b = document.getElementById(id); if (b) b.classList.remove('active');
  });
  if (mode === 'md') {
    body.style.display = ''; toolbar.style.display = '';
    previewPanel.style.display = 'none'; helpPanel.style.display = 'none';
    document.getElementById('composerMdBtn').classList.add('active');
  } else if (mode === 'preview') {
    body.style.display = 'none'; toolbar.style.display = 'none';
    previewPanel.style.display = ''; helpPanel.style.display = 'none';
    document.getElementById('composerPreviewBtn').classList.add('active');
    composerRenderPreview();
  } else {
    body.style.display = 'none'; toolbar.style.display = 'none';
    previewPanel.style.display = 'none'; helpPanel.style.display = '';
    document.getElementById('composerHelpBtn').classList.add('active');
  }
}

/* ══ MARKDOWN RENDERER ════════════════════════════════════════ */
function inlineFormat(text) {
  text = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  /* [font:x]...[/font] — resolve key to family before other transforms */
  text = text.replace(/\[font:([a-zA-Z]+)\]([\s\S]*?)\[\/font\]/g, function(_, key, inner) {
    var map = {
      'i':'inherit','inter':'inherit',
      'g':"'Georgia Pro', Georgia, serif",'georgia':"'Georgia Pro', Georgia, serif",
      'c':"'Courier New', monospace",'courier':"'Courier New', monospace",
      'q':"'Quicksand', sans-serif",'quicksand':"'Quicksand', sans-serif",
      't':"'Trebuchet MS', sans-serif",'trebuchet':"'Trebuchet MS', sans-serif",
      'p':"'Palatino Linotype', Palatino, serif",'palatino':"'Palatino Linotype', Palatino, serif",
      's':"'Satoshi', sans-serif",'satoshi':"'Satoshi', sans-serif",
      'j':"'JetBrains Mono', monospace",'jetbrains':"'JetBrains Mono', monospace",'mono':"'JetBrains Mono', monospace"
    };
    var family = map[key.toLowerCase()] || 'inherit';
    return '<span style="font-family:' + family + '">' + inner + '</span>';
  });
  text = text.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g,'<em>$1</em>');
  text = text.replace(/_(.+?)_/g,'<em>$1</em>');
  text = text.replace(/~~(.+?)~~/g,'<s>$1</s>');
  text = text.replace(/`(.+?)`/g,'<code style="background:var(--medium-grey);padding:0.1em 0.4em;border-radius:4px;font-family:monospace;font-size:0.9em">$1</code>');
  return text;
}

function composerParseMarkdown(raw) {
  var lines = raw.split('\n');
  var out = '', inUl = false, inOl = false;
  lines.forEach(function(line) {
    if (/^### /.test(line)) {
      if (inUl){out+='</ul>';inUl=false;} if (inOl){out+='</ol>';inOl=false;}
      out += '<h3>' + inlineFormat(line.slice(4)) + '</h3>'; return;
    }
    if (/^## /.test(line)) {
      if (inUl){out+='</ul>';inUl=false;} if (inOl){out+='</ol>';inOl=false;}
      out += '<h2>' + inlineFormat(line.slice(3)) + '</h2>'; return;
    }
    if (/^# /.test(line)) {
      if (inUl){out+='</ul>';inUl=false;} if (inOl){out+='</ol>';inOl=false;}
      out += '<h1>' + inlineFormat(line.slice(2)) + '</h1>'; return;
    }
    if (/^[•\-\*] /.test(line)) {
      if (inOl){out+='</ol>';inOl=false;} if (!inUl){out+='<ul>';inUl=true;}
      out += '<li>' + inlineFormat(line.slice(2)) + '</li>'; return;
    }
    if (/^\d+\. /.test(line)) {
      if (inUl){out+='</ul>';inUl=false;} if (!inOl){out+='<ol>';inOl=true;}
      out += '<li>' + inlineFormat(line.replace(/^\d+\. /,'')) + '</li>'; return;
    }
    if (inUl){out+='</ul>';inUl=false;} if (inOl){out+='</ol>';inOl=false;}
    if (line.trim()===''){out+='<p style="margin:0;height:0.4em"></p>';return;}
    out += '<p>' + inlineFormat(line) + '</p>';
  });
  if (inUl) out+='</ul>'; if (inOl) out+='</ol>';
  return out;
}

function composerRenderPreview() {
  var title   = document.getElementById('post-title').value.trim();
  var desc    = document.getElementById('post-desc').value;
  var content = document.getElementById('composerPreviewContent');
  content.style.background = composerState.bgColor  || '';
  content.style.color      = composerState.fontColor || '';
  content.style.fontFamily = composerState.font      || '';
  var out = '';
  if (title) out += '<h1 style="margin-top:0">' + title + '</h1>';
  if (composerState.imageData) {
    out += '<img src="' + composerState.imageData + '" style="width:100%;border-radius:8px;margin-bottom:0.5rem;display:block;">';
  }
  out += composerParseMarkdown(desc);
  content.innerHTML = out || '<p style="opacity:0.4;font-style:italic">Nothing to preview yet\u2026</p>';
}

/* ══ HYPERLINK ════════════════════════════════════════════════ */
function composerInsertLink(btn) {
  var ta  = document.getElementById('post-desc');
  var s   = ta.selectionStart, e = ta.selectionEnd;
  var v   = ta.value;
  var sel = v.slice(s, e).trim();

  /* If selection looks like a bare URL, wrap it directly */
  var isUrl = /^https?:\/\//i.test(sel);

  if (isUrl) {
    var replacement = '[' + sel + '](' + sel + ')';
    ta.value = v.slice(0, s) + replacement + v.slice(e);
    ta.selectionStart = s + 1;
    ta.selectionEnd   = s + 1 + sel.length;
  } else if (sel.length > 0) {
    /* Has selected text — prompt for URL */
    var url = window.prompt('Enter URL:', 'https://');
    if (!url || url === 'https://') { ta.focus(); return; }
    var replacement = '[' + sel + '](' + url + ')';
    ta.value = v.slice(0, s) + replacement + v.slice(e);
    ta.selectionStart = s + 1;
    ta.selectionEnd   = s + 1 + sel.length;
  } else {
    /* Nothing selected — prompt for both */
    var label = window.prompt('Link label:', '');
    if (!label) { ta.focus(); return; }
    var url = window.prompt('Enter URL:', 'https://');
    if (!url || url === 'https://') { ta.focus(); return; }
    var replacement = '[' + label + '](' + url + ')';
    ta.value = v.slice(0, s) + replacement + v.slice(s);
    ta.selectionStart = s + 1;
    ta.selectionEnd   = s + 1 + label.length;
  }
  ta.focus();
  autoGrowComposer(ta);
}

/* ══ CLEAR ALL FORMATTING ════════════════════════════════════ */
function composerClearFormatting() {
  var ta = document.getElementById('post-desc');
  var v  = ta.value;

  /* 1. Strip line-level prefixes: # ## ### • N. */
  var lines = v.split('\n');
  var cleaned = lines.map(function(line) {
    return line
      .replace(/^#{1,3} /, '')        /* h1 h2 h3 */
      .replace(/^\u2022 /, '')        /* bullet • */
      .replace(/^\d+\. /, '');        /* ordered 1. 2. */
  });
  v = cleaned.join('\n');

  /* 2. Strip inline markers: **bold** _italic_ ~~strike~~ `code` */
  v = v.replace(/\*\*(.+?)\*\*/g, '$1');
  v = v.replace(/_(.+?)_/g, '$1');
  v = v.replace(/~~(.+?)~~/g, '$1');
  v = v.replace(/`(.+?)`/g, '$1');

  /* 3. Strip markdown links [label](url) → label */
  v = v.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  /* 4. Strip [font:x]...[/font] tags */
  v = v.replace(/\[font:[a-zA-Z]+\]([\s\S]*?)\[\/font\]/g, '$1');

  ta.value = v;
  autoGrowComposer(ta);

  /* 4. Reset list mode state */
  activeListMode = null;
  orderedListCounter = 1;

  /* 5. Reset composerState: bg, font color, font family */
  composerState.bgColor   = null;
  composerState.fontColor = null;
  composerState.font      = null;

  /* 6. Reset the composer body visual styles */
  var body  = document.getElementById('composerBody');
  var title = document.getElementById('post-title');
  var desc  = document.getElementById('post-desc');
  if (body)  body.style.background  = '';
  if (title) { title.style.color = ''; title.style.fontFamily = ''; }
  if (desc)  { desc.style.color  = ''; desc.style.fontFamily  = ''; }

  /* 7. Deselect all swatches */
  document.querySelectorAll('.composer-swatch.active, .composer-swatch-clear.active').forEach(function(s) {
    s.classList.remove('active');
  });

  /* 8. Reset font picker — reactivate Default option */
  document.querySelectorAll('.composer-font-option').forEach(function(o) {
    o.classList.toggle('active', o.getAttribute('data-font') === 'inherit');
  });

  /* 9. Deactivate all formatting toolbar buttons */
  ['composerH1Btn','composerH2Btn','composerH3Btn',
   'composerBoldBtn','composerItalicBtn','composerStrikeBtn',
   'composerCodeBtn','composerBulletBtn','composerOrderedBtn'].forEach(function(id) {
    var b = document.getElementById(id);
    if (b) b.classList.remove('active');
  });

  ta.focus();
}

/* Re-wire list keydown (previous JS removed) */
document.addEventListener('DOMContentLoaded', function() {
  var ta = document.getElementById('post-desc');
  if (ta) ta.addEventListener('keydown', handleListKeydown);
});

/* ══ ONBOARDING TOOLTIPS ══════════════════════════════════════ */
(function() {
  var TOOLTIPS = [
    {
      targetId: 'composerMdBtn',
      num: 1,
      text: 'The composer is currently in markdown mode.',
      color: 'cyan'
    },
    {
      targetId: 'composerPreviewBtn',
      num: 2,
      text: 'Press this button at anytime to switch to preview mode.',
      color: 'cyan'
    },
    {
      targetId: 'composerHelpBtn',
      num: 3,
      text: 'This section contains useful instructions.',
      color: 'cyan'
    },
    {
      targetId: 'composerBgBtn',
      num: 4,
      text: 'This button changes the background color.',
      color: 'green'
    },
    {
      targetId: 'composerFontColorBtn',
      num: 5,
      text: 'This button changes the text color.',
      color: 'green'
    },
    {
      targetId: 'composerFontTypeBtn',
      num: 6,
      text: 'Press this button to change the font style.',
      color: 'green'
    },
    {
      targetId: 'composerClearBtn',
      num: 7,
      text: 'Press this button to clear any formatting applied.',
      color: 'green'
    }
  ];

  var currentStep = 0;
  var tipEl = null;
  var backdrop = null;

  function showTooltip(step) {
    if (tipEl) tipEl.remove();
    if (step >= TOOLTIPS.length) {
      /* All done — unlock the composer */
      if (backdrop) backdrop.style.display = 'none';
      var composer = document.querySelector('.post-composer');
      if (composer) composer.classList.remove('composer-locked');
      return;
    }

    var data   = TOOLTIPS[step];
    var target = document.getElementById(data.targetId);
    if (!target) { showTooltip(step + 1); return; }

    tipEl = document.createElement('div');
    tipEl.className = 'composer-tooltip' + (data.color === 'green' ? ' green' : '');
    tipEl.innerHTML =
      '<button class="composer-tooltip-close" id="tipClose">✕</button>' +
      '<div class="composer-tooltip-inner">' +
        '<div class="composer-tooltip-num">' + data.num + '</div>' +
        '<div class="composer-tooltip-text">' + data.text + '</div>' +
      '</div>';
    document.body.appendChild(tipEl);

    /* Position to the left of the target button, vertically centred */
    function positionTip() {
      var rect = target.getBoundingClientRect();
      var tw   = tipEl.offsetWidth;
      var th   = tipEl.offsetHeight;
      var left = rect.left - tw - 14;
      var top  = rect.top + (rect.height / 2) - (th / 2);
      if (left < 8) left = rect.right + 14; /* flip right if off-screen */
      tipEl.style.left = left + 'px';
      tipEl.style.top  = top  + 'px';
    }
    positionTip();

    document.getElementById('tipClose').addEventListener('click', function() {
      tipEl.style.animation = 'none';
      tipEl.style.opacity   = '0';
      tipEl.style.transform = 'scale(0.94)';
      tipEl.style.transition = 'opacity 0.15s, transform 0.15s';
      setTimeout(function() {
        currentStep++;
        showTooltip(currentStep);
      }, 160);
    });
  }

  /* Hide backdrop on load — tooltips only run inside the modal */
  document.addEventListener('DOMContentLoaded', function() {
    backdrop = document.getElementById('composerTooltipBackdrop');
    if (backdrop) backdrop.style.display = 'none';
  });

  /* Called by nav.js after the modal finishes opening */
  window.composerStartTour = function() {
    backdrop = document.getElementById('composerTooltipBackdrop');

    /* Only show once per session */
    if (sessionStorage.getItem('orro-composer-toured')) return;
    sessionStorage.setItem('orro-composer-toured', '1');

    var composer = document.querySelector('.post-composer');
    if (composer) composer.classList.add('composer-locked');
    if (backdrop) backdrop.style.display = 'block';

    setTimeout(function() { showTooltip(0); }, 400);
  };
})();