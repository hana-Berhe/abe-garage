// Demo data for local work: staff, customers, cars, services and orders in every state.
// Run after /install:  npm run seed            (adds ~12 demo orders)
//                      npm run seed -- --orders=1000   (extra orders to test list speed, NFR-09)
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
process.env.SMTP_HOST = ""; // never email demo customers

const bcrypt = require("bcrypt");
const { pool } = require("../../src/config/db");
const orderService = require("../../src/modules/orders/order.service");
const invoiceService = require("../../src/modules/invoices/invoice.service");

const PASSWORD = "Password123";

const STAFF = [
  ["dana@abegarage.com", "Dana", "Brooks", 2],
  ["sam@abegarage.com", "Sam", "Rivera", 1],
  ["morgan@abegarage.com", "Morgan", "Lee", 1],
  ["kebede@abegarage.com", "Kebede", "Alemu", 1],
];

const SERVICES = [
  ["Oil change", "Engine oil and filter replacement", 50, 0.5],
  ["Brakes", "Pads, discs and brake fluid check", 180, 2],
  ["Wheel alignment", "Four-wheel alignment", 35, 1],
  ["Engine diagnosis", "Computer diagnosis and road test", 120, 1.5],
  ["Tire rotation", "Rotate and balance four tires", 25, 0.5],
  ["Battery replacement", "Test and replace the battery", 90, 0.5],
  ["Air conditioning service", "Recharge and leak test", 110, 1.5],
  ["Full service", "Oil, filters, fluids and 40-point check", 220, 3],
];

const CUSTOMERS = [
  ["Lena", "Haile", "0911000101", [2017, "Honda", "Fit", "Hatchback", "Blue", "AA-10101", 61200]],
  ["Omar", "Daud", "0911000177", [2019, "Toyota", "Corolla", "Sedan", "White", "AA-20177", 48000]],
  ["Hirut", "Tesfaye", "0911000214", [2015, "Toyota", "Yaris", "Hatchback", "Silver", "AA-30214", 112400]],
  ["Sara", "Bekele", "0911000058", [2020, "Nissan", "Note", "Hatchback", "Red", "AA-40058", 30200]],
  ["Yonas", "Alemu", "0911000330", [2012, "Hyundai", "Tucson", "SUV", "Black", "AA-50330", 156000]],
  ["Meron", "Girma", "0911000412", [2018, "Kia", "Rio", "Sedan", "Grey", "AA-60412", 72000]],
];

async function upsertStaff(hash) {
  const ids = {};
  for (const [email, first, last, role] of STAFF) {
    await pool.query(
      `INSERT IGNORE INTO employees (email, first_name, last_name, phone, password_hash, role_id) VALUES (?, ?, ?, NULL, ?, ?)`,
      [email, first, last, hash, role]
    );
    const [[row]] = await pool.query("SELECT employee_id FROM employees WHERE email = ?", [email]);
    ids[first] = row.employee_id;
  }
  return ids;
}

async function upsertServices() {
  for (const [name, description, price, hours] of SERVICES) {
    await pool.query("INSERT IGNORE INTO services (name, description, price, labor_hours) VALUES (?, ?, ?, ?)", [
      name, description, price, hours,
    ]);
  }
  const [rows] = await pool.query("SELECT service_id, name FROM services");
  return Object.fromEntries(rows.map((r) => [r.name, r.service_id]));
}

async function upsertCustomers() {
  const cars = [];
  for (const [first, last, phone, [year, make, model, type, color, plate, mileage]] of CUSTOMERS) {
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@example.com`;
    await pool.query("INSERT IGNORE INTO customers (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)", [first, last, email, phone]);
    const [[c]] = await pool.query("SELECT customer_id FROM customers WHERE email = ?", [email]);
    await pool.query(
      `INSERT IGNORE INTO vehicles (customer_id, year, make, model, type, color, plate, mileage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.customer_id, year, make, model, type, color, plate, mileage]
    );
    const [[v]] = await pool.query("SELECT vehicle_id FROM vehicles WHERE plate = ?", [plate]);
    cars.push({ customer_id: c.customer_id, vehicle_id: v.vehicle_id });
  }
  return cars;
}

// Walks one order through the real services so every rule and history row is the same as in the app.
async function demoOrder(car, serviceIds, stage, staff) {
  const manager = { id: staff.Dana };
  const techs = [staff.Sam, staff.Morgan, staff.Kebede];
  const order = await orderService.create(
    { ...car, lines: serviceIds.map((id) => ({ service_id: id })), mileage: null, estimated_ready_date: null,
      notes_for_customer: "We will call you before any extra work.", internal_notes: null },
    manager.id
  );
  const id = order.order_id;
  if (stage === "awaiting") return;
  if (stage === "declined") return orderService.recordApproval(id, { decision: "decline", method: "phone" }, manager.id);
  await orderService.recordApproval(id, { decision: "approve", method: "phone" }, manager.id);
  const { lines } = await orderService.getById(id);
  for (const [i, line] of lines.entries()) await orderService.assignTechnician(line.line_id, techs[i % techs.length], manager.id);
  if (stage === "approved") return;
  for (const [i, line] of lines.entries()) {
    const tech = { id: techs[i % techs.length], role: 1 };
    await orderService.updateLineStatus(line.line_id, { status: 1 }, tech);
    if (stage === "in_progress" && i === lines.length - 1) return;
    await orderService.updateLineStatus(line.line_id, { status: 2 }, tech);
  }
  if (stage === "paid") await invoiceService.markPaid(id, manager.id);
}

async function main() {
  const extra = Number((process.argv.find((a) => a.startsWith("--orders=")) || "").split("=")[1] || 0);
  const [[{ n }]] = await pool.query("SELECT COUNT(*) AS n FROM employees WHERE role_id = 3");
  if (!n) throw new Error("Run GET /install first, then seed.");

  const staff = await upsertStaff(await bcrypt.hash(PASSWORD, 10));
  const svc = await upsertServices();
  const cars = await upsertCustomers();

  const [[{ orders }]] = await pool.query("SELECT COUNT(*) AS orders FROM orders");
  if (orders === 0) {
    const plan = [
      [0, ["Oil change", "Brakes"], "in_progress"],
      [1, ["Full service"], "awaiting"],
      [2, ["Engine diagnosis"], "approved"],
      [3, ["Tire rotation", "Wheel alignment"], "completed"],
      [4, ["Battery replacement"], "paid"],
      [5, ["Air conditioning service"], "declined"],
      [0, ["Wheel alignment"], "paid"],
      [2, ["Oil change", "Tire rotation"], "completed"],
      [3, ["Brakes"], "awaiting"],
      [1, ["Oil change"], "paid"],
    ];
    for (const [car, names, stage] of plan) await demoOrder(cars[car], names.map((x) => svc[x]), stage, staff);
  }
  for (let i = 0; i < extra; i++) {
    await demoOrder(cars[i % cars.length], [svc["Oil change"]], ["awaiting", "paid", "completed"][i % 3], staff);
    if (i % 100 === 99) console.log(`  ${i + 1} extra orders`);
  }

  console.log(`Seed done. Staff log in with password "${PASSWORD}":`);
  for (const [email, , , role] of STAFF) console.log(`  ${email} (${["", "Technician", "Manager", "Admin"][role]})`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
