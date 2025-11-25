let tempChart, humChart;

// Chart.js default colors for dark theme
Chart.defaults.color = '#e0e0e0';
Chart.defaults.borderColor = '#3a3a3a';

function loadData(period) {
    // Update active button
    document.querySelectorAll('.btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Define URL based on period
    let url = '/chart-data/';
    if (period === 'jour') url = '/chart-data-jour/';
    if (period === 'semaine') url = '/chart-data-semaine/';
    if (period === 'mois') url = '/chart-data-mois/';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            updateCharts(data);
        })
        .catch(error => console.error('Erreur:', error));
}

function updateCharts(data) {
    const labels = data.temps.map(t => new Date(t).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }));

    // Destroy old charts if they exist
    if (tempChart) tempChart.destroy();
    if (humChart) humChart.destroy();

    // Temperature chart
    const ctxTemp = document.getElementById('tempChart').getContext('2d');
    tempChart = new Chart(ctxTemp, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Température (°C)',
                data: data.temperature,
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#ff6b6b'
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
                            size: 14
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Température au fil du temps',
                    color: '#fff',
                    font: {
                        size: 18
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Température (°C)',
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    },
                    grid: {
                        color: '#3a3a3a'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date et Heure',
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    },
                    grid: {
                        color: '#3a3a3a'
                    }
                }
            }
        }
    });

    // Humidity chart
    const ctxHum = document.getElementById('humChart').getContext('2d');
    humChart = new Chart(ctxHum, {
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
                pointRadius: 3,
                pointBackgroundColor: '#4ecdc4'
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
                            size: 14
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Humidité au fil du temps',
                    color: '#fff',
                    font: {
                        size: 18
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
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    },
                    grid: {
                        color: '#3a3a3a'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date et Heure',
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    },
                    grid: {
                        color: '#3a3a3a'
                    }
                }
            }
        }
    });
}

// Load all data on startup
loadData('all');