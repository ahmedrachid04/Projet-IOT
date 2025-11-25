let humChart = null;
let currentPeriod = 'all';
let allData = null;

// Chart.js default colors for dark theme
Chart.defaults.color = '#e0e0e0';
Chart.defaults.borderColor = '#3a3a3a';

// Get URL based on period
function getUrl(period) {
    switch(period) {
        case 'jour': return '/chart-data-jour/';
        case 'semaine': return '/chart-data-semaine/';
        case 'mois': return '/chart-data-mois/';
        default: return '/chart-data/';
    }
}

// Load humidity data
async function loadData(period) {
    currentPeriod = period;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });

    // Show/hide date picker
    if (period === 'custom') {
        document.getElementById('datePickerContainer').style.display = 'block';
        return;
    } else {
        document.getElementById('datePickerContainer').style.display = 'none';
    }

    try {
        const response = await fetch(getUrl(period));
        const data = await response.json();

        if (data.humidity && data.humidity.length > 0) {
            allData = data;
            updateChart(data);
            updateStats(data);
            document.getElementById('data-count').textContent =
                `${data.humidity.length} mesures affichées`;
        } else {
            document.getElementById('data-count').textContent =
                'Aucune donnée disponible pour cette période';
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        document.getElementById('data-count').textContent =
            'Erreur lors du chargement des données';
    }
}

// Apply custom date range
async function applyCustomDates() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        alert('Veuillez sélectionner une date de début et de fin');
        return;
    }

    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();

    if (startTime >= endTime) {
        alert('La date de début doit être avant la date de fin');
        return;
    }

    try {
        // Load all data and filter by date
        const response = await fetch('/chart-data/');
        const data = await response.json();

        // Filter data by date range
        const filteredData = {
            temps: [],
            temperature: [],
            humidity: []
        };

        for (let i = 0; i < data.temps.length; i++) {
            const dataTime = new Date(data.temps[i]).getTime();
            if (dataTime >= startTime && dataTime <= endTime) {
                filteredData.temps.push(data.temps[i]);
                filteredData.temperature.push(data.temperature[i]);
                filteredData.humidity.push(data.humidity[i]);
            }
        }

        if (filteredData.humidity.length > 0) {
            allData = filteredData;
            updateChart(filteredData);
            updateStats(filteredData);
            document.getElementById('data-count').textContent =
                `${filteredData.humidity.length} mesures affichées`;
        } else {
            alert('Aucune donnée trouvée pour cette période');
        }

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement des données');
    }
}

// Reset zoom
function resetZoom() {
    if (humChart) {
        humChart.resetZoom();
    }
}

// Update chart
function updateChart(data) {
    const labels = data.temps.map(t => {
        const date = new Date(t);
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    });

    // Destroy existing chart
    if (humChart) {
        humChart.destroy();
    }

    const ctx = document.getElementById('humChart').getContext('2d');
    humChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Humidité (%)',
                data: data.humidity,
                borderColor: '#4ecdc4',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#4ecdc4',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                title: {
                    display: true,
                    text: 'Humidité au fil du temps',
                    color: '#fff',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    padding: 20
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#4ecdc4',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return 'Humidité: ' + context.parsed.y.toFixed(1) + '%';
                        }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.1
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    },
                    pan: {
                        enabled: true,
                        mode: 'x'
                    },
                    limits: {
                        x: {min: 'original', max: 'original'}
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Humidité (%)',
                        color: '#e0e0e0',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#e0e0e0',
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return value.toFixed(0) + '%';
                        }
                    },
                    grid: {
                        color: '#3a3a3a',
                        drawBorder: false
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date et Heure',
                        color: '#e0e0e0',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#e0e0e0',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: '#3a3a3a',
                        drawBorder: false
                    }
                }
            }
        }
    });
}

// Update statistics
function updateStats(data) {
    const hums = data.humidity;

    if (hums.length > 0) {
        const current = hums[hums.length - 1];
        const avg = hums.reduce((a, b) => a + b, 0) / hums.length;
        const min = Math.min(...hums);
        const max = Math.max(...hums);

        document.getElementById('current-hum').textContent = current.toFixed(1) + '%';
        document.getElementById('avg-hum').textContent = avg.toFixed(1) + '%';
        document.getElementById('min-hum').textContent = min.toFixed(1) + '%';
        document.getElementById('max-hum').textContent = max.toFixed(1) + '%';
    }
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            loadData(this.dataset.period);
        });
    });

    // Set default date values
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    document.getElementById('endDate').value = now.toISOString().slice(0, 16);
    document.getElementById('startDate').value = yesterday.toISOString().slice(0, 16);

    // Load initial data
    loadData('all');
});