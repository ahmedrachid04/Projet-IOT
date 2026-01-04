from DHT.models import Incident, TemperatureThreshold

print('Thresholds:')
t = TemperatureThreshold.objects.first()
if t:
    print(f'Min: {t.min_temp}, Max: {t.max_temp}')
else:
    print('No threshold set')

print('Incidents:')
for i in Incident.objects.all():
    print(f'ID: {i.id}, Temp: {i.temperature}, Hum: {i.humidity}, Actif: {i.actif}')

print('Latest DHT data:')
from DHT.models import Dht11
latest = Dht11.objects.order_by('-dt').first()
if latest:
    print(f'ID: {latest.id}, Temp: {latest.temp}, Hum: {latest.hum}, DT: {latest.dt}')
else:
    print('No data')