rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null;
    }

    match /products/{doc} {
      allow read: if true;
      allow write: if request.auth.token.email == "joni.lokoxon@gmail.com";
    }

    match /vip/{doc} {
      allow read: if true;
      allow write: if request.auth.token.email == "joni.lokoxon@gmail.com";
    }

    match /orders/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
