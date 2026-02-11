import admin from "firebase-admin";

const initFirebaseAdmin = () => {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("Firebase Admin not configured");
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
};

export default initFirebaseAdmin;
