// Integrated Project Code
// Organize files, backend, and frontend seamlessly.

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const app = express();
const PORT = 3000;

const nodemailer = require("nodemailer");

// // Middleware for parsing multipart form data
// const storage = multer.memoryStorage(); // Store image in memory temporarily
// const upload = multer({ storage });

const upload = multer(); // In-memory storage

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "waves.goa911@gmail.com",
    pass: "inmb pmer evwu kwnu", // Use the generated App Password here
  },
});

// Function to send an email
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: '"Dental Clinic" <waves.goa911@gmail.com>',
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
}

// MongoDB Atlas Connection
const dbURI =
  "mongodb+srv://tarunbagewadi1999:WTcoursePRO@dental.bnemx.mongodb.net/?retryWrites=true&w=majority&appName=Dental";
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("MongoDB Atlas connected successfully!"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Set views directory
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MONGODB SCHEMAS
// Session Management
app.use(
  session({
    secret: "mySecretKey", // Change this to a strong secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: dbURI, collectionName: "sessions" }),
    cookie: { maxAge: 1000 * 60 * 30 },
  })
);
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Identifier for the counter, e.g., 'patient_id'
  seq: { type: Number, default: 0 }, // Current sequence number
});

const Counter = mongoose.model("Counter", counterSchema);

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

const appointmentSchema = new mongoose.Schema({
  appointment_id: { type: Number, unique: true }, // Auto-incremented
  patient_id: { type: Number, ref: "Patient", required: true }, // Linked to Patient schema
  doctor_id: { type: Number, required: true }, // Linked to Doctor schema
  treatment: String, // Previous 'treatment' field renamed to 'name'
  date: Date,
  cost: Number, // Added to store cost
  email: String, // Added patient email for contact purposes
  //for image
});
const Appointment = mongoose.model("Appointment", appointmentSchema);

const patientSchema = new mongoose.Schema(
  {
    patient_id: { type: Number, unique: true }, // Sequential ID
    name: String,
    age: Number,
    contact_info: String,
    address: String,
    diagnostic_data: String,
    report: {
      img: String, // for base64 image data
      mimeType: String, // for file type
      name: String, // for original filename
    },
  },
  { strict: false }
);

const Patient = mongoose.model("Patient", patientSchema);

async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true } // Create if not exists
  );
  return counter.seq;
}

async function getNextAppointmentId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: "appointment_id" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// ROUTES
// Routes
app.get("/", (req, res) => {
  res.redirect("/landing.html");
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/login.html");
  });
});

// DISPLAY Add/Manage Patients
app.get("/add_manage_patients", (req, res) => {
  console.log("Accessing Add/Manage Patients Page");
  if (req.session.user) {
    res.sendFile(path.join(__dirname, "private", "add_manage_patients.html"));
  } else {
    res.redirect("/login.html");
  }
});

// DISPLAY PATIENT TABLE
app.get("/patientTable", (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, "private", "patientTable.html"));
  } else {
    res.redirect("/login.html");
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.user = user.username;
      res.redirect("/dashboard");
    } else {
      res.send(
        "Invalid username or password. <a href='/login.html'>Try Again</a>"
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// DISPLAY DASHBOARD
app.get("/dashboard", (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, "private", "dashboard.html"));
  } else {
    res.redirect("/login.html");
  }
});

//SHARE PATIENT RECORD
app.get("/share_patient_record.html", (req, res) => {
  if (req.session.user != undefined) {
    res.sendFile(path.join(__dirname, "private", "share_patient_record.html"));
  } else {
    res.redirect("/login.html");
  }
});

// VIEW ALL PATIENTS
// SENDS JSON DATA
// app.get("/view_patient_records", async (req, res) => {
//   try {
//     const patients = await Patient.find({});
//     res.status(200).json({
//       message: "Patient records retrieved successfully",
//       data: patients,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Error fetching patient records" });
//   }
// });

//VIEW ALL PATIENTS
// SENDS EJS DATA
app.get("/view_patient_records", async (req, res) => {
  try {
    const patients = await Patient.find({}); // Fetch all patients from the database

    // Render the EJS template and pass the patients' data
    res.render("view_all_patients", { patients });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching patients' data.");
  }
});

