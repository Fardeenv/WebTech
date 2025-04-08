const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  contact_info: String,
  address: String,
  diagnostic_data: String,
});

// Mongoose automatically adds an `_id` field of type ObjectId to the schema.
const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;
