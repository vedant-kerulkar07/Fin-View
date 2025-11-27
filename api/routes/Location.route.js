import express from "express";
import { getLocations } from "../controllers/Location.controller.js";

const locationRoute = express.Router();

locationRoute.get("/locationapi", getLocations);

export default locationRoute;