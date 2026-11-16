# EventEase — Event Management & Ticketing

EventEase is a React + Vite frontend with a Node.js/Express API and MongoDB database. The existing project includes event discovery, search and filters, customer registration/login, bookings, digital tickets, organizer event management, admin tools, analytics, recommendations, venue links and image uploads.

## Scope and important behaviour

- Event discovery is scoped to Pakistan and the supported Pakistani cities in the frontend.
- Prices are displayed in PKR where an event price is available.
- Organizer ticket verification is **upload-only**: an organizer selects an image containing a QR code. The app does not request camera access or start a live camera scanner.
- Existing API routes and database models are retained. Do not delete or replace your existing MongoDB database when updating the app.

## Requirements

- Node.js 20 or newer (Node.js 22 LTS recommended)
- npm
- MongoDB Atlas or a local MongoDB server

## 1. Configure the backend

Open a terminal in the project folder:

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Edit `backend/.env` and set at least:

- `MONGODB_URI`: your MongoDB connection string
- `JWT_SECRET`: a long, private random string (never commit or share it)
- `CORS_ORIGIN`: the frontend origin, normally `http://localhost:5173`
- `FRONTEND_URL`: the frontend URL, normally `http://localhost:5173`

SMTP settings are needed for password-reset emails. Cloudinary settings are needed for organizer event-image uploads. The API can start without those optional integrations configured; the related feature will return an explanatory error until configured.

Start the API:

```powershell
npm run dev
```

The API listens on `http://localhost:5000`. Check `http://localhost:5000/api/test` for the health response.

## 2. Configure the frontend

Open a second terminal from the project folder:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

For a production frontend build:

```powershell
npm run build
npm run preview
```

## 3. Production configuration

Before deployment, set `VITE_API_URL` to the deployed API base URL and set the backend `CORS_ORIGIN` and `FRONTEND_URL` to the deployed frontend URL. Configure MongoDB network access and credentials, JWT secret, SMTP and Cloudinary in the hosting provider's environment-variable settings. Never upload `.env` files or secrets to GitHub.

## 4. Functional verification checklist

1. Confirm the backend health endpoint reports a connected database.
2. Register and log in with a test customer account.
3. Discover events, search, filter by category/city and open an event.
4. Complete a test booking and confirm the booking appears in My Bookings.
5. Open the digital ticket and verify its QR code is displayed.
6. Log in as an organizer, create/manage an event and upload an event image after Cloudinary is configured.
7. Verify a test ticket by uploading its QR image in the organizer dashboard. Do not use camera scanning.
8. Check organizer/admin analytics with accounts that have the relevant roles.
9. Test mobile and desktop layouts and verify the production API URLs/CORS settings.

## Notes

This package is a source-code handoff. Live deployment, real payment processing, production credentials, SMTP delivery, Cloudinary uploads and end-to-end tests against your own MongoDB account require your environment and credentials; they are not represented as completed by a local source edit.
