import React from 'react';
import TransactionStore from './contexts/TransactionStore';
import App from './App';


const Container = ({ children }) => (
  <TransactionStore>
    <App />
  </TransactionStore>
);

export default Container;
