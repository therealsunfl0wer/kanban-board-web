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
