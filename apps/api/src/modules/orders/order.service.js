const crypto = require("crypto");
const { pool, withTransaction } = require("../../config/db");
const { ApiError } = require("../../shared/respond");
const { pageResult, likePattern } = require("../../shared/pagination");
const { calculateTotals } = require("../../shared/money");
const { ORDER_STATUS: S, LINE_STATUS: L } = require("../../shared/order-codes");
const { ROLES } = require("../../middlewares/auth");
const history = require("./history.service");
const serviceService = require("../services/service.service");
const vehicleService = require("../vehicles/vehicle.service");
const notification = require("./notification.service");

const METHOD_LABEL = { in_person: "in person", phone: "by phone" };

// FR-TRK-01: 32 random hex characters.
const newOrderHash = () => crypto.randomBytes(16).toString("hex");

async function lockOrder(conn, orderId) {
  const [rows] = await conn.query("SELECT * FROM orders WHERE order_id = ? FOR UPDATE", [orderId]);
  if (!rows[0]) throw new ApiError(404, "Order not found");
  return rows[0];
}

async function getVatRate(conn) {
  const [rows] = await conn.query("SELECT vat_rate FROM garage_settings WHERE settings_id = 1");
  if (!rows[0]) throw new ApiError(500, "Garage settings are missing. Run the installer (POST /api/install).");
  return rows[0].vat_rate;
}

// Turns requested lines into rows to insert, with prices read from the database now (AD-5, AD-6).
// A service line may carry its own price (FR-ORD-03); an extra item always has a description and price.
async function buildLines(conn, requested) {
  const serviceIds = requested.filter((l) => l.service_id).map((l) => l.service_id);
  const services = await serviceService.getActiveByIds(conn, serviceIds);
  const byId = new Map(services.map((s) => [s.service_id, s]));
  return requested.map((l, i) => {
    if (l.service_id) {
      const s = byId.get(l.service_id);
      if (!s) throw new ApiError(400, "One of the services is not offered any more", { field: `lines.${i}.service_id` });
      return {
        service_id: s.service_id,
        description: null,
        service_name: s.name,
        service_description: s.description,
        labor_hours: s.labor_hours,
        line_price: l.price ?? s.price,
      };
    }
    return { service_id: null, description: l.description, service_name: l.description, service_description: null, labor_hours: null, line_price: l.price };
  });
}

