const express = require("express");
const validator = require("validator");
const { initializeDatabase } = require("./database");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Node.js Users API is running" });
});

initializeDatabase((error, db) => {
    if (error) {
        console.error("Database setup failed:", error.message);
        process.exitCode = 1;
        return;
    }

    // GET ALL USERS
    app.get("/api/v1/users", (req, res) => {
        db.all(
            "SELECT id, name, email, created_at FROM users ORDER BY id",
            [],
            (error, rows) => {
                if (error) {
                    console.error(error.message);
                    return res.status(500).json({
                        detail: "Unable to retrieve users",
                    });
                }

                return res.json(rows);
            }
        );
    });

    // CREATE USER
    app.post("/api/v1/users", (req, res) => {
        const { name, email } = req.body ?? {};

        if (
            typeof name !== "string" ||
            name.trim().length === 0 ||
            name.trim().length > 100
        ) {
            return res.status(422).json({
                detail: "Name must contain between 1 and 100 characters",
            });
        }

        if (
            typeof email !== "string" ||
            !validator.isEmail(email.trim())
        ) {
            return res.status(422).json({
                detail: "Enter a valid email address",
            });
        }

        db.run(
            "INSERT INTO users (name, email) VALUES (?, ?)",
            [name.trim(), email.trim()],
            function (error) {
                if (error) {
                    if (
                        error.code === "SQLITE_CONSTRAINT" &&
                        error.message.includes("UNIQUE constraint failed: users.email")
                    ) {
                        return res.status(409).json({
                            detail: "A user with this email already exists",
                        });
                    }

                    console.error(error.message);
                    return res.status(500).json({
                        detail: "Unable to create user",
                    });
                }

                db.get(
                    "SELECT id, name, email, created_at FROM users WHERE id = ?",
                    [this.lastID],
                    (error, user) => {
                        if (error) {
                            console.error(error.message);
                            return res.status(500).json({
                                detail: "User was saved, but could not be retrieved",
                            });
                        }

                        return res.status(201).json(user);
                    }
                );
            }
        );
    });

    app.listen(PORT, "127.0.0.1", () => {
        console.log(`Server running at http://127.0.0.1:${PORT}`);
    });
});