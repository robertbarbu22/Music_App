const axios = require('axios');
require('dotenv').config();

const getSpotifyToken = async () => {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
        headers: {
            'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        params: {
            'grant_type': 'client_credentials'
        }
    });
    return response.data.access_token;
};

const getSpotifySongDetails = async (songTitle) => {
    const token = await getSpotifyToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        params: {
            q: songTitle,
            type: 'track',
            limit: 8 // Fetch up to 5 tracks to increase chances of finding one with a preview URL
        }
    });

    const tracks = response.data.tracks.items;
    for (let track of tracks) {
        if (track.preview_url) {
            return {
                id: track.id,
                title: track.name,
                artist: track.artists.map(artist => artist.name).join(', '),
                albumCover: track.album.images[0]?.url,
                previewUrl: track.preview_url
            };
        }
    }
    // If no track with a preview URL is found, return the first track's details without preview URL
    if (tracks.length > 0) {
        const track = tracks[0];
        return {
            id: track.id,
            title: track.name,
            artist: track.artists.map(artist => artist.name).join(', '),
            albumCover: track.album.images[0]?.url,
            previewUrl: null
        };
    }
    return null;
};

const getRecommendations = async (req, res) => {
    const { happinessLevel } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    const messages = [
        {
            role: "system",
            content: "You are a helpful assistant that provides song recommendations."
        },
        {
            role: "user",
            content: `Give me exactly 15 modern song recommendations for a user with a happiness level of ${happinessLevel}. The recommendations should match the user's mood: 1 for sad, 10 for happy, and the levels in between. Provide each recommendation in the format 'Song Title by Artist'. Do not repeat the same songs for different requests and do not respond with any other message than the informations requested.`
        }
    ];

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 300,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const songRecommendations = response.data.choices[0].message.content.trim().split('\n').map(song => song.trim());
        const detailedRecommendations = await Promise.all(songRecommendations.map(async song => {
            const [title, artist] = song.split(' by ');
            let details = await getSpotifySongDetails(`${title} ${artist}`);
            if (!details) {
                details = { id: null, title, artist, albumCover: '/path/to/default_cover.jpg', previewUrl: null };
            }
            return details;
        }));
        
        res.json({ recommendations: detailedRecommendations });
    } catch (error) {
        console.error('Error fetching recommendations:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
};

module.exports = { getRecommendations };
