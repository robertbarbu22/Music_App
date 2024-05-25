const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        display_name TEXT,
        email TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS viral_songs (
        id TEXT PRIMARY KEY,
        title TEXT,
        artist TEXT,
        album_cover TEXT,
        preview_url TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ratings (
        song_id TEXT,
        user_id TEXT,
        rating INTEGER,
        date TEXT,
        PRIMARY KEY (song_id, user_id, date)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS favorites (
        song_id TEXT,
        user_id TEXT,
        date_added TEXT,
        PRIMARY KEY (song_id, user_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS last_update (
        date TEXT
    )`);

    // Adaugă o înregistrare inițială în tabela last_update
    db.run(`INSERT INTO last_update (date) VALUES ('1970-01-01')`);
});

db.close();
