import React from "react";
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import "./assets/css/reset.css";
import "./assets/css/styles.css";
import "./assets/css/responsive.css";

ReactDOM.createRoot(document.getElementById("root")).render(
     <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>
);