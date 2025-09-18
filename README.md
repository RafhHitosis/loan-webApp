# Loan Tracker (React + Vite PWA)

A mobile-first loan tracking app to record money lent/borrowed, manage payments, generate breakdowns with interest, and export polished PDF reports. Built with React, Vite, Tailwind CSS, Firebase, and Cloudinary.

✨ Features

🔐 Authentication – Firebase email/password login, account enable/disable, profile image, password change
💰 Loans – Create, edit, delete (lent/borrowed), due dates, statuses (active/paid)
📊 Breakdowns – Flat/custom interest, monthly schedules, fees, early settlement handling
🧾 Payments – Upload proof (Cloudinary) or add receipts; prevents over/under payment
📈 Dashboard – Totals, net position, overdue/due soon indicators, recent activity
🔍 Loans List – Search/filter, due badges, per-loan progress & history
📑 PDF Export – Per-loan details + analytics in light/dark themes
📱 Mobile UX – Bottom nav, swipe navigation, installable PWA

🛠 Tech Stack

React 19 + Vite 7
Tailwind CSS
Firebase (Auth + Realtime Database)
Cloudinary (image uploads)
lucide-react (icons)
jsPDF + AutoTable (PDF export)
vite-plugin-pwa (PWA support)

🚀 Getting Started

Prerequisites
Node.js 18+ and npm

Install
cd loan-app
npm install

Environment Variables

Create a .env in the root:

## Firebase

VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_DATABASE_URL=your_db_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

## Cloudinary (optional: for client-side deletion, server recommended)

VITE_CLOUDINARY_API_KEY=your_key
VITE_CLOUDINARY_API_SECRET=your_secret

Cloudinary Setup

Edit src/services/cloudinaryService.js:

CLOUDINARY_CLOUD_NAME → your Cloudinary cloud name
CLOUDINARY_UPLOAD_PRESET → unsigned preset that accepts uploads

⚠️ Note: Client-side uploads are supported. For deletion, server-side signatures are recommended.

Run
npm run dev
