import { getAuth } from 'firebase-admin/auth';
import { config } from './config.js';

export async function createFirebaseAuthUser({ email, password, displayName }) {
  if (!config.firebaseAuthEnabled) return { enabled: false };
  try {
    const auth = getAuth();
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch {
      user = await auth.createUser({ email, password, displayName, emailVerified: false, disabled: false });
    }
    const emailVerificationLink = await auth.generateEmailVerificationLink(email);
    return { enabled: true, uid: user.uid, emailVerificationLink };
  } catch (err) {
    return { enabled: true, error: err.message };
  }
}
