const API_URL = "https://script.google.com/macros/s/AKfycbzO45Lscp0APoqDSA5z00o5eGG1tRT-rFldR8UBPR66D56Biug_KDcp8ZhK0ojXzYQE/exec";

const selectedIndices = new Set();

// 📥 Fetch and render profiles
async function fetchProfiles() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    window.allProfiles = data.map((p, i) => ({ ...p, index: i }));
    renderProfiles();
  } catch (err) {
    console.error("Error loading profiles:", err);
  }
}

function renderProfiles(filter = "") {
  const container = document.getElementById("profiles-container");
  container.innerHTML = "";

  const casteGroups = {};

  window.allProfiles.forEach(profile => {
    const caste = profile.caste || "Unknown";
    if (!casteGroups[caste]) casteGroups[caste] = [];
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
                .split(/[,\s]+/)
                .map(link => `<a href="${link.trim()}" target="_blank">View Photo</a>`)
                .join("<br>")
            : "No Photo";

          const detailsHTML = Object.entries(p)
            .filter(([key]) => !["index", "photos", "name", "age", "gender", "education", "profession", "caste"].includes(key))
            .map(([key, val]) => `<div><strong>${key.replace(/_/g, " ")}:</strong> ${val}</div>`)
            .join("");

          return `
            <tr>
              <td><input type="checkbox" class="profile-checkbox" data-index="${p.index}" ${selectedIndices.has(p.index) ? "checked" : ""}></td>
              <td>${photoHTML}</td>
              <td>${p.name || ""}</td>
              <td>${p.age || ""}</td>
              <td>${p.gender || ""}</td>
              <td>${p.education || ""}</td>
              <td>${p.profession || ""}</td>
              <td><button class="toggle-details" data-details-id="details-${p.index}">▶</button></td>
            </tr>
            <tr id="details-${p.index}" class="details-row" style="display:none;">
              <td colspan="8">${detailsHTML}</td>
            </tr>`;
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

// 🔍 Search filter
document.getElementById("searchBar").addEventListener("input", function () {
  const filter = this.value.toLowerCase();
  renderProfiles(filter);
});

// ✅ Track checkbox state
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

// 🔽 Expand/Collapse details
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

// 🚀 Initial fetch
fetchProfiles();
