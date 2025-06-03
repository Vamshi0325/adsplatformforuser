// components/AuthFormWrapper.jsx
"use client";

import styled from "styled-components";

const AuthFormWrapper = styled.div`
  background-color: #1f1f1f;
  padding: 30px;
  border-radius: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  width: 450px;
  color: #f1f1f1;

  form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  label {
    font-weight: 600;
    margin-bottom: 5px;
    display: block;
  }

  input[type="text"],
  input[type="email"],
  input[type="password"] {
    background-color: #2b2b2b;
    border: 1.5px solid #333;
    border-radius: 10px;
    height: 50px;
    padding: 0 10px;
    color: #f1f1f1;
    font-size: 16px;
    outline: none;
    transition: border-color 0.2s ease-in-out;
  }

  input[type="text"]:focus,
  input[type="email"]:focus,
  input[type="password"]:focus {
    border-color: #2d79f3;
  }

  .flex-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .flex-row > div {
    display: flex;
    align-items: center;
  }

  .flex-row > div > label {
    font-size: 14px;
    font-weight: 400;
    margin-left: 5px;
  }

  .link-button {
    color: #2d79f3;
    font-weight: 500;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font-size: 14px;
  }

  button.submit-button {
    margin-top: 20px;
    height: 50px;
    background-color: #2d79f3;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
  }

  button.submit-button:hover:enabled {
    background-color: #1e54c5;
  }

  button.submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  p.text-center {
    text-align: center;
    font-size: 14px;
    margin-top: 10px;
  }

  p.text-center > a {
    color: #2d79f3;
    font-weight: 500;
    text-decoration: none;
  }

  p.text-center > a:hover {
    text-decoration: underline;
  }

  .error-message {
    color: #ff6b6b;
    font-size: 14px;
    margin-bottom: 10px;
  }

  .success-message {
    color: #4ade80;
    font-size: 14px;
    margin-bottom: 10px;
  }
`;

export default AuthFormWrapper;
