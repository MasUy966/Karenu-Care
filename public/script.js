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
  // Tampilkan dashboard saat pertama kali load
  showSection("dashboard");

  // 1. Total Units → KPI Units & render list
  fetch("/api/units")
    .then(res => res.json())
    .then(units => {
      // Render Unit Management list (jika masih pakai)
      const ul = document.getElementById("unitList");
      ul.innerHTML = "";
      units.forEach(u => {
        const li = document.createElement("li");
        li.textContent = `${u.id} (${u.model}) purchased: ${u.purchaseDate}`;
        const hist = document.createElement("ul");
        u.maintenanceHistory.forEach(h => {
          const hi = document.createElement("li");
          hi.textContent = `${h.date}: ${h.description}`;
          hist.appendChild(hi);
        });
        li.appendChild(hist);
        ul.appendChild(li);
      });

      // KPI: Total Units
      document.getElementById("kpiUnits").textContent = units.length;
    })
    .catch(console.error);

  // 2. Open Tickets → KPI Tickets & render tickets
  fetch("/api/tickets")
    .then(res => res.json())
    .then(tickets => {
      // Render Service Tickets list (jika masih pakai renderTickets())
      renderTickets();

      // KPI: Open Tickets = semua tiket yang statusnya belum "Selesai"
      const openCount = tickets.filter(t => t.status !== "Selesai").length;
      document.getElementById("kpiTickets").textContent = openCount;
    })
    .catch(console.error);

  // 3. Pending Orders → KPI Orders
  // (Jika belum punya endpoint GET /api/orders, ditetapkan 0 dulu)
  document.getElementById("kpiOrders").textContent = 0;

  // 4. Next Maintenance → KPI Next Maintenance (tanggal terdekat dari hari ini)
  fetch("/api/units")
    .then(res => res.json())
    .then(units => {
      // kumpulkan semua tanggal maintenance
      const upcomingDates = units
        .flatMap(u => u.maintenanceHistory)
        .map(h => new Date(h.date))
        .filter(d => d >= new Date())          // hanya tanggal masa depan
        .sort((a, b) => a - b);

      const next = upcomingDates[0];
      document.getElementById("kpiNextMaint").textContent = next
        ? next.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
        : "-";
    })
    .catch(console.error);
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
