const express = require("express");
const app = express();
const mongoose = require("mongoose");
const ejs = require("ejs");
const path = require("path");
const bodyParser = require("body-parser");
const transactionModel = require("./models/transaction");

// View engine and middlewares
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

// ✅ Connect to MongoDB (cleaned)
mongoose.connect("mongodb://localhost:27017/finance")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// 🏠 Home Page
app.get("/", async (req, res) => {
  try {
    const transactions = await transactionModel.find().sort({ date: -1 });

    const monthlyData = await transactionModel.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const labels = monthlyData.map(item => item._id);
    const data = monthlyData.map(item => item.totalAmount);

    res.render("dashboard", {
      transactions,
      labels: JSON.stringify(labels),
      data: JSON.stringify(data)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading dashboard");
  }
});

// ➕ Add Transaction
app.post("/add-transaction", async (req, res) => {
  const { description, amount, date } = req.body;

  if (!description || !amount || !date) {
    return res.status(400).send("All fields are required");
  }

  try {
    await transactionModel.create({ description, amount, date });
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding transaction");
  }
});

// ✏️ Edit Transaction - Show form
app.get("/edit-transaction/:id", async (req, res) => {
  try {
    const transaction = await transactionModel.findById(req.params.id);
    if (!transaction) return res.status(404).send("Transaction not found");
    res.render("edit", { transaction });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading edit page");
  }
});

// ✏️ Edit Transaction - Update
app.post("/edit-transaction/:id", async (req, res) => {
  const { description, amount, date } = req.body;

  if (!description || !amount || !date) {
    return res.status(400).send("All fields are required");
  }

  try {
    await transactionModel.updateOne(
      { _id: req.params.id },
      { description, amount, date }
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating transaction");
  }
});

// ❌ Delete Transaction
app.post("/delete-transaction/:id", async (req, res) => {
  try {
    await transactionModel.deleteOne({ _id: req.params.id });
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting transaction");
  }
});

// 🚀 Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
