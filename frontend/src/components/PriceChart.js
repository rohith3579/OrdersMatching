import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register the required components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function PriceChart() {
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [] 
    });

    useEffect(() => {
        fetchChartData();
    }, []);

    const fetchChartData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/orders');
            const completedOrders = response.data.completedOrders;

            const labels = completedOrders.map(order => `Order ${order.id}`);
            const data = completedOrders.map(order => order.price);

            setChartData({
                labels: labels,
                datasets: [
                    {
                        label: 'Price over time',
                        data: data,
                        fill: false,
                        backgroundColor: 'rgba(75,192,192,1)',
                        borderColor: 'rgba(75,192,192,1)',
                    }
                ]
            });
        } catch (error) {
            console.error('There was an error fetching the chart data!', error);
        }
    };

    return (
        <div>
            <h2>Price Chart</h2>
            <Line data={chartData} />
        </div>
    );
}

export default PriceChart;
