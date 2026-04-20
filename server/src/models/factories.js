import { createHash } from "crypto";

export const UserFactory = {
  hashPassword(password) {
    return createHash("sha256").update(password).digest("hex");
  },

  create({ username, email, password }) {
    if (!username || username.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email address");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    return {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash: this.hashPassword(password),
    };
  },

  toPublic(user) {
    const { password_hash, ...safe } = user;
    return safe;
  },
};

export const CardFactory = {
  create({
    column_id,
    title,
    description = "",
    priority = "medium",
    position = 0,
  }) {
    if (!title || title.trim().length === 0) {
      throw new Error("Card title is required");
    }
    if (!["low", "medium", "high"].includes(priority)) {
      throw new Error("Priority must be low, medium, or high");
    }

    return {
      column_id,
      title: title.trim(),
      description: description.trim(),
      priority,
      position,
    };
  },
};
