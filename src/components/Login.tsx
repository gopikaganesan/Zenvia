import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Shield, User, Mail, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { getHealthStatus, loginUser, registerUser } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";

export function Login() {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [checkingBackend, setCheckingBackend] = useState(true);

  useEffect(() => {
    document.title = isRegisterMode ? "Zenvia | Create Account" : "Zenvia | Login";
  }, [isRegisterMode]);

  const checkBackendStatus = async () => {
    setCheckingBackend(true);
    try {
      await getHealthStatus();
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    } finally {
      setCheckingBackend(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const payload = isRegisterMode
        ? await registerUser({ name, email, password })
        : await loginUser({ email, password });

      setAuthSession(payload.token, {
        id: payload.data.id,
        name: payload.data.name,
        email: payload.data.email,
        avatarUrl: payload.data.avatarUrl,
      });

      navigate("/profile");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-white px-4 py-8 sm:py-12 flex items-start sm:items-center justify-center">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-violet-700 hover:text-violet-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </button>

        <Card className="border-violet-200 shadow-xl rounded-2xl">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-xl mx-auto bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl mt-2">
              {isRegisterMode ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isRegisterMode
                ? "Create your Zenvia account to enable tracking"
                : "Login to continue your wellness journey"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-6">
            <div
              className={`mb-4 rounded-lg border px-3 py-2 text-sm flex items-center justify-between gap-3 ${
                checkingBackend
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : backendOnline
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {checkingBackend ? (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                ) : backendOnline ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>
                  {checkingBackend
                    ? "Checking backend status..."
                    : backendOnline
                    ? "Backend online - login and signup available"
                    : "Backend offline - login/signup may fail"}
                </span>
              </div>
              <button
                type="button"
                onClick={checkBackendStatus}
                className="underline underline-offset-2 hover:opacity-80"
              >
                Retry
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isRegisterMode && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 block">Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="pl-10 h-11"
                      placeholder="Your name"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-gray-600 block">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-10 h-11"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 block">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-10 h-11"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-violet-600 to-pink-500"
                disabled={loading}
              >
                {loading ? "Please wait..." : isRegisterMode ? "Create Account" : "Login"}
              </Button>
            </form>

            <Button
              variant="ghost"
              className="w-full mt-3 h-10"
              onClick={() => {
                setIsRegisterMode((prev) => !prev);
                setErrorMessage("");
              }}
            >
              {isRegisterMode ? "Already have an account? Login" : "New here? Create account"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