async function insertLines(conn, orderId, lines) {
  for (const l of lines) {
    await conn.query(
      `INSERT INTO order_lines (order_id, service_id, description, service_name, service_description, labor_hours, line_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, l.service_id, l.description, l.service_name, l.service_description, l.labor_hours, l.line_price]
    );
  }
}

// Recalculates the order money from its lines with utils/money.js and the order's own VAT rate.
async function recalculate(conn, order) {
  const [lines] = await conn.query("SELECT line_price FROM order_lines WHERE order_id = ?", [order.order_id]);
  const totals = calculateTotals(
    lines.map((l) => l.line_price),
    order.vat_rate
  );
  await conn.query("UPDATE orders SET subtotal = ?, vat_amount = ?, total = ? WHERE order_id = ?", [
    totals.subtotal,
    totals.vat_amount,
    totals.total,
    order.order_id,
  ]);
  return totals;
}

function sameServiceTwice(lines) {
  const ids = lines.filter((l) => l.service_id).map((l) => l.service_id);
  return new Set(ids).size !== ids.length;
}

// FR-ORD-01, FR-ORD-02, FR-ORD-04, key flow 1.5.
async function create(data, employeeId) {
  if (sameServiceTwice(data.lines)) {
    throw new ApiError(400, "A service can be added once per order. Add a second one as an extra item.", { field: "lines" });
  }
  const order = await withTransaction(async (conn) => {
    const [cars] = await conn.query(
      `SELECT v.vehicle_id FROM vehicles v JOIN customers c ON c.customer_id = v.customer_id
       WHERE v.vehicle_id = ? AND v.customer_id = ? AND c.active = 1`,
      [data.vehicle_id, data.customer_id]
    );
    if (!cars[0]) throw new ApiError(400, "This car does not belong to this customer", { field: "vehicle_id" });

    const vatRate = await getVatRate(conn);
    const lines = await buildLines(conn, data.lines);
    const totals = calculateTotals(
      lines.map((l) => l.line_price),
      vatRate
    );
    const [result] = await conn.query(
      `INSERT INTO orders (customer_id, vehicle_id, created_by, status, order_hash, estimated_ready_date,
         notes_for_customer, internal_notes, subtotal, vat_rate, vat_amount, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.customer_id,
        data.vehicle_id,
        employeeId,
        S.AWAITING_APPROVAL,
        newOrderHash(),
        data.estimated_ready_date,
        data.notes_for_customer,
        data.internal_notes,
        totals.subtotal,
        totals.vat_rate,
        totals.vat_amount,
        totals.total,
      ]
    );
    await insertLines(conn, result.insertId, lines);
    if (data.mileage != null) {
      const [[car]] = await conn.query("SELECT mileage FROM vehicles WHERE vehicle_id = ? FOR UPDATE", [data.vehicle_id]);
      vehicleService.checkMileage(car.mileage, data.mileage);
      await conn.query("UPDATE vehicles SET mileage = ? WHERE vehicle_id = ?", [data.mileage, data.vehicle_id]);
    }
    await history.add(conn, result.insertId, employeeId, "created", `Estimate total ${totals.total}`);
    return { order_id: result.insertId, ...totals };
  });

  // After commit: email the status link (FR-TRK-05, FR-TRK-06).
  order.email_sent = await notification.sendOrderEmail(order.order_id, "created");
  return order;
}

