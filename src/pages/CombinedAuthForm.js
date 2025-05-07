import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CombinedAuthForm.css";

const CombinedAuthForm = () => {
  const [mode, setMode] = useState("login");
  const [userid, setUserid] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "signup" && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body =
      mode === "login"
        ? { userid, password }
        : { userid, username, password };

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === "login") {
          // Save token and user to localStorage
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify({ userid: data.userid, username: data.username }));

          navigate("/home");
        } else {
          alert("Signup successful! You can now log in.");
          setMode("login");
        }
      } else {
        alert(data.message || "Login/Signup failed.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="container">
      <div className="auth-tabs">
        <button
          className={mode === "login" ? "tab active-tab" : "tab"}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          className={mode === "signup" ? "tab active-tab" : "tab"}
          onClick={() => setMode("signup")}
        >
          Signup
        </button>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <h2 className="form-title">
          {mode === "login" ? "Login Form" : "Signup Form"}
        </h2>

        <input
          type="email"
          placeholder="Email Address"
          value={userid}
          onChange={(e) => setUserid(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {mode === "signup" && (
          <>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </>
        )}

        <button type="submit" className="btn-primary">
          {mode === "login" ? "Login" : "Signup"}
        </button>

        <p>
          {mode === "login" ? "Not a member?" : "Already have an account?"}{" "}
          <span className="link" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Signup now" : "Login here"}
          </span>
        </p>
      </form>
    </div>
  );
};

export default CombinedAuthForm;
