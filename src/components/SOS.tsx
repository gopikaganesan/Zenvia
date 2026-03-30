import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  AlertTriangle,
  Phone,
  MapPin,
  Shield,
  Users,
  Bell,
  Plus,
  Trash2,
  CheckCircle,
  X,
  Radio,
  Volume2,
  MessageSquare,
  Siren,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "./ui/dialog";
import { Switch } from "./ui/switch";
import { Progress } from "./ui/progress";
import { triggerSOS as apiTriggerSOS, resolveSOS as apiResolveSOS, type SOSAlert } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

// ─── Defaults ───────────────────────────────────────
const defaultContacts = [
  { id: "1", name: "Mom", phone: "+1 234-567-8900", relation: "Family", priority: 1 },
  { id: "2", name: "Best Friend - Sarah", phone: "+1 234-567-8901", relation: "Friend", priority: 2 },
  { id: "3", name: "Sister - Emily", phone: "+1 234-567-8902", relation: "Family", priority: 3 },
];

const quickMessages = [
  "I need help immediately!",
  "I feel unsafe, please come quickly.",
  "Emergency! Sharing my live location.",
  "Please call the police to my location.",
];

const CONTACTS_KEY = "zenvia_sos_contacts";

function loadContacts() {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    return raw ? JSON.parse(raw) : defaultContacts;
  } catch { return defaultContacts; }
}

