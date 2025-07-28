const express    = require("express");
const path       = require("path");
const bodyParser = require("body-parser");
const multer     = require("multer");

const app  = express();
const port = process.env.PORT || 3000;

// Multer config: simpan upload di public/uploads
const upload = multer({ dest: path.join(__dirname, "public/uploads") });

// In‑memory demo data
let tickets = [];
let catalog = [
  { id:"SP-001", name:"Ban Forklift A23", stock:12, price:250000, imageUrl:"/images/ban_a23.jpg" },
  { id:"SP-002", name:"Baterai Forklift B15", stock:5,  price:4500000, imageUrl:"/images/battery_b15.jpg" },
  { id:"SP-003", name:"Engine Filter C07",  stock:20, price:150000,  imageUrl:"/images/filter_c07.jpg" },
  { id:"SP-004", name:"Hydraulic Hose D09", stock:0,  price:800000,  imageUrl:"/images/hose_d09.jpg" }
];
let units = [
  {
    id:"U001", model:"Heli H2", purchaseDate:"2024-01-15",
    maintenanceHistory:[
      { date:"2024-03-01", description:"Ganti oli" },
      { date:"2024-06-20", description:"Perbaikan rem" }
    ]
  },
  {
    id:"U002", model:"Komatsu K1", purchaseDate:"2023-11-05",
    maintenanceHistory:[
      { date:"2024-02-10", description:"Servis rutin" }
    ]
  }
];

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// --- API endpoints ---

// Ping
app.get("/api/ping", (req,res) => res.json({ message:"pong" }));

// Catalog & Order
app.get("/api/catalog", (req,res) => res.json(catalog));
app.post("/api/catalog/order", (req,res) => {
  const { partId, quantity, customer } = req.body;
  if(!partId||!quantity||!customer)
    return res.status(400).json({ error:"Missing fields" });
  res.json({ partId, quantity, customer, status:"Order received" });
});

// Units
app.get("/api/units", (req,res) => res.json(units));

// Create ticket w/ photo
app.post("/api/tickets", upload.single("photo"), (req,res) => {
  const { forkliftId, issue, author } = req.body;
  if(!forkliftId||!issue||!author)
    return res.status(400).json({ error:"Missing fields" });
  const id = "TCK-"+String(tickets.length+1).padStart(4,"0");
  const photoUrl = req.file ? "/uploads/"+req.file.filename : null;
  const newTicket = {
    id, forkliftId, issue, author,
    photo:photoUrl,
    status:"Menunggu Jadwal",
    history:["Menunggu Jadwal"],
    comments:[]
  };
  tickets.push(newTicket);
  res.status(201).json(newTicket);
});

// Tickets & respond
app.get("/api/tickets", (req,res) => res.json(tickets));
app.get("/api/tickets/:ticketId", (req,res) => {
  const t = tickets.find(x=>x.id===req.params.ticketId);
  if(!t) return res.status(404).json({ error:"Not found" });
  res.json(t);
});
app.put("/api/tickets/:ticketId/respond", (req,res) => {
  const { author, message, newStatus } = req.body;
  const t = tickets.find(x=>x.id===req.params.ticketId);
  if(!t) return res.status(404).json({ error:"Not found" });
  if(author && message) {
    t.comments.push({ time:new Date().toISOString(), author, message });
  }
  if(newStatus) {
    t.status = newStatus;
    t.history.push(newStatus);
  }
  res.json(t);
});

// Download report CSV
app.get("/api/tickets/report", (req,res) => {
  const header = "id,forkliftId,author,status,photo\n";
  const rows = tickets.map(t=>[t.id,t.forkliftId,t.author,t.status,t.photo||""].join(",")).join("\n");
  res.setHeader("Content-Disposition","attachment; filename=service_report.csv");
  res.type("text/csv").send(header+rows);
});

// SPA fallback
app.get("*", (req,res) =>
  res.sendFile(path.join(__dirname,"public/index.html"))
);

app.listen(port, () =>
  console.log(`Karenu Care server running on port ${port}`)
);
