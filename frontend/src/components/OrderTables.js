import React, { useState, useEffect } from 'react';
import axios from 'axios';

function OrderTables() {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [updatependingOrders, setupdatePendingOrders] = useState([]);
    const [updatecompletedOrders, setupdateCompletedOrders] = useState([]);
    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get('http://localhost:5000/orders');
            setPendingOrders(response.data.pendingOrders);
            setCompletedOrders(response.data.completedOrders);
            setupdatePendingOrders(response.data.updatedPendingOrders);
            setupdateCompletedOrders(response.data.updatedCompletedOrders);
        } catch (error) {
            console.error('There was an error fetching the orders!', error);
        }
    };

    return (
        <div>
            <h2>Pending Orders</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Buyer Quantity</th>
                        <th>Buyer Price</th>
                        <th>Seller Quantity</th>
                        <th>Seller Price</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingOrders.map(order => (
                        <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{order.buyer_qty}</td>
                            <td>{order.buyer_price}</td>
                            <td>{order.seller_qty}</td>
                            <td>{order.seller_price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2>Completed Orders</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Price</th>
                        <th>Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    {completedOrders.map(order => (
                        <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{order.price}</td>
                            <td>{order.qty}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h2>Updated Pending Orders</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Buyer Quantity</th>
                        <th>Buyer Price</th>
                        <th>Seller Quantity</th>
                        <th>Seller Price</th>
                    </tr>
                </thead>
                <tbody>
                    {updatependingOrders.map(order => (
                        <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{order.buyer_qty}</td>
                            <td>{order.buyer_price}</td>
                            <td>{order.seller_qty}</td>
                            <td>{order.seller_price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
           
        </div>
    );
}

export default OrderTables;
