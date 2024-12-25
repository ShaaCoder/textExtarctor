import multer from "multer";
import pdfParse from "pdf-parse";
import Tesseract from "tesseract.js";
import os from "os";
import path from "path";
import fs from "fs/promises";

// Use memory storage with multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const uploadMiddleware = upload.single("file");

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to handle file upload
  },
};

const handler = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Allow only POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Process the uploaded file
  await new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => {
      if (err) reject(err);
      resolve();
    });
  });

  const file = req.file;
  const fileType = file.mimetype;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    let extractedText = "";

    // Temporary file path
    const tempPath = path.join(os.tmpdir(), file.originalname);

    // Save the uploaded file to temporary directory
    await fs.writeFile(tempPath, file.buffer);

    if (fileType === "application/pdf") {
      // Extract text from PDF file
      const pdfData = await fs.readFile(tempPath);
      const pdfText = await pdfParse(pdfData);
      extractedText = pdfText.text;
    } else if (fileType.startsWith("image/")) {
      // Extract text from image using Tesseract
      const result = await Tesseract.recognize(tempPath, "eng");
      extractedText = result.data.text;
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    // Cleanup: Remove the temporary file after processing
    await fs.unlink(tempPath);

    // Send the extracted text back as JSON response
    res.status(200).json({ text: extractedText });
  } catch (error) {
    res.status(500).json({ error: "Failed to process file", details: error.message });
  }
};

export default handler;
