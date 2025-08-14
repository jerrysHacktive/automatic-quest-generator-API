const axios = require("axios");
const logger = require("../utils/logger");
const { createQuest } = require("../model/questModel");
const { ValidationError, APIError } = require("../middleware/errorHandler");
const { createObjectCsvWriter } = require("csv-writer");

// Validate location search input
const validateSearchInput = (locationName) => {
  if (
    !locationName ||
    typeof locationName !== "string" ||
    locationName.trim() === ""
  ) {
    throw new ValidationError(
      "Location name is required and must be a non-empty string",
      {
        field: "locationName",
        value: locationName,
      }
    );
  }
};

// Validate quest creation input
const validateQuestInput = ({ place_id, display_name, lat, lon, price }) => {
  const errors = [];
  if (!place_id) errors.push("place_id is required");
  if (!display_name) errors.push("display_name is required");
  if (!lat || isNaN(lat)) errors.push("lat is required and must be a number");
  if (!lon || isNaN(lon)) errors.push("lon is required and must be a number");
  if (price !== undefined && (isNaN(price) || price < 0))
    errors.push("price must be a non-negative number or undefined");

  if (errors.length > 0) {
    throw new ValidationError("Invalid quest input data", { errors });
  }
};

// Handle location search using LocationIQ and Wikipedia APIs
const searchLocation = async (req, res, next) => {
  try {
    const { locationName } = req.body;
    validateSearchInput(locationName);

    // Try Autocomplete API first
    let response;
    try {
      response = await axios.get(
        "https://api.locationiq.com/v1/autocomplete.php",
        {
          params: {
            key: process.env.LOCATIONIQ_API_KEY,
            q: locationName,
            limit: 10,
            format: "json",
          },
          timeout: 5000,
        }
      );
    } catch (autocompleteError) {
      if (autocompleteError.response?.status === 404) {
        logger.info(
          `Autocomplete failed for ${locationName}, trying Search API`
        );
        response = await axios.get("https://api.locationiq.com/v1/search.php", {
          params: {
            key: process.env.LOCATIONIQ_API_KEY,
            q: locationName,
            limit: 10,
            format: "json",
            extratags: 1,
          },
          timeout: 5000,
        });
      } else {
        throw autocompleteError;
      }
    }

    // Validate LocationIQ response
    if (!Array.isArray(response.data)) {
      throw new APIError("Invalid response from LocationIQ API", {
        data: response.data,
        status: response.status,
      });
    }

    // Map LocationIQ response and fetch Wikipedia extracts if needed
    const locations = await Promise.all(
      response.data.map(async (loc) => {
        let wikipediaExtract = loc.wikipedia_extracts || {
          text: "No Wikipedia data available",
        };
        if (!loc.wikipedia_extracts) {
          try {
            const wikiUrl = loc.extratags?.wikipedia;
            let wikiTitle = loc.display_name.split(",")[0].trim();
            if (wikiUrl) {
              wikiTitle = wikiUrl.split("/").pop().replace("en:", "");
            }
            const wikiResponse = await axios.get(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
                wikiTitle
              )}`,
              {
                timeout: 5000,
              }
            );
            wikipediaExtract = {
              text: wikiResponse.data.extract || "No Wikipedia data available",
            };
            logger.info(`Fetched Wikipedia extract for ${wikiTitle}`);
          } catch (wikiError) {
            logger.warn(
              `Wikipedia API failed for ${loc.display_name}: ${wikiError.message}`
            );
          }
        }
        return {
          place_id: loc.place_id || "unknown",
          display_name: loc.display_name || "Unknown Location",
          lat: loc.lat || "0",
          lon: loc.lon || "0",
          wikipedia_extracts: wikipediaExtract,
        };
      })
    );

    logger.info(
      `Fetched ${locations.length} locations for query: ${locationName}`
    );
    res.json({ locations });
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorDetails = {
        status,
        data: error.response.data,
        api: "LocationIQ",
      };

      if (status === 429) {
        throw new APIError("LocationIQ API rate limit exceeded", {
          ...errorDetails,
          retryAfter: error.response.headers["retry-after"] || "unknown",
        });
      } else if (status === 401 || status === 403) {
        throw new APIError(
          "LocationIQ API authentication failed",
          errorDetails
        );
      } else {
        throw new APIError(
          `LocationIQ API error: ${
            error.response.statusText || "Unknown error"
          }`,
          errorDetails
        );
      }
    } else if (error.code === "ECONNABORTED") {
      throw new APIError("LocationIQ API request timed out", {
        api: "LocationIQ",
        timeout: 5000,
      });
    } else {
      next(error);
    }
  }
};

// Handle quest creation
const createQuestFromLocation = async (req, res, next) => {
  try {
    const {
      place_id,
      display_name,
      lat,
      lon,
      wikipedia_extracts,
      saveToCsv = true,
    } = req.body;
    validateQuestInput({ place_id, display_name, lat, lon });

    // Prepare prompt for Gemini API
    const prompt =
      wikipedia_extracts?.text &&
      wikipedia_extracts.text !== "No Wikipedia data available"
        ? `Summarize the following into a fun, two-sentence description for a quest: ${wikipedia_extracts.text}`
        : `Generate a concise Wikipedia-style description (3-4 sentences) for the location "${display_name}", including its historical or cultural significance, as if it were a Wikipedia entry. Then, summarize it into a fun, two-sentence description for a quest.`;

    // Call Gemini API
    let description;
    try {
      const geminiResponse = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        {
          params: { key: process.env.GEMINI_API_KEY },
          timeout: 5000,
        }
      );

      if (geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        description = geminiResponse.data.candidates[0].content.parts[0].text;
      } else {
        logger.warn(
          `No description generated for ${display_name}, using default`
        );
        description = `Embark on a thrilling adventure in ${display_name}! Uncover the hidden stories that await in this iconic place.`;
      }
    } catch (geminiError) {
      logger.warn(
        `Gemini API failed for ${display_name}: ${geminiError.message}, using default description`
      );
      description = `Embark on a thrilling adventure in ${display_name}! Uncover the hidden stories that await in this iconic place.`;
    }

    // Create quest object
    const quest = createQuest({
      title: display_name,
      aura: 400,
      category: "Adventure",
      description,
      latitude: lat,
      longitude: lon,
      // No price field set
    });

    // Save quest to CSV file if saveToCsv is true
    if (saveToCsv) {
      try {
        const csvWriter = createObjectCsvWriter({
          path: "quests.csv",
          header: [
            { id: "title", title: "Title" },
            { id: "aura", title: "Aura" },
            { id: "category", title: "Category" },
            { id: "description", title: "Description" },
            { id: "latitude", title: "Latitude" },
            { id: "longitude", title: "Longitude" },
            { id: "price", title: "Price" },
          ],
          append: true,
        });

        await csvWriter.writeRecords([quest]);
        logger.info(
          `Saved quest for ${display_name} to quests.csv, ready for Git commit`
        );
      } catch (csvError) {
        logger.warn(`Failed to save quest to CSV: ${csvError.message}`);
        throw new APIError("Failed to save quest to CSV", {
          error: csvError.message,
        });
      }
    } else {
      logger.info(`Skipped saving quest for ${display_name} to CSV`);
    }

    logger.info(`Created quest for ${display_name}`);
    res.json(quest);
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorDetails = {
        status,
        data: error.response.data,
        api: "Gemini",
      };

      if (status === 429) {
        throw new APIError("Gemini API rate limit exceeded", {
          ...errorDetails,
          retryAfter: error.response.headers["retry-after"] || "unknown",
        });
      } else if (status === 401 || status === 403) {
        throw new APIError("Gemini API authentication failed", errorDetails);
      } else {
        throw new APIError(
          `Gemini API error: ${error.response.statusText || "Unknown error"}`,
          errorDetails
        );
      }
    } else if (error.code === "ECONNABORTED") {
      throw new APIError("Gemini API request timed out", {
        api: "Gemini",
        timeout: 5000,
      });
    } else {
      next(error);
    }
  }
};

module.exports = { searchLocation, createQuestFromLocation };
