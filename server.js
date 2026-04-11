import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import admin from "firebase-admin";

const app = express();
app.use(bodyParser.json());

// =========================
// FIREBASE ADMIN SETUP
// =========================
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// =========================
// NOWPAYMENTS WEBHOOK
// =========================
app.post("/webhook", async (req, res) => {
  try {
    const payment = req.body;

    console.log("Payment received:", payment);

    // IMPORTANT FIELDS FROM NOWPAYMENTS
    const status = payment.payment_status;
    const orderId = payment.order_id; // we will use user email/uid here

    if (status === "finished") {
      // Mark user as premium
      await db.collection("users").doc(orderId).update({
        premium: true
      });

      console.log("User upgraded to premium:", orderId);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// =========================
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
