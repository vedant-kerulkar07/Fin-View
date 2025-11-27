// models/Location.js
import mongoose from "mongoose";

const StateSchema = new mongoose.Schema({
  name: String,
  code: String,
});

const LocationSchema = new mongoose.Schema({
  name: String,   // Country name
  code: String,   // Country code
  states: [StateSchema],
});

const Location = mongoose.model("Location", LocationSchema);

export default Location;
