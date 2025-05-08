import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./Profile.css";

const Profile = () => {
  const fileInputRef = useRef();
  const { userId } = useParams();

  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState(null);
  const [readBooks, setReadBooks] = useState([]);
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [toRead, setToRead] = useState([]);
  const [allBooks, setAllBooks] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setImage(data.profilePic);
          //setImage(`http://localhost:5000/${data.profilePic}`);
          setUsername(data.username || "");
        } else {
          console.error(data.message);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };

    const fetchBooks = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}/bookshelves`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setReadBooks(data.read);
          setCurrentlyReading(data.currentlyReading);
          setToRead(data.toRead);
        }
      } catch (err) {
        console.error("Error fetching bookshelves:", err);
      }
    };

    const fetchAll = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/library", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setAllBooks(data);
      } catch (err) {
        console.error("Error fetching all books:", err);
      }
    };

    fetchProfile();
    fetchBooks();
    fetchAll();
  }, [userId, token]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/profile-pic`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImage(data.filePath);
        //setImage(`http://localhost:5000/${data.filePath}`);
      }
    } catch {
      alert("Error uploading image.");
    }
  };

  const handleUsernameSave = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/username`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      if (res.ok) setIsEditing(false);
    } catch {
      alert("Username update failed.");
    }
  };

  const moveBook = async (bookId, fromShelf, toShelf) => {
    await fetch(`http://localhost:5000/api/users/${userId}/move-book`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookId, fromShelf, toShelf }),
    });
    refreshShelves();
  };

  const addBookToShelf = async (bookId) => {
    await fetch(`http://localhost:5000/api/users/${userId}/add-book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookId, shelf: "toRead" }),
    });
    refreshShelves();
  };

  const refreshShelves = async () => {
    const res = await fetch(`http://localhost:5000/api/users/${userId}/bookshelves`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok) {
      setReadBooks(data.read);
      setCurrentlyReading(data.currentlyReading);
      setToRead(data.toRead);
    }
  };

  const renderShelf = (label, books, shelfKey) => (
    <div className="shelf">
      <h3>{label} ({books.length})</h3>
      <div className="books-grid">
        {books.map((book) => (
          <div className="book-card" key={book._id}>
            <img src={book.imageUrl} alt={book.title} className="book-cover" />
            <p>{book.title}</p>
            <div className="actions">
              {["read", "currentlyReading", "toRead"]
                .filter((s) => s !== shelfKey)
                .map((target) => (
                  <button key={target} onClick={() => moveBook(book._id, shelfKey, target)}>
                    Move to {target}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      {shelfKey === "toRead" && (
        <div className="add-book">
          <select
            onChange={(e) => {
              if (e.target.value) {
                addBookToShelf(e.target.value);
                e.target.value = "";
              }
            }}
          >
            <option value="">Add a book...</option>
            {allBooks.map((b) => (
              <option key={b._id} value={b._id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-pic" onClick={() => fileInputRef.current.click()}>
          {image ? (
            <img src={image} alt="Profile" className="uploaded-pic" />
          ) : (
            <span>+</span>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
        </div>
        <div className="profile-details">
          {isEditing ? (
            <>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="username-input"
              />
              <button onClick={handleUsernameSave}>Save</button>
            </>
          ) : (
            <>
              <h1>{username || "Loading..."}</h1>
              <button onClick={() => setIsEditing(true)}>Edit</button>
            </>
          )}
          <p className="joined">Joined in April 2025</p>
        </div>
      </div>

      <div className="profile-shelves">
        {renderShelf("Read", readBooks, "read")}
        {renderShelf("Currently Reading", currentlyReading, "currentlyReading")}
        {renderShelf("To-Read", toRead, "toRead")}
      </div>

      <div className="profile-friends">
        <h2>{username}'s Friends</h2>
        <p className="link">Invite your friends »</p>
      </div>

      <div className="profile-year">
        <h2>Your 2024 Year in Books</h2>
        <p>Take a look back at your 2024 reading journey.</p>
        <p className="link">Go to Your 2024 Year in Books »</p>
      </div>
    </div>
  );
};

export default Profile;
