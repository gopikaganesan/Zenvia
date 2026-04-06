import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Mail, User, LogOut, Phone, MapPin, Shield, Camera, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { UserAvatar } from "./UserAvatar";
import { CropImageDialog } from "./CropImageDialog";
import {
  clearAuthSession,
  getStoredUser,
  isAuthenticated,
  updateStoredUser,
  type AuthUser,
} from "@/lib/auth";
import { getCurrentUser, logoutUser, updateCurrentUser } from "@/lib/api";

type ProfileForm = {
  name: string;
  email: string;
  avatarUrl: string;
  phone: string;
  city: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bio: string;
};

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(isAuthenticated());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageForCrop, setImageForCrop] = useState("");
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    avatarUrl: "",
    phone: "",
    city: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    bio: "",
  });

  useEffect(() => {
    if (!isAuthenticated()) { setLoading(false); return; }
    getCurrentUser()
      .then((r) => {
        setUser({ id: r.data._id, name: r.data.name, email: r.data.email, avatarUrl: r.data.avatarUrl });
        setForm({
          name: r.data.name || "",
          email: r.data.email || "",
          avatarUrl: r.data.avatarUrl || "",
          phone: r.data.phone || "",
          city: r.data.city || "",
          emergencyContactName: r.data.emergencyContactName || "",
          emergencyContactPhone: r.data.emergencyContactPhone || "",
          bio: r.data.bio || "",
        });
      })
      .catch(() => { clearAuthSession(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const updateForm = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess("");
  };

  const handleAvatarUpload: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      setImageForCrop(value);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage: string) => {
    updateForm("avatarUrl", croppedImage);
    setUser((prev) => (prev ? { ...prev, avatarUrl: croppedImage } : prev));
    updateStoredUser({ avatarUrl: croppedImage });
    setSuccess("Photo updated. Save profile to sync it to server.");
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await updateCurrentUser({
        name: form.name.trim(),
        avatarUrl: form.avatarUrl,
        phone: form.phone.trim(),
        city: form.city.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
        bio: form.bio.trim(),
      });

      setUser({
        id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        avatarUrl: response.data.avatarUrl,
      });
      updateStoredUser({ name: response.data.name, avatarUrl: response.data.avatarUrl });
      setSuccess("Profile updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="max-w-2xl mx-auto space-y-4">
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
      <div className="bg-gradient-to-br from-violet-600 to-pink-500 text-white mb-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-violet-100 hover:text-white">
              <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
            </button>
            <h1 className="text-2xl" style={{ fontWeight: 700 }}>Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 space-y-8">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{success}</p>}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <UserAvatar
                name={form.name || user.name}
                imageUrl={form.avatarUrl}
                seed={user.id}
                className="w-16 h-16 border-2 border-violet-200 flex-shrink-0"
              />
              <label className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-300 text-sm font-medium cursor-pointer hover:bg-violet-50 transition-colors h-11 bg-white">
                <Camera className="w-4 h-4 " />
                Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="pl-10 bg-white h-10" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input value={form.email} readOnly className="pl-10 bg-gray-50 h-10" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className="pl-10 bg-white h-10" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">City / Locality</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input value={form.city} onChange={(e) => updateForm("city", e.target.value)} className="pl-10 bg-white h-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">Emergency Contact Name</label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.emergencyContactName}
                    onChange={(e) => updateForm("emergencyContactName", e.target.value)}
                    className="pl-10 bg-white h-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">Emergency Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.emergencyContactPhone}
                    onChange={(e) => updateForm("emergencyContactPhone", e.target.value)}
                    className="pl-10 bg-white h-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">About You</label>
              <Textarea
                value={form.bio}
                onChange={(e) => updateForm("bio", e.target.value)}
                className="min-h-[100px] resize-none text-sm"
                placeholder="Add additional information for better support in emergency situations..."
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700">
              <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50 mt-6" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />Logout
        </Button>

        <CropImageDialog
          open={cropDialogOpen}
          imageUrl={imageForCrop}
          onCropComplete={handleCropComplete}
          onOpenChange={setCropDialogOpen}
          aspectRatio={1}
        />
      </div>
    </div>
  );
}
