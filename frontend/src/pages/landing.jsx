import React from "react";
import { Link, useNavigate } from 'react-router-dom';
import "../App.css";

export default function LandingPage() {
    const router = useNavigate();

    const handleJoinAsGuest = () => {
        const chars = "abcdefghijklmnopqrstuvwxyz";
        const segment = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        const randomCode = `${segment(3)}-${segment(4)}-${segment(3)}`;
        router(`/${randomCode}`);
    };

    return (
        <div className="landingPageContainer">
            <nav>
                <div className="navHeader">
                    <h2>NEXAMEET</h2>
                </div>
                <div className="navList">
                    <p onClick={handleJoinAsGuest}>Join as Guest</p>
                    <p onClick={() => router("/auth")}>Register</p>
                    <div role="button">
                        <p onClick={() => router("/auth")}>Login</p>
                    </div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h1>
                        <span style={{ color: "#FF9839" }}>Connect</span> with your loved<br />Ones
                    </h1>

                    <p>Cover a distance by NEXAMEET</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
                <div>
                    <img src="/mobile.png" alt="NEXAMEET Preview" />
                </div>
            </div>
        </div>
    );
}