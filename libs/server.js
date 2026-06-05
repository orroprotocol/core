const http = require('http');
const Database = require('better-sqlite3');

const DB_PATH = 'C:/orroprotocol/core/data/orro.db';
const PORT = 3001;

function genCertId() {
    return 'cert_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function parseQuery(url) {
    var qs = url.indexOf('?');
    var query = {};
    if (qs !== -1) {
        url.slice(qs + 1).split('&').forEach(function(p) {
            var kv = p.split('=');
            if (kv[0]) query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
    }
    return query;
}

function readBody(req, cb) {
    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
        try { cb(null, JSON.parse(body || '{}')); }
        catch(e) { cb(e); }
    });
}

http.createServer(function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    var qs    = req.url.indexOf('?');
    var path  = req.url.slice(0, qs === -1 ? undefined : qs);
    var query = parseQuery(req.url);

    /* ── GET /api/certificates?user_id=xxx ── */
    if (path === '/api/certificates' && req.method === 'GET') {
        try {
            var db   = new Database(DB_PATH, { readonly: true });
            var rows = db.prepare(
                'SELECT * FROM certificates WHERE user_id = ? ORDER BY created_at DESC'
            ).all(query.user_id || '');
            db.close();
            console.log('GET /api/certificates →', rows.length, 'records');
            res.end(JSON.stringify(rows));
        } catch(e) {
            console.error('GET error:', e.message);
            res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
        }

    /* ── POST /api/certificates ── */
    } else if (path === '/api/certificates' && req.method === 'POST') {
        readBody(req, function(err, data) {
            if (err) { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON' })); return; }
            try {
                var db = new Database(DB_PATH);
                var newCertId = data.certificate_id || genCertId();
                var stmt = db.prepare(`
                    INSERT INTO certificates
                    (certificate_id, item_type, item_id, user_id,
                     name, artist, artwork, release_date,
                     category, type, genre, series_no,
                     status, mint_date, description, format,
                     tags, private, agree_to_terms, save_signature,
                     signature_strokes, aspect_ratio,
                     reposition_x, reposition_y,
                     crop_x1, crop_y1, crop_x2, crop_y2)
                    VALUES
                    (@certificate_id, @item_type, @item_id, @user_id,
                     @name, @artist, @artwork, @release_date,
                     @category, @type, @genre, @series_no,
                     @status, @mint_date, @description, @format,
                     @tags, @private, @agree_to_terms, @save_signature,
                     @signature_strokes, @aspect_ratio,
                     @reposition_x, @reposition_y,
                     @crop_x1, @crop_y1, @crop_x2, @crop_y2)
                `);
                var result = stmt.run({
                    certificate_id:    newCertId,
                    item_type:         data.item_type         || 'certificate',
                    item_id:           data.item_id           || '',
                    user_id:           data.user_id           || '',
                    name:              data.name              || '',
                    artist:            data.artist            || '',
                    artwork:           data.artwork           || data.name || '',
                    release_date:      data.release_date      || null,
                    category:          data.category          || '',
                    type:              data.type              || '',
                    genre:             data.genre             || '',
                    series_no:         data.series_no         || '',
                    status:            data.status            || 'draft',
                    mint_date:         data.mint_date         || null,
                    description:       data.description       || '',
                    format:            data.format            || '',
                    tags:              data.tags              || null,
                    private:           data.private           || 0,
                    agree_to_terms:    data.agree_to_terms    || 0,
                    save_signature:    data.save_signature    || 0,
                    signature_strokes: data.signature_strokes || null,
                    aspect_ratio:      data.aspect_ratio      || null,
                    reposition_x:      data.reposition_x      || 0.0,
                    reposition_y:      data.reposition_y      || 0.0,
                    crop_x1:           data.crop_x1           || 0.0,
                    crop_y1:           data.crop_y1           || 0.0,
                    crop_x2:           data.crop_x2           || 0.0,
                    crop_y2:           data.crop_y2           || 0.0,
                });
                db.close();
                console.log('POST /api/certificates → inserted id', result.lastInsertRowid, 'cert_id:', newCertId);
                res.writeHead(201);
                res.end(JSON.stringify({ id: result.lastInsertRowid, certificate_id: newCertId }));
            } catch(e) {
                console.error('POST error:', e.message);
                res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
            }
        });

    /* ── PUT /api/certificates/id/:id ── update by integer primary key ── */
    } else if (path.startsWith('/api/certificates/id/') && req.method === 'PUT') {
        var rowId = parseInt(decodeURIComponent(path.replace('/api/certificates/id/', '')));
        readBody(req, function(err, data) {
            if (err) { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON' })); return; }
            try {
                var db = new Database(DB_PATH);
                var stmt = db.prepare(`
                    UPDATE certificates SET
                        name              = @name,
                        artist            = @artist,
                        artwork           = @artwork,
                        release_date      = @release_date,
                        category          = @category,
                        type              = @type,
                        genre             = @genre,
                        status            = @status,
                        mint_date         = @mint_date,
                        description       = @description,
                        format            = @format,
                        tags              = @tags,
                        private           = @private,
                        agree_to_terms    = @agree_to_terms,
                        save_signature    = @save_signature,
                        signature_strokes = @signature_strokes,
                        aspect_ratio      = @aspect_ratio,
                        reposition_x      = @reposition_x,
                        reposition_y      = @reposition_y,
                        crop_x1           = @crop_x1,
                        crop_y1           = @crop_y1,
                        crop_x2           = @crop_x2,
                        crop_y2           = @crop_y2,
                        updated_at        = CURRENT_TIMESTAMP
                    WHERE id = @id
                `);
                var result = stmt.run({
                    id:                rowId,
                    name:              data.name              || '',
                    artist:            data.artist            || '',
                    artwork:           data.artwork           || data.name || '',
                    release_date:      data.release_date      || null,
                    category:          data.category          || '',
                    type:              data.type              || '',
                    genre:             data.genre             || '',
                    status:            data.status            || 'draft',
                    mint_date:         data.mint_date         || null,
                    description:       data.description       || '',
                    format:            data.format            || '',
                    tags:              data.tags              || null,
                    private:           data.private           || 0,
                    agree_to_terms:    data.agree_to_terms    || 0,
                    save_signature:    data.save_signature    || 0,
                    signature_strokes: data.signature_strokes || null,
                    aspect_ratio:      data.aspect_ratio      || null,
                    reposition_x:      data.reposition_x      || 0.0,
                    reposition_y:      data.reposition_y      || 0.0,
                    crop_x1:           data.crop_x1           || 0.0,
                    crop_y1:           data.crop_y1           || 0.0,
                    crop_x2:           data.crop_x2           || 0.0,
                    crop_y2:           data.crop_y2           || 0.0,
                });
                db.close();
                console.log('PUT /api/certificates/id/' + rowId + ' → changed', result.changes, 'row(s)');
                res.end(JSON.stringify({ id: rowId, changes: result.changes }));
            } catch(e) {
                console.error('PUT by id error:', e.message);
                res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
            }
        });

    /* ── PUT /api/certificates/:certificate_id ── */
    } else if (path.startsWith('/api/certificates/') && req.method === 'PUT') {
        var certId = decodeURIComponent(path.replace('/api/certificates/', ''));
        readBody(req, function(err, data) {
            if (err) { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON' })); return; }
            try {
                var db = new Database(DB_PATH);
                var stmt = db.prepare(`
                    UPDATE certificates SET
                        name              = @name,
                        artist            = @artist,
                        artwork           = @artwork,
                        release_date      = @release_date,
                        category          = @category,
                        type              = @type,
                        genre             = @genre,
                        series_no         = @series_no,
                        status            = @status,
                        mint_date         = @mint_date,
                        description       = @description,
                        format            = @format,
                        tags              = @tags,
                        private           = @private,
                        agree_to_terms    = @agree_to_terms,
                        save_signature    = @save_signature,
                        signature_strokes = @signature_strokes,
                        aspect_ratio      = @aspect_ratio,
                        reposition_x      = @reposition_x,
                        reposition_y      = @reposition_y,
                        crop_x1           = @crop_x1,
                        crop_y1           = @crop_y1,
                        crop_x2           = @crop_x2,
                        crop_y2           = @crop_y2,
                        updated_at        = CURRENT_TIMESTAMP
                    WHERE certificate_id  = @certificate_id
                `);
                var result = stmt.run({
                    certificate_id:    certId,
                    name:              data.name              || '',
                    artist:            data.artist            || '',
                    artwork:           data.artwork           || data.name || '',
                    release_date:      data.release_date      || null,
                    category:          data.category          || '',
                    type:              data.type              || '',
                    genre:             data.genre             || '',
                    series_no:         data.series_no         || '',
                    status:            data.status            || 'draft',
                    mint_date:         data.mint_date         || null,
                    description:       data.description       || '',
                    format:            data.format            || '',
                    tags:              data.tags              || null,
                    private:           data.private           || 0,
                    agree_to_terms:    data.agree_to_terms    || 0,
                    save_signature:    data.save_signature    || 0,
                    signature_strokes: data.signature_strokes || null,
                    aspect_ratio:      data.aspect_ratio      || null,
                    reposition_x:      data.reposition_x      || 0.0,
                    reposition_y:      data.reposition_y      || 0.0,
                    crop_x1:           data.crop_x1           || 0.0,
                    crop_y1:           data.crop_y1           || 0.0,
                    crop_x2:           data.crop_x2           || 0.0,
                    crop_y2:           data.crop_y2           || 0.0,
                });
                db.close();
                console.log('PUT /api/certificates/' + certId + ' → changed', result.changes, 'row(s)');
                res.end(JSON.stringify({ changes: result.changes }));
            } catch(e) {
                console.error('PUT error:', e.message);
                res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
            }
        });

    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }

}).listen(PORT, function() {
    console.log('ORRO API running at http://localhost:' + PORT);
});
