import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

if (!admin.apps.length) {
<<<<<<< HEAD
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("Firebase Admin not configured");
  }
=======
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
>>>>>>> c5d8d4a (Updated PrimePicks: Firebase removed, JWT added)

  console.log("✅ Firebase Admin initialized");
}

<<<<<<< HEAD
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin initialized");
}

export default admin;
=======
export default admin;
>>>>>>> c5d8d4a (Updated PrimePicks: Firebase removed, JWT added)
