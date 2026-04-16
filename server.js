const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const https = require('https');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint to force file download (bypasses CORS download limitations)
app.get('/api/proxy', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send('No URL provided');
    
    https.get(videoUrl, (response) => {
        res.setHeader('Content-Disposition', 'attachment; filename="instagram_video.mp4"');
        res.setHeader('Content-Type', 'video/mp4');
        response.pipe(res);
    }).on('error', (err) => {
        console.error('Proxy error:', err);
        res.status(500).send('Error downloading file');
    });
});

app.post('/api/download', (req, res) => {
    const { url } = req.body;
    
    if (!url || !url.includes('instagram.com')) {
        return res.status(400).json({ error: 'Пожалуйста, введите корректную ссылку на Instagram' });
    }

    console.log(`Processing URL: ${url}`);
    
    const ytdlpPath = path.join(__dirname, 'yt-dlp.exe');
    const command = `"${ytdlpPath}" --no-warnings --socket-timeout 15 -j "${url}"`;
    
    exec(command, { maxBuffer: 1024 * 1024 * 10, timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`yt-dlp error: ${error.message}`);
            return res.status(500).json({ error: 'Ошибка сервера при скачивании видео. Убедитесь, что аккаунт открыт и пост доступен.' });
        }
        
        try {
            const data = JSON.parse(stdout);
            
            // yt-dlp usually provides 'url' as the direct access, and 'thumbnail'
            const videoUrl = data.url;
            const thumbnail = data.thumbnail;
            
            if (!videoUrl) {
                throw new Error("Не удалось найти прямую ссылку на видео.");
            }
            
            res.json({
                success: true,
                videoUrl: videoUrl,
                thumbnail: thumbnail
            });
            
        } catch (e) {
            console.error('Failed to parse yt-dlp response', e);
            res.status(500).json({ error: 'Не удалось обработать видео.' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
