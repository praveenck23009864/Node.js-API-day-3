import "./App.css";
import { useState } from "react";


function App() {
  const [backend, setBackend] = useState("http://127.0.0.1:3000");
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);


  async function apiRequest(path, method = "GET", body = null) {
    const response = await fetch(`${backend}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body !== null ? { body: JSON.stringify(body) } : {}),
    });

    const data = await response.json();

    if (!response.ok) {
      const message =
        typeof data.detail === "string"
          ? data.detail
          : typeof data.error === "string"
            ? data.error
            : `HTTP ${response.status}`;

      throw new Error(message);
    }

    return data;
  }

  // READ
  async function loadUsers() {
    try {
      const data = await apiRequest("/api/v1/users");
      setUsers(data);
      setStatus("Users loaded successfully");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  }

  // CREATE or UPDATE
  async function saveUser(event) {
    event.preventDefault();

    try {
      const userData = { name, email };

      if (editingId !== null) {
        await apiRequest(
          `/api/v1/users/${editingId}`,
          "PATCH",
          userData
        );
        setStatus("User updated successfully");
      } else {
        await apiRequest("/api/v1/users", "POST", userData);
        setStatus("User created successfully");
      }

      setName("");
      setEmail("");
      setEditingId(null);

      const data = await apiRequest("/api/v1/users");
      setUsers(data);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  }

  // Select a user for editing
  function editUser(user) {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
  }

  // DELETE

  async function deleteUser(id) {
    try {
      await apiRequest(`/api/v1/users/${id}`, "DELETE");

      const data = await apiRequest("/api/v1/users");
      setUsers(data);

      if (editingId === id) {
        setEditingId(null);
        setName("");
        setEmail("");
      }

      setDeleteTarget(null);
      setStatus("User deleted successfully");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  }


  return (
    <div style={{ padding: 30, fontFamily: "Arial", maxWidth: 700 }}>
      <h1>Users Management </h1>

      <label htmlFor="backend">Choose Backend: </label>
      <select
        id="backend"
        value={backend}
        onChange={(event) => {
          setBackend(event.target.value);
          setUsers([]);
          setEditingId(null);
          setName("");
          setEmail("");
          setStatus("");
        }}
      >
        <option value="http://127.0.0.1:3000">
          Node.js API
        </option>
        <option value="http://127.0.0.1:8001">
          Python API
        </option>
      </select>

      <button onClick={loadUsers} style={{ marginLeft: 10 }}>
        Load Users
      </button>

      <h2>{editingId !== null ? "Edit User" : "Create User"}</h2>

      <form onSubmit={saveUser}>
        <div style={{ marginBottom: 10 }}>
          <input
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <button type="submit">
          {editingId !== null ? "Update User" : "Create User"}
        </button>

        {editingId !== null && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setName("");
              setEmail("");
            }}
            style={{ marginLeft: 10 }}
          >
            Cancel
          </button>
        )}
      </form>

      <p role="status">{status}</p>

      <h2>User List</h2>

      {users.length === 0 && <p>No users loaded.</p>}

      <ul>
        {users.map((user) => (
          <li key={user.id} style={{ marginBottom: 15 }}>
            <strong>{user.name}</strong> - {user.email}

            <div style={{ marginTop: 5 }}>
              <button onClick={() => editUser(user)}>
                Edit
              </button>

              <button onClick={() => setDeleteTarget(user)}>
                Delete
              </button>
            </div>
          </li>
        ))}

      </ul>

      {/* DELETE WARNING POPUP */}
      {deleteTarget && (
        <div className="delete-overlay">
          <div
            className="delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-message"
          >
            <div className="delete-icon">⚠️</div>

            <h3 id="delete-title">Delete User?</h3>

            <p id="delete-message">
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong>?
              <br />
              This action cannot be undone.
            </p>

            <div className="delete-actions">
              <button
                className="delete-cancel"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                className="delete-confirm"
                onClick={() => deleteUser(deleteTarget.id)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

