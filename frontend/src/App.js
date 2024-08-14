import React from 'react';
import OrderForm from './components/OrderForm';
import OrderTables from './components/OrderTables';
import PriceChart from './components/PriceChart';
function App() {
    return (
        <div className="App">
            <h1>Order Matching System</h1>
            <OrderForm />
            <OrderTables />
            <PriceChart/>
        </div>
    );
}

export default App;
