import React, { useState } from 'react';
import axios from 'axios';

function OrderForm() {
    const [orderType, setOrderType] = useState('Buy');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted'); // Log before sending request

        // Ensure quantity and price are numbers
        const data = {
            orderType, // Add this line
            quantity: parseFloat(quantity),
            price: parseFloat(price),
        };
        
        

        try {
            const response = await axios.post('http://localhost:5000/order', data);
            console.log('Response:', response); // Log response
            alert('Order placed successfully!');
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Request data:', error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
            }
            console.error('Error config:', error.config);
            alert('There was an error placing the order. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>
                    Order Type:
                    <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                        <option value="Buy">Buy</option>
                        <option value="Sell">Sell</option>
                    </select>
                </label>
            </div>
            <div>
                <label>
                    Quantity:
                    <input
                        type="number"
                        step="any" // Allows decimal input
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                    />
                </label>
            </div>
            <div>
                <label>
                    Price:
                    <input
                        type="number"
                        step="any" // Allows decimal input
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                    />
                </label>
            </div>
            <button type="submit">Place Order</button>
        </form>
    );
}

export default OrderForm;
