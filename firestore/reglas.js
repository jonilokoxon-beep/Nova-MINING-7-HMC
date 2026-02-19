rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuth() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // ================= USERS =================
    match /users/{userId} {

      allow read: if isAuth() && request.auth.uid == userId;

      allow create: if isAuth();

      allow update: if isAuth() &&
        request.auth.uid == userId &&
        !("balance" in request.resource.data.diff(resource.data).affectedKeys());

      allow update: if isAdmin();

      allow delete: if false;
    }

    // ================= ORDERS =================
    match /orders/{orderId} {
      allow read: if isAuth() &&
        request.auth.uid == resource.data.uid;

      allow create: if isAuth() &&
        request.auth.uid == request.resource.data.uid;

      allow update: if false; // Solo backend
      allow delete: if false;
    }

    // ================= DEPOSITS =================
    match /deposits/{id} {
      allow create: if isAuth();
      allow read: if isAdmin() || request.auth.uid == resource.data.uid;
      allow update: if isAdmin();
      allow delete: if false;
    }

    // ================= WITHDRAWALS =================
    match /withdrawals/{id} {
      allow create: if isAuth();
      allow read: if isAdmin() || request.auth.uid == resource.data.uid;
      allow update: if isAdmin();
      allow delete: if false;
    }

    // ================= TRANSACTIONS =================
    match /transactions/{id} {
      allow read: if isAuth() &&
        request.auth.uid == resource.data.uid;

      allow write: if false; // Solo backend
    }

    // ================= PRODUCTS =================
    match /products/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
