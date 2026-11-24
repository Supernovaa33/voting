const STORAGE_KEY = "simple_voting_app_v1";

const DEFAULT_CANDIDATES = [
  {
    id: 1,
    name: "Andi Pratama",
    tagline: "Membangun komunitas yang aktif, inklusif, dan terbuka.",
    votes: 12,
    color: "#2563eb",
  },
  {
    id: 2,
    name: "Siti Rahmawati",
    tagline: "Fokus pada program edukasi rutin dan kolaborasi anggota.",
    votes: 18,
    color: "#7c3aed",
  },
  {
    id: 3,
    name: "Rizky Hidayat",
    tagline: "Transparansi kegiatan dan inovasi agenda bulanan.",
    votes: 9,
    color: "#0d9488",
  },
];

const AVATAR_COLORS = ["#2563eb", "#7c3aed", "#0d9488", "#db2777", "#ea580c", "#16a34a"];

let state = loadState();
let toastTimer = null;

const candidatesGrid = document.getElementById("candidates-grid");
const resultsList = document.getElementById("results-list");
const totalVotesEl = document.getElementById("total-votes");
const voteStatusEl = document.getElementById("vote-status");
const resetBtn = document.getElementById("reset-btn");
const toggleAddBtn = document.getElementById("toggle-add-btn");
const cancelAddBtn = document.getElementById("cancel-add-btn");
const addForm = document.getElementById("add-candidate-form");
const nameInput = document.getElementById("candidate-name");
const taglineInput = document.getElementById("candidate-tagline");
const toastEl = document.getElementById("toast");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.candidates) && parsed.candidates.length > 0) {
        return {
          candidates: parsed.candidates,
          votedCandidateId: parsed.votedCandidateId ?? null,
        };
      }
    }
  } catch {
    // Abaikan data storage yang rusak dan gunakan data default.
  }
  return {
    candidates: structuredClone(DEFAULT_CANDIDATES),
    votedCandidateId: null,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getTotalVotes() {
  return state.candidates.reduce((sum, c) => sum + c.votes, 0);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2600);
}

function castVote(candidateId) {
  if (state.votedCandidateId !== null) {
    showToast("Anda sudah memberikan suara.");
    return;
  }

  const candidate = state.candidates.find((c) => c.id === candidateId);
  if (!candidate) return;

  candidate.votes += 1;
  state.votedCandidateId = candidateId;
  saveState();
  render();
  showToast(`Suara untuk ${candidate.name} berhasil dicatat!`);
}

function resetVoting() {
  state = {
    candidates: structuredClone(DEFAULT_CANDIDATES),
    votedCandidateId: null,
  };
  saveState();
  render();
  showToast("Voting berhasil direset.");
}

function addCandidate(event) {
  event.preventDefault();
  const name = nameInput.value.trim();
  const tagline = taglineInput.value.trim();
  if (!name || !tagline) return;

  const nextId = state.candidates.reduce((max, c) => Math.max(max, c.id), 0) + 1;
  const color = AVATAR_COLORS[(nextId - 1) % AVATAR_COLORS.length];

  state.candidates.push({
    id: nextId,
    name,
    tagline,
    votes: 0,
    color,
  });

  saveState();
  addForm.reset();
  addForm.classList.add("hidden");
  render();
  showToast(`Kandidat "${name}" ditambahkan.`);
}

