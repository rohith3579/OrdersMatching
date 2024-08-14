const express = require('express');
const db = require('./database');

const app = express();
app.use(express.json());
const cors = require('cors');

app.use(cors());

app.post('/order', (req, res) => {
    const { orderType, quantity, price } = req.body;

    console.log("Received orderType:", orderType);

    let buyerQty = 0, buyerPrice = 0, sellerQty = 0, sellerPrice = 0;

    if (orderType === 'Buy') {
        buyerQty = quantity;
        buyerPrice = price;
    } else if (orderType === 'Sell') {
        sellerQty = quantity;
        sellerPrice = price;
    } else {
        return res.status(400).send({ message: 'Invalid order type' });
    }

    matchOrders(orderType,buyerQty, buyerPrice, sellerQty, sellerPrice, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).send({ message: 'Order processed successfully!' });
    });
});

function matchOrders(orderType, buyerQty, buyerPrice, sellerQty, sellerPrice, callback) {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION", (err) => {
            if (err) {
                console.error('Error starting transaction:', err.message);
                return callback(err);
            }

            // Main query to fetch all orders sorted as required
            const fetchOrdersQuery = `
                SELECT * FROM Pendingor
                ORDER BY seller_price ASC, buyer_price DESC
            `;

            // Query to match orders based on the buyer's or seller's price
            let matchedQuery;
            let params;

            if (orderType === 'Buy') {
                matchedQuery = `
                    SELECT * FROM Pendingor
                    WHERE seller_price <= ?
                    ORDER BY seller_price ASC
                `;
                params = [buyerPrice];
            } else if (orderType === 'Sell') {
                matchedQuery = `
                    SELECT * FROM Pendingor
                    WHERE buyer_price >= ?
                    ORDER BY buyer_price DESC
                `;
                params = [sellerPrice];
            }

            db.all(fetchOrdersQuery, [], (err, allOrders) => {
                if (err) {
                    console.error('Error fetching orders:', err.message);
                    return rollbackTransaction(callback, err);
                }

                db.all(matchedQuery, params, (err, matchedRows) => {
                    if (err) {
                        console.error('Error fetching matched orders:', err.message);
                        return rollbackTransaction(callback, err);
                    }
                    const updates = [];
                    const completedOrders = [];
                    //const rowCount = allOrders.length;
                    var float=false;
                    
                    matchedRows.forEach((row, index) => {
                        var matchedQty;
                        var matchPrice;
                        if(orderType==='Buy'){
                         matchedQty = Math.min(buyerQty, row.seller_qty);
                         matchPrice = (buyerPrice + row.seller_price) / 2;
                        }
                        if(orderType==='Sell'){
                            matchedQty = Math.min(row.buyer_qty, sellerQty);
                         matchPrice = (row.buyer_price + sellerPrice) / 2;
                        }
                        // Add to completed orders
                        completedOrders.push({
                            price: matchPrice,
                            qty: matchedQty
                        });

                        updates.push(new Promise((resolve, reject) => {
                            db.run(`
                                INSERT INTO Completedorder (price, qty)
                                VALUES (?, ?)`,
                                [matchPrice, matchedQty],
                                (err) => {
                                    if (err) return reject(err);
                                    resolve();
                                }
                            );
                        }));
                    
                    
                    
                   
                    if(orderType==='Buy'){
                        buyerQty-=matchedQty;
                    allOrders.forEach((order, index) => {
                        // Check if this order is matched
                        const isMatched = matchedRows.some(matchedRow => {
 
                            return matchedRow.seller_price === order.seller_price &&
               matchedRow.buyer_price === order.buyer_price &&
               matchedRow.seller_qty === order.seller_qty &&
               matchedRow.buyer_qty === order.buyer_qty;
                        });
                    
                        if (isMatched) {
                            float=true;
                            console.log('Matched Order:', order);
                            if(buyerQty>0){
                                const nextRow=allOrders[index+1];
                                if(nextRow){
                            updates.push(new Promise((resolve, reject) => {
                                db.run(`
                                    INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                    VALUES (?, ?, ?, ?)`,
                                    [buyerQty, buyerPrice,nextRow.seller_qty,nextRow.seller_price],
                                    (err) => {
                                        if (err) return reject(err);
                                        resolve();
                                    }
                                );
                            }));
                        }
                        else{
                            updates.push(new Promise((resolve, reject) => {
                                db.run(`
                                    INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                    VALUES (?, ?, ?, ?)`,
                                    [buyerQty, buyerPrice,Math.floor(Math.random() * 50) + 1,order.seller_price+1],
                                    (err) => {
                                        if (err) return reject(err);
                                        resolve();
                                    }
                                );
                            }));
                        }
                        }
                        else if(buyerQty<0){
                            const nextRow=allOrders[index+1];
                            if(nextRow){
                            updates.push(new Promise((resolve, reject) => {
                                db.run(`
                                    INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                    VALUES (?, ?, ?, ?)`,
                                    [order.buyer_qty, order.buyer_price,nextRow.seller_qty,nextRow.seller_price],
                                    (err) => {
                                        if (err) return reject(err);
                                        resolve();
                                    }
                                );
                            }));
                        }
                        else{
                            updates.push(new Promise((resolve, reject) => {
                                db.run(`
                                    INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                    VALUES (?, ?, ?, ?)`,
                                    [order.buyer_qty, order.buyer_price,Math.floor(Math.random() * 50) + 1,order.seller_price+1],
                                    (err) => {
                                        if (err) return reject(err);
                                        resolve();
                                    }
                                );
                            }));
                        }
                    }
                            // Handle matched order logic here
                            // E.g., process the matched order, update quantities, etc.
                        }
                        else if(float===true){
                            const nextRow=allOrders[index+1];
                            if(nextRow){
                            updates.push(new Promise((resolve, reject) => {
                                db.run(`
                                    INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                    VALUES (?, ?, ?, ?)`,
                                    [order.buyer_qty, order.buyer_price,nextRow.seller_qty,nextRow.seller_price],
                                    (err) => {
                                        if (err) return reject(err);
                                        resolve();
                                    }
                                );
                            }));
                        }
                        else{
                            updates.push(new Promise((resolve, reject) => {
                                db.run(`
                                    INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                    VALUES (?, ?, ?, ?)`,
                                    [order.buyer_qty, order.buyer_price,Math.floor(Math.random() * 50) + 1,order.seller_price+1],
                                    (err) => {
                                        if (err) return reject(err);
                                        resolve();
                                    }
                                );
                            }));
                        }
                        } else {
                            console.log('Unmatched Order:', order);
                            updates.push(new Promise((resolve, reject) => {
                                db.run(`
                                    INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                    VALUES (?, ?, ?, ?)`,
                                    [order.buyer_qty, order.buyer_price,order.seller_qty,order.seller_price],
                                    (err) => {
                                        if (err) return reject(err);
                                        resolve();
                                    }
                                );
                            }));
                            // Handle unmatched order logic here
                            // E.g., insert into UpdatedPendingor with adjustments, etc.
                        }
                    });
                
                    
                
                }
                if(orderType==='Sell'){
                    sellerQty-=matchedQty;
                allOrders.forEach((order, index) => {
                    // Check if this order is matched
                    let floo=false;
                    const isMatched = matchedRows.some(matchedRow => {
             
                        return matchedRow.seller_price === order.seller_price &&
           matchedRow.buyer_price === order.buyer_price &&
           matchedRow.seller_qty === order.seller_qty &&
           matchedRow.buyer_qty === order.buyer_qty;
                    });
                
                    if (isMatched) {
                        floo=true;
                        console.log('Matched Order:', order);
                        if(sellerQty>0){
                            const nextRow=allOrders[index+1];
                            if(nextRow){
                        updates.push(new Promise((resolve, reject) => {
                            db.run(`
                                INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                VALUES (?, ?, ?, ?)`,
                                [nextRow.buyer_qty, nextRow.buyer_price,sellerQty,sellerPrice],
                                (err) => {
                                    if (err) return reject(err);
                                    resolve();
                                }
                            );
                        }));
                    }
                    else{
                        updates.push(new Promise((resolve, reject) => {
                            db.run(`
                                INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                VALUES (?, ?, ?, ?)`,
                                [Math.floor(Math.random() * 50) + 1,order.buyer_price-1,sellerQty,sellerPrice],
                                (err) => {
                                    if (err) return reject(err);
                                    resolve();
                                }
                            );
                        }));
                    }
                    }
                    else if(sellerQty<0){
                        const nextRow=allOrders[index+1];
                        if(nextRow){
                        updates.push(new Promise((resolve, reject) => {
                            db.run(`
                                INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                VALUES (?, ?, ?, ?)`,
                                [nextRow.buyer_qty, nextRow.buyer_price,order.seller_qty,order.seller_price],
                                (err) => {
                                    if (err) return reject(err);
                                    resolve();
                                }
                            );
                        }));
                    }
                    else{
                        updates.push(new Promise((resolve, reject) => {
                            db.run(`
                                INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                VALUES (?, ?, ?, ?)`,
                                [Math.floor(Math.random() * 50) + 1, order.buyer_price-1,order.seller_qty,order.seller_price],
                                (err) => {
                                    if (err) return reject(err);
                                    resolve();
                                }
                            );
                        }));
                    }
                }
                        // Handle matched order logic here
                        // E.g., process the matched order, update quantities, etc.
                    }
                    else if(floo===true){
                        const nextRow=allOrders[index+1];
                        if(nextRow){
                        updates.push(new Promise((resolve, reject) => {
                            db.run(`
                                INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                VALUES (?, ?, ?, ?)`,
                                [nextRow.buyer_qty, nextRow.buyer_price,order.seller_qty,order.seller_price],
                                (err) => {
                                    if (err) return reject(err);
                                    resolve();
                                }
                            );
                        }));
                    }
                    else{
                        updates.push(new Promise((resolve, reject) => {
                            db.run(`
                                INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                VALUES (?, ?, ?, ?)`,
                                [Math.floor(Math.random() * 50) + 1,order.buyer_price-1,order.seller_qty, order.seller_price],
                                (err) => {
                                    if (err) return reject(err);
                                    resolve();
                                }
                            );
                        }));
                    }
                    } else {
                        console.log('Unmatched Order:', order);
                        updates.push(new Promise((resolve, reject) => {
                            db.run(`
                                INSERT INTO UpdatedPendingorder (buyer_qty, buyer_price, seller_qty, seller_price)
                                VALUES (?, ?, ?, ?)`,
                                [order.buyer_qty, order.buyer_price,order.seller_qty,order.seller_price],
                                (err) => {
                                    if (err) return reject(err);
                                    resolve();
                                }
                            );
                        }));
                        // Handle unmatched order logic here
                        // E.g., insert into UpdatedPendingor with adjustments, etc.
                    }
                });
            
                
            
            }

                    // Execute all updates sequentially
                    Promise.all(updates)
                        .then(() => {
                            db.run("COMMIT", (commitErr) => {
                                if (commitErr) {
                                    console.error('Error committing transaction:', commitErr.message);
                                    return rollbackTransaction(callback, commitErr);
                                }
                                callback(null); // No results needed
                            });
                        })
                        .catch(err => {
                            rollbackTransaction(callback, err);
                        });
                });
            });
        });
    });
});
}


