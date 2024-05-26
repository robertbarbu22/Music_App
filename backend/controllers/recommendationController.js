const axios = require('axios');

const getRecommendations = async (req, res) => {
    const { happinessLevel, userData } = req.body;

    if (!userData || !userData.likedArtists) {
        return res.status(400).json({ error: 'Liked artists data is missing' });
    }

    const prompt = `Give me 15 song recommendations for a user with the following details: 
                     Happiness Level: ${happinessLevel}, 
                     Liked Artists: ${userData.likedArtists.join(', ')},
                     Liked Songs: ${userData.likedSongs.join(', ')},
                     Preferred Genres: ${userData.preferredGenres.join(', ')}.`;

    try {
        const response = await axios.post('https://api.openai.com/v1/completions', {
            model: 'gpt-3.5-turbo',
            prompt: prompt,
            max_tokens: 150,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const recommendations = response.data.choices[0].text.trim();
        res.json({ recommendations });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
};

module.exports = { getRecommendations };
