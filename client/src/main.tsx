import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import store from "./store";
import AppErrorBoundary from "./components/ui/AppErrorBoundary";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Provider store={store}>
        <AppErrorBoundary><App /></AppErrorBoundary>
      </Provider>
    </BrowserRouter>
  </QueryClientProvider>
);
