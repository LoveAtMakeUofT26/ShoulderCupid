# Google OAuth 2.0 Setup Guide

This guide walks you through setting up Google OAuth 2.0 authentication for the ShoulderCupid application. Follow these steps carefully to configure your Google Cloud project and obtain the necessary credentials.

## Table of Contents

1. [Creating a Google Cloud Project](#creating-a-google-cloud-project)
2. [Enabling Required APIs](#enabling-required-apis)
3. [Configuring OAuth Consent Screen](#configuring-oauth-consent-screen)
4. [Creating OAuth 2.0 Credentials](#creating-oauth-20-credentials)
5. [Setting Authorized Redirect URIs](#setting-authorized-redirect-uris)
6. [Adding Credentials to .env](#adding-credentials-to-env)
7. [Testing the OAuth Flow](#testing-the-oauth-flow)
8. [Troubleshooting](#troubleshooting)

---

## Creating a Google Cloud Project

### Step 1: Sign in to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. If you don't have a Google Cloud account, create one (free tier available)

**Screenshot Placeholder:** Console login screen

### Step 2: Create a New Project

1. In the top left corner, click the **Project dropdown** (shows "Select a Project")
2. In the dialog that opens, click **NEW PROJECT**

**Screenshot Placeholder:** Project dropdown menu

3. Enter a project name: `ShoulderCupid` (or your preferred name)
4. Optionally select an organization
5. Click **CREATE**

**Screenshot Placeholder:** New project creation form

6. Wait for the project to be created. You'll see a notification in the top right
7. Select your newly created project from the dropdown

**Screenshot Placeholder:** Project created notification

---

## Enabling Required APIs

### Step 3: Enable Google+ API

1. In the Google Cloud Console, click the **APIs & Services** option in the left sidebar
   - Or search for "APIs & Services" in the search bar
2. Click **Enable APIs and Services** (or the blue button)

**Screenshot Placeholder:** APIs & Services dashboard

3. Search for **"Google+ API"** in the search bar
4. Click on the **Google+ API** result
5. Click the **ENABLE** button

**Screenshot Placeholder:** Google+ API page

6. Wait for the API to be enabled. You'll see a confirmation message

**Screenshot Placeholder:** API enabled confirmation

### Step 4: Verify OAuth 2.0 API is Available

1. Go back to **APIs & Services** > **Library**
2. Search for **"OAuth 2.0"** to verify it's available in your project
3. You should see "OAuth 2.0 is built into the Google APIs" message

**Screenshot Placeholder:** OAuth 2.0 API verification

---

## Configuring OAuth Consent Screen

### Step 5: Set Up the OAuth Consent Screen

The consent screen is what users see when they authorize your application.

1. In **APIs & Services**, click **OAuth consent screen** (left sidebar)

**Screenshot Placeholder:** OAuth consent screen menu

2. Select the **User Type** as **External** (for testing purposes)
   - Choose **Internal** only if your organization uses Google Workspace
3. Click **CREATE**

**Screenshot Placeholder:** User type selection

### Step 6: Fill in App Information

You'll be taken to the "App registration" form. Fill in the following:

**App name:**
- Enter: `ShoulderCupid`

**User support email:**
- Enter the support email for your application (e.g., `support@shouldercupid.com` or your personal email)

**App logo (optional):**
- Upload a logo if desired (recommended for professional appearance)

**Screenshot Placeholder:** App information form

### Step 7: Add Scopes

Scopes define what data the app can access from the user's Google account.

1. Scroll down to **Scopes**
2. Click **Add or Remove Scopes**
3. Select the following scopes:
   - `userinfo.email` - Access to email address
   - `userinfo.profile` - Access to basic profile information
4. Click **Update**

**Screenshot Placeholder:** Scopes selection form

### Step 8: Add Test Users (Optional)

For development and testing:

1. Click **Add Users** under "Test users"
2. Enter your Google account email address(es)
3. Click **ADD**

**Screenshot Placeholder:** Test users form

This allows the app to work in development mode without production verification.

### Step 9: Review and Continue

1. Verify all information is correct
2. Click **SAVE AND CONTINUE**
3. You'll see a confirmation that the consent screen is configured

**Screenshot Placeholder:** Consent screen summary

---

## Creating OAuth 2.0 Credentials

### Step 10: Create OAuth 2.0 Client ID

1. In **APIs & Services**, click **Credentials** (left sidebar)

**Screenshot Placeholder:** Credentials menu

2. Click **+ CREATE CREDENTIALS** at the top
3. Select **OAuth 2.0 Client IDs**

**Screenshot Placeholder:** Create credentials dropdown

4. You may be prompted to configure the OAuth consent screen first
   - If so, go back and complete the consent screen setup, then return to this step

### Step 11: Configure the OAuth Client

1. For **Application type**, select **Web application**

**Screenshot Placeholder:** Application type selection

2. Give the credential a **Name**:
   - Enter: `ShoulderCupid Web Client` (or similar)

**Screenshot Placeholder:** Credential name form

3. You'll now configure the **Authorized URIs** (see next section)

---

## Setting Authorized Redirect URIs

### Step 12: Add Authorized JavaScript Origins

In the OAuth client configuration, under **Authorized JavaScript origins**, add:

```
http://localhost:3000
http://localhost:4000
```

For production, also add:
```
https://yourdomain.com
```

**Screenshot Placeholder:** Authorized JavaScript origins

Click **+ ADD URI** to add multiple origins.

### Step 13: Add Authorized Redirect URIs

In the same form, under **Authorized redirect URIs**, add:

```
http://localhost:4000/api/auth/google/callback
http://localhost:3000/auth/callback
```

For production:
```
https://yourdomain.com/api/auth/google/callback
https://yourdomain.com/auth/callback
```

**Screenshot Placeholder:** Authorized redirect URIs form

### Step 14: Save the Credential

1. Click **CREATE**
2. A dialog will appear with your credentials

**Screenshot Placeholder:** Credentials confirmation dialog

---

## Getting Client ID and Client Secret

### Step 15: Retrieve Your Credentials

After clicking CREATE, you'll see a popup with:

- **Client ID** (a long string ending in `.apps.googleusercontent.com`)
- **Client Secret** (a random string)

**Screenshot Placeholder:** OAuth credentials popup

**Important:** Keep these credentials secure. Treat them like passwords.

### Step 16: Download or Copy Credentials

1. You can download the credentials as JSON by clicking the download icon
2. Or copy them directly from the popup
3. Save them somewhere safe for the next step

**Screenshot Placeholder:** Download credentials option

---

## Adding Credentials to .env

### Step 17: Update Your .env File

1. Open the `.env` file in the root of your ShoulderCupid project
   ```bash
   cp .env.example .env
   ```

2. Find (or add) these lines:
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

3. Replace with your actual credentials:
   ```
   GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrst
   ```

**Example .env file section:**
```env
# Backend Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# OAuth - Google
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrst
```

### Step 18: Security Reminder

- **Never commit** the `.env` file to version control (it should be in `.gitignore`)
- For production, use environment variables from:
  - Cloud provider secret management (AWS Secrets Manager, Google Secret Manager, etc.)
  - CI/CD platform secrets (GitHub Actions, GitLab CI, etc.)
- Rotate credentials periodically
- If credentials are exposed, regenerate them immediately in Google Cloud Console

---

## Testing the OAuth Flow

### Step 19: Start Your Application

1. Start the backend server:
   ```bash
   cd apps/backend
   npm run dev
   ```

2. In a new terminal, start the frontend:
   ```bash
   cd apps/frontend
   npm run dev
   ```

3. Both should be running:
   - Backend: `http://localhost:4000`
   - Frontend: `http://localhost:3000`

**Screenshot Placeholder:** Terminal showing both servers running

### Step 20: Test the Login Flow

1. Navigate to your frontend application: `http://localhost:3000`
2. Look for a **Sign in with Google** button
3. Click the button

**Screenshot Placeholder:** Sign in button on frontend

### Step 21: Verify the Google Consent Screen

1. You'll be redirected to Google's login page
2. Sign in with your test Google account (or the one you added as a test user)
3. You should see the OAuth consent screen showing:
   - Your app name (ShoulderCupid)
   - The scopes your app is requesting
   - Your app logo (if you added one)

**Screenshot Placeholder:** Google consent screen

### Step 22: Verify Successful Authentication

1. Click **Allow** on the consent screen
2. You should be redirected back to your application
3. You should be logged in and able to see the dashboard
4. Your user profile should display your Google account information

**Screenshot Placeholder:** Successful login and dashboard

### Step 23: Verify Session Persistence

1. Refresh the page
2. You should remain logged in (session should persist)
3. Check your browser cookies for session data

**Screenshot Placeholder:** Logged-in state after refresh

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Invalid Client ID"

**Symptoms:** Error message about invalid client ID when trying to log in

**Solution:**
1. Verify the Client ID in your `.env` file matches exactly what Google provided
2. Check for extra spaces or line breaks
3. Ensure the `.env` file is being read by the backend (restart the server after changes)
4. Verify the URL matches one of your authorized JavaScript origins

#### Issue: "Redirect URI Mismatch"

**Symptoms:** Error message like "The redirect URI in the request does not match"

**Solution:**
1. Check that `http://localhost:4000/api/auth/google/callback` is in your authorized redirect URIs
2. Ensure there are no trailing slashes or typos
3. Wait a few minutes for Google to update its configuration
4. Try clearing your browser cache

**Screenshot Placeholder:** Redirect URI mismatch error

#### Issue: "User Cancelled Login or Didn't Fully Authorize"

**Symptoms:** You click "Allow" but get redirected without logging in

**Solution:**
1. Check the browser console for error messages
2. Ensure your frontend URL (`http://localhost:3000`) is in authorized JavaScript origins
3. Try incognito/private mode to clear all cookies
4. Check that `FRONTEND_URL` in your backend `.env` matches your frontend URL

#### Issue: "Credentials Not Working in Production"

**Symptoms:** Google OAuth works locally but fails on production servers

**Solution:**
1. Create new credentials in Google Cloud Console with production URLs
2. Update authorized redirect URIs to include your production domain:
   - `https://yourdomain.com/api/auth/google/callback`
3. Update authorized JavaScript origins to include your production domain
4. Add production environment variables in your deployment platform
5. Wait 5-10 minutes for Google to propagate the changes

#### Issue: "Session Not Persisting"

**Symptoms:** You log in successfully but get logged out on refresh

**Solution:**
1. Verify `SESSION_SECRET` is set in your `.env` file
2. Ensure `NODE_ENV` is set correctly (`development` for local, `production` for prod)
3. Check that cookies are enabled in your browser
4. Verify the session store (MongoDB/Redis) is running
5. Check backend logs for session errors

### Viewing Logs

**Backend logs:**
```bash
# Check for OAuth errors
tail -f logs/backend.log | grep -i oauth
```

**Browser console (Frontend):**
1. Open DevTools: `F12` or `Cmd+Option+I`
2. Go to **Console** tab
3. Look for red error messages

**Network tab (Frontend):**
1. Open DevTools: `F12` or `Cmd+Option+I`
2. Go to **Network** tab
3. Look for requests to `/api/auth/google/callback`
4. Check the response for error details

---

## Next Steps

After successfully setting up Google OAuth:

1. **Customize the consent screen** with your app's branding
2. **Move to production** by creating new credentials with production URLs
3. **Implement logout functionality** for users to disconnect their Google account
4. **Add additional OAuth providers** (Discord, GitHub, etc.) using the same process
5. **Implement refresh tokens** for long-lived authentication
6. **Add error handling** for edge cases in your frontend

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [Setting Up OAuth in Web Applications](https://developers.google.com/identity/protocols/oauth2/web)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review your `.env` file for typos
3. Check the backend server logs
4. Verify all credentials are correctly configured in Google Cloud Console
5. Clear browser cache and cookies
6. Restart both backend and frontend servers

For additional help, refer to the main project README or contact the development team.