function renderCandidates() {
  candidatesGrid.innerHTML = "";
  const hasVoted = state.votedCandidateId !== null;

  state.candidates.forEach((candidate, index) => {
    const isSelected = state.votedCandidateId === candidate.id;

    const card = document.createElement("article");
    card.className = `candidate-card${isSelected ? " selected" : ""}`;

    const top = document.createElement("div");
    top.className = "card-top";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.style.backgroundColor = candidate.color;
    avatar.textContent = getInitials(candidate.name);

    const info = document.createElement("div");
    const num = document.createElement("div");
    num.className = "candidate-number";
    num.textContent = `Kandidat #${index + 1}`;

    const nameEl = document.createElement("h3");
    nameEl.className = "candidate-name";
    nameEl.textContent = candidate.name;

    info.append(num, nameEl);
    top.append(avatar, info);

    const taglineEl = document.createElement("p");
    taglineEl.className = "candidate-tagline";
    taglineEl.textContent = candidate.tagline;

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const votesLabel = document.createElement("span");
    votesLabel.className = "vote-count-pill";
    votesLabel.textContent = `${candidate.votes} suara`;

    const voteBtn = document.createElement("button");
    voteBtn.type = "button";
    voteBtn.className = isSelected ? "btn btn-secondary" : "btn btn-primary";
    voteBtn.disabled = hasVoted;
    voteBtn.textContent = isSelected ? "Pilihan Anda" : hasVoted ? "Terkunci" : "Pilih";
    voteBtn.addEventListener("click", () => castVote(candidate.id));

    footer.append(votesLabel, voteBtn);
    card.append(top, taglineEl, footer);
    candidatesGrid.appendChild(card);
  });
}

function renderResults() {
  resultsList.innerHTML = "";
  const totalVotes = getTotalVotes();
  const maxVotes = Math.max(...state.candidates.map((c) => c.votes), 0);

  const sorted = [...state.candidates].sort((a, b) => b.votes - a.votes);

  sorted.forEach((candidate) => {
    const percent = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : "0.0";
    const isLeader = maxVotes > 0 && candidate.votes === maxVotes;
    const isUserChoice = state.votedCandidateId === candidate.id;

    const item = document.createElement("div");
    item.className = "result-item";

    const meta = document.createElement("div");
    meta.className = "result-meta";

    const nameGroup = document.createElement("div");
    nameGroup.className = "result-name";
    const nameText = document.createElement("span");
    nameText.textContent = candidate.name;
    nameGroup.appendChild(nameText);

    if (isLeader) {
      const leaderBadge = document.createElement("span");
      leaderBadge.className = "leader-badge";
      leaderBadge.textContent = "Unggul";
      nameGroup.appendChild(leaderBadge);
    }

    if (isUserChoice) {
      const votedBadge = document.createElement("span");
      votedBadge.className = "voted-badge";
      votedBadge.textContent = "Pilihan Anda";
      nameGroup.appendChild(votedBadge);
    }

    const statsText = document.createElement("span");
    statsText.textContent = `${candidate.votes} suara (${percent}%)`;

    meta.append(nameGroup, statsText);

    const track = document.createElement("div");
    track.className = "progress-track";

    const fill = document.createElement("div");
    fill.className = "progress-fill";
    fill.style.width = `${percent}%`;
    fill.style.backgroundColor = candidate.color;

    track.appendChild(fill);
    item.append(meta, track);
    resultsList.appendChild(item);
  });
}

function renderSummary() {
  totalVotesEl.textContent = String(getTotalVotes());

  if (state.votedCandidateId !== null) {
    const chosen = state.candidates.find((c) => c.id === state.votedCandidateId);
    voteStatusEl.textContent = chosen ? `Memilih ${chosen.name}` : "Sudah Memilih";
    voteStatusEl.className = "status-voted";
  } else {
    voteStatusEl.textContent = "Belum Memilih";
    voteStatusEl.className = "status-pending";
  }
}

function render() {
  renderSummary();
  renderCandidates();
  renderResults();
}

resetBtn.addEventListener("click", resetVoting);
toggleAddBtn.addEventListener("click", () => {
  addForm.classList.toggle("hidden");
  if (!addForm.classList.contains("hidden")) {
    nameInput.focus();
  }
});
cancelAddBtn.addEventListener("click", () => {
  addForm.reset();
  addForm.classList.add("hidden");
});
addForm.addEventListener("submit", addCandidate);

render();
