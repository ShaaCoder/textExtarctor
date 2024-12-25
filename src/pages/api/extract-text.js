import multer from "multer";
import pdfParse from "pdf-parse";
import Tesseract from "tesseract.js";
import fs from "fs/promises";
import path from "path";

// Multer configuration for file upload
const upload = multer({ dest: "uploads/" });
const uploadMiddleware = upload.single("file");

export const config = {
  api: {
    bodyParser: false, // Disable default body parser
  },
};

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Process uploaded file
  await new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => {
      if (err) reject(err);
      resolve();
    });
  });

  const filePath = req.file.path;
  const fileType = req.file.mimetype;

  try {
    let extractedText = "";

    if (fileType === "application/pdf") {
      // Extract text from PDF
      const pdfData = await fs.readFile(filePath);
      const pdfText = await pdfParse(pdfData);
      extractedText = pdfText.text;
    } else if (fileType.startsWith("image/")) {
      // Extract text from image
      const result = await Tesseract.recognize(filePath, "eng");
      extractedText = result.data.text;
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    // Cleanup uploaded file
    await fs.unlink(filePath);

    res.status(200).json({ text: extractedText });
  } catch (error) {
    res.status(500).json({ error: "Failed to process file", details: error.message });
  }
};

export default handler;
