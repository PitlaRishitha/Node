const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid");
const moment = require("moment");

// Connect to MongoDB
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a URL schema
const urlSchema = new mongoose.Schema({
  shortUrl: {
    type: String,
    unique: true,
    default: shortid.generate,
  },
  destinationUrl: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    default: moment().add(30, "days").toDate(), // Default expiry time: 30 days from now
  },
});

// Create a URL model
const Url = mongoose.model("Url", urlSchema);

// Express app setup
const app = express();
app.use(express.json());

// Method to shorten URL
const shortenUrl = async (destinationUrl) => {
  try {
    const url = new Url({ destinationUrl });
    await url.save();
    return url.shortUrl;
  } catch (error) {
    throw new Error("Error while shortening URL");
  }
};

// Method to update short URL
const updateShortUrl = async (shortUrl, destinationUrl) => {
  try {
    const url = await Url.findOneAndUpdate(
      { shortUrl },
      { destinationUrl },
      { new: true }
    );
    return !!url;
  } catch (error) {
    throw new Error("Error while updating short URL");
  }
};

// Method to get destination URL
const getDestinationUrl = async (shortUrl) => {
  try {
    const url = await Url.findOne({ shortUrl });
    return url ? url.destinationUrl : null;
  } catch (error) {
    throw new Error("Error while getting destination URL");
  }
};

// Method to update expiry time
const updateExpiry = async (shortUrl, daysToAdd) => {
  try {
    const url = await Url.findOneAndUpdate(
      { shortUrl },
      { $set: { expiresAt: moment().add(daysToAdd, "days").toDate() } }
    );
    return !!url;
  } catch (error) {
    throw new Error("Error while updating expiry time");
  }
};

// API endpoints
app.post("/shorten", async (req, res) => {
  const { destinationUrl } = req.body;
  try {
    const shortUrl = await shortenUrl(destinationUrl);
    res.json({ shortUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/update", async (req, res) => {
  const { shortUrl, destinationUrl } = req.body;
  try {
    const updated = await updateShortUrl(shortUrl, destinationUrl);
    res.json({ updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;
  try {
    const destinationUrl = await getDestinationUrl(shortUrl);
    if (destinationUrl) {
      res.redirect(destinationUrl);
    } else {
      res.status(404).send("URL not found");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/expiry", async (req, res) => {
  const { shortUrl, daysToAdd } = req.body;
  try {
    const updated = await updateExpiry(shortUrl, daysToAdd);
    res.json({ updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
