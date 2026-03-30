import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Mail, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { clearAuthSession, getStoredUser, isAuthenticated, type AuthUser } from "@/lib/auth";
import { getCurrentUser, logoutUser } from "@/lib/api";

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(isAuthenticated());

  useEffect(() => {
    if (!isAuthenticated()) { setLoading(false); return; }
    getCurrentUser()
      .then((r) => setUser({ id: r.data._id, name: r.data.name, email: r.data.email }))
      .catch(() => { clearAuthSession(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    clearAuthSession();
    navigate("/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading…</p></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen py-10 px-4">
        <div className="max-w-md mx-auto space-y-4">
          <Button variant="ghost" onClick={() => navigate("/")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <Card className="border-violet-200">
            <CardContent className="pt-6 text-center space-y-3">
              <p className="text-gray-600">Please log in to view your profile.</p>
              <Button onClick={() => navigate("/login")} className="bg-violet-600 hover:bg-violet-700">Go to Login</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="bg-gradient-to-br from-violet-600 to-pink-500 text-white">
        <div className="max-w-md mx-auto px-4 py-8">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-violet-100 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
          </button>
          <h1 className="text-2xl" style={{ fontWeight: 700 }}>Profile</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Account</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <Input value={user.name} readOnly className="pl-9 bg-gray-50" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <Input value={user.email} readOnly className="pl-9 bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />Logout
        </Button>
      </div>
    </div>
  );
}