// DISPLAY MANAGE APPOINTMENTS
app.get("/manage_appointments", (req, res) => {
  if (req.session.user != undefined) {
    console.log(`Dashboard says: ${req.session.user}`);
    res.sendFile(path.join(__dirname, "private", "manage_appointments.html"));
  } else {
    res.redirect("/login.html");
  }
});

// ADD APPOINTMENTS
app.get("/addAppointment", (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, "private", "addAppointment.html")); // Ensure the file exists
  } else {
    res.redirect("/login.html");
  }
});

// DISPLAY UPDATING THE APPOINTMENT
app.get("/updateAppointment", (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, "private", "updateAppointment.html")); // Ensure the file exists
  } else {
    res.redirect("/login.html");
  }
});

// DISPLAY DELETING OF APPOINTMENT
app.get("/deleteAppointment", (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, "private", "deleteAppointment.html")); // Ensure the file exists
  } else {
    res.redirect("/login.html");
  }
});

// DISPLAY ALL APPOINTMENTS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Optional: Set views directory

app.get("/viewAppointments", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  const patientId = req.query.patient_id; // Get patient_id from query params
  if (!patientId) {
    return res.status(400).send("Patient ID is required.");
  }

  try {
    const appointments = await Appointment.find({ patient_id: patientId });

    res.render("viewAppointments", {
      appointments: appointments || [],
    });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).send("Error retrieving appointments.");
  }
});

// DISPLAY ALL THE INVOICES
app.get("/manage_invoices", (req, res) => {
  if (req.session.user != undefined) {
    console.log(`Dashboard says: ${req.session.user}`);
    res.sendFile(path.join(__dirname, "private", "manage_invoices.html"));
  } else {
    res.redirect("/login.html");
  }
});
app.get("/manage_documents", (req, res) => {
  if (req.session.user != undefined) {
    console.log(`Dashboard says: ${req.session.user}`);
    res.sendFile(path.join(__dirname, "private", "manage_documents.html"));
  } else {
    res.redirect("/login.html");
  }
});

// SHARE DATA ALONG WITH THE IMAGE
app.post("/sharePatient", async (req, res) => {
  try {
    const patientId = req.body.patient_id;

    // Input validation
    if (!patientId || isNaN(patientId)) {
      return res.status(400).send(`
        <div class="error">
          <h2>Invalid Patient ID</h2>
          <p>Please provide a valid patient ID number.</p>
          <a href="/">Back to Search</a>
        </div>
      `);
    }

    // Find patient in database
    const patient = await Patient.findOne({ patient_id: patientId });

    if (!patient) {
      return res.status(404).send(`
        <div class="error">
          <h2>Patient Not Found</h2>
          <p>No patient found with ID: ${patientId}</p>
          <a href="/">Back to Search</a>
        </div>
      `);
    }

    // Create image URL if report exists
    if (patient.report && patient.report.img && patient.report.mimeType) {
      patient.imageUrl = `data:${patient.report.mimeType};base64,${patient.report.img}`;
    }

    res.render("patientDetails", { patient });
  } catch (error) {
    console.error("Error fetching patient details:", error);
    res.status(500).send(`
      <div class="error">
        <h2>Server Error</h2>
        <p>An error occurred while fetching patient details.</p>
        <a href="/">Back to Search</a>
      </div>
    `);
  }
});

// DOWNLOADING THE PDF

