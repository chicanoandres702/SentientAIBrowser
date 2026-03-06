# Sentient AI Browser Deployment & Backend URL Automation

## Automated Backend URL Wiring

- The frontend uses `shared/env.utils.ts` to determine the backend (proxy) URL.
- A script `scripts/set-backend-url.js` automates setting the correct backend URL for each environment.

### Usage

```sh
node scripts/set-backend-url.js <env>
```
- `<env>` can be:
  - `cloudrun` (Cloud Run backend)
  - `firebase` (Firebase Hosting, uses Cloud Run backend)
  - `local` (local development)

### What It Does
- Updates `shared/env.utils.ts` to set the correct `proxyBaseUrl` for the selected environment.
- Ensures frontend always points to the right backend for Cloud Run, Firebase Hosting, or local dev.

## Deployment Checklist

1. **Local Development**
   - Run: `node scripts/set-backend-url.js local`
   - Start local proxy/backend: `npm run start` or `npm run web`
   - Frontend will use `http://localhost:3000` (or `http://10.0.2.2:3000` for Android emulator)

2. **Cloud Run Deployment**
   - Run: `node scripts/set-backend-url.js cloudrun`
   - Deploy backend to Cloud Run
   - Deploy frontend (Firebase Hosting or other)
   - Frontend will use `https://sentient-proxy-184717935920.us-central1.run.app`

3. **Firebase Hosting**
   - Run: `node scripts/set-backend-url.js firebase`
   - Deploy frontend to Firebase Hosting
   - Backend should be deployed to Cloud Run
   - Frontend will use Cloud Run backend URL

## Notes
- CORS must be enabled on Cloud Run backend for Firebase Hosting frontend.
- For custom domains or staging, update the script and `env.utils.ts` as needed.

---

**Automation ensures error-free wiring and seamless deployment for all environments.**
