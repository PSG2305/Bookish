// components/Navbar.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="navbar-modern">
      <div className="navbar-left">
        <Link to="/" className="brand" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo.png" alt="Logo" style={{ height: "80px", marginRight: "10px" }} />
          <h2 style={{ margin: 0, color: "white" }}>Bookish</h2>
        </Link>
      </div>

      <div className="navbar-right">
        {token ? (
          <>
            <Link to="/home">Dashboard</Link>
            <Link to="/clubs">Clubs</Link>
            <Link to="/community">Discussions</Link>
            <Link to={`/profile/${user.userid}`}>Profile</Link>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;
