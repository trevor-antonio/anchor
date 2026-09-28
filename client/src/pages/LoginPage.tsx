import { useState } from "react";

export default function LoginPage() {
  const handleOidcLogin = () => {
    window.location.href = "http://localhost:8000/auth/login";
  };

  return (
    <button onClick={handleOidcLogin}>Login with Google</button>
  );
}