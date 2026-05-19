# 🚀 Deployed App Troubleshooting: Data Not Showing

If your Grocery Inventory System works perfectly on your local machine (`localhost`) but shows **no data** (empty tables and 0 values) when you deploy both the frontend and backend to production, it is almost certainly due to one of three common configuration missteps:

1. **Frontend API URL (`VITE_API_URL`) is not configured or compiled correctly.**
2. **Backend is trying to connect to local MongoDB (`localhost:27017`) instead of a cloud database.**
3. **CORS settings in the FastAPI backend are blocking browser requests.**

Follow this step-by-step checklist to get everything wired up and working beautifully in the browser.

---

## 🛠️ Step 1: Point the Deployed Frontend to the Deployed Backend

In your code (`frontend/my-project/src/api.js` and `Login.jsx`), the app defaults to `http://localhost:8000` if the environment variable `VITE_API_URL` is empty:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

When your frontend is hosted on an **HTTPS** URL (e.g. `https://your-app.netlify.app` or `https://your-app.vercel.app`), the browser will **block** requests to `http://localhost:8000` due to **Mixed Content Security Rules** (HTTPS websites cannot make unencrypted HTTP requests).

### How to Fix:
1. **Get your Deployed Backend URL**: Copy the HTTPS URL of your deployed FastAPI backend (e.g., `https://grocery-inventory-backend.onrender.com`).
2. **Add Environment Variable to Frontend Hosting**:
   * Go to your frontend hosting provider's dashboard (Netlify, Vercel, Render, etc.).
   * Locate the **Environment Variables** section in your site settings.
   * Add a new variable:
     * **Key**: `VITE_API_URL`
     * **Value**: `https://your-deployed-backend-url.com` (replace with your actual deployed backend URL, without a trailing slash `/`).
3. **🚨 IMPORTANT (Vite Build-time Behavior)**:
   * **Vite environment variables are baked in at build time**. They are compiled directly into the static JavaScript files during `npm run build`.
   * Setting the variable in your host's dashboard **will not take effect until you redeploy/rebuild the site**.
   * Go to your hosting platform and trigger a **manual clear cache and rebuild/redeploy** to force Vite to compile the new backend URL.

---

## 🛠️ Step 2: Configure a Cloud Database (MongoDB Atlas) for the Backend

In `backend/database.py`, the app connects to:
```python
MONGO_DETAILS = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") or "mongodb://localhost:27017/"
```
When deployed to a cloud platform like Render or Railway, `localhost:27017` does not run a MongoDB server. The backend will fail to connect, causing all API endpoints (`/items/`, `/shops/`, etc.) to time out or return `500 Internal Server Error`.

### How to Fix:
1. **Create a Cloud Database**:
   * Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database).
   * Create a free Shared Cluster (M0).
   * Under **Database Access**, create a user with a username and password.
   * Under **Network Access**, allow access from **0.0.0.0/0** (anywhere) so your cloud hosting provider can connect.
2. **Get Connection String**:
   * Click **Connect** on your cluster dashboard, choose **Drivers**, and copy the connection string. It will look like:
     `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
3. **Configure Backend Environment Variables**:
   * Go to your backend hosting dashboard (e.g., Render, Railway).
   * In the **Environment Variables** settings, add:
     * **Key**: `MONGODB_URI`
     * **Value**: Your MongoDB Atlas connection string (replace `<username>` and `<password>` with your database user credentials).
   * Restart/Redeploy the backend server.

---

## 🛠️ Step 3: Update Backend CORS to Allow Your Frontend

In `backend/main.py`, the current CORS configuration uses a wildcard `*` with credentials enabled:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Modern web browsers block CORS requests if the server sets `allow_credentials=True` but lists the origin as `*`. To prevent the browser from blocking requests, you should explicitly define the allowed origins.

### How to Fix:
Edit `backend/main.py` to allow both your local development environment and your production frontend URL:

```python
# Change allow_origins to a list of allowed hosts
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://your-deployed-frontend.netlify.app",  # 👈 REPLACE with your deployed frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔍 How to Verify and Diagnose in the Browser

To see exactly what error is occurring, open the browser's developer tools:
1. Right-click anywhere on the blank page and click **Inspect**.
2. Go to the **Console** tab. Look for red error messages:
   * **`ERR_CONNECTION_REFUSED` or `Mixed Content`**: The frontend is trying to query `http://localhost:8000` from an HTTPS site. (Refer to **Step 1**).
   * **`CORS Error`**: The backend CORS middleware is rejecting the request or is configured incorrectly. (Refer to **Step 3**).
3. Go to the **Network** tab, refresh the page, and click on requests like `items/` or `shops/`:
   * If they are failing with `500` or taking a long time and failing (timeout), the backend cannot talk to the database. (Refer to **Step 2**).
