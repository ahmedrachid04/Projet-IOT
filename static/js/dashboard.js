// dashboard.js - COMPLETE FIXED VERSION

const API_URL = '/latest/';
const INCIDENT_STATUS_URL = '/incident-status/';
const UPDATE_INCIDENT_URL = '/update-incident/';

// Global permissions object
let userPermissions = {
    user_role: 'visiteur',
    can_edit_op1: false,
    can_edit_op2: false,
    can_edit_op3: false,
    can_comment: false,
    can_accuse_reception: false
};

// ==================== UTILITY FUNCTIONS ====================
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

// ==================== MANUAL DATA SUBMISSION ====================
async function submitManualData() {
    console.log('🚀 submitManualData called');

    const tempInput = document.getElementById('manual-temp');
    const humInput = document.getElementById('manual-hum');

    if (!tempInput || !humInput) {
        console.error('❌ Input elements not found!');
        alert('❌ Erreur: Éléments de formulaire introuvables');
        return;
    }

    const temp = parseFloat(tempInput.value);
    const hum = parseFloat(humInput.value);

    console.log('📊 Values:', { temp, hum });

    if (isNaN(temp) || isNaN(hum)) {
        alert('❌ Veuillez entrer des valeurs valides');
        return;
    }

    if (hum < 0 || hum > 100) {
        alert('❌ L\'humidité doit être entre 0 et 100%');
        return;
    }

    try {
        console.log('🔄 Sending POST request to /api/post/');

        const response = await fetch('/api/post/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ temp: temp, hum: hum })
        });

        console.log('📥 Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Success:', result);

            alert('✅ Données enregistrées avec succès!');
            tempInput.value = '';
            humInput.value = '';

            // Refresh data
            await getData();
            await getIncidentStatus();

            // Optional: reload page after 1 second
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            const errorText = await response.text();
            console.error('❌ Server error:', errorText);
            alert('❌ Erreur lors de l\'enregistrement: ' + response.status);
        }
    } catch (error) {
        console.error('❌ Fetch error:', error);
        alert('❌ Erreur de connexion au serveur: ' + error.message);
    }
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

// ==================== INCIDENT STATUS ====================
async function getIncidentStatus() {
    try {
        const res = await fetch(INCIDENT_STATUS_URL);
        const data = await res.json();

        if (data.permissions) {
            userPermissions = data.permissions;
        }

        const statusEl = document.getElementById('incident-status');
        const detailsEl = document.getElementById('incident-details');
        const compteurEl = document.getElementById('incident-compteur');
        const dateDebutEl = document.getElementById('incident-date-debut');

        if (data.incident_actif) {
            statusEl.textContent = '⚠️ Incident détecté!';
            statusEl.className = 'incident-status-alert';
            detailsEl.classList.remove('incident-details-hidden');
            compteurEl.textContent = data.compteur;

            const dateDebut = new Date(data.date_debut);
            dateDebutEl.textContent = dateDebut.toLocaleString('fr-FR');

            loadOperationState(1, data);
            loadOperationState(2, data);
            loadOperationState(3, data);

            showOperationsBasedOnCounter(data.compteur);
            applyPermissions();

        } else {
            statusEl.textContent = '✅ Pas d\'incidents';
            statusEl.className = 'incident-status-ok';
            detailsEl.classList.add('incident-details-hidden');
            compteurEl.textContent = '0';

            hideAllOperations();
        }
    } catch (e) {
        console.error('Erreur getIncidentStatus:', e);
    }
}

function loadOperationState(opNum, data) {
    const checked = data[`op${opNum}_checked`];
    const comment = data[`op${opNum}_comment`] || '';

    document.getElementById(`op${opNum}-check`).checked = checked;
    document.getElementById(`op${opNum}-comment`).value = comment;
}

function showOperationsBasedOnCounter(compteur) {
    const op1 = document.getElementById('op1-container');
    const op2 = document.getElementById('op2-container');
    const op3 = document.getElementById('op3-container');

    if (compteur >= 1) {
        op1.classList.remove('op1-hidden');
    } else {
        op1.classList.add('op1-hidden');
    }

    if (compteur >= 4) {
        op2.classList.remove('op2-hidden');
    } else {
        op2.classList.add('op2-hidden');
    }

    if (compteur >= 7) {
        op3.classList.remove('op3-hidden');
    } else {
        op3.classList.add('op3-hidden');
    }
}

