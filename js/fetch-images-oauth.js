/* eslint-env node */

"use strict";

const { google } = require("googleapis");
const path = require("path");
const fs = require("fs/promises");
const sharp = require("sharp");
const pLimit = require("p-limit");

// === CONFIG ===
const SERVICE_ACCOUNT_KEY_FILE = "pnw-bryo-atlas-e1fb9a5765ea.json";
// BC Bryophyte Guide > Pictures_&_Plates > Online at https://drive.google.com/drive/folders/1B1QBo3woWDlQ7L_wG9FEbQhkKfqye_U2
const ROOT_FOLDER_ID = "1B1QBo3woWDlQ7L_wG9FEbQhkKfqye_U2";
const TRAVERSE_CONCURRENCY = 5;
const FETCH_CONCURRENCY = 32;
const OUTPUT_JSON = "./imagefiles.json";
const IMG_OUTPUT_BASE = "static/img";

// === AUTH ===
const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"]
});

const drive = google.drive({ version: "v3", auth });

// === HELPERS ===
async function ensureDir(filePath) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function isImage(fileName) {
    return /(\.jpe?g|\.png)$/i.test(fileName);
}

// === LIST FOLDER ===
async function listFolder(folderId, relativePath = "") {
    let pageToken = null;
    const items = [];

    do {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: "nextPageToken, files(id, name, mimeType)",
            pageToken,
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        for (const file of res.data.files) {
            const relPath = relativePath + "/" + file.name;
            items.push({ id: file.id, name: file.name, mimeType: file.mimeType, relPath });
        }

        pageToken = res.data.nextPageToken;
    } while (pageToken);

    return items;
}

// === TRAVERSAL WITH CONCURRENCY ===
async function traverse(folderId, basePath = "", filesList = []) {
    const limit = pLimit(TRAVERSE_CONCURRENCY);
    const items = await listFolder(folderId, basePath);
    const subfolderPromises = [];

    for (const item of items) {
        console.log(`${item.id}\t${item.relPath}`);

        if (item.mimeType === "application/vnd.google-apps.folder") {
            subfolderPromises.push(limit(() => traverse(item.id, item.relPath, filesList)));
        } else {
            filesList.push({ id: item.id, path: item.relPath, name: item.name });
        }
    }

    await Promise.all(subfolderPromises);
    return filesList;
}

// === DOWNLOAD + RESIZE IMAGE ===
async function downloadAndResizeImage(fileId, outPath) {
    try {
        await ensureDir(outPath);

        const res = await drive.files.get(
            { fileId, alt: "media" },
            { responseType: "arraybuffer" }
        );

        const buffer = Buffer.from(res.data);
        // sharp.resize with only width specified preserves aspect ratio
        const resized = await sharp(buffer)
            .resize({ width: 640 })
            .jpeg({ quality: 75 }) // reduce quality a little for smaller file size
            .toBuffer();

        await fs.writeFile(outPath, resized);
        console.log("Saved image:", outPath);
    } catch (err) {
        console.error("Error downloading/resizing image:", fileId, err.message);
    }
}

// === MAIN ===
(async () => {
    try {
        const t0 = Date.now();
        const filesList = await traverse(ROOT_FOLDER_ID);
        const t1 = Date.now();
        console.log(`Traversed ${filesList.length} files in ${((t1 - t0) / 1000).toFixed(2)} s`);

        await fs.writeFile(OUTPUT_JSON, JSON.stringify(filesList, null, 2));
        console.log("JSON written to", OUTPUT_JSON);

        const limit = pLimit(FETCH_CONCURRENCY);
        const imageFiles = filesList.filter(f => isImage(f.name));
        const downloadTasks = imageFiles.map(f => {
            const outPath = IMG_OUTPUT_BASE + "/" + f.path;
            return limit(() => downloadAndResizeImage(f.id, outPath));
        });

        const f0 = Date.now();
        await Promise.all(downloadTasks);
        const f1 = Date.now();
        console.log(`Saved ${imageFiles.length} files in ${((f1 - f0) / 1000).toFixed(2)} s`);
    } catch (err) {
        console.error("Error:", err);
    }
})();
