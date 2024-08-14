const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database or create it if it doesn't exist
const db = new sqlite3.Database('orders.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');

    // Create Pendingg table
    db.run(`
        CREATE TABLE IF NOT EXISTS Pendingor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            buyer_qty INTEGER NOT NULL,
            buyer_price REAL NOT NULL,
            seller_price REAL NOT NULL,
            seller_qty INTEGER NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating Pendingor:', err.message);
            return;
        }
        console.log('Pendingg table created successfully.');

        // Create indexes on buyer_price and seller_price
        db.run(`
            CREATE INDEX IF NOT EXISTS idx_buyer_price ON Pendingor (buyer_price)
        `);
        db.run(`
            CREATE INDEX IF NOT EXISTS idx_seller_price ON Pendingor (seller_price)
        `);

        // Define values to be inserted
        const values = [
            [10, 99, 100, 20],
            [50, 98, 101, 20],
            [70, 97, 103, 150],
            [80, 96, 104, 70]
        ];

        // Function to insert values if they do not already exist
        const insertIfNotExists = (value) => {
            return new Promise((resolve, reject) => {
                const checkQuery = `
                    SELECT 1 FROM Pendingor 
                    WHERE buyer_qty = ? AND buyer_price = ? AND seller_price = ? AND seller_qty = ?
                `;

                db.get(checkQuery, value, (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!row) {
                        const insertQuery = `
                            INSERT INTO Pendingor (buyer_qty, buyer_price, seller_price, seller_qty)
                            VALUES (?, ?, ?, ?)
                        `;
                        db.run(insertQuery, value, (err) => {
                            if (err) {
                                return reject(err);
                            }
                            console.log(`Inserted: ${value}`);
                            resolve();
                        });
                    } else {
                        console.log(`Already exists: ${value}`);
                        resolve();
                    }
                });
            });
        };

        // Use a Promise to ensure all insertions are completed
        let insertPromises = values.map(value => insertIfNotExists(value));

        Promise.all(insertPromises)
            .then(() => {
                console.log('All values processed successfully.');
            })
            .catch(err => {
                console.error('Error processing values:', err.message);
            });
    });

    // Create Completedd table
    db.run(`
        CREATE TABLE IF NOT EXISTS Completedorder (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            price REAL NOT NULL,
            qty INTEGER NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating Completedorder:', err.message);
            return;
        }
        console.log('Completedorder table created successfully.');
    });

    // Create UpdatedPendingg table
    db.run(`
        CREATE TABLE IF NOT EXISTS UpdatedPendingorder (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            buyer_qty INTEGER NOT NULL,
            buyer_price REAL NOT NULL,
            seller_qty INTEGER NOT NULL,
            seller_price REAL NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating UpdatedPendingorder:', err.message);
            return;
        }
        console.log('UpdatedPendingorder table created successfully.');
    });

    // Create UpdatedCompletedd table
    db.run(`
        CREATE TABLE IF NOT EXISTS UpdatedCompletedor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            price REAL NOT NULL,
            qty INTEGER NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating UpdatedCompletedor:', err.message);
            return;
        }
        console.log('UpdatedCompletedor table created successfully.');
    });
});

module.exports = db;
