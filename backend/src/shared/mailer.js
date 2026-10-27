import nodemailer from "nodemailer";

let transporter = null;
let testTransport = null;

// Tests swap in a fake mail server (BE-043, BE-049): { sendMail(message) } that records or fails on purpose.
function setTransportForTests(fake) {
  testTransport = fake;
}

function getTransporter() {
  if (testTransport) return testTransport;
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
      // A mail server that hangs must not hold requests open (BE-043).
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }
  return transporter;
}

// Called only after the data is committed (AD-7). Never throws: returns true when sent.
async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) return false;
  try {
    await t.sendMail({ from: process.env.MAIL_FROM, to, subject, text, html });
    return true;
  } catch (err) {
    console.error("Email failed:", err.message);
    return false;
  }
}

export { sendMail, setTransportForTests };
