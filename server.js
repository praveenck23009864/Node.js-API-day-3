const cors = require("cors");
const express = require("express");
const validator = require("validator");
const { initializeDatabase } = require("./database");

const app = express();
const PORT = 3000;

app.use(
    cors({
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type"],
    })
);

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

    // GET USER BY ID
    app.get("/api/v1/users/:id", (req, res) => {
        const userId = Number(req.params.id);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(422).json({
                detail: "User ID must be a positive integer",
            });
        }

        db.get(
            "SELECT id, name, email, created_at FROM users WHERE id = ?",
            [userId],
            (error, user) => {
                if (error) {
                    console.error(error.message);
                    return res.status(500).json({
                        detail: "Unable to retrieve user",
                    });
                }

                if (!user) {
                    return res.status(404).json({
                        detail: "User not found",
                    });
                }

                return res.json(user);
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
                        error.message.includes(
                            "UNIQUE constraint failed: users.email"
                        )
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

    // UPDATE USER
    app.patch("/api/v1/users/:id", (req, res) => {
        const userId = Number(req.params.id);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(422).json({
                detail: "User ID must be a positive integer",
            });
        }

        const body = req.body;

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return res.status(422).json({
                detail: "Send a JSON object",
            });
        }

        const fields = [];
        const values = [];

        if (Object.hasOwn(body, "name")) {
            if (
                typeof body.name !== "string" ||
                body.name.trim().length === 0 ||
                body.name.trim().length > 100
            ) {
                return res.status(422).json({
                    detail: "Name must contain between 1 and 100 characters",
                });
            }

            fields.push("name = ?");
            values.push(body.name.trim());
        }

        if (Object.hasOwn(body, "email")) {
            if (
                typeof body.email !== "string" ||
                !validator.isEmail(body.email.trim())
            ) {
                return res.status(422).json({
                    detail: "Enter a valid email address",
                });
            }

            fields.push("email = ?");
            values.push(body.email.trim());
        }

        if (fields.length === 0) {
            return res.status(400).json({
                detail: "Provide a name or email to update",
            });
        }

        values.push(userId);

        db.run(
            `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
            values,
            function (error) {
                if (error) {
                    if (
                        error.code === "SQLITE_CONSTRAINT" &&
                        error.message.includes(
                            "UNIQUE constraint failed: users.email"
                        )
                    ) {
                        return res.status(409).json({
                            detail: "A user with this email already exists",
                        });
                    }

                    console.error(error.message);
                    return res.status(500).json({
                        detail: "Unable to update user",
                    });
                }

                if (this.changes === 0) {
                    return res.status(404).json({
                        detail: "User not found",
                    });
                }

                db.get(
                    "SELECT id, name, email, created_at FROM users WHERE id = ?",
                    [userId],
                    (error, user) => {
                        if (error) {
                            console.error(error.message);
                            return res.status(500).json({
                                detail: "User was updated, but could not be retrieved",
                            });
                        }

                        if (!user) {
                            return res.status(404).json({
                                detail: "User no longer exists",
                            });
                        }

                        return res.json(user);
                    }
                );
            }
        );
    });
        // DELETE USER
    app.delete("/api/v1/users/:id", (req, res) => {
        const userId = Number(req.params.id);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(422).json({
                detail: "User ID must be a positive integer",
            });
        }

        db.run(
            "DELETE FROM users WHERE id = ?",
            [userId],
            function (error) {
                if (error) {
                    console.error(error.message);
                    return res.status(500).json({
                        detail: "Unable to delete user",
                    });
                }

                if (this.changes === 0) {
                    return res.status(404).json({
                        detail: "User not found",
                    });
                }

                return res.json({
                    message: "User deleted successfully",
                });
            }
        );
    });
    app.listen(PORT, "127.0.0.1", () => {

        console.log(`Server running at http://127.0.0.1:${PORT}`);
    });
});