function hideAllOperations() {
    document.getElementById('op1-container').classList.add('op1-hidden');
    document.getElementById('op2-container').classList.add('op2-hidden');
    document.getElementById('op3-container').classList.add('op3-hidden');
}

function applyPermissions() {
    // Apply permissions for operation 1
    const op1Check = document.getElementById('op1-check');
    const op1Comment = document.getElementById('op1-comment');
    const op1Btn = document.getElementById('op1-btn');

    if (!userPermissions.can_edit_op1) {
        op1Check.disabled = true;
        op1Comment.disabled = true;
        op1Btn.disabled = true;
        op1Btn.style.opacity = '0.5';
        op1Btn.style.cursor = 'not-allowed';
    } else {
        op1Check.disabled = false;
        op1Comment.disabled = false;
        op1Btn.disabled = false;
        op1Btn.style.opacity = '1';
        op1Btn.style.cursor = 'pointer';
    }

    // Apply permissions for operation 2
    const op2Check = document.getElementById('op2-check');
    const op2Comment = document.getElementById('op2-comment');
    const op2Btn = document.getElementById('op2-btn');

    if (!userPermissions.can_edit_op2) {
        op2Check.disabled = true;
        op2Comment.disabled = true;
        op2Btn.disabled = true;
        op2Btn.style.opacity = '0.5';
        op2Btn.style.cursor = 'not-allowed';
    } else {
        op2Check.disabled = false;
        op2Comment.disabled = false;
        op2Btn.disabled = false;
        op2Btn.style.opacity = '1';
        op2Btn.style.cursor = 'pointer';
    }

    // Apply permissions for operation 3
    const op3Check = document.getElementById('op3-check');
    const op3Comment = document.getElementById('op3-comment');
    const op3Btn = document.getElementById('op3-btn');

    if (!userPermissions.can_edit_op3) {
        op3Check.disabled = true;
        op3Comment.disabled = true;
        op3Btn.disabled = true;
        op3Btn.style.opacity = '0.5';
        op3Btn.style.cursor = 'not-allowed';
    } else {
        op3Check.disabled = false;
        op3Comment.disabled = false;
        op3Btn.disabled = false;
        op3Btn.style.opacity = '1';
        op3Btn.style.cursor = 'pointer';
    }
}

// ==================== SAVE OPERATION ====================
async function saveOperation(opNumber) {
    if (opNumber === 1 && !userPermissions.can_edit_op1) {
        alert('❌ Vous n\'avez pas la permission de modifier cette opération');
        return;
    }
    if (opNumber === 2 && !userPermissions.can_edit_op2) {
        alert('❌ Vous n\'avez pas la permission de modifier cette opération');
        return;
    }
    if (opNumber === 3 && !userPermissions.can_edit_op3) {
        alert('❌ Vous n\'avez pas la permission de modifier cette opération');
        return;
    }

    const checkId = `op${opNumber}-check`;
    const commentId = `op${opNumber}-comment`;
    const btnId = `op${opNumber}-btn`;

    const isChecked = document.getElementById(checkId).checked;
    const comment = document.getElementById(commentId).value.trim();

    if (!comment) {
        alert('❌ Veuillez saisir un commentaire obligatoire avant de valider!');
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
            alert(`✅ Opération ${opNumber} enregistrée avec succès!`);
            await getIncidentStatus();
        } else {
            alert('❌ Erreur: ' + (data.error || 'Erreur inconnue'));
        }
    } catch (e) {
        alert('❌ Erreur lors de la sauvegarde: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Dashboard JavaScript loaded');

    // Load theme
    const savedTheme = localStorage.getItem('theme');
    const themeBtn = document.getElementById('theme-toggle');

    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeBtn) themeBtn.textContent = '🌙 Mode Sombre';
    } else {
        if (themeBtn) themeBtn.textContent = '☀️ Mode Clair';
    }

    // Initial data load
    getData();
    getStats();
    getIncidentStatus();

    // Auto-refresh
    setInterval(getData, 10000);
    setInterval(getStats, 30000);
    setInterval(getIncidentStatus, 5000);
});

// Make functions globally available
window.submitManualData = submitManualData;
window.toggleTheme = toggleTheme;
window.saveOperation = saveOperation;