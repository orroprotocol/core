/* ══════════════════════════════════════════════════════
  AUTOMATION ENGINE SCRIPT
══════════════════════════════════════════════════════ */

const db = require('./db'); // your better-sqlite3 or similar connection

let isRunning = false;
let currentCycleId = null;

/**
 * Start the automation engine
 */
async function startAutomationEngine() {
    if (isRunning) return;
    isRunning = true;

    console.log("🚀 ORRO Automation Engine started...");

    // Create new uptime cycle record
    const cycle = db.prepare(`
        INSERT INTO cycles (cycle_start, last_heartbeat)
        VALUES (unixepoch(), unixepoch())
        RETURNING id
    `).get();

    currentCycleId = cycle.id;

    // Main loop
    while (isRunning) {
        const now = Math.floor(Date.now() / 1000); // current Unix timestamp

        try {
            // Update heartbeat
            db.prepare("UPDATE cycles SET last_heartbeat = ? WHERE id = ?")
                .run(now, currentCycleId);

            // Find due tasks (with 60-second tolerance window)
            const dueTasks = db.prepare(`
                SELECT * FROM automations 
                WHERE scheduled_for <= ? 
                  AND scheduled_for >= ? 
                  AND status = 'pending'
                ORDER BY scheduled_for ASC
                LIMIT 50
            `).all(now, now - 300); // 5 minute grace period for missed tasks

            for (const task of dueTasks) {
                await executeTask(task);
            }

        } catch (error) {
            console.error("Automation loop error:", error);
            await logAutomationEvent('error', 'Automation loop crashed', { error: error.message });
        }

        // Sleep ~8 seconds
        await new Promise(resolve => setTimeout(resolve, 8000));
    }
}

/**
 * Execute a single scheduled task
 */
async function executeTask(task) {
    try {
        console.log(`Executing automation: ${task.automation_id} | ${task.item_type} | ${task.action_type}`);

        let success = false;

        switch (task.item_type) {
            case 'project':
                success = await handleProjectAutomation(task);
                break;
            case 'fragment':
                success = await handleFragmentAutomation(task);
                break;
            case 'certificate':
                success = await handleCertificateAutomation(task);
                break;
            case 'agreement':
                success = await handleAgreementAutomation(task);
                break;
            case 'watermark':
                success = await handleWatermarkAutomation(task);
                break;
            default:
                console.warn(`Unknown item_type: ${task.item_type}`);
        }

        if (success) {
            db.prepare("UPDATE automations SET status = 'executed', updated_at = unixepoch() WHERE id = ?")
                .run(task.id);
        } else {
            db.prepare("UPDATE automations SET status = 'failed', updated_at = unixepoch() WHERE id = ?")
                .run(task.id);
        }

    } catch (error) {
        console.error(`Failed to execute task ${task.automation_id}:`, error);
        db.prepare("UPDATE automations SET status = 'failed', updated_at = unixepoch() WHERE id = ?")
            .run(task.id);

        await logAutomationEvent('error', `Task execution failed`, {
            automation_id: task.automation_id,
            item_type: task.item_type,
            error: error.message
        });
    }
}

/* ==================== Task Handlers ==================== */

async function handleProjectAutomation(task) {
    // Example: Publish a scheduled project
    if (task.action_type === 'publish') {
        // Add your publish logic here
        console.log(`Publishing project: ${task.item_id}`);
        return true;
    }
    return false;
}

async function handleFragmentAutomation(task) {
    if (task.action_type === 'mint') {
        console.log(`Minting fragment: ${task.item_id}`);
        // Call your minting function
        return true;
    }
    return false;
}

async function handleCertificateAutomation(task) {
    if (task.action_type === 'issue') {
        console.log(`Issuing certificate: ${task.item_id}`);
        return true;
    }
    return false;
}

async function handleAgreementAutomation(task) {
    if (task.action_type === 'activate') {
        console.log(`Activating agreement: ${task.item_id}`);
        return true;
    }
    return false;
}

async function handleWatermarkAutomation(task) {
    if (task.action_type === 'apply') {
        console.log(`Applying watermark: ${task.item_id}`);
        return true;
    }
    return false;
}

/**
 * Log important events
 */
async function logAutomationEvent(eventType, message, details = {}) {
    db.prepare(`
        INSERT INTO automation_logs (event_type, message, details)
        VALUES (?, ?, ?)
    `).run(eventType, message, JSON.stringify(details));
}

/**
 * Schedule or update an automation
 */
async function scheduleAutomation(userId, itemType, itemId, scheduledFor, actionType, payload = {}) {
    const automationId = `auto_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;

    const existing = db.prepare(
        "SELECT id FROM automations WHERE item_type = ? AND item_id = ? AND status = 'pending'"
    ).get(itemType, itemId);

    if (existing) {
        db.prepare(`
            UPDATE automations 
            SET scheduled_for = ?, action_type = ?, payload = ?, status = 'pending', updated_at = unixepoch()
            WHERE id = ?
        `).run(scheduledFor, actionType, JSON.stringify(payload), existing.id);
    } else {
        db.prepare(`
            INSERT INTO automations 
            (automation_id, user_id, item_type, item_id, action_type, scheduled_for, payload)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(automationId, userId, itemType, itemId, actionType, scheduledFor, JSON.stringify(payload));
    }

    return automationId;
}

/**
 * Stop the engine (graceful shutdown)
 */
function stopAutomationEngine() {
    isRunning = false;
    console.log("⛔ ORRO Automation Engine stopped.");
}

module.exports = {
    startAutomationEngine,
    stopAutomationEngine,
    scheduleAutomation,
    logAutomationEvent
};
