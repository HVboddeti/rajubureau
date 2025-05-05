const API_URL = "https://script.google.com/macros/s/AKfycbzO45Lscp0APoqDSA5z00o5eGG1tRT-rFldR8UBPR66D56Biug_KDcp8ZhK0ojXzYQE/exec";

const selectedIndices = new Set();

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

// 🔍 Normalize caste with smart matching and tag detection
function normalizeCaste(rawCaste) {
  const casteStr = (rawCaste || "Unknown").toLowerCase().replace(/[^a-z0-9\s]/gi, "").trim();

  const knownCastes = [
    "gavara", "gavarapalem", "bc d gavara", "gavara b c d", "bc-dgavara", "gavara group d",
    "viswabrahmins", "koppela velama", "padmanayaka velama", "bcd", "kaikala", "velama", "naidu", "reddy",
    "kapu", "yadav", "kamma", "balija", "vysya", "muslim", "christian", "sc", "st", "bc", "oc"
  ];

  let matchedCaste = "Unknown";
  for (const caste of knownCastes) {
    if (casteStr.includes(caste.replace(/[^a-z0-9]/gi, ""))) {
      matchedCaste = toTitleCase(caste);
      break;
    }
  }

  const tagRegex = /(b\.?c\.?[-\s]?[abcd])/i;
  const match = casteStr.match(tagRegex);
  const bcTag = match ? match[0].toUpperCase().replace(/[^A-Z]/g, "") : null;

  return bcTag ? `${matchedCaste} (BC-${bcTag.slice(-1)})` : matchedCaste;
}

async function fetchProfiles() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    window.allProfiles = data;
    renderStats(data);
    renderProfiles();
  } catch (err) {
    console.error("Error loading profiles:", err);
  }
}

function renderStats(data) {
  let statsContainer = document.getElementById("stats-container");
  if (!statsContainer) {
    statsContainer = document.createElement("div");
    statsContainer.id = "stats-container";
    statsContainer.className = "summary-container";
    document.body.insertBefore(statsContainer, document.getElementById("profiles-container"));
  }

  const casteCounts = {};
  let totalMales = 0;
  let totalFemales = 0;

  data.forEach(profile => {
    const caste = normalizeCaste(profile.caste);
    if (!casteCounts[caste]) casteCounts[caste] = { male: 0, female: 0 };
    const gender = (profile.gender || '').toLowerCase();
    if (gender === "male") {
      casteCounts[caste].male++;
      totalMales++;
    } else if (gender === "female") {
      casteCounts[caste].female++;
      totalFemales++;
    }
  });

  const totalPeople = totalMales + totalFemales;
  const summaryItems = Object.entries(casteCounts).map(([caste, counts]) => {
    return `<div class="summary-item"><strong>${caste}</strong><br>${counts.male + counts.female} (M: ${counts.male}, F: ${counts.female})</div>`;
  }).join("");

  statsContainer.innerHTML = `
    <h3>Profile Summary</h3>
    <div class="summary-grid">
      <div class="summary-item"><strong>Total</strong><br>${totalPeople} People</div>
      <div class="summary-item"><strong>Male</strong><br>${totalMales}</div>
      <div class="summary-item"><strong>Female</strong><br>${totalFemales}</div>
      ${summaryItems}
    </div>
  `;
}

