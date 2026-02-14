# MongoDB Atlas Setup Guide

This guide walks you through setting up MongoDB Atlas for the ShoulderCupid application. MongoDB Atlas is a fully managed cloud database service that's perfect for development and production workloads.

## Table of Contents

1. [Create a MongoDB Atlas Account](#create-a-mongodb-atlas-account)
2. [Create a Free Tier Cluster](#create-a-free-tier-cluster)
3. [Create a Database User](#create-a-database-user)
4. [Configure IP Whitelist](#configure-ip-whitelist)
5. [Get Your Connection String](#get-your-connection-string)
6. [Update Your .env File](#update-your-env-file)
7. [Test the Connection](#test-the-connection)
8. [Troubleshooting](#troubleshooting)

---

## Create a MongoDB Atlas Account

### Step 1: Sign Up

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click the **"Try Free"** or **"Sign Up"** button
3. You can sign up with:
   - Email and password (create a new account)
   - Google account
   - GitHub account

### Step 2: Complete Account Setup

1. Fill in the registration form with your details
2. Accept the terms and conditions
3. Click **"Create your MongoDB Account"**
4. Verify your email address by clicking the link in the verification email
5. Log in to your MongoDB Atlas account

### Step 3: Create an Organization

1. After logging in, you'll see the "Create an organization" dialog
2. Enter an organization name (e.g., "ShoulderCupid Dev")
3. Click **"Next"**
4. You'll be asked to create a project - this is normal, continue to the next section

---

## Create a Free Tier Cluster

### Step 1: Create a New Project

1. In the MongoDB Atlas dashboard, click **"New Project"**
2. Enter a project name (e.g., "ShoulderCupid")
3. Click **"Next"**
4. Add team members if needed (optional for development)
5. Click **"Create Project"**

### Step 2: Build a Database

1. You'll be taken to the project dashboard
2. Click **"Build a Database"** or **"Create a Deployment"**
3. Choose the **"Shared"** cluster option (this is the free tier)
4. Click **"Create"** or **"Continue"**

### Step 3: Configure Your Free Cluster

1. **Provider Selection**: Choose your cloud provider
   - AWS (recommended)
   - Google Cloud
   - Azure

2. **Region Selection**: Choose the region closest to your users or development location
   - US East (N. Virginia) is a common default
   - Note: Some regions may not be available for free tier

3. **Cluster Name**: Keep the default or change to something meaningful (e.g., "shoulder-cupid-dev")

4. **Cluster Tier**: Confirm **"M0 Sandbox"** is selected (this is the free tier)

5. Click **"Create Deployment"**

The cluster will take a few minutes to initialize. You'll see a progress indicator. Wait for it to complete.

---

## Create a Database User

### Step 1: Add a Database User

After your cluster is created, MongoDB Atlas will prompt you to create a database user.

If you don't see the prompt:
1. Click **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**

### Step 2: Set User Credentials

1. **Username**: Enter a username (e.g., "shoulder-cupid-dev")
   - Use alphanumeric characters and underscores
   - Avoid special characters or remember to URL-encode them

2. **Password**:
   - Click **"Generate Secure Password"** (recommended)
   - Or enter your own password
   - **IMPORTANT**: Copy and save this password in a secure location - you'll need it for the connection string
   - You won't be able to see this password again, so save it now!

3. **Database User Privileges**:
   - Select **"Built-in Role"**
   - Choose **"Atlas Admin"** for development (full access)
   - For production, use more restrictive roles like "Read/Write to any database"

4. Click **"Add User"**

The user will appear in the "Database Users" list immediately.

---

## Configure IP Whitelist

The IP whitelist controls which IP addresses can connect to your MongoDB cluster. For development, we'll allow all IPs.

### Step 1: Add IP Address

1. Click **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**

### Step 2: Allow All IPs (Development Only)

For local development:

1. **IP Address**: Enter `0.0.0.0/0`
   - This allows connections from any IP address
   - **WARNING**: This is not secure for production clusters

2. **Description**: Enter a note (e.g., "Development - All IPs")

3. Click **"Confirm"**

The whitelist entry will appear immediately.

### For Production

When deploying to production:
1. Only add the specific IP addresses of your production servers
2. Example: If your server is at `203.0.113.45`, add that IP
3. Never use `0.0.0.0/0` in production
4. For applications on multiple servers, add each IP separately

---

## Get Your Connection String

### Step 1: Access Connection Options

1. In the MongoDB Atlas dashboard, go to **"Databases"** or **"Clusters"**
2. Find your cluster (e.g., "shoulder-cupid-dev")
3. Click the **"Connect"** button

### Step 2: Choose Connection Method

1. Click **"Drivers"** or **"Connect your application"**
2. Select **"Node.js"** from the language dropdown
3. Select a recent **Node.js version** (e.g., 4.5 or newer)

### Step 3: Copy Your Connection String

You'll see a connection string that looks like this:

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

**Example with actual values:**
```
mongodb+srv://shoulder-cupid-dev:MySecurePassword123@shoulder-cupid-dev.abcde.mongodb.net/?retryWrites=true&w=majority
```

### Understanding the Connection String

- `<username>`: The database user you created (e.g., "shoulder-cupid-dev")
- `<password>`: The password for that user (URL-encoded if it contains special characters)
- `<cluster>`: Your cluster identifier (e.g., "shoulder-cupid-dev.abcde.mongodb.net")

**IMPORTANT**: The password in the connection string must be URL-encoded. Common characters:
- `@` becomes `%40`
- `#` becomes `%23`
- `!` becomes `%21`
- `$` becomes `%24`

If your password contains special characters, use a URL encoder or let MongoDB do it for you:
1. Go back to "Database Access"
2. Click the "Copy" button next to the user to get a properly formatted connection string

---

## Update Your .env File

### Step 1: Find or Create .env File

1. In the root of your project (same directory as `package.json`), locate or create `.env`
2. If it doesn't exist, you can copy from `.env.example`:
   ```bash
   cp .env.example .env
   ```

### Step 2: Update MONGODB_URI

Find the `MONGODB_URI` line in your `.env` file:

**Before:**
```
MONGODB_URI=mongodb://localhost:27017/shoulder-cupid
```

**After:**
```
MONGODB_URI=mongodb+srv://shoulder-cupid-dev:MySecurePassword123@shoulder-cupid-dev.abcde.mongodb.net/?retryWrites=true&w=majority
```

Replace with your actual connection string.

### Step 3: Save the File

Save the `.env` file. Your application will read this on startup.

### Important Security Notes

- Never commit your `.env` file to version control (it's already in `.gitignore`)
- Never share your connection string with others
- If you accidentally commit your credentials, regenerate the database user password in MongoDB Atlas immediately
- For team development, share instructions only, not the actual credentials

---

## Test the Connection

### Step 1: Verify Basic Connectivity

Create a simple test file to verify your connection (optional):

```javascript
// test-mongodb.js
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);

async function testConnection() {
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB Atlas successfully!');

    // Get database and collection info
    const adminDb = client.db('admin');
    const status = await adminDb.command({ ping: 1 });
    console.log('✓ Ping result:', status);

    const db = client.db('shoulder-cupid');
    const collections = await db.listCollections().toArray();
    console.log('✓ Collections:', collections.map(c => c.name));

  } catch (error) {
    console.error('✗ Connection failed:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();
```

Run it with:
```bash
node test-mongodb.js
```

### Step 2: Start Your Development Server

In your project root:

```bash
npm install  # if you haven't already
npm run dev  # or your project's start command
```

If your application starts without connection errors, you're all set!

### Step 3: Check Logs

Look for connection messages in your console. Typical success indicators:
- No "Connection refused" errors
- No "Authentication failed" errors
- Application starts and runs normally

---

## Troubleshooting

### Connection Refused / Can't Connect

**Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
1. Verify your connection string starts with `mongodb+srv://` (not `mongodb://`)
2. Copy the exact connection string from MongoDB Atlas again
3. Ensure your `.env` file has the correct `MONGODB_URI`
4. Restart your development server after updating `.env`

### Authentication Failed

**Symptom**: `Error: Authentication failed`

**Solution**:
1. Double-check your **username** and **password** in the connection string
2. Verify the password hasn't been accidentally modified
3. If unsure, regenerate the password:
   - Go to **Database Access** in MongoDB Atlas
   - Click the menu (⋮) next to your user
   - Select **Edit Password**
   - Generate a new password and update your `.env` file
4. Ensure special characters in your password are URL-encoded

### IP Address Not Whitelisted

**Symptom**: `Error: 0 [FATAL] exception in initAndListen`

**Solution**:
1. Go to **Network Access** in MongoDB Atlas
2. Verify your IP address is whitelisted
3. If you're connecting from different locations, add multiple IP addresses
4. For development, you can use `0.0.0.0/0` (allows all IPs)
5. Try adding your IP by clicking **Add Current IP Address**

### Cluster Not Found or Invalid Connection String

**Symptom**: `MongoNetworkError: couldn't resolve host`

**Solution**:
1. Copy the connection string directly from MongoDB Atlas again (sometimes typos occur)
2. Verify the cluster name is correct (check the **Clusters** page)
3. Ensure your cluster has finished initializing (wait if you just created it)
4. Try pasting the connection string in quotes: `"your-string"`

### Password Contains Special Characters

**Symptom**: Sporadic authentication failures or odd behavior

**Solution**:
1. Regenerate the password and choose one without special characters
2. Or URL-encode the special characters:
   - `!` → `%21`
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
3. Use an online URL encoder tool to be sure
4. Update your `.env` file with the properly encoded string

### Still Having Issues?

1. **Check MongoDB Atlas Status**: Visit [status.mongodb.com](https://status.mongodb.com) to check for service issues

2. **Review MongoDB Logs**: In MongoDB Atlas:
   - Go to your cluster
   - Click **"Logs"** to see connection attempts
   - Look for error messages

3. **Enable Debug Logging**: In your Node.js app:
   ```javascript
   const { MongoClient, Logger } = require('mongodb');
   Logger.setLevel('debug');
   ```

4. **Test with MongoDB Shell**:
   ```bash
   # Install MongoDB Shell if you don't have it
   # On Mac: brew install mongodb-community

   mongosh "mongodb+srv://username:password@cluster.mongodb.net/test"
   ```

5. **Ask for Help**:
   - MongoDB Atlas Support: [support.mongodb.com](https://support.mongodb.com)
   - Stack Overflow: Tag your question with `mongodb-atlas`

---

## Next Steps

Once you have MongoDB Atlas set up:

1. **Connect Your Application**: Your backend code should now connect automatically using the `MONGODB_URI` from `.env`

2. **Create Collections**: Your application will typically create collections as needed, or you can create them manually in MongoDB Atlas

3. **Set Environment Variables**: If deploying to production:
   - Set `MONGODB_URI` as an environment variable on your hosting platform
   - Use different credentials for production (more restrictive permissions)
   - Whitelist only your production server's IP address

4. **Backup and Restore**:
   - MongoDB Atlas automatically backs up your data daily
   - You can restore from backups in the **Backup** section

5. **Monitor Your Cluster**:
   - Watch the **Metrics** tab to monitor performance
   - Set up alerts for high CPU or memory usage
   - Keep an eye on data size as it grows

---

## Useful Links

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/)
- [MongoDB Security Best Practices](https://www.mongodb.com/docs/manual/security/)
- [IP Whitelist Reference](https://docs.atlas.mongodb.com/security/ip-access-list/)

---

## Common Environment Variables

Here's a quick reference for your `.env` file with MongoDB Atlas:

```
# Backend Server
PORT=4000
NODE_ENV=development

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379

# Session
SESSION_SECRET=your-secret-here
```

---

## Summary Checklist

- [ ] Created MongoDB Atlas account
- [ ] Created a free tier cluster (M0 Sandbox)
- [ ] Created a database user with a strong password
- [ ] Added your IP address to the whitelist (0.0.0.0/0 for dev)
- [ ] Copied the connection string from MongoDB Atlas
- [ ] Updated `MONGODB_URI` in your `.env` file
- [ ] Tested the connection with your application
- [ ] Application starts without connection errors

You're all set! Your application should now be connected to MongoDB Atlas.
