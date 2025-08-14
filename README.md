
Quest_Generator-Api is a web application that allows users to search for locations, view their details, and create adventure quests based on real-world places. Built with Node.js, Express.js, and vanilla JavaScript, it integrates LocationIQ for geocoding, Wikipedia API for location descriptions, and Google Gemini API for generating engaging quest descriptions when Wikipedia data is unavailable. Quests are saved to a CSV file for persistence and can be extended for future features like user-defined prices or database storage.
Features

Location Search: Search for locations using LocationIQ's Autocomplete and Search APIs.
Wikipedia Integration: Fetch concise Wikipedia summaries for locations when available.
Quest Generation: Create adventure quests with details like title, aura, category, description, and coordinates, using Gemini API for custom descriptions when needed.
CSV Storage: Save quests to quests.csv for easy data management.
Responsive UI: Simple, user-friendly interface for searching locations and creating quests.
Error Handling: Robust validation and logging for API errors and user inputs.

Tech Stack

Backend: Node.js, Express.js
Frontend: HTML, CSS, vanilla JavaScript
APIs:
LocationIQ for geocoding and location data
Wikipedia REST API for location summaries
Google Gemini API for generating quest descriptions


Dependencies: axios, csv-writer, winston (for logging)
Storage: CSV file (quests.csv)

Project Structure
QuestSeeker/
├── controllers/
│   └── questController.js   API logic for location search and quest creation
├── middleware/
│   └── errorHandler.js     Custom error handling
├── models/
│   └── questModel.js       Quest object creation
├── public/
│   ├── index.html          Main HTML page
│   ├── seek.css            Styles for the frontend
│   └── seek.js             Frontend JavaScript logic
├── utils/
│   └── logger.js           Winston logging configuration
├── app.js                  Express server setup
├── quests.csv              Output file for saved quests
├── .env                   Environment variables (not tracked)
├── .gitignore              Git ignore file
├── package.json            Node.js dependencies and scripts
└── README.md               Project documentation

Installation

Clone the Repository:
git clone https://github.com/jerrysHacktive/quest-generator-api.git
cd Quest-Generator-API


Install Dependencies:
npm install


Set Up Environment Variables:Create a .env file in the root directory with the following:
LOCATIONIQ_API_KEY=your_locationiq_api_key
GEMINI_API_KEY=your_gemini_api_key
PORT=3000


Obtain a LocationIQ API key.
Obtain a Google Gemini API key.


Run the Application:
npm run dev


Usage

Search for a Location:

Open http://localhost:YOUR PORT in your browser.
Enter a location (e.g., "Eiffel Tower, Paris, France") in the search form.
View a list of matching locations with coordinates and Wikipedia summaries (or "No Wikipedia data available").


Create a Quest:

Select a location from the search results.
The quest form auto-fills with location details and Wikipedia data.
Submit the form to create a quest, which uses the Gemini API to generate a description if no Wikipedia data is available.
View the quest details in the UI and save them to quests.csv (optional).


View Saved Quests:

Check quests.csv for saved quests, which include:Title,Aura,Category,Description,Latitude,Longitude,Price
"Eiffel Tower, Paris, France",400,Adventure,"The Eiffel Tower, located on...",48.8584,2.2945,


API Endpoints

POST /api/quests/search:

Body: { "locationName": "string" }
Response: { "locations": [{ "place_id": string, "display_name": string, "lat": string, "lon": string, "wikipedia_extracts": { "text": string } }, ...] }
Searches for locations using LocationIQ and fetches Wikipedia summaries.


POST /api/quests/create:

Body: { "place_id": string, "display_name": string, "lat": string, "lon": string, "wikipedia_extracts": { "text": string }, "saveToCsv": boolean }
Response: { "title": string, "aura": number, "category": string, "description": string, "latitude": string, "longitude": string, "price": undefined }
Creates a quest and optionally saves it to quests.csv.

