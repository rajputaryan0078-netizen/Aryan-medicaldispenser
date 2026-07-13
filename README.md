# NexDose — Clinical Dispensing System

A modern React + Vite + TypeScript web application for a secure clinical medical dispenser. This repository is fully portable and compatible across Windows, macOS, and Linux.

## Requirements

Ensure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

## Setup & Startup Instructions

Follow these steps to get the project running locally:

### 1. Clone the Repository
```bash
git clone <repository_url>
cd Himanshu-medicaldispenser-main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the template `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` in your text editor and fill in your Firebase configuration parameters:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_DATABASE_URL` (optional: overrides default realtime database url)

*(Note: The system will run in warning mode if config is missing, but for full database integrations, these credentials must be supplied.)*

### 4. Run Development Server
To launch the website locally:
```bash
npm run dev
```
By default, the application will be hosted at [http://localhost:5173/](http://localhost:5173/).

### 5. Build for Production
To bundle and compile the application with typechecks:
```bash
npm run build
```
The production bundle will be generated under the `dist/` directory.

## Main Tech Stack
- **Framework**: React 19 + Vite 8 + TypeScript
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **Database/Auth**: Firebase v12
- **Icons**: Lucide React
- **3D Modeling**: Three.js & React Three Fiber (R3F)
