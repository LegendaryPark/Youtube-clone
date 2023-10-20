import express from "express";
import ffmpeg from "fluent-ffmpeg";
import {
  uploadProcessedVideo,
  downloadRawVideo,
  deleteRawVideo,
  deleteProcessedVideo,
  convertVideo,
  setupDirectories,
} from "./storage";
import { isVideoNew, setVideo } from "./firestore";

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

setupDirectories();

const app = express();
app.use(express.json());

app.post("/process-video", async (req, res) => {
  // Get the bucket and filename from the Cloud Pub/Sub message
  let data;

  try {
    const message = Buffer.from(req.body.message.data, "base64").toString(
      "utf8"
    );
    data = JSON.parse(message);

    if (!data.name) {
      throw new Error("Invalid message payload received.");
    }
  } catch (error) {
    console.error(error);
    return res.status(400).send("Bad Request: missing filename.");
  }

  const inputFileName = data.name;
  const outputFileName = `processed-${inputFileName}`;
  const videoId = inputFileName.split('.')[0];

  if (!isVideoNew(videoId)){
    return res.status(400).send('Bad Request: video already processing');
  }else{
    await setVideo(videoId, {
      id: videoId,
      uid: videoId.split("-")[0],
      status: "processing"
    })
  }
  await downloadRawVideo(inputFileName);

  try {
    await convertVideo(inputFileName, outputFileName);
  } catch (error) {
    await Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(outputFileName),
    ]);
    return res.status(500).send("Processing failed");
  }

  await uploadProcessedVideo(outputFileName);

  setVideo(videoId, {
    status: "processed",
    filename: outputFileName
  })

  await Promise.all([
    deleteRawVideo(inputFileName),
    deleteProcessedVideo(outputFileName),
  ]);

  return res.status(200).send("Processing finished successfully");
});

const port = process.env.PORT || 3500;

app.listen(port, () => {
  console.log(`Video processing service at http://localhost:${port}`);
});
