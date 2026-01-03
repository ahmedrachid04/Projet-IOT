from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    Dht11, UserProfile, TemperatureThreshold,
    Incident, IncidentComment, ArchiveIncident
)


# Inline for UserProfile
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profil'
    fields = ['role', 'full_name', 'phone_number']


# Extended User Admin
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ['username', 'email', 'get_role', 'get_full_name', 'get_phone', 'is_staff', 'is_active']
    list_filter = ['is_staff', 'is_active', 'profile__role']
    search_fields = ['username', 'email', 'profile__full_name', 'profile__phone_number']

    def get_role(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.get_role_display()
        return '-'

    get_role.short_description = 'Rôle'

    def get_full_name(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.full_name or '-'
        return '-'

    get_full_name.short_description = 'Nom Complet'

    def get_phone(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.phone_number or '-'
        return '-'

    get_phone.short_description = 'Téléphone'


# Unregister default User admin and register custom one
admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'full_name', 'phone_number']
    list_filter = ['role']
    search_fields = ['user__username', 'full_name', 'phone_number']


@admin.register(Dht11)
class Dht11Admin(admin.ModelAdmin):
    list_display = ['id', 'temp', 'hum', 'dt']
    list_filter = ['dt']
    search_fields = ['temp', 'hum']
    ordering = ['-dt']
    readonly_fields = ['dt']


@admin.register(TemperatureThreshold)
class TemperatureThresholdAdmin(admin.ModelAdmin):
    list_display = ['min_temp', 'max_temp', 'updated_at', 'updated_by']
    readonly_fields = ['updated_at']

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    def has_add_permission(self, request):
        # Only allow one threshold object
        return not TemperatureThreshold.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # Don't allow deletion
        return False


class IncidentCommentInline(admin.TabularInline):
    model = IncidentComment
    extra = 0
    readonly_fields = ['author', 'created_at']
    fields = ['author', 'content', 'created_at']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'date_debut', 'compteur', 'status', 'temperature', 'humidity',
        'op1_status', 'op2_status', 'op3_status'
    ]
    list_filter = ['status', 'actif', 'date_debut']
    search_fields = ['id', 'compteur']
    readonly_fields = ['date_debut', 'last_increment', 'temperature', 'humidity']
    inlines = [IncidentCommentInline]

    fieldsets = (
        ('Informations Générales', {
            'fields': ('date_debut', 'date_fin', 'compteur', 'last_increment',
                       'status', 'actif', 'temperature', 'humidity')
        }),
        ('Opération Corrective 1', {
            'fields': ('nom_op1', 'op1_checked', 'op1_comment',
                       'op1_operateur', 'op1_date')
        }),
        ('Opération Corrective 2', {
            'fields': ('nom_op2', 'op2_checked', 'op2_comment',
                       'op2_operateur', 'op2_date')
        }),
        ('Opération Corrective 3', {
            'fields': ('nom_op3', 'op3_checked', 'op3_comment',
                       'op3_operateur', 'op3_date')
        }),
    )

    def op1_status(self, obj):
        if obj.op1_checked:
            return '✅'
        return '❌'

    op1_status.short_description = 'Op1'

    def op2_status(self, obj):
        if obj.op2_checked:
            return '✅'
        return '❌'

    op2_status.short_description = 'Op2'

    def op3_status(self, obj):
        if obj.op3_checked:
            return '✅'
        return '❌'

    op3_status.short_description = 'Op3'


@admin.register(IncidentComment)
class IncidentCommentAdmin(admin.ModelAdmin):
    list_display = ['incident', 'author', 'content_preview', 'created_at']
    list_filter = ['created_at', 'author']
    search_fields = ['content', 'author__username', 'incident__id']
    readonly_fields = ['created_at']

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content

    content_preview.short_description = 'Contenu'


@admin.register(ArchiveIncident)
class ArchiveIncidentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'date_debut', 'date_fin', 'compteur', 'status',
        'temperature', 'humidity'
    ]
    list_filter = ['status', 'date_debut']
    search_fields = ['id', 'compteur']
    readonly_fields = ['date_debut', 'date_fin']

    fieldsets = (
        ('Informations Générales', {
            'fields': ('date_debut', 'date_fin', 'compteur', 'status',
                       'temperature', 'humidity')
        }),
        ('Opération 1', {
            'fields': ('nom_op1', 'op1_checked', 'op1_comment',
                       'op1_operateur_name', 'op1_date')
        }),
        ('Opération 2', {
            'fields': ('nom_op2', 'op2_checked', 'op2_comment',
                       'op2_operateur_name', 'op2_date')
        }),
        ('Opération 3', {
            'fields': ('nom_op3', 'op3_checked', 'op3_comment',
                       'op3_operateur_name', 'op3_date')
        }),
    )


# Customize admin site
admin.site.site_header = "Administration DHT11 IoT"
admin.site.site_title = "DHT11 Admin"
admin.site.index_title = "Gestion du Système IoT"