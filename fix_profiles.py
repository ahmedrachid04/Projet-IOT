import os
import sys
import django

# Ensure Django settings are loaded
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "projet.settings")
django.setup()

from django.contrib.auth import get_user_model
from DHT.models import UserProfile

User = get_user_model()

print("Fixing users and profiles...\n")

users_config = [
    {"username": "admin", "role": "admin", "full_name": "Administrateur"},
    {"username": "op1", "role": "operateur1", "full_name": "Opérateur 1"},
    {"username": "op2", "role": "operateur2", "full_name": "Opérateur 2"},
    {"username": "op3", "role": "operateur3", "full_name": "Opérateur 3"},
    {"username": "visiteur", "role": "visiteur", "full_name": "Visiteur"},
]

def set_password_if_needed(user, desired_password: str) -> bool:
    """
    Idempotent: only sets password if it doesn't match.
    Returns True if changed.
    """
    if not user.check_password(desired_password):
        user.set_password(desired_password)
        user.save(update_fields=["password"])
        return True
    return False


for config in users_config:
    username = config["username"]
    role = config["role"]
    full_name = config["full_name"]

    # Password policy: <username>123
    desired_password = f"{username}123"

    user, created = User.objects.get_or_create(username=username)

    if created:
        user.set_password(desired_password)
        # Admin gets staff/superuser
        if role == "admin":
            user.is_staff = True
            user.is_superuser = True
        user.save()
        print(f"Created user '{username}'")
    else:
        print(f"User '{username}' exists")

        # Ensure password is what we expect (optional but requested)
        pwd_changed = set_password_if_needed(user, desired_password)
        if pwd_changed:
            print(f"  Set password to '{username}123'")

        if role == "admin":
            changed = False
            if not user.is_staff:
                user.is_staff = True
                changed = True
            if not user.is_superuser:
                user.is_superuser = True
                changed = True
            if changed:
                user.save(update_fields=["is_staff", "is_superuser"])
                print("  Ensured admin permissions (is_staff/is_superuser)")

    # Ensure profile exists and matches config
    profile, p_created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            "role": role,
            "full_name": full_name,
            "phone_number": "",
        },
    )

    if p_created:
        print(f"  Created profile (role={role})")
    else:
        updates = {}
        if profile.role != role:
            updates["role"] = role
        # handle None safely
        if (profile.full_name or "") != full_name:
            updates["full_name"] = full_name

        if updates:
            for k, v in updates.items():
                setattr(profile, k, v)
            profile.save(update_fields=list(updates.keys()))
            print(f"  Updated profile: {', '.join(updates.keys())}")
        else:
            print(f"  Profile OK (role={profile.role})")

    print()

print("=" * 60)
print("FINAL USER LIST")
print("=" * 60)

for u in User.objects.all().order_by("username"):
    try:
        r = u.profile.role
        status = "OK"
    except Exception:
        r = "NO PROFILE"
        status = "MISSING"
    print(f"{status:7} {u.username:12} | role: {r}")

print("=" * 60)
print("\nLogin credentials:")
print("  admin    / admin123")
print("  op1      / op1123")
print("  op2      / op2123")
print("  op3      / op3123")
print("  visiteur / visiteur123")