// FR-ORD-05, BE-030: filter by status, paid, customer and car; search by customer, phone or plate.
async function list({ page, search, limit, offset, status, paid, customerId, vehicleId }) {
  const where = [];
  const params = [];
  const filters = [["o.status", status], ["o.paid", paid === null ? null : Number(paid)], ["o.customer_id", customerId], ["o.vehicle_id", vehicleId]];
  for (const [column, value] of filters) {
    if (value === null || value === undefined) continue;
    where.push(`${column} = ?`);
    params.push(value);
  }
  if (search) {
    const like = likePattern(search);
    where.push(`(CONCAT(c.first_name, ' ', c.last_name) LIKE ? OR c.phone LIKE ? OR v.plate LIKE ? OR o.order_id = ?)`);
    params.push(like, like, like, Number(search.replace(/^#/, "")) || 0);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const from = `FROM orders o JOIN customers c ON c.customer_id = o.customer_id JOIN vehicles v ON v.vehicle_id = o.vehicle_id`;

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${from} ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT o.order_id, o.status, o.paid, o.total, o.created_at, o.estimated_ready_date, o.completed_at,
       c.customer_id, c.first_name, c.last_name, v.vehicle_id, v.year, v.make, v.model, v.plate
     ${from} ${whereSql}
     ORDER BY o.created_at DESC, o.order_id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return pageResult(rows, total, page, limit);
}

async function getLines(conn, orderId) {
  const [rows] = await conn.query(
    `SELECT l.line_id, l.service_id, l.service_name AS name, l.description, l.service_description, l.line_price,
       l.labor_hours, l.technician_id, CONCAT(e.first_name, ' ', e.last_name) AS technician_name,
       l.line_status, l.started_at, l.done_at, l.technician_note, l.created_at
     FROM order_lines l
     LEFT JOIN employees e ON e.employee_id = l.technician_id
     WHERE l.order_id = ? ORDER BY l.line_id`,
    [orderId]
  );
  return rows;
}

// FR-ORD-06: customer, car, lines, technicians and history. The garage block is for the printed estimate.
async function getById(id) {
  const [rows] = await pool.query(
    `SELECT o.*, c.first_name, c.last_name, c.email, c.phone,
       v.year, v.make, v.model, v.type, v.color, v.mileage, v.plate, v.vin,
       CONCAT(cb.first_name, ' ', cb.last_name) AS created_by_name,
       CONCAT(ab.first_name, ' ', ab.last_name) AS approved_by_name,
       CONCAT(pb.first_name, ' ', pb.last_name) AS paid_received_by_name
     FROM orders o
     JOIN customers c ON c.customer_id = o.customer_id
     JOIN vehicles v ON v.vehicle_id = o.vehicle_id
     JOIN employees cb ON cb.employee_id = o.created_by
     LEFT JOIN employees ab ON ab.employee_id = o.approved_by
     LEFT JOIN employees pb ON pb.employee_id = o.paid_received_by
     WHERE o.order_id = ?`,
    [id]
  );
  if (!rows[0]) throw new ApiError(404, "Order not found");
  const order = rows[0];
  order.lines = await getLines(pool, id);
  order.history = await history.listForOrder(pool, id);
  const [garage] = await pool.query("SELECT name, address, phone, email FROM garage_settings WHERE settings_id = 1");
  order.garage = garage[0];
  return order;
}

// BE-031: a technician may read any order, but not the customer's email and phone, the internal note or the
// status link code. Email history lines name the customer's address, so their detail is left out too.
const TECHNICIAN_HIDDEN = ["email", "phone", "internal_notes", "order_hash"];
function technicianView(order) {
  const view = { ...order };
  for (const key of TECHNICIAN_HIDDEN) delete view[key];
  view.history = order.history.map((h) =>
    h.action === "email_sent" || h.action === "email_failed" ? { ...h, details: null } : h
  );
  return view;
}

// BE-039: only what goes on the printed estimate. Uses the prices saved on the order, never today's price list,
// and leaves out internal notes, technician notes, the status link code and the history. Reading changes nothing.
async function getEstimate(id) {
  const [rows] = await pool.query(
    `SELECT o.order_id, o.status, o.subtotal, o.vat_rate, o.vat_amount, o.total, o.notes_for_customer, o.estimated_ready_date,
       c.first_name, c.last_name, c.email, c.phone,
       v.vehicle_id, v.customer_id, v.year, v.make, v.model, v.type, v.mileage, v.plate, v.vin, v.color
     FROM orders o
     JOIN customers c ON c.customer_id = o.customer_id
     JOIN vehicles v ON v.vehicle_id = o.vehicle_id
     WHERE o.order_id = ?`,
    [id]
  );
  if (!rows[0]) throw new ApiError(404, "Order not found");
  const o = rows[0];
  const [lines] = await pool.query(
    `SELECT l.line_id, l.service_name, l.service_description AS description, l.line_price
     FROM order_lines l
     WHERE l.order_id = ? ORDER BY l.line_id`,
    [id]
  );
  const [[garage]] = await pool.query(
    "SELECT settings_id, name, address, phone, email, vat_rate FROM garage_settings WHERE settings_id = 1"
  );
  return {
    order_id: o.order_id,
    document_type: "estimate",
    estimate_number: `EST-${o.order_id}`,
    issued_at: new Date().toISOString(),
    garage,
    customer: { first_name: o.first_name, last_name: o.last_name, email: o.email, phone: o.phone },
    vehicle: {
      vehicle_id: o.vehicle_id, customer_id: o.customer_id, year: o.year, make: o.make, model: o.model,
      type: o.type, mileage: o.mileage, plate: o.plate, vin: o.vin, color: o.color,
    },
    lines,
    subtotal: o.subtotal,
    vat_rate: o.vat_rate,
    vat_amount: o.vat_amount,
    total: o.total,
    currency: "ETB",
    status: o.status,
    notes_for_customer: o.notes_for_customer,
    estimated_ready_date: o.estimated_ready_date,
  };
}

// FR-ORD-07. Notes and dates can always change (until Declined); lines only while Awaiting approval.
// Lines already started are kept, so after extra work the manager can drop a job the customer refused.
async function update(id, data, updatedAt, employeeId) {
  await withTransaction(async (conn) => {
    const order = await lockOrder(conn, id);
    if (new Date(order.updated_at).getTime() !== updatedAt.getTime()) {
      throw new ApiError(409, "Someone else changed this order since you opened it. Reload to see their changes.");
    }
    if (order.status === S.DECLINED) throw new ApiError(400, "A declined order can't be changed");

    await conn.query(
      "UPDATE orders SET estimated_ready_date = ?, notes_for_customer = ?, internal_notes = ? WHERE order_id = ?",
      [data.estimated_ready_date, data.notes_for_customer, data.internal_notes, id]
    );

    if (data.lines) {
      if (order.status !== S.AWAITING_APPROVAL) {
        throw new ApiError(400, "Jobs and prices can only change while the order is Awaiting approval", { field: "lines" });
      }
      const [current] = await conn.query("SELECT * FROM order_lines WHERE order_id = ? FOR UPDATE", [id]);
      const kept = current.filter((l) => l.line_status !== L.NOT_STARTED);
      const newLines = (await buildLines(conn, data.lines)).map((l, i) => ({ ...l, line_id: data.lines[i].line_id }));
      if (sameServiceTwice([...kept, ...newLines])) {
        throw new ApiError(400, "A service can be added once per order. Add a second one as an extra item.", {
          field: "lines",
        });
      }
      if (kept.length + newLines.length === 0) throw new ApiError(400, "An order needs at least one job", { field: "lines" });

      // BE-032: change jobs in place, so each job keeps its number and its technician.
      // A line is matched by its line_id, or else by the same service (or the same extra item text).
      const open = current.filter((l) => l.line_status === L.NOT_STARTED);
      const used = new Set();
      const matchFor = (l, i) => {
        if (l.line_id) {
          const byId = open.find((o) => o.line_id === l.line_id);
          if (!byId || used.has(byId.line_id)) {
            throw new ApiError(400, "This job has started or is not on this order. Reload the order.", {
              field: `lines.${i}.line_id`,
            });
          }
          return byId;
        }
        return open.find(
          (o) => !used.has(o.line_id) && (l.service_id ? o.service_id === l.service_id : !o.service_id && o.description === l.description)
        );
      };
      const changes = newLines.map((l, i) => {
        const match = matchFor(l, i);
        if (match) used.add(match.line_id);
        return { line: l, match };
      });
      for (const o of open.filter((o) => !used.has(o.line_id))) {
        await conn.query("DELETE FROM order_lines WHERE line_id = ?", [o.line_id]);
      }
      for (const { line, match } of changes) {
        if (!match) {
          await insertLines(conn, id, [line]);
        } else if (match.service_id !== line.service_id) {
          // A different job on the same line: the old technician was chosen for the old job.
          await conn.query(
            `UPDATE order_lines SET service_id = ?, description = ?, service_name = ?, service_description = ?, labor_hours = ?,
               line_price = ?, technician_id = NULL
             WHERE line_id = ?`,
            [line.service_id, line.description, line.service_name, line.service_description, line.labor_hours, line.line_price, match.line_id]
          );
        } else if (line.service_id) {
          // Same service: only the price changes; the job keeps the name it was added with.
          await conn.query("UPDATE order_lines SET line_price = ? WHERE line_id = ?", [line.line_price, match.line_id]);
        } else {
          await conn.query("UPDATE order_lines SET description = ?, service_name = ?, line_price = ? WHERE line_id = ?", [
            line.description,
            line.service_name,
            line.line_price,
            match.line_id,
          ]);
        }
      }
      const totals = await recalculate(conn, order);
      await history.add(conn, id, employeeId, "edited", `Jobs changed · total ${totals.total}`);
    } else {
      await history.add(conn, id, employeeId, "edited", "Notes or dates changed");
    }
  });
  return getById(id);
}

// FR-EST-04: extra work found during repair. The order goes back to Awaiting approval.
async function addLine(id, line, employeeId) {
  await withTransaction(async (conn) => {
    const order = await lockOrder(conn, id);
    if (order.status === S.DECLINED || order.status === S.COMPLETED) {
      throw new ApiError(400, "Jobs can't be added to a completed or declined order");
    }
    const [existing] = await conn.query("SELECT service_id FROM order_lines WHERE order_id = ?", [id]);
    const [newLine] = await buildLines(conn, [line]);
    if (sameServiceTwice([...existing, newLine])) {
      throw new ApiError(400, "This service is already on the order. Add it as an extra item instead.", {
        field: "service_id",
      });
    }
    await insertLines(conn, id, [newLine]);
    const totals = await recalculate(conn, order);
    await conn.query("UPDATE orders SET status = ? WHERE order_id = ?", [S.AWAITING_APPROVAL, id]);
    await history.add(conn, id, employeeId, "job_added", `New total ${totals.total} · needs customer approval`);
  });
  return getById(id);
}

// FR-EST-02, FR-EST-03, FR-EST-05, FR-EST-06. Each approval keeps its method and exact total in the history.
async function recordApproval(id, { decision, method, note }, employeeId) {
  const completed = await withTransaction(async (conn) => {
    const order = await lockOrder(conn, id);
    if (order.status !== S.AWAITING_APPROVAL) {
      throw new ApiError(400, "Only an order that is Awaiting approval can be approved or declined");
    }
    const [[work]] = await conn.query(
      "SELECT COUNT(*) AS total, SUM(line_status <> ?) AS started, SUM(line_status = ?) AS done FROM order_lines WHERE order_id = ?",
      [L.NOT_STARTED, L.DONE, id]
    );
    const started = Number(work.started || 0);
    const suffix = note ? ` · ${note}` : "";
    if (decision === "approve") {
      // BE-033: the status follows the jobs. If every job is already done (the refused extra work was removed),
      // the order completes now and the "car is ready" email goes out once.
      const allDone = work.total > 0 && Number(work.done) === work.total;
      const status = allDone ? S.COMPLETED : started > 0 ? S.IN_PROGRESS : S.APPROVED;
      await conn.query(
        `UPDATE orders SET status = ?, approved_by = ?, approved_at = UTC_TIMESTAMP(), approval_method = ?,
           completed_at = IF(? = ${S.COMPLETED}, UTC_TIMESTAMP(), completed_at)
         WHERE order_id = ?`,
        [status, employeeId, method, status, id]
      );
      await history.add(conn, id, employeeId, "approved", `${METHOD_LABEL[method]} · total ${order.total}${suffix}`);
      if (allDone) await history.add(conn, id, null, "completed", `All jobs done · total ${order.total}`);
      return allDone;
    }
    if (started > 0) {
      throw new ApiError(
        400,
        "Work has already started. Remove the new job the customer refused, then record the approval of the rest."
      );
    }
    await conn.query("UPDATE orders SET status = ? WHERE order_id = ?", [S.DECLINED, id]);
    await history.add(conn, id, employeeId, "declined", `${METHOD_LABEL[method]} · total ${order.total}${suffix}`);
    return false;
  });
  // After commit: "Your car is ready" (FR-TRK-05).
  if (completed) await notification.sendOrderEmail(id, "completed");
  return getById(id);
}

async function lockLine(conn, lineId) {
  const [rows] = await conn.query("SELECT order_id FROM order_lines WHERE line_id = ?", [lineId]);
  if (!rows[0]) throw new ApiError(404, "Job not found");
  const order = await lockOrder(conn, rows[0].order_id);
  const [lines] = await conn.query("SELECT * FROM order_lines WHERE line_id = ? FOR UPDATE", [lineId]);
  return { order, line: lines[0] };
}

// FR-TEC-01, BE-035: one active technician per job. A started job may move to another technician (someone is
// ill or leaves) and keeps its progress. The same technician again changes nothing. Jobs can't be un-assigned.
async function assignTechnician(lineId, technicianId, employeeId) {
  const orderId = await withTransaction(async (conn) => {
    const { order, line } = await lockLine(conn, lineId);
    if (order.status === S.DECLINED || order.status === S.COMPLETED) {
      throw new ApiError(400, "Technicians can't be changed on a completed or declined order");
    }
    if (line.line_status === L.DONE) throw new ApiError(400, "This job is already done");
    if (line.technician_id === technicianId) return order.order_id;
    // Locking the technician's row means a switch-off at the same moment waits, and is then seen here.
    const [techs] = await conn.query(
      "SELECT first_name, last_name FROM employees WHERE employee_id = ? AND role_id = ? AND active = 1 FOR UPDATE",
      [technicianId, ROLES.TECHNICIAN]
    );
    if (!techs[0]) throw new ApiError(400, "Choose an active technician", { field: "technician_id" });
    const name = `${techs[0].first_name} ${techs[0].last_name}`;
    await conn.query("UPDATE order_lines SET technician_id = ? WHERE line_id = ?", [technicianId, lineId]);
    if (line.technician_id) {
      const [[old]] = await conn.query("SELECT first_name, last_name FROM employees WHERE employee_id = ?", [line.technician_id]);
      const detail = `Job #${lineId}: ${old.first_name} ${old.last_name} → ${name}`;
      await history.add(conn, order.order_id, employeeId, "technician_changed", detail);
    } else {
      await history.add(conn, order.order_id, employeeId, "technician_assigned", `Job #${lineId} → ${name}`);
    }
    return order.order_id;
  });
  return getById(orderId);
}

// BE-038: work notes only on approved, in-progress or completed orders, by the assigned technician or the office.
// A job already started may keep its note while extra work waits for the customer, since it may also be finished then.
const NOTE_STATUSES = [S.APPROVED, S.IN_PROGRESS, S.COMPLETED];

async function writeNote(conn, order, line, note, actor) {
  const startedDuringWait = order.status === S.AWAITING_APPROVAL && line.line_status !== L.NOT_STARTED;
  if (!NOTE_STATUSES.includes(order.status) && !startedDuringWait) {
    throw new ApiError(409, "Work notes can be added once the customer has approved the work");
  }
  await conn.query("UPDATE order_lines SET technician_note = ? WHERE line_id = ?", [note, line.line_id]);
  await history.add(conn, order.order_id, actor.id, "note_saved", `Job #${line.line_id} work note ${note ? "saved" : "cleared"}`);
}

async function saveLineNote(lineId, note, actor) {
  return withTransaction(async (conn) => {
    const { order, line } = await lockLine(conn, lineId);
    if (actor.role === ROLES.TECHNICIAN && line.technician_id !== actor.id) {
      throw new ApiError(403, "This job is assigned to someone else");
    }
    await writeNote(conn, order, line, note, actor);
    return { line_id: line.line_id, technician_note: note };
  });
}

// FR-TEC-03..07: start or finish a job, and add a work note. The order status follows its jobs.
async function updateLineStatus(lineId, { status, note }, actor) {
  const result = await withTransaction(async (conn) => {
    const { order, line } = await lockLine(conn, lineId);
    if (actor.role === ROLES.TECHNICIAN && line.technician_id !== actor.id) {
      throw new ApiError(403, "This job is assigned to someone else");
    }
    let completed = false;
    if (status !== undefined && status !== line.line_status) {
      if (status !== line.line_status + 1) throw new ApiError(400, "A job goes Not started → Started → Done", { field: "status" });

      if (status === L.STARTED) {
        // FR-TEC-06: no work before approval, also from Postman.
        if (order.status !== S.APPROVED && order.status !== S.IN_PROGRESS) {
          throw new ApiError(400, "Work can't start until the customer approves the estimate");
        }
        if (!line.technician_id) throw new ApiError(400, "Assign a technician before starting this job");
        await conn.query("UPDATE order_lines SET line_status = ?, started_at = UTC_TIMESTAMP() WHERE line_id = ?", [
          L.STARTED,
          lineId,
        ]);
        if (order.status === S.APPROVED) {
          await conn.query("UPDATE orders SET status = ? WHERE order_id = ?", [S.IN_PROGRESS, order.order_id]);
        }
        await history.add(conn, order.order_id, actor.id, "job_started", `Job #${lineId}`);
      } else {
        // FR-TEC-07: a started job may be finished even while extra work waits for approval.
        if (order.status === S.DECLINED || order.status === S.COMPLETED) throw new ApiError(400, "This order is closed");
        await conn.query("UPDATE order_lines SET line_status = ?, done_at = UTC_TIMESTAMP() WHERE line_id = ?", [
          L.DONE,
          lineId,
        ]);
        await history.add(conn, order.order_id, actor.id, "job_done", `Job #${lineId}`);
        // A locking read sees jobs another technician finished a moment ago. A plain read would use this
        // transaction's older snapshot, and two last jobs finished together would leave the order open.
        const [[left]] = await conn.query(
          "SELECT COUNT(*) AS open FROM order_lines WHERE order_id = ? AND line_status <> ? FOR UPDATE",
          [order.order_id, L.DONE]
        );
        if (left.open === 0 && order.status === S.IN_PROGRESS) {
          await conn.query("UPDATE orders SET status = ?, completed_at = UTC_TIMESTAMP() WHERE order_id = ?", [
            S.COMPLETED,
            order.order_id,
          ]);
          await history.add(conn, order.order_id, null, "completed", `All jobs done · total ${order.total}`);
          completed = true;
        }
      }
    }
    // The note is saved after a start, so "start with a note" works on a just-approved order.
    if (note !== undefined) {
      const [[now]] = await conn.query("SELECT status FROM orders WHERE order_id = ?", [order.order_id]);
      const [[lineNow]] = await conn.query("SELECT * FROM order_lines WHERE line_id = ?", [lineId]);
      await writeNote(conn, { ...order, status: now.status }, lineNow, note, actor);
    }
    return { orderId: order.order_id, completed };
  });
  // After commit: "Your car is ready" (FR-TRK-05).
  if (result.completed) await notification.sendOrderEmail(result.orderId, "completed");
  return getById(result.orderId);
}

// FR-TEC-02: my jobs on approved orders, newest first. Finished jobs stay visible for a day.
// Jobs on an order waiting for re-approval show only if they had started (FR-TEC-07 badge).
async function myJobs(technicianId) {
  const [rows] = await pool.query(
    `SELECT l.line_id, l.order_id, l.service_name AS name, l.labor_hours, l.line_status,
       l.started_at, l.done_at, l.technician_note, o.status AS order_status, o.estimated_ready_date,
       o.notes_for_customer, v.year, v.make, v.model, v.plate, v.color
     FROM order_lines l
     JOIN orders o ON o.order_id = l.order_id
     JOIN vehicles v ON v.vehicle_id = o.vehicle_id
     WHERE l.technician_id = ?
       AND (o.status IN (2, 3) OR (o.status = 1 AND l.line_status >= 1) OR (o.status = 4 AND l.done_at >= UTC_TIMESTAMP() - INTERVAL 1 DAY))
       AND (l.line_status < 2 OR l.done_at >= UTC_TIMESTAMP() - INTERVAL 1 DAY)
     ORDER BY l.line_status = 2, o.created_at DESC, l.line_id`,
    [technicianId]
  );
  return rows;
}

module.exports = {
  create,
  list,
  getById,
  technicianView,
  getEstimate,
  update,
  addLine,
  recordApproval,
  saveLineNote,
  assignTechnician,
  updateLineStatus,
  myJobs,
  lockOrder,
};
