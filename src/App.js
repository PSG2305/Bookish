// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import CombinedAuthForm from "./pages/CombinedAuthForm";
import Clubs from "./pages/Clubs"; 
import ClubDetail from "./pages/ClubDetail";
import Community from "./pages/Community";
import CreateClub from "./pages/CreateClub";
import AddBook from "./pages/AddBook";
import { ClubProvider } from "./context/ClubContext";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
};

const App = () => {
  return (
    <ClubProvider>
      <Router>
      <Navbar />
      <Routes>
      <Route path="/" element={<CombinedAuthForm />} />
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/profile/:userId" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/clubs" element={<PrivateRoute><Clubs /></PrivateRoute>} />
          <Route path="/clubs/create" element={<PrivateRoute><CreateClub /></PrivateRoute>} />
          <Route path="/clubs/:clubId/add-book" element={<PrivateRoute><AddBook /></PrivateRoute>} />
          <Route path="/clubs/:clubId" element={<PrivateRoute><ClubDetail /></PrivateRoute>} />
          <Route path="/clubs/:clubSlug" element={<PrivateRoute><ClubDetail /></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />
      </Routes>
    </Router>
    </ClubProvider>
    
  );
};

export default App;
