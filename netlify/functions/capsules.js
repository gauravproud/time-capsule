/* =====================================================================
   TIME CAPSULE — Netlify serverless function
   ---------------------------------------------------------------------
   Netlify does NOT run a long-lived Express server. Instead it runs
   small "functions" that wake up for a single request and then sleep.
   So the two Express routes we had become ONE function that looks at
   the request and decides: is this a "seal" (POST) or an "open" (GET)?

   The reveal logic is identical to every version before: the message
   is only included in the response once the reveal time has passed.
   ===================================================================== */

const crypto = require("crypto");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

/* Serverless functions can be re-used across requests ("warm" starts).
   getApps() stops us from initialising Firebase twice, which throws. */
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const capsules = getFirestore().collection("capsules");

const json = (statusCode, obj) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(obj)
});

exports.handler = async (event) => {
  // Pull the capsule id out of the path, if there is one.
  // "/api/capsules"        -> id = ""      (a seal request)
  // "/api/capsules/abc123" -> id = "abc123" (an open request)
  const after = (event.path.split("/capsules")[1] || "").replace(/^\//, "");
  const id = after;

  try {
    /* ---------- SEAL (POST) ---------- */
    if (event.httpMethod === "POST") {
      const { message, to, from, reveal } = JSON.parse(event.body || "{}");

      if (!message || typeof message !== "string" || !message.trim())
        return json(400, { error: "Message is required." });

      const revealAt = Number(reveal);
      if (!Number.isFinite(revealAt) || revealAt <= Date.now())
        return json(400, { error: "Reveal date must be in the future." });

      const newId = crypto.randomBytes(8).toString("base64url");
      await capsules.doc(newId).set({
        message:    message.trim(),
        recipient: (to   || "").trim() || null,
        sender:    (from || "").trim() || null,
        reveal_at:  revealAt,
        created_at: Date.now()
      });
      return json(201, { id: newId });
    }

    /* ---------- OPEN (GET) ---------- */
    if (event.httpMethod === "GET" && id) {
      const snap = await capsules.doc(id).get();
      if (!snap.exists) return json(404, { error: "Capsule not found." });

      const row = snap.data();
      const locked = Date.now() < row.reveal_at;

      const payload = {
        locked,
        to:         row.recipient,
        from:       row.sender,
        reveal_at:  row.reveal_at,
        created_at: row.created_at
      };
      if (!locked) payload.message = row.message;   // ← released ONLY when unlocked
      return json(200, payload);
    }

    return json(405, { error: "Method not allowed." });
  } catch (e) {
    console.error(e);
    return json(500, { error: "Server error." });
  }
};
