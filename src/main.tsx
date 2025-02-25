
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { store, persistor } from './store';
import App from './App';
import './index.css';

// Create a client with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000,
      gcTime: 60 * 1000, // 1 minute
      retry: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <App />
          </PersistGate>
        </Provider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
