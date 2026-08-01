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

export async function updateFirebaseAuthUser(uid, { email, password } = {}) {
  if (!config.firebaseAuthEnabled || !uid) return { enabled: false };
  const updates = {};
  if (email) updates.email = email;
  if (password) updates.password = password;
  if (!Object.keys(updates).length) return { enabled: true, updated: false };
  await getAuth().updateUser(uid, updates);
  return { enabled: true, updated: true };
}

export async function deleteFirebaseAuthUser(uid) {
  if (!config.firebaseAuthEnabled || !uid) return { enabled: false };
  try {
    await getAuth().deleteUser(uid);
    return { enabled: true, deleted: true };
  } catch (err) {
    if (err?.code === 'auth/user-not-found') return { enabled: true, deleted: false };
    throw err;
  }
}
