"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import AuthFormWrapper from "@/components/auth-form-wrapper";

export default function SignupPage() {
  const { signup } = useAuth();

  const [username, setUsername] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!username || !telegramUsername || !email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await signup({
        Username: username,
        Email: email,
        Password: password,
        TelegramUsername: telegramUsername,
        Role: "Publisher",
      });

      if (result && result.status === 201) {
        setSuccess(result.data.message);
        setUsername("");
        setTelegramUsername("");
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError(err?.response?.data?.message);
      } else {
        setError(err.response?.data?.message || "Signup failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-r from-purple-600 to-indigo-700">
      <AuthFormWrapper>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-5">
          Sign Up
        </h2>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <form onSubmit={handleSignupSubmit} noValidate>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="telegramUsername">Telegram Username</label>
          <input
            id="telegramUsername"
            type="text"
            placeholder="@username"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="your@email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center" style={{ marginTop: "20px" }}>
          Already have an account?{" "}
          <Link href="/auth/login" className="link-button">
            Login
          </Link>
        </p>
      </AuthFormWrapper>
    </div>
  );
}
