let currentUser = null;

function login(e) {
  e.preventDefault();
  currentUser = document.getElementById("loginUser").value;
  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  initApp();
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
  document.getElementById("content").classList.toggle("collapsed");
}

function showSection(id) {
  // sembunyikan semua section...
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  // highlight menu aktif
  document.querySelectorAll("#sidebar ul li").forEach(li => {
    const sec = li.getAttribute("data-section");
    li.classList.toggle("active", sec === id);
  });
}


function initApp() {
  showSection("dashboard");
  // Load Units
  fetch("/api/units")
    .then(r => r.json())
    .then(data => {
      const ul = document.getElementById("unitList");
      ul.innerHTML = "";
      data.forEach(u => {
        const li = document.createElement("li");
        li.textContent = `${u.id} (${u.model}) purchased: ${u.purchaseDate}`;
        const h = document.createElement("ul");
        u.maintenanceHistory.forEach(m => {
          const mi = document.createElement("li");
          mi.textContent = `${m.date}: ${m.description}`;
          h.appendChild(mi);
        });
        li.appendChild(h);
        ul.appendChild(li);
      });
    });

  // Load Parts
 // di initApp() atau bagian Spare Part load
fetch("/api/catalog")
  .then(res => res.json())
  .then(data => {
    const grid = document.getElementById("partList");
    const sel  = document.getElementById("orderPartSelect");
    grid.innerHTML = "";
    sel.innerHTML  = "";
    data.forEach(p => {
      // 1) render kartu
      const card = document.createElement("div");
      card.className = "part-card";
      card.innerHTML = `
        <img src="${p.imageUrl}" alt="${p.name}" />
        <div class="info">
          <h4>${p.name}</h4>
          <p><strong>ID:</strong> ${p.id}</p>
          <p><strong>Stock:</strong> ${p.stock}</p>
          <p><strong>Price:</strong> Rp ${p.price.toLocaleString()}</p>
        </div>
      `;
      grid.appendChild(card);

      // 2) update dropdown order
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.name} – Rp ${p.price.toLocaleString()}`;
      sel.appendChild(opt);
    });
  })
  .catch(err => console.error("Error loading catalog:", err));


  // Load Tickets
  renderTickets();
}

function createTicket(e) {
  e.preventDefault();
  const form = document.getElementById("ticketForm2");
  const fd = new FormData(form);
  fd.append("author", currentUser);
  fetch("/api/tickets", { method: "POST", body: fd })
    .then(r => r.json())
    .then(() => { alert("Ticket created"); form.reset(); renderTickets(); });
}

function renderTickets() {
  fetch("/api/tickets")
    .then(r => r.json())
    .then(data => {
      const ul = document.getElementById("ticketList");
      ul.innerHTML = "";
      data.forEach(t => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${t.id}</strong> [${t.status}]<br>${t.issue}<br>
          ${t.photo?`<img src="${t.photo}" width="80"/><br>`:""}
          <button onclick="respondPrompt('${t.id}')">Respond</button>
        `;
        ul.appendChild(li);
      });
    });
}

function respondPrompt(id) {
  const message = prompt("Reply message");
  const newStatus = prompt("New status (optional)", "");
  fetch(`/api/tickets/${id}/respond`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author: currentUser, message, newStatus })
  }).then(() => renderTickets());
}

function orderPart(e) {
  e.preventDefault();
  const f = document.getElementById("orderForm");
  const data = {
    partId: f.partId.value,
    quantity: f.quantity.value,
    customer: currentUser
  };
  fetch("/api/catalog/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(r => r.json())
    .then(j => alert(JSON.stringify(j)));
}

function downloadReport() {
  window.location = "/api/tickets/report";
}
