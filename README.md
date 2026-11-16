# EventEase — Event Management & Ticketing

EventEase is a full-stack event management and ticketing platform built with React, Vite, Node.js, Express and MongoDB. It helps customers discover events and book tickets while providing organizers and administrators with tools to manage events, bookings and platform activity.

**Live Website:** https://event-ease-44xo.vercel.app/
**GitHub Repository:** https://github.com/HADI-AI434/EventEase

## Project Overview

EventEase provides a centralized platform for event discovery, ticket booking and event management. It includes customer authentication, digital tickets, QR-based ticket verification, organizer tools and administrative features.

### Main Features

- Event discovery, search and filtering
- Customer registration and login
- Event details and venue links
- Ticket booking and booking history
- Digital tickets with QR codes
- Organizer event creation and management
- Upload-only QR ticket verification
- Admin management tools
- Organizer and administrative analytics
- Event recommendations
- Event image uploads

## Scope and Important Behaviour

- Event discovery focuses on Pakistan and the supported Pakistani cities configured in the frontend.
- Event prices are displayed in PKR where a price is available.
- Ticket verification is upload-only. Organizers select an image containing a QR code for verification.
- The application does not request camera access or start a live camera scanner.
- Existing API routes and MongoDB models should be retained when maintaining or updating the project.
- Do not delete or replace the existing MongoDB database when updating the application.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens, bcryptjs |
| QR Tickets | qrcode, qrcode.react |
| Charts | Recharts |
| PDF Tickets | jsPDF |
| Image Uploads | Cloudinary, Multer |
| Email | Nodemailer |
| Deployment | Vercel |
| Version Control | Git, GitHub |

## Requirements

- Node.js 20 or newer (Node.js 22 LTS recommended)
- npm
- MongoDB Atlas or a local MongoDB server
- Git
- Visual Studio Code or another code editor

## Project Structure

```text
EventEase/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   └── ...
│   ├── package.json
│   └── ...
│
└── README.md
```

The structure above shows the main project areas. Individual files and folders may vary as the project develops.

## Local Installation and Setup

### 1. Clone the repository

```powershell
git clone https://github.com/HADI-AI434/EventEase.git
cd EventEase
```

### 2. Configure the backend

```powershell
cd backend
npm install
```

Create a file named `.env` inside the `backend` directory. Add your own configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_private_random_secret
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

Do not use the example placeholder values as real credentials.

The following additional variables are used for optional integrations:

```env
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=your_sender_email

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Configure these integrations only when you have the corresponding accounts and credentials.

Start the backend:

```powershell
npm run dev
```

The API normally runs at:

`http://localhost:5000`

Test the API endpoint:

`http://localhost:5000/api/test`

### 3. Configure the frontend

Open a second terminal from the project root:

```powershell
cd frontend
npm install
```

The frontend uses `VITE_API_URL` to configure the backend API address.

If you need to override the default local API address, create a file named `.env` inside `frontend`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```powershell
npm run dev
```

Open the local URL printed by Vite, normally:

`http://localhost:5173`

### 4. Build the frontend for production

From the frontend directory:

```powershell
npm run build
```

To preview the production build locally:

```powershell
npm run preview
```

## Environment Configuration

| Variable | Location | Purpose |
|---|---|---|
| `MONGODB_URI` | Backend | MongoDB connection |
| `JWT_SECRET` | Backend | Authentication token signing |
| `PORT` | Backend | API server port |
| `CORS_ORIGIN` | Backend | Allowed frontend origins |
| `FRONTEND_URL` | Backend | Frontend URL used by relevant authentication flows |
| `VITE_API_URL` | Frontend | Backend API base URL |
| `SMTP_HOST` | Backend | Email server |
| `SMTP_PORT` | Backend | Email server port |
| `SMTP_USER` | Backend | Email account username |
| `SMTP_PASS` | Backend | Email account password |
| `EMAIL_FROM` | Backend | Sender address |
| `CLOUDINARY_CLOUD_NAME` | Backend | Cloudinary account |
| `CLOUDINARY_API_KEY` | Backend | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Backend | Cloudinary API secret |

Never commit `.env` files, database credentials, API secrets or private authentication keys to GitHub.

## Production Deployment

The EventEase website is deployed using Vercel.

For production configuration:

1. Set the frontend `VITE_API_URL` to the deployed backend API base URL.
2. Set the backend `CORS_ORIGIN` to the deployed frontend origin.
3. Set the backend `FRONTEND_URL` to the deployed frontend URL.
4. Configure MongoDB connectivity and credentials.
5. Configure the JWT secret.
6. Configure SMTP and Cloudinary credentials when using those integrations.
7. Redeploy the affected application after changing production environment variables.

**Live Website:** https://event-ease-44xo.vercel.app/

## Functional Testing Checklist

Use this checklist when testing a local or production deployment:

- [ ] Backend starts and connects to MongoDB.
- [ ] Customer registration works.
- [ ] Customer login works.
- [ ] Events can be discovered and opened.
- [ ] Search and filters work.
- [ ] Customers can complete a test booking.
- [ ] Bookings appear in the customer's booking history.
- [ ] Digital tickets display their QR codes.
- [ ] Organizers can create and manage events.
- [ ] Event image uploads work when Cloudinary is configured.
- [ ] Organizers can verify tickets by uploading QR images.
- [ ] Admin and organizer dashboards display their relevant information.
- [ ] Desktop and mobile layouts work correctly.

## Security Considerations

- Passwords should be securely hashed.
- Authentication should use protected JWT tokens.
- Role-based access should restrict administrative and organizer operations.
- Secrets and credentials must remain outside the Git repository.
- MongoDB should use appropriate access controls and network restrictions.
- Production CORS settings should allow only the intended frontend origins.

## Future Improvements

Potential future enhancements include:

- Online payment gateway integration
- Additional event discovery features
- Improved reporting and analytics
- Additional notification options
- Further performance and accessibility improvements

## Project Status

EventEase has been deployed, and its live functionality has been tested by the project developer.

Optional third-party integrations depend on their respective service configurations. Real payment processing should not be considered implemented unless a payment gateway is separately integrated and tested.

## Author

Developed as a university and portfolio project focused on event management, database management and software engineering.

---

**EventEase — Discover Events. Book Tickets. Manage Experiences.**
