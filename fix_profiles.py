import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projet.settings')
django.setup()

from django.contrib.auth.models import User
from DHT.models import UserProfile

print("🔧 Fixing user profiles...\n")

users_config = [
    {'username': 'admin', 'role': 'admin', 'full_name': 'Administrateur'},
    {'username': 'op1', 'role': 'operateur1', 'full_name': 'Opérateur 1'},
    {'username': 'op2', 'role': 'operateur2', 'full_name': 'Opérateur 2'},
    {'username': 'op3', 'role': 'operateur3', 'full_name': 'Opérateur 3'},
    {'username': 'visiteur', 'role': 'visiteur', 'full_name': 'Visiteur'},
]

for config in users_config:
    username = config['username']

    try:
        user = User.objects.get(username=username)
        print(f"ℹ️  User '{username}' exists")

        if config['role'] == 'admin':
            user.is_staff = True
            user.is_superuser = True
            user.save()
            print(f"   ✅ Set admin permissions")

    except User.DoesNotExist:
        user = User.objects.create_user(username=username, password=f"{username}123")

        if config['role'] == 'admin':
            user.is_staff = True
            user.is_superuser = True
            user.save()

        print(f"✅ Created user '{username}'")

    try:
        profile = user.profile
        print(f"   ℹ️  Profile exists with role: {profile.role}")

        if profile.role != config['role']:
            profile.role = config['role']
            profile.full_name = config['full_name']
            profile.save()
            print(f"   ✅ Updated role to: {config['role']}")

    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(
            user=user,
            role=config['role'],
            full_name=config['full_name'],
            email=f"{username}@example.com",
            phone_number=''
        )
        print(f"   ✅ Created profile with role: {config['role']}")

    print()

print("=" * 60)
print("📊 FINAL USER LIST:")
print("=" * 60)

for user in User.objects.all().order_by('username'):
    if hasattr(user, 'profile'):
        role = user.profile.role
        status = "✅"
    else:
        role = "NO PROFILE"
        status = "❌"

    print(f"{status} {user.username:12} | Role: {role:15}")

print("=" * 60)
print("\n🎉 Done! Login credentials:")
print("   admin / admin123")
print("   op1 / op1123")
print("   op2 / op2123")
print("   op3 / op3123")
print("   visiteur / visit123")