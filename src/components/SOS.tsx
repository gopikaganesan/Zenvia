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
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "./ui/dialog";
import { Switch } from "./ui/switch";
import { Progress } from "./ui/progress";
import { triggerSOS, resolveSOS, getNearbyAlerts } from "@/lib/api";
import type { SOSAlert } from "@/lib/api";
import { getStoredUser, isAuthenticated } from "@/lib/auth";
import { getLocalityEmergencyDetails, type LocalityEmergencyDetails } from "@/lib/emergency";

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
  const currentUser = getStoredUser();
  const [myActiveAlerts, setMyActiveAlerts] = useState<SOSAlert[]>([]);
    const [loadingMyAlerts, setLoadingMyAlerts] = useState(false);
    const [myAlertsError, setMyAlertsError] = useState("");
    const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

    // Load user's own active SOS alerts
    const loadMyActiveAlerts = useCallback(async () => {
      if (!isAuthenticated() || !currentUser?.id) {
        setMyActiveAlerts([]);
        return;
      }
      setLoadingMyAlerts(true);
      setMyAlertsError("");
      try {
        // Fetch all nearby alerts with large radius, then filter by user
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
              const res = await getNearbyAlerts(pos.coords.longitude, pos.coords.latitude, 1000);
              setMyActiveAlerts(res.data.filter((a: SOSAlert) => a.active && a.user === currentUser.id));
            } catch {
              setMyAlertsError("Could not load your active SOS alerts");
            } finally {
              setLoadingMyAlerts(false);
            }
          }, () => {
            setMyAlertsError("Location access required to fetch your SOS alerts");
            setLoadingMyAlerts(false);
          });
        } else {
          setMyAlertsError("Geolocation not supported");
          setLoadingMyAlerts(false);
        }
      } catch {
        setMyAlertsError("Could not load your active SOS alerts");
        setLoadingMyAlerts(false);
      }
    }, [currentUser]);

    // My Active Alerts are NOT fetched automatically on mount anymore.
    // They will be fetched when the user clicks a manual refresh button.
    // However, if the user wants a one-time initial load, we can keep it but
    // since the user specifically asked for "manual fetch", I'll remove it.
    useEffect(() => {
      // loadMyActiveAlerts(); // Removed for manual fetch requirement
    }, [loadMyActiveAlerts]);

    const handleDeactivateSOS = async (id: string) => {
      setDeactivatingId(id);
      try {
        await resolveSOS(id);
        setMyActiveAlerts((prev) => prev.filter((a) => a._id !== id));
      } catch {
        // Optionally show error
      } finally {
        setDeactivatingId(null);
      }
    };
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
  const [deliveryVerified, setDeliveryVerified] = useState(false);
  const [emergencyDetails, setEmergencyDetails] = useState<LocalityEmergencyDetails | null>(null);
  const [activeTab, setActiveTab] = useState("trigger");
  const [nearbyAlerts, setNearbyAlerts] = useState<SOSAlert[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState("");
  const [nearbyFetchStatus, setNearbyFetchStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [nearbyLastRefreshedAt, setNearbyLastRefreshedAt] = useState<string>("");

  

  // Persist contacts
  useEffect(() => { localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts)); }, [contacts]);

  // ─── SOS trigger ─────────────────────────────────
  const activateSOS = useCallback(async () => {
    setSosActivated(true);
    setAlertSent(true);
    setDeliveryVerified(false);

    // Try sending location to backend
    if (isAuthenticated() && shareLocation && alertNearby && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await triggerSOS({
              longitude: pos.coords.longitude,
              latitude: pos.coords.latitude,
              message: selectedMessage,
            });
            setActiveAlertId(res.data._id);
            setBackendStatus("Alert sent to server. Verifying for testing...");

            try {
              const nearby = await getNearbyAlerts(pos.coords.longitude, pos.coords.latitude, 1);
              const exists = nearby.data.some((alert) => alert._id === res.data._id);
              setDeliveryVerified(exists);
              setBackendStatus(exists ? "Alert sent and verified on server" : "Alert sent but not visible in nearby feed yet");
            } catch {
              setBackendStatus("Alert sent to server (verification unavailable)");
            }

            getLocalityEmergencyDetails(pos.coords.latitude, pos.coords.longitude).then(setEmergencyDetails);
          } catch {
            setBackendStatus("Server unreachable – local alert only");
          }
        },
        () => setBackendStatus("Location denied – local alert only"),
      );
    } else {
      setBackendStatus("Local alert only");
    }
  }, [shareLocation, alertNearby, selectedMessage]);

  const loadNearbyAlerts = useCallback(() => {
    if (!isAuthenticated()) {
      setNearbyAlerts([]);
      setNearbyError("Log in to receive nearby SOS notifications.");
      setNearbyFetchStatus("error");
      return;
    }

    if (!navigator.geolocation) {
      setNearbyError("Geolocation not supported by your browser.");
      setNearbyFetchStatus("error");
      return;
    }

    setNearbyLoading(true);
    setNearbyError("");
    setNearbyFetchStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const response = await getNearbyAlerts(pos.coords.longitude, pos.coords.latitude, 10);
          const filtered = response.data
            .filter((alert) => alert.active && alert.user !== currentUser?.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNearbyAlerts(filtered);
          setNearbyFetchStatus("success");
          setNearbyLastRefreshedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        } catch {
          setNearbyError("Unable to load nearby SOS alerts right now.");
          setNearbyFetchStatus("error");
        } finally {
          setNearbyLoading(false);
        }
      },
      () => {
        setNearbyLoading(false);
        setNearbyError("Location access is needed to find nearby SOS notifications.");
        setNearbyFetchStatus("error");
      },
    );
  }, [currentUser?.id]);

  useEffect(() => {
    if (activeTab !== "nearby") return;
    // loadNearbyAlerts(); // Removed for manual fetch requirement
  }, [activeTab, loadNearbyAlerts]);

  const getAlertCoordinates = (alert: SOSAlert) => {
    const [longitude, latitude] = alert.location?.coordinates || [];
    if (longitude == null || latitude == null) return null;
    return { latitude, longitude };
  };

  const openAlertLocation = (alert: SOSAlert) => {
    const coords = getAlertCoordinates(alert);
    if (!coords) return;
    const query = `${coords.latitude},${coords.longitude}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  };

  const openAlertDirections = (alert: SOSAlert) => {
    const coords = getAlertCoordinates(alert);
    if (!coords) return;
    const destination = `${coords.latitude},${coords.longitude}`;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`, "_blank", "noopener,noreferrer");
  };

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
    setDeliveryVerified(false);

    if (activeAlertId) {
      try { await resolveSOS(activeAlertId); } catch {}
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
      <div className={`text-white mb-10 transition-all duration-500 ${sosActivated ? "bg-gradient-to-br from-red-600 via-red-700 to-red-800" : counting ? "bg-gradient-to-br from-orange-500 via-red-500 to-red-600" : "bg-gradient-to-br from-red-500 via-red-600 to-orange-600"}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-red-100 hover:text-white">
              <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
            </button>
            <AlertTriangle className="w-5 h-5" />
            <h1 className="text-2xl" style={{ fontWeight: 700 }}>SOS Emergency</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  {/* My Active SOS Alerts Section */}
                  <Card className="border-red-200 mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base text-red-700"><Siren className="w-4 h-4" />My Active SOS Alerts</CardTitle>
                    <CardDescription className="flex items-center justify-between">
                      <span>Deactivate any previously triggered SOS alerts here.</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loadMyActiveAlerts}
                        disabled={loadingMyAlerts}
                        className="h-7 border-red-200 text-red-700"
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${loadingMyAlerts ? "animate-spin" : ""}`} />
                        {loadingMyAlerts ? "Fetching..." : "Fetch Alerts"}
                      </Button>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMyAlerts && (
                      <div className="flex items-center gap-2 py-4 justify-center text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Fetching your active alerts...</span>
                      </div>
                    )}
                    {myAlertsError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">{myAlertsError}</p>}
                    {!loadingMyAlerts && !myAlertsError && myActiveAlerts.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed rounded-lg bg-gray-50/50">
                        <p className="text-xs text-gray-500">Click "Fetch Alerts" to see your active SOS requests.</p>
                      </div>
                    )}
                      <div className="space-y-3">
                        {myActiveAlerts.map((alert) => (
                          <div key={alert._id} className="flex items-center justify-between border rounded-lg p-3 bg-red-50">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-red-600 text-white">ACTIVE</Badge>
                                <span className="text-xs text-gray-700">{new Date(alert.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="text-sm text-gray-800">{alert.message}</div>
                            </div>
                            <Button
                              size="sm"
                              className="bg-gray-800 hover:bg-gray-900 text-white"
                              onClick={() => handleDeactivateSOS(alert._id)}
                              disabled={deactivatingId === alert._id}
                            >
                              {deactivatingId === alert._id ? "Deactivating..." : "Deactivate"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trigger"><Siren className="w-4 h-4 mr-1" />Trigger SOS</TabsTrigger>
            <TabsTrigger value="nearby"><Bell className="w-4 h-4 mr-1" />Nearby Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="trigger">
            {/* SOS Button */}
            <Card className={`shadow-lg transition-all mb-10 ${sosActivated ? "border-red-500 bg-red-50" : counting ? "border-orange-400 bg-orange-50" : "border-red-200 bg-red-50/50"}`}>
              <CardContent className="py-8">
                <div className="text-center">
                  {/* Idle */}
                  {!counting && !sosActivated && (
                    <>
                      <p className="text-gray-600 mb-6 text-sm">Press the SOS button to alert your emergency contacts and nearby services.</p>
                      <button onClick={startCountdown} className="w-42 h-42 py-6 px-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white mx-auto flex items-center justify-center shadow-2xl shadow-red-300 hover:scale-105 active:scale-95 transition-all border-4 border-red-300">
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
                      <div className="w-36 h-36 mb-4 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white mx-auto flex items-center justify-center shadow-2xl shadow-orange-300 animate-pulse border-4 border-orange-300">
                        <span className="text-5xl" style={{ fontWeight: 700 }}>{countdown}</span>
                      </div>
                      <Progress value={((5 - countdown) / 5) * 100} className="h-2 max-w-xs mx-auto mt-6 mb-6" />
                      <Button variant="outline" className="mt-5 border-orange-400 text-orange-700" onClick={cancelSOS}>
                        <X className="w-4 h-4 mr-1" />Cancel
                      </Button>
                    </>
                  )}

                  {/* Active */}
                  {sosActivated && (
                    <>
                      <div className="w-36 h-36 py-3 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white mx-auto flex items-center justify-center shadow-2xl shadow-red-400 border-4 border-red-400">
                        <div className="text-center">
                          <Radio className="w-8 h-8 mx-auto mb-1 animate-pulse" />
                          <span className="text-sm" style={{ fontWeight: 700 }}>ACTIVE</span>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
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
                        {deliveryVerified && (
                          <div className="flex items-center justify-center gap-2 text-green-700">
                            <CheckCircle className="w-4 h-4" />Server delivery check passed
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
          </TabsContent>

          <TabsContent value="nearby">
            <Card className="border-violet-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4 text-violet-600" />Nearby SOS Notifications
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadNearbyAlerts}
                    disabled={nearbyLoading}
                    className="border-violet-300 text-violet-700 hover:bg-violet-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${nearbyLoading ? "animate-spin" : ""}`} />
                    {nearbyLoading ? "Refreshing..." : "Manual Refresh"}
                  </Button>
                </div>
                <CardDescription>
                  Live feed of active SOS alerts around you from other users.
                </CardDescription>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                  <span className="rounded-full border px-2 py-0.5 bg-white">Status: {nearbyFetchStatus}</span>
                  <span className="rounded-full border px-2 py-0.5 bg-white">Alerts: {nearbyAlerts.length}</span>
                  <span className="rounded-full border px-2 py-0.5 bg-white">Last refresh: {nearbyLastRefreshedAt || "--"}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {nearbyError && <p className="text-xs text-red-600">{nearbyError}</p>}
                {!nearbyError && nearbyAlerts.length === 0 && (
                  <p className="text-sm text-gray-500">No nearby active SOS alerts right now.</p>
                )}
                {nearbyAlerts.map((alert) => (
                  <div key={alert._id} className="rounded-lg border p-3 bg-violet-50/40">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{alert.userName}</p>
                      <Badge className="bg-red-600 text-white">ACTIVE</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                    {getAlertCoordinates(alert) && (
                      <p className="text-xs text-gray-600 mt-1">
                        Location: {getAlertCoordinates(alert)?.latitude.toFixed(5)}, {getAlertCoordinates(alert)?.longitude.toFixed(5)}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => openAlertLocation(alert)}
                        disabled={!getAlertCoordinates(alert)}
                      >
                        <MapPin className="w-3.5 h-3.5 mr-1" />Open Location
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs bg-violet-600 hover:bg-violet-700"
                        onClick={() => openAlertDirections(alert)}
                        disabled={!getAlertCoordinates(alert)}
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1 rotate-135" />Directions
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Triggered {new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
        <Card className="bg-red-50 border-red-200 mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2 text-base">
              <Phone className="w-4 h-4" />Direct Emergency Calls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full bg-red-600 hover:bg-red-700 justify-between" asChild>
              <a href={`tel:${(emergencyDetails?.emergencyNumber || "112").replace(/\s+/g, "")}`}>
                <span>Emergency Services{emergencyDetails ? ` (${emergencyDetails.localityLabel})` : ""}</span>
                <span style={{ fontWeight: 700 }}>{emergencyDetails?.emergencyNumber || "112"}</span>
              </a>
            </Button>
            <Button className="w-full bg-violet-600 hover:bg-violet-700 justify-between" asChild>
              <a href={`tel:${(emergencyDetails?.womensHelpline || "1-800-799-7233").replace(/\s+/g, "")}`}>
                <span>Women's Helpline</span>
                <span style={{ fontWeight: 700 }}>{emergencyDetails?.womensHelpline || "1-800-799-7233"}</span>
              </a>
            </Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-between" asChild>
              <a href={`tel:${(emergencyDetails?.mentalHealthLine || "988").replace(/\s+/g, "")}`}>
                <span>Mental Health Crisis</span>
                <span style={{ fontWeight: 700 }}>{emergencyDetails?.mentalHealthLine || "988"}</span>
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
