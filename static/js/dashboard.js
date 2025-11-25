const API_URL = "/latest/";
const INCIDENT_STATUS_URL = "/incident-status/";
const UPDATE_INCIDENT_URL = "/update-incident/";

// Update live time
function updateTime() {
    const now = new Date();
    document.getElementById('live-time').textContent = now.toLocaleTimeString('fr-FR');
}
setInterval(updateTime, 1000);
updateTime();

// Fetch latest data
async function getData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        // Mettre à jour température et humidité
        document.getElementById('tempValue').textContent = data.temperature.toFixed(1) + '°C';
        document.getElementById('humValue').textContent = data.humidity.toFixed(1) + '%';

        // Calculer le temps écoulé
        const timestamp = new Date(data.timestamp);
        const now = new Date();
        const diffMs = now - timestamp;
        const diffMins = Math.floor(diffMs / 60000);

        let timeText = '';
        if (diffMins < 1) {
            timeText = 'il y a moins d\'une minute';
        } else if (diffMins < 60) {
            timeText = `il y a ${diffMins} min`;
        } else {
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            timeText = `il y a ${hours}h ${mins}min`;
        }

        document.getElementById('tempTime').textContent = timeText;
        document.getElementById('humTime').textContent = timeText;

        document.getElementById('status').textContent = '● Connecté';
        document.getElementById('status').className = 'status-online';

    } catch (e) {
        document.getElementById('status').textContent = '● Erreur: ' + e.message;
        document.getElementById('status').className = 'status-offline';
    }
}

// Fetch incident status
async function getIncidentStatus() {
    try {
        const res = await fetch(INCIDENT_STATUS_URL);
        const data = await res.json();

        const statusEl = document.getElementById('incident-status');
        const detailsEl = document.getElementById('incident-details');
        const compteurEl = document.getElementById('incident-compteur');
        const dateDebutEl = document.getElementById('incident-date-debut');

        if (data.incident_actif) {
            // Incident actif - afficher en rouge
            statusEl.textContent = '⚠️ Incident détecté!';
            statusEl.className = 'incident-status-alert';
            detailsEl.classList.remove('incident-details-hidden');
            compteurEl.textContent = data.compteur;

            // Afficher la date de début
            const dateDebut = new Date(data.date_debut);
            dateDebutEl.textContent = dateDebut.toLocaleString('fr-FR');

            // Charger les états des opérations
            document.getElementById('op1-check').checked = data.op1_checked;
            document.getElementById('op1-comment').value = data.op1_comment || '';
            document.getElementById('op2-check').checked = data.op2_checked;
            document.getElementById('op2-comment').value = data.op2_comment || '';
            document.getElementById('op3-check').checked = data.op3_checked;
            document.getElementById('op3-comment').value = data.op3_comment || '';

            // Afficher les opérations selon le compteur
            if (data.compteur >= 1) {
                document.getElementById('op1-container').classList.remove('op1-hidden');
            }
            if (data.compteur >= 4) {
                document.getElementById('op2-container').classList.remove('op2-hidden');
            }
            if (data.compteur >= 7) {
                document.getElementById('op3-container').classList.remove('op3-hidden');
            }
        } else {
            // Pas d'incident - afficher en vert
            statusEl.textContent = '✅ Pas d\'incidents';
            statusEl.className = 'incident-status-ok';
            detailsEl.classList.add('incident-details-hidden');
            compteurEl.textContent = '0';

            // Masquer toutes les opérations
            document.getElementById('op1-container').classList.add('op1-hidden');
            document.getElementById('op2-container').classList.add('op2-hidden');
            document.getElementById('op3-container').classList.add('op3-hidden');
        }
    } catch (e) {
        console.error('Erreur lors de la récupération du statut d\'incident:', e);
    }
}

// Vérifier si température > 25 et créer incident si nécessaire
async function checkTemperatureAlert() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        const temp = parseFloat(data.temperature);

        // Si température > 25, vérifier l'état de l'incident
        if (temp > 25) {
            // Rafraîchir le statut d'incident
            await getIncidentStatus();
        }
    } catch (e) {
        console.error('Erreur lors de la vérification de température:', e);
    }
}

// Save incident operations
async function saveIncident() {
    const op1 = document.getElementById('op1-check').checked;
    const op2 = document.getElementById('op2-check').checked;
    const op3 = document.getElementById('op3-check').checked;
    const comment1 = document.getElementById('op1-comment').value;
    const comment2 = document.getElementById('op2-comment').value;
    const comment3 = document.getElementById('op3-comment').value;

    try {
        const response = await fetch(UPDATE_INCIDENT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                op1_checked: op1,
                op1_comment: comment1,
                op2_checked: op2,
                op2_comment: comment2,
                op3_checked: op3,
                op3_comment: comment3
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Opérations enregistrées avec succès!');
        } else {
            alert('❌ Erreur: ' + (data.error || 'Erreur inconnue'));
        }
    } catch (e) {
        alert('❌ Erreur lors de la sauvegarde: ' + e.message);
    }
}

// Get CSRF token from cookies
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

// Fetch all data for stats
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

// Auto-refresh
getData();
getStats();
getIncidentStatus();
checkTemperatureAlert();

setInterval(getData, 10000); // Every 10 seconds
setInterval(getStats, 30000); // Every 30 seconds
setInterval(getIncidentStatus, 5000); // Every 5 seconds
setInterval(checkTemperatureAlert, 5000); // Every 5 seconds - vérifie température