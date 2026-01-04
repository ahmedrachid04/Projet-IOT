// dashboard.js - COMPLETE FIX: NO ALERT POPUPS

const API_URL = '/latest/';
const API_POST_URL = '/api/manual-entry/';
const INCIDENT_STATUS_URL = '/incident-status/';
const UPDATE_INCIDENT_URL = '/update-incident/';

let userPermissions = {
    user_role: 'visiteur',
    can_edit_op1: false,
    can_edit_op2: false,
    can_edit_op3: false,
    can_comment: false,
    can_accuse_reception: false
};

let currentIncidentId = null;

// ==================== DARK MODE ====================
function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('theme-toggle');
    body.classList.toggle('light-mode');

    if (body.classList.contains('light-mode')) {
        themeBtn.textContent = '🌙 Mode Sombre';
        localStorage.setItem('theme', 'light');
    } else {
        themeBtn.textContent = '☀️ Mode Clair';
        localStorage.setItem('theme', 'dark');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    const themeBtn = document.getElementById('theme-toggle');

    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeBtn.textContent = '🌙 Mode Sombre';
    } else {
        themeBtn.textContent = '☀️ Mode Clair';
    }
});

// ==================== MANUAL DATA SUBMISSION - NO POPUP ====================
async function submitManualData() {
    console.log('🔵 submitManualData appelée');

    const tempInput = document.getElementById('manual-temp');
    const humInput = document.getElementById('manual-hum');

    const temp = parseFloat(tempInput.value);
    const hum = parseFloat(humInput.value);

    console.log(`📊 Valeurs entrées: Temp=${temp}°C, Hum=${hum}%`);

    if (isNaN(temp) || isNaN(hum)) {
        console.log('❌ Valeurs invalides');
        return;
    }

    try {
        console.log('📤 Envoi de la requête POST à', API_POST_URL);

        const response = await fetch(API_POST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ temp: temp, hum: hum })
        });

        console.log('📥 Réponse reçue:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Données enregistrées:', result);

            // Clear inputs
            tempInput.value = '';
            humInput.value = '';

            console.log('⏳ Attente de 2 secondes avant rafraîchissement...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('🔄 Rafraîchissement des données...');
            await getData();
            await getIncidentStatus();
        } else {
            const error = await response.text();
            console.error('❌ Erreur serveur:', error);
        }
    } catch (error) {
        console.error('❌ Erreur critique:', error);
    }
}

// ==================== INCIDENT STATUS ====================
async function getIncidentStatus() {
    try {
        console.log('🔍 Vérification du statut de l\'incident...');
        const res = await fetch(INCIDENT_STATUS_URL);
        const data = await res.json();

        console.log('📊 Statut incident reçu:', data);

        if (data.permissions) {
            userPermissions = data.permissions;
        }

        const statusEl = document.getElementById('incident-status');
        const detailsEl = document.getElementById('incident-details');
        const compteurEl = document.getElementById('incident-compteur');
        const dateDebutEl = document.getElementById('incident-date-debut');
        const tempEl = document.getElementById('incident-temperature');
        const humEl = document.getElementById('incident-humidity');

        if (data.incident_actif) {
            console.log('🚨 INCIDENT ACTIF - Compteur:', data.compteur);
            currentIncidentId = data.id;

            statusEl.textContent = '⚠️ Incident détecté!';
            statusEl.className = 'incident-status-alert';
            detailsEl.classList.remove('incident-details-hidden');
            compteurEl.textContent = data.compteur;

            const dateDebut = new Date(data.date_debut);
            dateDebutEl.textContent = dateDebut.toLocaleString('fr-FR');

            if (data.temperature !== null && data.temperature !== undefined) {
                tempEl.textContent = data.temperature.toFixed(1);
            }
            if (data.humidity !== null && data.humidity !== undefined) {
                humEl.textContent = data.humidity.toFixed(1);
            }

            loadOperationState(1, data);
            loadOperationState(2, data);
            loadOperationState(3, data);
            showOperationsBasedOnCounter(data.compteur);
            applyPermissions();

        } else {
            console.log('✅ PAS D\'INCIDENT ACTIF');
            currentIncidentId = null;

            statusEl.textContent = '✅ Pas d\'incidents';
            statusEl.className = 'incident-status-ok';
            detailsEl.classList.add('incident-details-hidden');
            compteurEl.textContent = '0';

            hideAllOperations();
        }
    } catch (e) {
        console.error('❌ Erreur getIncidentStatus:', e);
    }
}

// ==================== OPERATIONS ====================
function loadOperationState(opNum, data) {
    const checked = data[`op${opNum}_checked`];
    const comment = data[`op${opNum}_comment`] || '';

    document.getElementById(`op${opNum}-check`).checked = checked;
    document.getElementById(`op${opNum}-comment`).value = comment;
}

