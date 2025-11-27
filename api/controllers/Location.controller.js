import Location from "../models/location.model.js";

export const getLocations = async (req, res) => {
  try {
    // Fetch only name and states (ignoring other fields)
    const locations = await Location.find({}, { name: 1, states: 1, _id: 0 }).lean();

    res.status(200).json({
      success: true,
      total: locations.length,
      countries: locations,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
