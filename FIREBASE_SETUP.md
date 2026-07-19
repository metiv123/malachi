# Firebase / Firestore setup for Malachi

## Status
Firebase Admin support is implemented in the app, but Firestore must be enabled in the Firebase project before Render can use it.

Project ID received:

```text
malachi-7d1ab
```

## Required one-time action in Firebase Console

Open Firebase Console → project `Malachi` → **Firestore Database** → **Create database**.

Recommended settings:

- Mode: **Production mode**
- Region: Europe if available, otherwise default

Until this is done, Google returns:

```text
Cloud Firestore API has not been used in project malachi-7d1ab before or it is disabled.
```

## Render environment variables

After Firestore is enabled, set this in Render service `malachi`:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON=<paste the full service account JSON as one-line value>
FIRESTORE_COLLECTION=malachi_runtime
FIRESTORE_DOCUMENT=main
```

`MALACHI_STORE` is optional. If `FIREBASE_SERVICE_ACCOUNT_JSON` exists, Malachi auto-selects Firestore. To force explicitly:

```bash
MALACHI_STORE=firestore
```

## Important security note

Do not commit the Firebase service account JSON to Git. It is a powerful secret.

If it was exposed publicly, rotate it in Firebase Console:

Project settings → Service accounts → Manage service account permissions → Keys → delete old key → generate new key.

## Verification after Render env is set

1. Deploy/restart Render.
2. Check:

```text
/api/health
/api/version
```

3. Create a test family.
4. Redeploy/restart Render.
5. Reopen dashboard link.
6. Verify family data still exists.

If it remains after redeploy, Firestore persistence is working.
