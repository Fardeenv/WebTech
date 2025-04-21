# Dentcare - Dental Appointment Web App

**Dentcare** is a web application built using Node.js, Express, and MongoDB, designed for managing dental appointments. The application allows patients to book appointments and provides an interface for clinic staff to manage these appointments.

**Hosted on Render:** [Visit Dentcare Live](https://your-render-link.onrender.com)

---

## Project Structure

```
Dentcare/
├── models/          # Mongoose schemas for MongoDB
├── node_modules/    # Project dependencies
├── private/         # Private assets (if any)
├── public/          # Public static files (CSS, JS, images)
├── views/           # EJS view templates
├── temp/            # Temporary or backup files
├── app.js           # Application entry point
├── index.js         # Server initializer
├── package.json     # Project metadata and dependencies
└── package-lock.json# Dependency lock file
```

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Frontend:** EJS templating engine, HTML, CSS
- **Hosting:** Render

---

## How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/FardeenVaddo/dentcare.git
   cd dentcare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   node app.js
   ```

4. Open your browser and go to `http://localhost:3000`

---

## Live Deployment

Dentcare is hosted on **Render**.  
Access the live application here: [https://your-render-link.onrender.com](https://your-render-link.onrender.com)

---

## Notes

- Ensure MongoDB is running locally or configure your connection string in the app.
- The server is bound to `0.0.0.0` for Render deployment compatibility.

---

## Author

**Fardeen Vaddo**  
GitHub: [FardeenVaddo](https://github.com/FardeenVaddo)