app.post("/downloadPatientReport", async (req, res) => {
  try {
    const patientId = req.body.patient_id;

    // Fetch patient and appointment data
    const patient = await Patient.findOne({ patient_id: patientId });
    const appointments = await Appointment.find({ patient_id: patientId }).sort(
      { date: -1 }
    );

    if (!patient) {
      return res.status(404).send("Patient not found");
    }

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=patient_${patientId}_report.pdf`
    );

    // Pipe the PDF into the response
    doc.pipe(res);

    // Add content to PDF
    // Header
    doc.fontSize(20).text("Patient Report", { align: "center" }).moveDown();

    // Patient Details
    doc.fontSize(12);

    const details = [
      { label: "Patient ID", value: patient.patient_id },
      { label: "Name", value: patient.name },
      { label: "Age", value: patient.age },
      { label: "Contact Info", value: patient.contact_info },
      { label: "Address", value: patient.address },
      { label: "Diagnostic Data", value: patient.diagnostic_data },
    ];

    details.forEach((detail) => {
      doc.text(`${detail.label}: ${detail.value}`).moveDown(0.5);
    });

    // Add Appointment History Section
    doc
      .moveDown()
      .fontSize(16)
      .text("Appointment History", { underline: true })
      .moveDown();

    if (appointments.length > 0) {
      appointments.forEach((appointment, index) => {
        doc
          .fontSize(12)
          .text(Appointment`#${index + 1}`)
          .moveDown(0.5);

        const appointmentDetails = [
          { label: "Appointment ID", value: appointment.appointment_id },
          { label: "Doctor ID", value: appointment.doctor_id },
          { label: "Treatment", value: appointment.treatment || "N/A" },
          { label: "Date", value: appointment.date.toLocaleDateString() },
          { label: "Cost", value: `$${appointment.cost?.toFixed(2) || "N/A"}` },
          { label: "Email", value: appointment.email || "N/A" },
        ];

        appointmentDetails.forEach((detail) => {
          doc.text(`${detail.label}: ${detail.value}`).moveDown(0.5);
        });

        // Add a separator between appointments
        if (index < appointments.length - 1) {
          doc.moveDown().text("------------------------").moveDown();
        }
      });
    } else {
      doc.text("No appointment history found.").moveDown();
    }

    // Add report image if exists
    if (patient.report && patient.report.img) {
      doc
        .moveDown()
        .text("Patient Report Image:", { underline: true })
        .moveDown();

      // Convert base64 to Buffer
      const imgBuffer = Buffer.from(patient.report.img, "base64");

      // Add the image to the PDF
      doc.image(imgBuffer, {
        fit: [500, 400],
        align: "center",
        valign: "center",
      });

      doc
        .moveDown()
        .text(`Report File Name: ${patient.report.name}`, { align: "center" });
    }

    // Add footer
    doc
      .moveDown()
      .fontSize(10)
      .text(`Generated on: ${new Date().toLocaleString()}`, {
        align: "center",
        color: "grey",
      });

    // Finalize PDF file
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF report");
  }
});

// SHARE PATIENT ONLY THE TEXT DATA
// app.post("/sharePatient", async (req, res) => {
//   try {
//     console.log(req.query.patient_id);
//     console.log(req.body.patient_id);
//     // Get patient_id from query parameters (form submission)
//     // const patientId = parseInt(req.query.patient_id);
//     const patientId = req.body.patient_id;

//     // Input validation
//     if (!patientId || isNaN(patientId)) {
//         return res.status(400).send(`
//             <div class="error">
//                 <h2>Invalid Patient ID</h2>
//                 <p>Please provide a valid patient ID number.</p>
//                 <a href="/">Back to Search</a>
//             </div>
//         `);
//     }

//     // Find patient in database
//     const patient = await Patient.findOne({ patient_id: patientId });

//     if (!patient) {
//         return res.status(404).send(`
//             <div class="error">
//                 <h2>Patient Not Found</h2>
//                 <p>No patient found with ID: ${patientId}</p>
//                 <a href="/">Back to Search</a>
//             </div>
//         `);
//     }
//     res.render("patientDetails", { patient });

//     } catch (error) {
//       console.error('Error fetching patient details:', error);
//         res.status(500).send(`
//             <div class="error">
//                 <h2>Server Error</h2>
//                 <p>An error occurred while fetching patient details.</p>
//                 <a href="/">Back to Search</a>
//             </div>
//         `);
//     }
// });

////////////////////////////////////////////////////////////////////////////////////////////

//HANDLE POST ADDING PATIENT
app.post("/addPatient", async (req, res) => {
  const { name, age, contact_info, address, diagnostic_data } = req.body;
  const report = null;
  try {
    let report_image = null;
    const patient_id = await getNextSequence("patient_id");
    const newPatient = new Patient({
      patient_id,
      name,
      age,
      contact_info,
      address,
      diagnostic_data,
      report,
    });

    await newPatient.save();
    res.redirect("/add_manage_patients?message=Patient added successfully!");
  } catch (err) {
    console.error(err);
    res.redirect("/add_manage_patients?error=Error adding patient.");
  }
});

