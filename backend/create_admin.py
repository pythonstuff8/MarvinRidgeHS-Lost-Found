
import firebase_admin
from firebase_admin import credentials, db, auth
import sys

# Initialize Firebase Admin
cred = credentials.Certificate("../fblalf-firebase-adminsdk-fbsvc-ce8e5771c0.json")
try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://fblalf-default-rtdb.firebaseio.com/' 
    })

def create_admin_user(username, password):
    # We still need an email for Firebase Auth, so we append a hidden suffix.
    # This suffix must match what is used in the frontend auth-context.tsx
    email = f"{username}@lf.app"
    
    try:
        # 1. Create User in Firebase Auth
        try:
            user = auth.create_user(
                email=email,
                password=password,
                display_name=username
            )
            print(f"Created new user '{username}' (UID: {user.uid})")
        except firebase_admin.auth.EmailAlreadyExistsError:
            # If user exists, fetch them
            user = auth.get_user_by_email(email)
            print(f"User '{username}' already exists (UID: {user.uid}). Updating role...")
            # Optional: Update password if needed, but for now we just promote
            # auth.update_user(user.uid, password=password)

        # 2. Set Role in Realtime DB
        ref = db.reference(f'users/{user.uid}')
        ref.update({
            'username': username,
            'role': 'ADMIN',
            'createdAt': 'SERVER_TIMESTAMP' # Simple placeholder
        })
        print(f"Successfully set '{username}' as ADMIN.")
        
    except Exception as e:
        error_msg = str(e)
        if "CONFIGURATION_NOT_FOUND" in error_msg:
            print(f"\n[ERROR] Firebase Auth Configuration Error.")
            print("It looks like the 'Email/Password' Sign-in method is disabled in your Firebase Console.")
            print("1. Go to Firebase Console -> Authentication -> Sign-in method")
            print("2. Enable 'Email/Password'")
            print("3. Try running this command again.")
            print("\n(Note: We use this provider to securely handle passwords, even though we only show Usernames to users.)")
        else:
            print(f"An error occurred: {error_msg}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_admin.py <username> <password>")
    else:
        create_admin_user(sys.argv[1], sys.argv[2])