function rollbackTransaction(callback, err) {
    db.run("ROLLBACK", (rollbackErr) => {
        if (rollbackErr) {
            console.error('Error rolling back transaction:', rollbackErr.message);
        }
        callback(err); // Ensure the callback is always called, regardless of rollback success
    });
}

app.get('/orders', (req, res) => {
    const getPendingOrdersQuery = 'SELECT * FROM Pendingor ORDER BY seller_price ASC, buyer_price DESC';
    const getCompletedOrdersQuery = 'SELECT * FROM Completedorder';
    const getUpdatedPendingOrdersQuery = 'SELECT * FROM UpdatedPendingorder ORDER BY seller_price ASC, buyer_price DESC';
    const getUpdatedCompletedOrdersQuery = 'SELECT * FROM UpdatedCompletedor';

    db.serialize(() => {
        db.all(getPendingOrdersQuery, [], (err, pendingOrders) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            db.all(getCompletedOrdersQuery, [], (err, completedOrders) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                db.all(getUpdatedPendingOrdersQuery, [], (err, updatedPendingOrders) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    db.all(getUpdatedCompletedOrdersQuery, [], (err, updatedCompletedOrders) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }

                        res.json({
                            pendingOrders,
                            completedOrders,
                            updatedPendingOrders,
                            updatedCompletedOrders
                        });
                    });
                });
            });
        });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
