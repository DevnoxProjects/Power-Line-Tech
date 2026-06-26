import express from "express";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import admin from "firebase-admin";
import { createServer as createViteServer } from "vite";
import { defaultAppContent } from "./src/data/defaultContent.js";

// Initialize Firebase Admin
let adminApp;
const activeOTPs = new Map();

try {
  const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
  adminApp = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseConfig.projectId
  });
  console.log("Firebase Admin initialized via Application Default Credentials.");
} catch (err) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
    adminApp = admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
    console.log("Firebase Admin initialized via ProjectId fallback.");
  } catch (e) {
    console.error("Firebase Admin initialization failed entirely:", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure directories exist
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const contentFilePath = path.join(dataDir, "content.json");
  const inquiriesFilePath = path.join(dataDir, "inquiries.json");

  // Load content
  const isObject = (item) => item && typeof item === "object" && !Array.isArray(item);
  const deepMerge = (target, source) => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  };

  let currentContent = { ...defaultAppContent, adminUsername: "admin", adminPassphrase: "admin" };
  if (fs.existsSync(contentFilePath)) {
    try {
      const saved = JSON.parse(fs.readFileSync(contentFilePath, "utf-8"));
      currentContent = deepMerge(currentContent, saved);
    } catch (e) {
      console.error("Error reading content.json, falling back to defaults.", e);
    }
  } else {
    fs.writeFileSync(contentFilePath, JSON.stringify(currentContent, null, 2));
  }

  // Load inquiries
  let inquiriesList = [];
  if (fs.existsSync(inquiriesFilePath)) {
    try {
      inquiriesList = JSON.parse(fs.readFileSync(inquiriesFilePath, "utf-8"));
    } catch (e) {
      console.error("Error reading inquiries.json", e);
    }
  } else {
    fs.writeFileSync(inquiriesFilePath, JSON.stringify([], null, 2));
  }

  // Middlewares
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API 1: GET corporate page content
  app.get("/api/content", (req, res) => {
    // Return content without the secret credentials for safety
    const { adminUsername, adminPassphrase, ...publicContent } = currentContent;
    res.json(publicContent);
  });

  // API 2: Verify admin credentials
  app.post("/api/admin/verify", (req, res) => {
    const { username, password, passphrase } = req.body;
    const expectedUsername = currentContent.adminUsername || "admin";
    const expectedPassword = currentContent.adminPassphrase || "admin";

    if (username !== undefined && password !== undefined) {
      if (username === expectedUsername && password === expectedPassword) {
        return res.json({ success: true, token: "authorized_session_token_eplt" });
      } else {
        return res.status(401).json({ success: false, error: "Invalid username or password" });
      }
    } else if (passphrase !== undefined) {
      // Fallback transition support
      if (passphrase === expectedPassword) {
        return res.json({ success: true, token: "authorized_session_token_eplt" });
      } else {
        return res.status(401).json({ success: false, error: "Invalid passphrase" });
      }
    }

    res.status(400).json({ success: false, error: "Missing login credentials. Please provide username and password." });
  });

  // API 3: POST update corporate content (Requires token)
  app.post("/api/content", (req, res) => {
    const { token, content, newUsername, newPassphrase } = req.body;
    if (token !== "authorized_session_token_eplt") {
      return res.status(403).json({ success: false, error: "Unauthorized access" });
    }

    if (content) {
      currentContent = {
        ...currentContent,
        ...content,
        // Keep credentials unless explicitly changed
        adminUsername: newUsername || currentContent.adminUsername || "admin",
        adminPassphrase: newPassphrase || currentContent.adminPassphrase || "admin",
      };

      try {
        fs.writeFileSync(contentFilePath, JSON.stringify(currentContent, null, 2));
        return res.json({ success: true, message: "Content updated successfully!" });
      } catch (err) {
        return res.status(500).json({ success: false, error: "Failed to write file to disk" });
      }
    }

    res.status(400).json({ success: false, error: "Bad request payload" });
  });

  // API 4: POST submit client inquiry
  app.post("/api/inquiry", async (req, res) => {
    const { name, email, phone, requirements } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, error: "Name, email, and phone are required fields." });
    }

    const newInquiry = {
      id: "inq_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      name,
      email,
      phone,
      requirements: requirements || "",
      status: "New",
      adminNotes: "",
      timestamp: new Date().toISOString()
    };

    // Save locally
    inquiriesList.unshift(newInquiry);
    try {
      fs.writeFileSync(inquiriesFilePath, JSON.stringify(inquiriesList, null, 2));
    } catch (e) {
      console.error("Failed to write inquiry to disk", e);
    }

    // Try forwarding to Google Sheets
    const webhookUrl = currentContent.contact?.gsheetWebhookUrl;
    const gsheetEnabled = currentContent.contact?.gsheetEnabled !== false; // default true if not set explicitly to false
    let forwardSuccess = false;

    if (gsheetEnabled && webhookUrl && webhookUrl !== "https://script.google.com/macros/s/AKfycbyVexample/exec") {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            timestamp: newInquiry.timestamp,
            name: newInquiry.name,
            email: newInquiry.email,
            phone: newInquiry.phone,
            requirements: newInquiry.requirements,
            adminEmail: currentContent.contact?.email // notify target
          })
        });

        if (response.ok) {
          forwardSuccess = true;
          console.log("Inquiry forwarded to Google Sheets successfully.");
        } else {
          console.error("Google Sheets forward returned status:", response.status);
        }
      } catch (e) {
        console.error("Failed to fetch Google Sheets webhook:", e);
      }
    } else {
      console.log("Google Sheets Webhook forwarding is either disabled or not configured.");
    }

    // Try forwarding to Gmail if enabled
    const gmailEnabled = currentContent.contact?.gmailEnabled === true;
    const gmailSender = currentContent.contact?.gmailSender;
    const gmailTarget = currentContent.contact?.gmailTarget;
    const gmailAppPassword = currentContent.contact?.gmailAppPassword;

    let emailSent = false;
    let emailError = null;

    if (gmailEnabled && gmailSender && gmailTarget && gmailAppPassword) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailSender,
            pass: gmailAppPassword
          }
        });

        const mailOptions = {
          from: `"EPLT Substation Alerts" <${gmailSender}>`,
          to: gmailTarget,
          subject: `New Inquiry Received from ${newInquiry.name}`,
          text: `
New Customer Inquiry Details:
----------------------------
ID: ${newInquiry.id}
Date: ${new Date(newInquiry.timestamp).toLocaleString()}
Name: ${newInquiry.name}
Email: ${newInquiry.email}
Phone: ${newInquiry.phone}

Technical Requirements:
----------------------
${newInquiry.requirements}

--
This is an automated alert generated by EPLT Substation Systems Admin Panel.
          `,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1)">
              <div style="background-color: #714B9D; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0; font-size: 20px;">EPLT Substation Systems</h2>
                <p style="margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px;">New Inquiry Logged</p>
              </div>
              <div style="padding: 24px; background-color: #ffffff; color: #334155;">
                <h3 style="margin-top: 0; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Customer Contact Information</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 120px;">Name:</td>
                    <td style="padding: 6px 0; color: #0f172a;">${newInquiry.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Email:</td>
                    <td style="padding: 6px 0;"><a href="mailto:${newInquiry.email}" style="color: #714B9D; text-decoration: none; font-weight: 600;">${newInquiry.email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Phone:</td>
                    <td style="padding: 6px 0;"><a href="tel:${newInquiry.phone}" style="color: #0f766e; text-decoration: none; font-weight: 600;">${newInquiry.phone}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Timestamp:</td>
                    <td style="padding: 6px 0; font-family: monospace; font-size: 12px; color: #64748b;">${new Date(newInquiry.timestamp).toLocaleString()}</td>
                  </tr>
                </table>

                <h3 style="margin-top: 24px; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Technical Requirements & Message</h3>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; color: #334155;">${newInquiry.requirements || "No specifications message was detailed."}</div>
              </div>
              <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
                Generated automatically by EPLT CRM Systems.
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log("Inquiry notification email sent via Gmail SMTP successfully.");
      } catch (err) {
        emailError = err.toString();
        console.error("Failed to dispatch Gmail notification email:", err);
      }
    }

    res.json({
      success: true,
      message: "Your inquiry has been logged successfully.",
      id: newInquiry.id,
      forwarded: forwardSuccess,
      emailSent: emailSent,
      emailError: emailError
    });
  });

  // API 5: GET inquiry list (Requires Admin token)
  app.post("/api/admin/inquiries", (req, res) => {
    const { token } = req.body;
    if (token !== "authorized_session_token_eplt") {
      return res.status(403).json({ success: false, error: "Unauthorized access" });
    }
    // Ensure all loaded inquiries have status and adminNotes
    const updatedList = inquiriesList.map(inq => ({
      status: "New",
      adminNotes: "",
      ...inq
    }));
    res.json(updatedList);
  });

  // API 6: Clear local inquiry list (Requires Admin token)
  app.post("/api/admin/inquiries/clear", (req, res) => {
    const { token } = req.body;
    if (token !== "authorized_session_token_eplt") {
      return res.status(403).json({ success: false, error: "Unauthorized access" });
    }
    inquiriesList = [];
    try {
      fs.writeFileSync(inquiriesFilePath, JSON.stringify([], null, 2));
      res.json({ success: true, message: "Inquiry history cleared." });
    } catch (e) {
      res.status(500).json({ success: false, error: "Failed to clear list" });
    }
  });

  // API 7: CREATE an inquiry manually (Requires Admin token)
  app.post("/api/admin/inquiries/create", (req, res) => {
    const { token, inquiry } = req.body;
    if (token !== "authorized_session_token_eplt") {
      return res.status(403).json({ success: false, error: "Unauthorized access" });
    }
    if (!inquiry || !inquiry.name || !inquiry.email || !inquiry.phone) {
      return res.status(400).json({ success: false, error: "Missing required contact details." });
    }

    const newInquiryObj = {
      id: "inq_man_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      requirements: inquiry.requirements || "",
      status: inquiry.status || "New",
      adminNotes: inquiry.adminNotes || "",
      timestamp: new Date().toISOString()
    };

    inquiriesList.unshift(newInquiryObj);
    try {
      fs.writeFileSync(inquiriesFilePath, JSON.stringify(inquiriesList, null, 2));
      res.json({ success: true, inquiry: newInquiryObj });
    } catch (e) {
      res.status(500).json({ success: false, error: "Failed to save manual inquiry to disk." });
    }
  });

  // API 8: UPDATE an inquiry details or status/notes (Requires Admin token)
  app.post("/api/admin/inquiries/update", (req, res) => {
    const { token, id, updatedInquiry } = req.body;
    if (token !== "authorized_session_token_eplt") {
      return res.status(403).json({ success: false, error: "Unauthorized access" });
    }
    const index = inquiriesList.findIndex(item => item.id === id);
    if (index !== -1) {
      inquiriesList[index] = {
        ...inquiriesList[index],
        ...updatedInquiry
      };
      try {
        fs.writeFileSync(inquiriesFilePath, JSON.stringify(inquiriesList, null, 2));
        res.json({ success: true, inquiry: inquiriesList[index] });
      } catch (e) {
        res.status(500).json({ success: false, error: "Failed to save inquiry update to disk." });
      }
    } else {
      res.status(404).json({ success: false, error: "Inquiry not found." });
    }
  });

  // API 9: DELETE a single inquiry (Requires Admin token)
  app.post("/api/admin/inquiries/delete", (req, res) => {
    const { token, id } = req.body;
    if (token !== "authorized_session_token_eplt") {
      return res.status(403).json({ success: false, error: "Unauthorized access" });
    }
    const initialLength = inquiriesList.length;
    inquiriesList = inquiriesList.filter(item => item.id !== id);
    if (inquiriesList.length < initialLength) {
      try {
        fs.writeFileSync(inquiriesFilePath, JSON.stringify(inquiriesList, null, 2));
        res.json({ success: true, message: "Inquiry deleted successfully." });
      } catch (e) {
        res.status(500).json({ success: false, error: "Failed to update database on disk." });
      }
    } else {
      res.status(404).json({ success: false, error: "Inquiry not found." });
    }
  });

  // API 10: Generate and Send OTP for Password Reset
  app.post("/api/admin/forgot-password-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required." });
    }

    try {
      // Find user in Firebase Auth
      const userRecord = await admin.auth().getUserByEmail(email);
      if (!userRecord) {
        return res.status(404).json({ success: false, error: "No administrative user registered under this email." });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store in memory with 10 min expiration
      activeOTPs.set(email.toLowerCase().trim(), {
        otp,
        uid: userRecord.uid,
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      console.log(`[SECURITY] OTP Generated for ${email}: ${otp}`);

      // Check if SMTP is configured
      const gmailEnabled = currentContent.contact?.gmailEnabled === true;
      const gmailSender = currentContent.contact?.gmailSender;
      const gmailAppPassword = currentContent.contact?.gmailAppPassword;

      if (gmailEnabled && gmailSender && gmailAppPassword) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: gmailSender,
              pass: gmailAppPassword
            }
          });

          const mailOptions = {
            from: `"EPLT Admin Security" <${gmailSender}>`,
            to: email,
            subject: `EPLT Admin Password Reset Code: ${otp}`,
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05)">
                <div style="background-color: #f59e0b; padding: 24px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 20px; font-weight: bold;">EPLT Substation Systems</h2>
                  <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9;">Administrative Security Credentials Recovery</p>
                </div>
                <div style="padding: 32px 24px; background-color: #ffffff; color: #334155; text-align: center;">
                  <p style="margin-top: 0; font-size: 15px; color: #475569;">You requested a password reset verification code. Use the secure verification code below to authorize your credentials update:</p>
                  <div style="background-color: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 16px; margin: 24px 0; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b; display: inline-block;">
                    ${otp}
                  </div>
                  <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">This security code is extremely confidential and will expire in 10 minutes. If you did not initiate this request, please change your credentials immediately.</p>
                </div>
                <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
                  Authorized security alert dispatch system.
                </div>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          return res.json({
            success: true,
            message: `OTP successfully dispatched to ${email}.`,
            smtpNotConfigured: false
          });
        } catch (mailErr) {
          console.error("Nodemailer SMTP failed, falling back to secure JSON response:", mailErr);
          return res.json({
            success: true,
            message: `Nodemailer SMTP delivery failed (${mailErr.message || mailErr}), displaying OTP for seamless preview testing.`,
            smtpNotConfigured: true,
            otp: otp
          });
        }
      } else {
        // No SMTP config fallback
        return res.json({
          success: true,
          message: "SMTP settings not fully configured in 'General Copy & Contact'. Displaying generated OTP for sandbox testing.",
          smtpNotConfigured: true,
          otp: otp
        });
      }
    } catch (err) {
      console.error("OTP generation error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to locate registered administrative user." });
    }
  });

  // API 11: Verify OTP and Reset Password in Firebase Auth Admin
  app.post("/api/admin/verify-otp-reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: "Email, OTP, and new password are required fields." });
    }

    const key = email.toLowerCase().trim();
    const record = activeOTPs.get(key);

    if (!record) {
      return res.status(400).json({ success: false, error: "No active verification requests found for this email." });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, error: "Invalid verification OTP code. Please verify the 6-digit code and try again." });
    }

    if (Date.now() > record.expiresAt) {
      activeOTPs.delete(key);
      return res.status(400).json({ success: false, error: "Verification code has expired. Please request a new security code." });
    }

    try {
      // Direct Admin update - completely bypasses client requires-recent-login restrictions!
      await admin.auth().updateUser(record.uid, { password: newPassword });
      activeOTPs.delete(key);
      res.json({ success: true, message: "Administrative credentials password has been successfully updated via security code authorization." });
    } catch (err) {
      console.error("Firebase admin updateUser failed:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to update administrative credentials." });
    }
  });

  // Serve static UI / Vite Dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EPLT Server running on port ${PORT}`);
  });
}

startServer();
