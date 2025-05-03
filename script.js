const API_URL = "https://script.google.com/macros/s/AKfycbzO45Lscp0APoqDSA5z00o5eGG1tRT-rFldR8UBPR66D56Biug_KDcp8ZhK0ojXzYQE/exec";

// 📥 Fetch and display all profiles
async function fetchProfiles() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    const container = document.getElementById("profiles-container");
    container.innerHTML = "";

    const casteGroups = {};
    data.forEach(profile => {
      const caste = profile.caste || "Unknown";
      if (!casteGroups[caste]) casteGroups[caste] = [];
      casteGroups[caste].push(profile);
    });

    for (const caste in casteGroups) {
      const div = document.createElement("div");
      div.classList.add("caste-category");
      div.innerHTML = `<h2>${caste}</h2>`;

      const table = document.createElement("table");
      table.innerHTML = `
        <thead>
          <tr>
            <th>Name</th><th>Age</th><th>Gender</th><th>Education</th><th>Profession</th>
          </tr>
        </thead>
        <tbody>
          ${casteGroups[caste]
            .map(p => `<tr>
              <td>${p.name || ""}</td>
              <td>${p.age || ""}</td>
              <td>${p.gender || ""}</td>
              <td>${p.education || ""}</td>
              <td>${p.profession || ""}</td>
            </tr>`)
            .join("")}
        </tbody>
      `;
      div.appendChild(table);
      container.appendChild(div);
    }
  } catch (err) {
    console.error("Error loading profiles:", err);
  }
}

// 📤 Handle form submission
document.getElementById("profile-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());
  const formBody = new URLSearchParams(data).toString();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formBody,
    });

    const result = await res.json();
    if (result.success) {
      alert("Profile added!");
      this.reset();
      document.getElementById("add-profile-modal").style.display = "none";
      fetchProfiles(); // Refresh list
    } else {
      alert("Error adding profile.");
    }
  } catch (err) {
    console.error("Submit error:", err);
    alert("Error submitting profile.");
  }
});

// 🔍 Search filter
document.getElementById("searchBar").addEventListener("input", function () {
  const filter = this.value.toLowerCase();
  const rows = document.querySelectorAll("tbody tr");

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? "" : "none";
  });
});

// 🚀 Initial fetch
fetchProfiles();
