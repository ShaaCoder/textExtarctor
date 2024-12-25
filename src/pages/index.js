import { useState } from "react";
import { motion } from "framer-motion";
import Tesseract from "tesseract.js";
import { FaFilePdf, FaImage, FaCopy, FaExclamationCircle, FaCamera } from "react-icons/fa";

export default function Home() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [cameraMode, setCameraMode] = useState(false);
  const [stream, setStream] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setExtractedText("");
    setCopySuccess("");
  };

  const handleExtractText = async () => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://text-extarctor.vercel.app/api/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to extract text");
      }

      const data = await res.json();
      setExtractedText(data.text);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopyText = () => {
    if (extractedText) {
      navigator.clipboard
        .writeText(extractedText)
        .then(() => setCopySuccess("Text copied to clipboard!"))
        .catch(() => setCopySuccess("Failed to copy text."));
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(stream);
      setCameraMode(true);
    } catch (err) {
      setError("Failed to access the camera.");
    }
  };

  const captureImage = (videoRef) => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.videoWidth;
    canvas.height = videoRef.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  };

  const handleExtractFromCamera = async (videoRef) => {
    const image = captureImage(videoRef);
    try {
      const { data: { text } } = await Tesseract.recognize(image, "eng");
      setExtractedText(text);
      setCameraMode(false);
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      setError("Failed to extract text from the camera image.");
    }
  };

  return (
    <motion.div
      className="p-6 md:p-10 w-full min-h-screen flex flex-col space-y-8 bg-gradient-to-r from-black to-purple-900 rounded-none shadow-none overflow-y-auto backdrop-blur-lg border-4 border-white/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-4xl font-bold text-white text-center mb-6"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        Text Extractor
      </motion.h1>

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <label className="block text-xl font-medium text-white">
          Upload a file (PDF or image):
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf, image/*"
          className="w-full border border-gray-300 rounded-lg p-3 text-white"
        />
        <motion.button
          onClick={handleExtractText}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaFilePdf className="inline-block mr-2" />
          Extract Text
        </motion.button>
        <motion.button
          onClick={startCamera}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition mt-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaCamera className="inline-block mr-2" />
          Scan with Camera
        </motion.button>
      </motion.div>

      {cameraMode && (
        <motion.div
          className="mt-6 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <video
            autoPlay
            playsInline
            ref={(video) => {
              if (video && stream) video.srcObject = stream;
            }}
            className="w-full max-w-md border border-gray-300 rounded-lg"
          />
          <motion.button
            onClick={(e) => handleExtractFromCamera(e.target.previousSibling)}
            className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Capture & Extract Text
          </motion.button>
        </motion.div>
      )}

      {error && (
        <motion.p
          className="text-red-500 text-center font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <FaExclamationCircle className="inline-block mr-2" />
          {error}
        </motion.p>
      )}

      {extractedText && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            Extracted Text
          </h2>
          <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-300 max-h-[500px] overflow-y-auto">
            <pre className="text-gray-800 font-mono whitespace-pre-wrap text-sm leading-6">
              {extractedText}
            </pre>
            <motion.button
              onClick={handleCopyText}
              className="mt-4 w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaCopy className="inline-block mr-2" />
              Copy Text
            </motion.button>
            {copySuccess && (
              <motion.p
                className="text-green-500 text-center font-medium mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {copySuccess}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