function renderProfiles(filter = "") {
  const container = document.getElementById("profiles-container");
  container.innerHTML = "";

  const casteGroups = {};
  window.allProfiles.forEach((profile, index) => {
    const caste = normalizeCaste(profile.caste);
    if (!casteGroups[caste]) casteGroups[caste] = [];
    profile.index = index;
    casteGroups[caste].push(profile);
  });

  for (const caste in casteGroups) {
    const div = document.createElement("div");
    div.classList.add("caste-category");
    div.innerHTML = `<h2>${caste}</h2>`;

    const table = document.createElement("table");
    const filteredProfiles = casteGroups[caste].filter(p =>
      !filter || Object.values(p).join(" ").toLowerCase().includes(filter)
    );

    table.innerHTML = `
      <thead>
        <tr>
          <th>Select</th><th>Photo</th><th>Name</th><th>Age</th><th>Gender</th><th>Education</th><th>Profession</th><th>More</th>
        </tr>
      </thead>
      <tbody>
        ${filteredProfiles.map(p => {
          const photoHTML = p.photos
            ? p.photos
                .split(/[\,\s]+/)
                .map(link => `<a href="${link.trim()}" target="_blank">View Photo</a>`)
                .join("<br>")
            : "No Photo";

          const detailsHTML = `
            <div class="details-wrapper">
              ${Object.entries(p)
                .filter(([key]) =>
                  !["index", "photos", "name", "age", "gender", "education", "profession", "caste"].includes(key)
                )
                .map(([key, val]) =>
                  `<div class="detail-item"><strong>${key.replace(/_/g, " ")}:</strong> ${val}</div>`
                )
                .join("")}
            </div>
          `;

          return `
            <tr>
              <td data-label="Select"><input type="checkbox" class="profile-checkbox" data-index="${p.index}" ${selectedIndices.has(p.index) ? "checked" : ""}></td>
              <td data-label="Photo">${photoHTML}</td>
              <td data-label="Name">${p.name || ""}</td>
              <td data-label="Age">${p.age || ""}</td>
              <td data-label="Gender">${p.gender || ""}</td>
              <td data-label="Education">${p.education || ""}</td>
              <td data-label="Profession">${p.profession || ""}</td>
              <td data-label="More"><button class="toggle-details" data-details-id="details-${p.index}">▶</button></td>
            </tr>
            <tr id="details-${p.index}" class="details-row" style="display:none;"><td colspan="8">${detailsHTML}</td></tr>`;
        }).join("")}
      </tbody>
    `;
    div.appendChild(table);
    container.appendChild(div);
  }
}

function getSelectedProfiles() {
  return window.allProfiles.filter((_, i) => selectedIndices.has(i));
}

function generateMessage(profile, i) {
  const fields = Object.entries(profile)
    .filter(([key]) => key !== "index" && key !== "timestamp" && key !== "")
    .map(([key, val]) => `${key.replace(/_/g, " ")}: ${val}`)
    .join("\n");
  return `Profile ${i + 1}\n${fields}`;
}

function shareSelectedWhatsApp() {
  const profiles = getSelectedProfiles();
  const message = profiles.map((p, i) => generateMessage(p, i)).join("\n\n-------------------\n\n");
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

function shareSelectedGmail() {
  const profiles = getSelectedProfiles();
  const body = profiles.map((p, i) => generateMessage(p, i)).join("\n\n-------------------\n\n");
  const subject = encodeURIComponent("Marriage Bureau Profiles");
  const encodedBody = encodeURIComponent(body);
  window.open(`mailto:?subject=${subject}&body=${encodedBody}`, "_blank");
}

function shareSelectedSMS() {
  const profiles = getSelectedProfiles();
  const message = profiles.map((p, i) => generateMessage(p, i)).join("\n\n-------------------\n\n");
  const encoded = encodeURIComponent(message);
  window.open(`sms:?body=${encoded}`, "_blank");
}

const searchInput = document.getElementById("searchBar");
searchInput.addEventListener("input", () => renderProfiles(searchInput.value.toLowerCase()));

document.addEventListener("change", function (e) {
  if (e.target.classList.contains("profile-checkbox")) {
    const index = parseInt(e.target.dataset.index);
    if (e.target.checked) {
      selectedIndices.add(index);
    } else {
      selectedIndices.delete(index);
    }
  }
});

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("toggle-details")) {
    const detailsId = e.target.dataset.detailsId;
    const row = document.getElementById(detailsId);
    if (row.style.display === "none") {
      row.style.display = "table-row";
      e.target.textContent = "▼";
    } else {
      row.style.display = "none";
      e.target.textContent = "▶";
    }
  }
});

fetchProfiles();