function showOperationsBasedOnCounter(compteur) {
    console.log(`📋 Affichage des opérations pour compteur=${compteur}`);

    const op1 = document.getElementById('op1-container');
    const op2 = document.getElementById('op2-container');
    const op3 = document.getElementById('op3-container');

    if (compteur >= 1) {
        console.log('✅ Op1 visible');
        op1.classList.remove('op1-hidden');
    } else {
        op1.classList.add('op1-hidden');
    }

    if (compteur >= 4) {
        console.log('✅ Op2 visible');
        op2.classList.remove('op2-hidden');
    } else {
        op2.classList.add('op2-hidden');
    }

    if (compteur >= 7) {
        console.log('✅ Op3 visible');
        op3.classList.remove('op3-hidden');
    } else {
        op3.classList.add('op3-hidden');
    }
}

function hideAllOperations() {
    console.log('🔒 Masquage de toutes les opérations');
    document.getElementById('op1-container').classList.add('op1-hidden');
    document.getElementById('op2-container').classList.add('op2-hidden');
    document.getElementById('op3-container').classList.add('op3-hidden');
}

function applyPermissions() {
    for (let opNum = 1; opNum <= 3; opNum++) {
        const canEdit = userPermissions[`can_edit_op${opNum}`];
        const check = document.getElementById(`op${opNum}-check`);
        const comment = document.getElementById(`op${opNum}-comment`);
        const btn = document.getElementById(`op${opNum}-btn`);

        if (!canEdit) {
            check.disabled = true;
            comment.disabled = true;
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        } else {
            check.disabled = false;
            comment.disabled = false;
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    }
}

async function saveOperation(opNumber) {
    if (opNumber === 1 && !userPermissions.can_edit_op1) {
        console.log('❌ Pas de permission pour op1');
        return;
    }
    if (opNumber === 2 && !userPermissions.can_edit_op2) {
        console.log('❌ Pas de permission pour op2');
        return;
    }
    if (opNumber === 3 && !userPermissions.can_edit_op3) {
        console.log('❌ Pas de permission pour op3');
        return;
    }

    const checkId = `op${opNumber}-check`;
    const commentId = `op${opNumber}-comment`;
    const btnId = `op${opNumber}-btn`;

    const isChecked = document.getElementById(checkId).checked;
    const comment = document.getElementById(commentId).value.trim();

    if (!comment) {
        console.log('❌ Commentaire obligatoire');
        return;
    }

    const btn = document.getElementById(btnId);
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Enregistrement...';

    try {
        const payload = {
            [`op${opNumber}_checked`]: isChecked,
            [`op${opNumber}_comment`]: comment
        };

        const response = await fetch(UPDATE_INCIDENT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            console.log(`✅ Opération ${opNumber} enregistrée`);
            await getIncidentStatus();
        } else {
            console.error('❌ Erreur:', data.error);
        }
    } catch (e) {
        console.error('❌ Erreur:', e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// ==================== UTILITY FUNCTIONS ====================
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    const hours = diffHour;
    const minutes = diffMin % 60;
    const seconds = diffSec % 60;

    let result = 'il y a ';
    if (hours > 0) result += hours + ' heure' + (hours > 1 ? 's' : '') + ' ';
    if (minutes > 0) result += minutes + ' minute' + (minutes > 1 ? 's' : '') + ' ';
    if (seconds > 0 || (hours === 0 && minutes === 0)) {
        result += seconds + ' seconde' + (seconds > 1 ? 's' : '');
    }
    return result.trim();
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// ==================== FETCH LATEST DATA ====================
async function getData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        document.getElementById('current-temp').textContent = data.temperature.toFixed(1) + '°C';
        document.getElementById('current-hum').textContent = data.humidity.toFixed(1) + '%';

        const timeAgo = getTimeAgo(new Date(data.timestamp));
        document.getElementById('last-update').textContent = 'Mis à jour ' + timeAgo;
        document.getElementById('last-update-hum').textContent = 'Mis à jour ' + timeAgo;

        document.getElementById('status').className = 'stat-value status-online';
        document.getElementById('status').textContent = '● En ligne';

    } catch (e) {
        console.error('Erreur getData:', e);
        document.getElementById('status').className = 'stat-value status-offline';
        document.getElementById('status').textContent = '● Hors ligne';
    }
}

// ==================== FETCH STATISTICS ====================
async function getStats() {
    try {
        const res = await fetch('/api/');
        const result = await res.json();
        const data = result.data;

        document.getElementById('total-records').textContent = data.length;

        if (data.length > 0) {
            const temps = data.map(d => d.temp);
            const hums = data.map(d => d.hum);

            const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
            const avgHum = (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1);

            document.getElementById('avg-temp').textContent = avgTemp + '°C';
            document.getElementById('avg-hum').textContent = avgHum + '%';
        }
    } catch (e) {
        console.error('Erreur stats:', e);
    }
}

// ==================== INITIALIZATION ====================
console.log('🚀 Initialisation du dashboard...');
getData();
getStats();
getIncidentStatus();

// Auto-refresh
setInterval(getData, 10000);
setInterval(getStats, 30000);
setInterval(getIncidentStatus, 5000);