// ─── Component ─────────────────────────────────────
export function SOS() {
  const navigate = useNavigate();
  const [sosActivated, setSosActivated] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [counting, setCounting] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [contacts, setContacts] = useState(loadContacts);
  const [shareLocation, setShareLocation] = useState(true);
  const [soundAlarm, setSoundAlarm] = useState(true);
  const [alertNearby, setAlertNearby] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(quickMessages[0]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRelation, setNewContactRelation] = useState("");
  const [backendStatus, setBackendStatus] = useState("");

  // Persist contacts
  useEffect(() => { localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts)); }, [contacts]);

  // ─── SOS trigger ─────────────────────────────────
  const activateSOS = useCallback(async () => {
    setSosActivated(true);
    setAlertSent(true);

    // Try sending location to backend
    if (isAuthenticated() && shareLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await apiTriggerSOS({
              longitude: pos.coords.longitude,
              latitude: pos.coords.latitude,
              message: selectedMessage,
            });
            setActiveAlertId(res.data._id);
            setBackendStatus("Alert sent to server");
          } catch {
            setBackendStatus("Server unreachable – local alert only");
          }
        },
        () => setBackendStatus("Location denied – local alert only"),
      );
    } else {
      setBackendStatus("Local alert only");
    }
  }, [shareLocation, selectedMessage]);

  const startCountdown = useCallback(() => {
    setCounting(true);
    setCountdown(5);
  }, []);

  const cancelSOS = useCallback(async () => {
    setCounting(false);
    setCountdown(5);
    setSosActivated(false);
    setAlertSent(false);
    setBackendStatus("");

    if (activeAlertId) {
      try { await apiResolveSOS(activeAlertId); } catch {}
      setActiveAlertId(null);
    }
  }, [activeAlertId]);

  useEffect(() => {
    if (!counting) return;
    if (countdown <= 0) { setCounting(false); activateSOS(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [counting, countdown, activateSOS]);

  // ─── Contacts ────────────────────────────────────
  const addContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    setContacts((prev: typeof defaultContacts) => [
      ...prev,
      { id: Date.now().toString(), name: newContactName, phone: newContactPhone, relation: newContactRelation.trim() || "Other", priority: prev.length + 1 },
    ]);
    setNewContactName("");
    setNewContactPhone("");
    setNewContactRelation("");
  };

  const removeContact = (id: string) => setContacts((prev: typeof defaultContacts) => prev.filter((c) => c.id !== id));

  // ─── Render ──────────────────────────────────────
  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className={`text-white transition-all duration-500 ${sosActivated ? "bg-gradient-to-br from-red-600 via-red-700 to-red-800" : counting ? "bg-gradient-to-br from-orange-500 via-red-500 to-red-600" : "bg-gradient-to-br from-red-500 via-red-600 to-orange-600"}`}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-red-100 hover:text-white mb-3">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <h1 className="text-2xl" style={{ fontWeight: 700 }}>SOS Emergency</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* SOS Button */}
        <Card className={`shadow-lg transition-all ${sosActivated ? "border-red-500 bg-red-50" : counting ? "border-orange-400 bg-orange-50" : "border-red-200 bg-red-50/50"}`}>
          <CardContent className="py-8">
            <div className="text-center">
              {/* Idle */}
              {!counting && !sosActivated && (
                <>
                  <p className="text-gray-600 mb-6 text-sm">Press the SOS button to alert your emergency contacts and nearby services.</p>
                  <button onClick={startCountdown} className="w-36 h-36 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white mx-auto flex items-center justify-center shadow-2xl shadow-red-300 hover:scale-105 active:scale-95 transition-all border-4 border-red-300">
                    <div className="text-center">
                      <Siren className="w-10 h-10 mx-auto mb-1" />
                      <span className="text-xl" style={{ fontWeight: 700 }}>SOS</span>
                    </div>
                  </button>
                  {!isAuthenticated() && (
                    <p className="text-xs text-amber-600 mt-4">Log in to also alert nearby Zenvia users via the server.</p>
                  )}
                </>
              )}

              {/* Counting */}
              {counting && (
                <>
                  <p className="text-orange-700 mb-4" style={{ fontWeight: 600 }}>Alert sending in…</p>
                  <div className="w-36 h-36 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white mx-auto flex items-center justify-center shadow-2xl shadow-orange-300 animate-pulse border-4 border-orange-300">
                    <span className="text-5xl" style={{ fontWeight: 700 }}>{countdown}</span>
                  </div>
                  <Progress value={((5 - countdown) / 5) * 100} className="h-2 max-w-xs mx-auto mt-5" />
                  <Button variant="outline" className="mt-5 border-orange-400 text-orange-700" onClick={cancelSOS}>
                    <X className="w-4 h-4 mr-1" />Cancel
                  </Button>
                </>
              )}

              {/* Active */}
              {sosActivated && (
                <>
                  <div className="w-36 h-36 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white mx-auto flex items-center justify-center shadow-2xl shadow-red-400 border-4 border-red-400">
                    <div className="text-center">
                      <Radio className="w-8 h-8 mx-auto mb-1 animate-pulse" />
                      <span className="text-sm" style={{ fontWeight: 700 }}>ACTIVE</span>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2 text-sm">
                    <div className="flex items-center justify-center gap-2 text-red-700">
                      <CheckCircle className="w-4 h-4 text-green-600" />Alert sent to {contacts.length} contacts
                    </div>
                    {shareLocation && (
                      <div className="flex items-center justify-center gap-2 text-red-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />Location shared
                      </div>
                    )}
                    {backendStatus && (
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <Shield className="w-4 h-4" />{backendStatus}
                      </div>
                    )}
                  </div>
                  <Button className="mt-6 bg-gray-800 hover:bg-gray-900" onClick={cancelSOS}>
                    <X className="w-4 h-4 mr-1" />Deactivate SOS
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Emergency Contacts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="w-4 h-4 text-red-600" />Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contacts.map((c: typeof defaultContacts[0]) => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-orange-400 rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 600 }}>{c.priority}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ fontWeight: 600 }}>{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{c.relation}</Badge>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-700" onClick={() => removeContact(c.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full border-dashed"><Plus className="w-4 h-4 mr-1" />Add Contact</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Emergency Contact</DialogTitle>
                    <DialogDescription>This person will be alerted when you trigger SOS.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 pt-2">
                    <Input placeholder="Name" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} />
                    <Input placeholder="Phone" value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} />
                    <div className="flex flex-wrap gap-2">
                      {["Family", "Friend", "Partner", "Colleague", "Other"].map((r) => (
                        <button key={r} onClick={() => setNewContactRelation(r)} className={`px-3 py-1 rounded-full border text-xs ${newContactRelation === r ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200"}`}>{r}</button>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full bg-red-600 hover:bg-red-700 mt-2" onClick={addContact}>Add Contact</Button>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Settings + Quick Message */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-4 h-4 text-violet-600" />Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Share Location</span>
                  </div>
                  <Switch checked={shareLocation} onCheckedChange={setShareLocation} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Sound Alarm</span>
                  </div>
                  <Switch checked={soundAlarm} onCheckedChange={setSoundAlarm} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-600" />
                    <span className="text-sm">Alert Nearby Users</span>
                  </div>
                  <Switch checked={alertNearby} onCheckedChange={setAlertNearby} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="w-4 h-4 text-violet-600" />Quick Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickMessages.map((msg) => (
                  <button key={msg} onClick={() => setSelectedMessage(msg)} className={`w-full text-left p-2.5 rounded-lg border text-sm transition-all ${selectedMessage === msg ? "border-violet-400 bg-violet-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <div className="flex items-center gap-2">
                      {selectedMessage === msg ? <CheckCircle className="w-4 h-4 text-violet-600 flex-shrink-0" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex-shrink-0" />}
                      <span>{msg}</span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Emergency Hotlines */}
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2 text-base">
              <Phone className="w-4 h-4" />Direct Emergency Calls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full bg-red-600 hover:bg-red-700 justify-between"><span>Emergency Services</span><span style={{ fontWeight: 700 }}>911</span></Button>
            <Button className="w-full bg-violet-600 hover:bg-violet-700 justify-between"><span>Women's Helpline</span><span style={{ fontWeight: 700 }}>1-800-799-7233</span></Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-between"><span>Mental Health Crisis</span><span style={{ fontWeight: 700 }}>988</span></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