//AFTER MODIFYINF FRONTEND
app.post("/updatePatient", upload.single("image"), async (req, res) => {
  const { patient_id, diagnostic_data } = req.body;

  // Validate input
  if (!patient_id || !diagnostic_data) {
    return res.redirect("/add_manage_patients?error=All fields are required.");
  }

  try {
    let report_image = null; // Initialize as null

    // Check if an image file was uploaded
    if (req.file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.redirect(
          "/add_manage_patients?error=Invalid file type. Please upload JPEG, PNG, or GIF."
        );
      }

      // Validate file size (e.g., 5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (req.file.size > maxSize) {
        return res.redirect(
          "/add_manage_patients?error=File too large. Maximum size is 5MB."
        );
      }

      // Convert the uploaded image to Base64 and store metadata
      report_image = {
        img: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
        name: req.file.originalname,
      };
      console.log("Created the report image");
    }

    // Update the patient record
    const updatedPatient = await Patient.updateOne(
      { patient_id: patient_id },
      {
        $set: {
          diagnostic_data,
          ...(report_image && { report: report_image }), // Only add 'report' if an image was uploaded
        },
      }
    );

    if (updatedPatient.modifiedCount === 0) {
      return res.redirect(
        "/add_manage_patients?error=Patient not found or no changes made."
      );
    }

    res.redirect(
      "/add_manage_patients?message=Patient record updated successfully!"
    );
  } catch (err) {
    console.error("Error updating patient:", err);
    res.redirect("/add_manage_patients?error=Error updating patient.");
  }
});

