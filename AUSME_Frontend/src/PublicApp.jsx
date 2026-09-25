import React from "react";
import {Routes, Route, Navigate} from "react-router-dom";
import LandingPage from "./layouts/landing.jsx";
import FindAusme from "./layouts/find_ausme.jsx";
import Profile from "./layouts/profile";
import About from "./layouts/about"

function PublicApp() {
    return (

        <Routes>
            <Route index element={<LandingPage viewType="public"/>}/>

            <Route path="find" element={<FindAusme viewType="public"/>}/>

            <Route path="profile/:auid" element={<Profile viewType="public"/>}/>

            <Route path="about" element={<About viewType="public"/>} />

            <Route path="*" element={<Navigate to="find" replace/>}/>

        </Routes>
    );
}

export default PublicApp;