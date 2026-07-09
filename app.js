const STORAGE_KEY = "phd-dashboard-v1-1";

let state = loadState();

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

$all("nav a").forEach(link => {
  link.addEventListener("click", () => {
    $all("nav a").forEach(a => a.classList.remove("active"));
    $all(".page").forEach(section => section.classList.remove("active-page"));

    link.classList.add("active");
    const page = document.querySelector(link.getAttribute("href"));
    page.classList.add("active-page");
  });
});

$("#courseForm").addEventListener("submit", event => {
  event.preventDefault();

  state.courses.push({
    id: crypto.randomUUID(),
    title: $("#courseTitle").value.trim(),
    institution: $("#courseInstitution").value.trim(),
    ects: Number($("#courseEcts").value),
    category: $("#courseCategory").value,
    status: $("#courseStatus").value
  });

  saveState();
  event.target.reset();
  $("#courseInstitution").value = "Aalborg University";
  render();
});

$("#articleForm").addEventListener("submit", event => {
  event.preventDefault();

  state.articles.push({
    id: crypto.randomUUID(),
    title: $("#articleTitle").value.trim(),
    authors: $("#articleAuthors").value.trim(),
    pages: $("#articlePages").value.trim(),
    venue: $("#articleVenue").value.trim(),
    status: $("#articleStatus").value
  });

  saveState();
  event.target.reset();
  render();
});

$("#disseminationForm").addEventListener("submit", event => {
  event.preventDefault();

  state.dissemination.push({
    id: crypto.randomUUID(),
    date: $("#disseminationDate").value,
    place: $("#disseminationPlace").value.trim(),
    duration: Number($("#disseminationDuration").value),
    description: $("#disseminationDescription").value.trim()
  });

  saveState();
  event.target.reset();
  render();
});

$("#exportBtn").addEventListener("click", async () => {
  const json = JSON.stringify(state, null, 2);
  await navigator.clipboard.writeText(json);
  alert("Data er kopieret til udklipsholderen.");
});

$("#downloadBtn").addEventListener("click", () => {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "phd-dashboard-data.json";
  a.click();

  URL.revokeObjectURL(url);
});

$("#importBtn").addEventListener("click", () => {
  try {
    const imported = JSON.parse($("#importData").value);
    validateState(imported);
    state = ensureIds(imported);
    saveState();
    $("#importData").value = "";
    render();
    alert("Data er importeret.");
  } catch (error) {
    alert("Import fejlede: " + error.message);
  }
});

$("#resetBtn").addEventListener("click", () => {
  if (!confirm("Vil du nulstille til startdata?")) return;
  state = ensureIds(structuredClone(INITIAL_DATA));
  saveState();
  render();
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return ensureIds(JSON.parse(saved));
    } catch {
      return ensureIds(structuredClone(INITIAL_DATA));
    }
  }
  return ensureIds(structuredClone(INITIAL_DATA));
}

function validateState(data) {
  if (!data.profile) throw new Error("Mangler profile.");
  if (!Array.isArray(data.courses)) throw new Error("Mangler courses-array.");
  if (!Array.isArray(data.articles)) throw new Error("Mangler articles-array.");
  if (!Array.isArray(data.dissemination)) throw new Error("Mangler dissemination-array.");
}

function ensureIds(data) {
  validateState(data);

  for (const key of ["courses", "articles", "dissemination"]) {
    data[key] = data[key].map(item => ({
      id: item.id || crypto.randomUUID(),
      ...item
    }));
  }

  data.profile.ectsTarget = Number(data.profile.ectsTarget || 30);

  return data;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  renderProfile();
  renderDashboard();
  renderCourses();
  renderArticles();
  renderDissemination();
}

function renderProfile() {
  $("#profileTitle").textContent = state.profile.title;
  $("#profileSubtitle").textContent = `${state.profile.name} · ${state.profile.institution}`;
}

function renderDashboard() {
  const target = state.profile.ectsTarget;
  const passedEcts = state.courses
    .filter(course => course.status === "Passed")
    .reduce((sum, course) => sum + Number(course.ects || 0), 0);

  const missing = Math.max(0, target - passedEcts);
  const pct = Math.min(100, Math.round((passedEcts / target) * 100));

  $("#ectsScore").textContent = `${fmt(passedEcts)} / ${fmt(target)}`;
  $("#ectsBar").style.width = pct + "%";
  $("#ectsMissing").textContent = `Mangler ${fmt(missing)} ECTS`;

  const articleCounts = countBy(state.articles, "status");
  $("#articleScore").textContent = state.articles.length;
  $("#articleSummary").textContent = summarizeCounts(articleCounts);

  const disseminationHours = state.dissemination.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  $("#disseminationScore").textContent = state.dissemination.length;
  $("#disseminationSummary").textContent = `${fmt(disseminationHours)} timer registreret`;
}

function renderCourses() {
  const tbody = $("#coursesTable");
  tbody.innerHTML = "";

  const sorted = [...state.courses].sort((a, b) => {
    const statusOrder = { "Passed": 1, "In progress": 2, "Planned": 3 };
    return (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9);
  });

  for (const course of sorted) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(course.title)}</td>
      <td>${escapeHtml(course.institution)}</td>
      <td>${fmt(course.ects)}</td>
      <td>${escapeHtml(course.category)}</td>
      <td><span class="status">${escapeHtml(course.status)}</span></td>
      <td><button class="delete" onclick="removeItem('courses', '${course.id}')">Slet</button></td>
    `;
    tbody.appendChild(tr);
  }
}

function renderArticles() {
  const tbody = $("#articlesTable");
  tbody.innerHTML = "";

  const statusOrder = { "Published": 1, "Pending": 2, "In progress": 3, "Planned": 4, "Idea": 5 };

  const sorted = [...state.articles].sort((a, b) => {
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
  });

  for (const article of sorted) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(article.title)}</td>
      <td>${escapeHtml(article.authors)}</td>
      <td>${escapeHtml(article.pages)}</td>
      <td>${escapeHtml(article.venue)}</td>
      <td><span class="status">${escapeHtml(article.status)}</span></td>
      <td><button class="delete" onclick="removeItem('articles', '${article.id}')">Slet</button></td>
    `;
    tbody.appendChild(tr);
  }
}

function renderDissemination() {
  const list = $("#disseminationList");
  list.innerHTML = "";

  const sorted = [...state.dissemination].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  if (sorted.length === 0) {
    list.innerHTML = `<p>Ingen dissemination-aktiviteter registreret endnu.</p>`;
    return;
  }

  for (const item of sorted) {
    const div = document.createElement("div");
    div.className = "activity";
    div.innerHTML = `
      <h3>${escapeHtml(item.place)}</h3>
      <p><strong>${escapeHtml(item.date)}</strong> · ${fmt(item.duration)} timer</p>
      <p>${escapeHtml(item.description)}</p>
      <button class="delete" onclick="removeItem('dissemination', '${item.id}')">Slet</button>
    `;
    list.appendChild(div);
  }
}

function removeItem(key, id) {
  state[key] = state[key].filter(item => item.id !== id);
  saveState();
  render();
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "Unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function summarizeCounts(counts) {
  const entries = Object.entries(counts);
  if (entries.length === 0) return "Ingen artikler";
  return entries.map(([key, value]) => `${value} ${key}`).join(" · ");
}

function fmt(number) {
  return Number(number || 0).toLocaleString("da-DK", { maximumFractionDigits: 2 });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
