# MedCare OS – Hospital Management System

## 👨‍🎓 Student Details
- Name: Prakhar Tandon
- Registration Number: 24BCI0222
- Course: B.Tech CSE Information Security
- University: VIT Vellore, Vellore

## 📌 Project Description
MedCare OS is a React-based hospital management system that manages patient admissions, doctor scheduling, billing, and analytics with an interactive UI.

## 🔗 GitHub Repository
[https://github.com/prakhar-1611/medcare-react](https://github.com/prakhar-1611/Hospital-Management-System-DBMS)

Folder Structure:

## 📁 Folder Structure
```
medcare-react/
│
├── public/
│   ├── icons.svg
│   └── index.html
│
├── src/
│   ├── components/
│   │   ├── AdmissionsSection.jsx
│   │   ├── AnalyticsSection.jsx
│   │   ├── BillingSection.jsx
│   │   ├── CreateInvoiceModal.jsx
│   │   ├── DashboardSection.jsx
│   │   ├── DoctorsSection.jsx
│   │   ├── LoginScreen.jsx
│   │   ├── NotifPanel.jsx
│   │   ├── PatientsSection.jsx
│   │   ├── PaymentModal.jsx
│   │   ├── SettingsSection.jsx
│   │   ├── Toast.jsx
│   │   └── ViewInvoiceModal.jsx
│   │
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── constants.js
│   └── api.js            (API layer for the backend)
│
├── backend/              (Express + MongoDB API, see backend/README.md)
│
├── package.json
├── package-lock.json
├── vite.config.js
├── README.md
└── .gitignore
```
## 🚀 Features
- Patient admission and record management
- Doctor scheduling and availability tracking
- Appointment slot booking system
- Billing and invoice generation
- Payment processing system
- Analytics dashboard for hospital data
- Notification system for alerts and updates

## 🗄️ Backend (Review 2 – BCSE302P)
The `backend/` folder has the Node.js / Express / MongoDB API for appointment booking.
Setup and API list are in `backend/README.md`.

```bash
cd backend && npm install
# create backend/.env with MONGO_URI and JWT_SECRET
npm run seed && npm start
```

## 🛠️ Technologies Used
- React.js
- JavaScript (ES6+)
- HTML5 & CSS3
- Vite (Build Tool)
- Node.js, Express
- MongoDB, Mongoose
