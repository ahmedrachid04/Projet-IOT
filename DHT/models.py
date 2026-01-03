from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class Dht11(models.Model):
    temp = models.FloatField(null=True)
    hum = models.FloatField(null=True)
    dt = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"Temperature: {self.temp}°C, Humidity: {self.hum}% at {self.dt}"


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('operateur1', 'Operateur 1'),
        ('operateur2', 'Operateur 2'),
        ('operateur3', 'Operateur 3'),
        ('visiteur', 'Visiteur'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='visiteur')
    full_name = models.CharField(max_length=200, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"


class TemperatureThreshold(models.Model):
    min_temp = models.FloatField(default=2.0)
    max_temp = models.FloatField(default=8.0)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = "Seuil de Température"
        verbose_name_plural = "Seuils de Température"

    def __str__(self):
        return f"Min: {self.min_temp}°C, Max: {self.max_temp}°C"


class Incident(models.Model):
    STATUS_CHOICES = [
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
    ]

    date_debut = models.DateTimeField(auto_now_add=True)
    date_fin = models.DateTimeField(null=True, blank=True)
    compteur = models.IntegerField(default=0)
    last_increment = models.DateTimeField(null=True, blank=True)
    actif = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_cours')

    # Temperature and humidity at incident creation
    temperature = models.FloatField(null=True, blank=True)
    humidity = models.FloatField(null=True, blank=True)

    # Accusé de réception
    accuse_reception = models.BooleanField(default=False)
    accuse_reception_operateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='accuse_reception_incidents')
    accuse_reception_date = models.DateTimeField(null=True, blank=True)

    # Opérations correctives avec noms
    nom_op1 = models.CharField(max_length=200, default="Opération Corrective 1")
    op1_checked = models.BooleanField(default=False)
    op1_comment = models.TextField(blank=True, null=True)
    op1_operateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='op1_incidents')
    op1_date = models.DateTimeField(null=True, blank=True)

    nom_op2 = models.CharField(max_length=200, default="Opération Corrective 2")
    op2_checked = models.BooleanField(default=False)
    op2_comment = models.TextField(blank=True, null=True)
    op2_operateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='op2_incidents')
    op2_date = models.DateTimeField(null=True, blank=True)

    nom_op3 = models.CharField(max_length=200, default="Opération Corrective 3")
    op3_checked = models.BooleanField(default=False)
    op3_comment = models.TextField(blank=True, null=True)
    op3_operateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='op3_incidents')
    op3_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_debut']

    def __str__(self):
        return f"Incident {self.id} - Compteur: {self.compteur}"

    def save(self, *args, **kwargs):
        # Set temperature and humidity from latest reading if not set
        if not self.temperature or not self.humidity:
            latest = Dht11.objects.order_by('-dt').first()
            if latest:
                self.temperature = latest.temp
                self.humidity = latest.hum
        super().save(*args, **kwargs)


class IncidentComment(models.Model):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on Incident {self.incident.id}"


class ArchiveIncident(models.Model):
    STATUS_CHOICES = [
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
    ]

    date_debut = models.DateTimeField(default=timezone.now)
    date_fin = models.DateTimeField(default=timezone.now)
    compteur = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='termine')

    # Temperature and humidity at incident time
    temperature = models.FloatField(null=True, blank=True)
    humidity = models.FloatField(null=True, blank=True)

    nom_op1 = models.CharField(max_length=200, default="")
    op1_checked = models.BooleanField(default=False)
    op1_comment = models.TextField(blank=True, null=True, default="")
    op1_operateur_name = models.CharField(max_length=200, default="")
    op1_date = models.DateTimeField(null=True, blank=True)

    nom_op2 = models.CharField(max_length=200, default="")
    op2_checked = models.BooleanField(default=False)
    op2_comment = models.TextField(blank=True, null=True, default="")
    op2_operateur_name = models.CharField(max_length=200, default="")
    op2_date = models.DateTimeField(null=True, blank=True)

    nom_op3 = models.CharField(max_length=200, default="")
    op3_checked = models.BooleanField(default=False)
    op3_comment = models.TextField(blank=True, null=True, default="")
    op3_operateur_name = models.CharField(max_length=200, default="")
    op3_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_debut']

    def __str__(self):
        return f"Archived Incident {self.id} - {self.date_debut}"