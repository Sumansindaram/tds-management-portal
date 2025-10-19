// api/server.js
const express = require("express");
const path = require("path");
const { v4: uuid } = require("uuid");
const { BlobServiceClient } = require("@azure/storage-blob");

const app = express();
app.use(express.json());

// ===== Storage bootstrap =====
const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.STORAGE_CONTAINER || "entries";

if (!connStr) {
  console.error("Missing AZURE_STORAGE_CONNECTION_STRING");
  process.exit(1);
}
const blobService = BlobServiceClient.fromConnectionString(connStr);
async function getContainer() {
  const container = blobService.getContainerClient(containerName);
  await container.createIfNotExists();
  return container;
}

// ===== API =====
app.post("/api/entries", async (req, res) => {
  try {
    const data = req.body || {};
    const id = data.id || uuid();
    const when = new Date().toISOString();
    const payload = { id, when, ...data };

    const container = await getContainer();
    const blob = container.getBlockBlobClient(`${id}.json`);
    await blob.upload(JSON.stringify(payload, null, 2), Buffer.byteLength(JSON.stringify(payload)));

    res.status(201).json({ ok: true, id, when });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to save entry" });
  }
});

app.get("/api/entries", async (_req, res) => {
  try {
    const container = await getContainer();
    const items = [];
    for await (const blob of container.listBlobsFlat()) {
      items.push({ id: path.basename(blob.name, ".json"), size: blob.properties.contentLength });
    }
    res.json({ ok: true, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to list entries" });
  }
});

app.get("/api/entries/:id", async (req, res) => {
  try {
    const container = await getContainer();
    const blob = container.getBlockBlobClient(`${req.params.id}.json`);
    const exists = await blob.exists();
    if (!exists) return res.status(404).json({ ok: false, error: "Not found" });
    const dl = await blob.download();
    const body = await streamToString(dl.readableStreamBody);
    res.json({ ok: true, entry: JSON.parse(body) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to read entry" });
  }
});

function streamToString(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (d) => chunks.push(d));
    readable.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    readable.on("error", reject);
  });
}

// ===== Serve built React app =====
const dist = path.join(__dirname, "..", "dist");
app.use(express.static(dist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server running on :${port}`));
