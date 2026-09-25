import React from "react";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PublicApp from "./PublicApp";
import PrivateApp from "./PrivateApp";
import { HeadshotProvider } from "./components/HeadshotContext";

import Dashboard from "./components/dashboard/Dashboard";
import Researchers from "./components/dashboard/Researchers";
import Papers from "./components/dashboard/Papers";
import Opportunities from "./components/dashboard/Opportunities";
import Navigation from "./components/dashboard/Navigation";

const queryClient = new QueryClient();
function ResearchLayout() {
    return (
        <>
            <Navigation />
            <Outlet />
        </>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <HeadshotProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Navigate to="/internal/login" replace />} />

                        <Route element={<ResearchLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />

                            <Route path="/researchers" element={<Researchers />} />

                            <Route path="/papers" element={<Papers />} />

                            <Route path="/opportunities" element={<Opportunities />} />
                        </Route>

                        <Route path="/public/*" element={<PublicApp />} />

                        <Route path="/internal/*" element={<PrivateApp />} />

                        <Route path="/" element={<Navigate to="/public" replace />} />
                        <Route path="*" element={<Navigate to="/public" replace />} />

                    </Routes>
                </BrowserRouter>
            </HeadshotProvider>
        </QueryClientProvider>
    );
}

export default App;