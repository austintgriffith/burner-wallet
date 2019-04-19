import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import TransactionStore from './contexts/TransactionStore';
import App from './App';
import i18n from './i18n';


const Container = ({ children }) => (
  <Router>
    <I18nextProvider i18n={i18n}>
      <TransactionStore>
        <App />
      </TransactionStore>
    </I18nextProvider>
  </Router>
);

export default Container;