// POST route to upload image
app.post("/upload", upload.single("image"), async (req, res, next) => {
  try {
    // Validate input
    if (!req.file) {
      return res.status(400).json({
        status: "Error",
        message: "Please upload an image",
      });
    }

    const collection = database.collection("images"); // Replace with your collection name

    // Create an image document
    const uploadImage = {
      img: req.file.buffer.toString("base64"),
      mimeType: req.file.mimetype,
      name: req.file.originalname,
    };

    const result = await collection.insertOne(uploadImage);

    res.status(200).json({
      message: "File uploaded successfully",
      imageUrl: `/image/${result.insertedId}`,
      details: {
        fileName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Error uploading image." });
  }
});

// HANDLE POST DELLTING PATIENT
app.post("/deletePatient", async (req, res) => {
  const { patient_id } = req.body;

  try {
    const deletedPatient = await Patient.deleteOne({ patient_id });

    if (deletedPatient.deletedCount === 0) {
      return res.redirect("/add_manage_patients?error=Patient not found.");
    }

    res.redirect(
      "/add_manage_patients?message=Patient record deleted successfully!"
    );
  } catch (err) {
    console.error(err);
    res.redirect("/add_manage_patients?error=Error deleting patient.");
  }
});

// SEARCHING PATIENTS
app.post("/searchPatient", async (req, res) => {
  const { patient_id } = req.body;

  try {
    const patient = await Patient.findOne({ patient_id });

    if (!patient) {
      return res.status(404).send("Patient not found.");
    }

    // Redirect with query parameters
    res.redirect(
      `/patientTable?patient_id=${patient.patient_id}&name=${patient.name}&age=${patient.age}&contact_info=${patient.contact_info}&address=${patient.address}&diagnostic_data=${patient.diagnostic_data}`
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Error searching for patient.");
  }
});

// HANDLE POST ADD NEW APPOINTMENT(With email sending)
app.post("/addAppointment", async (req, res) => {
  const { patient_id, doctor_id, treatment, date, cost, email } = req.body;

  try {
    const appointment_id = await getNextAppointmentId(); // Ensure auto-increment
    const newAppointment = new Appointment({
      appointment_id,
      patient_id,
      doctor_id,
      treatment,
      date,
      cost,
      email,
    });

    await newAppointment.save();

    // Send email notification to the patient with invoice details
    const subject = "Appointment Confirmation with Invoice";
    const html = `
      <p>Dear Patient,</p>
      <p>Your appointment has been scheduled successfully:</p>
      <ul>
        <li>Treatment: ${treatment}</li>
        <li>Date: ${date}</li>
        <li>Cost: ${cost}</li>
      </ul>
      <p>Please find the invoice details below:</p>
      <p><strong>Total Cost:</strong> ${cost}</p>
      <p>Thank you for choosing our clinic!</p>
    `;

    await sendEmail(email, subject, html);

    res.redirect(
      "/manage_appointments?message=Appointment added successfully and email sent with invoice!"
    );
  } catch (err) {
    console.error(err);
    res.redirect("/manage_appointments?error=Error adding appointment.");
  }
});

// HANDLE THE UPDATION OF APPOINNMENTS
// HANDLE THE UPDATION OF APPOINNMENTS
app.post("/updateAppointment", async (req, res) => {
  const { appointment_id, treatment, date, cost } = req.body;

  // Validate input: Ensure appointment_id is provided
  if (!appointment_id) {
    res.redirect("/manage_appointments?error=Appointment ID is required.");
    return;
  }

  try {
    // Fetch the current appointment details
    const currentAppointment = await Appointment.findOne({ appointment_id });

    if (!currentAppointment) {
      res.redirect("/manage_appointments?error=Appointment not found.");
      return;
    }

    // Prepare the update object, using current values for blank inputs
    const updateFields = {
      treatment: treatment || currentAppointment.treatment, // Use new value or retain old
      date: date || currentAppointment.date, // Use new value or retain old
      cost: cost || currentAppointment.cost, // Use new value or retain old
    };

    // Update the appointment
    const updatedAppointment = await Appointment.findOneAndUpdate(
      { appointment_id },
      updateFields,
      { new: true }
    );

    if (updatedAppointment) {
      // Send email notification to the patient
      const subject = "Appointment Update";
      const html = `
        <p>Dear Patient,</p>
        <p>Your appointment details have been updated:</p>
        <ul>
          <li>Treatment: ${updateFields.treatment}</li>
          <li>Date: ${updateFields.date}</li>
          <li>Cost: ${updateFields.cost}</li>
        </ul>
        <p>Thank you for choosing our clinic!</p>
      `;
      await sendEmail(currentAppointment.email, subject, html);

      res.redirect(
        "/manage_appointments?message=Appointment updated successfully and email sent!"
      );
    } else {
      res.redirect("/manage_appointments?error=Error updating appointment.");
    }
  } catch (err) {
    console.error(err);
    res.redirect("/manage_appointments?error=Error updating appointment.");
  }
});

// HANDLE DELETING AN APPOINTMENT
app.post("/deleteAppointment", async (req, res) => {
  const { appointment_id } = req.body;

  try {
    const deletedAppointment = await Appointment.findOneAndDelete({
      appointment_id,
    });

    if (deletedAppointment) {
      res.redirect(
        "/manage_appointments?message=Appointment deleted successfully!"
      );
    } else {
      res.redirect("/manage_appointments?error=Appointment not found.");
    }
  } catch (err) {
    console.error(err);
    res.redirect("/manage_appointments?error=Error deleting appointment.");
  }
});

// HANDLE POST REGISTRATION
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.send("User already exists. Please try a different username.");
    }

    // Hash the password before saving
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create a new user
    const newUser = new User({
      username,
      password: hashedPassword,
    });

    await newUser.save(); // Save user to database
    res.send(
      "User registered successfully! <a href='/login.html'>Go to Login</a>"
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error: Could not register user.");
  }
});

// HANDLE SHARE PATIENT RECORD
app.post("/share_patient_record", async (req, res) => {
  const { patientId, recipientEmail } = req.body; // Assuming these are sent from the frontend

  try {
    // Fetch the patient record from the database (dummy data here)
    const patientRecord = await Patient.findById(patientId); // Assuming a Patient model is created

    if (!patientRecord) {
      return res.status(404).send("Patient record not found.");
    }

    // Send an email with the patient record (you would use an email service like Nodemailer here)
    // Placeholder for email sending logic:
    console.log(`Sharing patient record with ${recipientEmail}...`);

    // Example: Send the link (could be dynamic)
    const shareLink = `http://localhost:3000/view_patient_records/${patientId}`;
    console.log(`Patient record shared at: ${shareLink}`);

    // Respond with success message
    res.send("Patient record shared successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
