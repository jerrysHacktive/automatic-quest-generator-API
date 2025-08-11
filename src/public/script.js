// Handle search form submission
const searchForm = document.getElementById("search-form");
const locationsList = document.getElementById("locations-list");
const questForm = document.getElementById("quest-form");
const questResult = document.getElementById("quest-result");

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const locationName = document.getElementById("location-name").value;

  try {
    const response = await fetch("/api/v1/quests/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to search locations");
    }

    const { locations } = await response.json();
    locationsList.innerHTML = "<h2>Locations Found</h2>";
    if (locations.length === 0) {
      locationsList.innerHTML += "<p>No locations found.</p>";
    } else {
      locations.forEach((loc) => {
        const div = document.createElement("div");
        div.innerHTML = `
          <p><strong>${loc.display_name}</strong></p>
          <p>Coordinates: (${loc.lat}, ${loc.lon})</p>
          <button class="search-btn" onclick="fillQuestForm('${
            loc.place_id
          }', '${loc.display_name.replace(/'/g, "\\'")}', '${loc.lat}', '${
          loc.lon
        }', '${loc.wikipedia_extracts.text.replace(
          /'/g,
          "\\'"
        )}')">Select</button>
        `;
        locationsList.appendChild(div);
      });
      questForm.style.display = "block";
    }
  } catch (error) {
    locationsList.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
});

// Fill quest form with selected location data
const fillQuestForm = (placeId, displayName, lat, lon, wikiText) => {
  document.getElementById("place-id").value = placeId;
  document.getElementById("display-name").value = displayName;
  document.getElementById("latitude").value = lat;
  document.getElementById("longitude").value = lon;
  document.getElementById("wikipedia-extracts").value = wikiText;
};

// Handle quest form submission
questForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const questData = {
    place_id: document.getElementById("place-id").value,
    display_name: document.getElementById("display-name").value,
    lat: document.getElementById("latitude").value,
    lon: document.getElementById("longitude").value,
    wikipedia_extracts: {
      text: document.getElementById("wikipedia-extracts").value,
    },
    saveToCsv: document.getElementById("save-to-csv").checked,
  };

  try {
    const response = await fetch("/api/v1/quests/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create quest");
    }

    const quest = await response.json();
    questResult.innerHTML = `
      <h2>Quest Created</h2>
      <p><strong>Title:</strong> ${quest.title}</p>
      <p><strong>Aura:</strong> ${quest.aura}</p>
      <p><strong>Category:</strong> ${quest.category}</p>
      <p><strong>Description:</strong> ${quest.description}</p>
      <p><strong>Coordinates:</strong> (${quest.latitude}, ${
      quest.longitude
    })</p>
      <p><strong>Price:</strong> ${quest.price || "Free"}</p>
    `;
  } catch (error) {
    questResult.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
});
