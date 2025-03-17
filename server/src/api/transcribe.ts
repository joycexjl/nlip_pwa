import { Router } from 'express';
import multer from 'multer';

import { transcribeAudio } from '../services/speech-to-text.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    console.log('Received transcription request');

    if (!req.file) {
      console.error('No audio file provided in request');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(
      `Received audio file: ${req.file.originalname || 'unnamed'}, size: ${
        req.file.size
      } bytes, mimetype: ${req.file.mimetype}`
    );

    // Convert the audio buffer to the format expected by Google Speech-to-Text
    const audioBuffer = req.file.buffer;

    // Use the transcribeAudio function
    console.log('Calling transcribeAudio function...');
    const transcription = await transcribeAudio(audioBuffer);
    console.log('Transcription completed:', transcription || '(empty)');

    return res.json({ text: transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({
      error: 'Failed to transcribe audio',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
