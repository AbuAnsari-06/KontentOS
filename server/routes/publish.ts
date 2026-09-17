import express from 'express';
import crypto from 'crypto';
import * as db from '../db.js';

const router = express.Router();

// Get connection status (standalone mode - no platform logins required)
router.get(['/status', '/instagram/status'], async (req, res) => {
  res.json({
    success: true,
    standalone: true,
    message: 'KontentOS is running in standalone creator mode with no OAuth required.',
  });
});

// Save / Export Reel record to library & history
router.post(['/reels', '/instagram', '/save'], async (req, res) => {
  try {
    const { videoId, captionText, hashtags = [] } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: 'Missing videoId' });
    }

    let video = await db.getVideo(videoId);
    if (!video) {
      video = await db.createVideo({
        id: videoId,
        title: 'Uploaded Creator Footage',
        file_name: 'footage.mp4',
        file_url: '/uploads/footage.mp4',
        status: 'ready',
        file_size: 1024 * 1024 * 15,
        duration: 30,
      });
    }

    // Format final caption with hashtags
    const formattedTags = Array.isArray(hashtags)
      ? hashtags.map((h: string) => (h.startsWith('#') ? h : `#${h}`)).join(' ')
      : '';

    const fullCaption = `${captionText || ''}\n\n${formattedTags}`.trim();

    // Check character count constraint
    if (fullCaption.length > 2200) {
      return res.status(400).json({
        error: `Caption exceeds Instagram maximum limit of 2,200 characters (currently ${fullCaption.length})`,
      });
    }

    const postId = `reel_${crypto.randomUUID().slice(0, 10)}`;
    const postUrl = `https://www.instagram.com/reel/${postId.slice(5)}/`;

    const record = await db.recordPublish({
      video_id: videoId,
      platform: 'instagram',
      platform_post_id: postId,
      url: postUrl,
      status: 'saved',
    });

    // Mark caption as approved
    const caption = await db.getCaption(videoId, 'instagram');
    if (caption) {
      await db.updateCaption(caption.id, { approved: true });
    }

    res.json({
      success: true,
      data: record,
      postUrl,
      message: 'Reel and caption saved to library successfully!',
    });
  } catch (err: any) {
    console.error('Error in /api/publish/reels:', err);
    res.status(500).json({ error: err.message || 'Saving failed' });
  }
});

// Get Publishing History
router.get('/history', async (req, res) => {
  try {
    const history = await db.listPublishingHistory();
    // Join with video info
    const enriched = await Promise.all(
      history.map(async (item) => {
        const video = await db.getVideo(item.video_id);
        const caption = await db.getCaption(item.video_id, item.platform);
        return {
          ...item,
          video_title: video?.title || 'Reel Post',
          caption_text: caption?.caption_text || '',
          hashtags: caption?.hashtags || [],
        };
      })
    );
    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a publishing history record
router.delete('/history/:id', async (req, res) => {
  try {
    const deleted = await db.deletePublishingRecord(req.params.id);
    res.json({ success: deleted, message: deleted ? 'Record deleted' : 'Record not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
