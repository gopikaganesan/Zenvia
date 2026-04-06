import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Navigation,
  Hospital,
  Shield,
  Search,
  Pill,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { getLocalityEmergencyDetails, type LocalityEmergencyDetails } from "@/lib/emergency";

// ─── Types ──────────────────────────────────────────
type Place = {
  id: number;
  name: string;
  type: string;
  lat: number;
  lon: number;
  distance?: string;
  phone?: string;
  hours?: string;
  address?: string;
  emergency?: boolean;
  website?: string;
};

// ─── Overpass helpers ───────────────────────────────
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function buildOverpassQuery(lat: number, lon: number, radiusM: number, tags: string) {
  return `[out:json][timeout:15];(${tags.split("|").map(
    (t) => `node${t}(around:${radiusM},${lat},${lon});way${t}(around:${radiusM},${lat},${lon});`
  ).join("")});out center body;`;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parsePlaces(data: any, userLat: number, userLon: number): Place[] {
  if (!data?.elements) return [];
  return data.elements
    .map((el: any) => {
      const tags = el.tags || {};
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!lat || !lon || !tags.name) return null;
      const dist = haversineKm(userLat, userLon, lat, lon);
      return {
        id: el.id,
        name: tags.name,
        type: tags.amenity || tags.healthcare || tags.shop || "place",
        lat,
        lon,
        distance: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`,
        phone: tags.phone || tags["contact:phone"],
        hours: tags.opening_hours,
        address: [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"]].filter(Boolean).join(", "),
        emergency: tags.emergency === "yes",
        website: tags.website || tags["contact:website"],
      } as Place;
    })
    .filter(Boolean)
    .sort((a: Place, b: Place) => parseFloat(a.distance || "999") - parseFloat(b.distance || "999"));
}

async function fetchPlaces(lat: number, lon: number, tags: string): Promise<Place[]> {
  const query = buildOverpassQuery(lat, lon, 5000, tags);

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const body = new URLSearchParams({ data: query }).toString();
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
        },
        body,
      });
      if (!res.ok) {
        continue;
      }
      const json = await res.json();
      return parsePlaces(json, lat, lon);
    } catch {
      continue;
    }
  }

  throw new Error("Overpass API request failed");
}

// ─── Component ──────────────────────────────────────
export function NearbyServices() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState("hospitals");
  const [hospitals, setHospitals] = useState<Place[]>([]);
  const [safeSpaces, setSafeSpaces] = useState<Place[]>([]);
  const [pharmacies, setPharmacies] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("Detecting location…");
  const [emergencyDetails, setEmergencyDetails] = useState<LocalityEmergencyDetails | null>(null);

  const loadData = useCallback(
    async (lat: number, lon: number) => {
      setLoading(true);
      setError("");
      try {
        const [h, s, p] = await Promise.all([
          fetchPlaces(lat, lon, '[amenity=hospital]|[amenity=clinic]|[amenity=doctors]|[healthcare=centre]'),
          fetchPlaces(lat, lon, '[amenity=social_facility]|[amenity=community_centre]|[social_facility=shelter]'),
          fetchPlaces(lat, lon, '[amenity=pharmacy]|[shop=chemist]'),
        ]);
        setHospitals(h);
        setSafeSpaces(s);
        setPharmacies(p);
      } catch {
        setError("Could not fetch nearby services. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    setLocationLabel("Detecting location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setLocation(coords);
        setLocationLabel(`${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`);
        loadData(coords.lat, coords.lon);
        getLocalityEmergencyDetails(coords.lat, coords.lon).then(setEmergencyDetails);
      },
      () => {
        setError("Location access denied. Please enable location permissions.");
        setLocationLabel("Location unavailable");
      },
    );
  }, [loadData]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const filtered = (list: Place[]) =>
    searchQuery.trim()
      ? list.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : list;

  const openDirections = (lat: number, lon: number) => {
    window.open(`https://www.openstreetmap.org/directions?from=&to=${lat}%2C${lon}`, "_blank");
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-blue-100 hover:text-white">
              <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
            </button>
            <MapPin className="w-5 h-5" />
            <div>
              <h1 className="text-2xl" style={{ fontWeight: 700 }}>Nearby Services</h1>
              <p className="text-blue-100 text-sm">Powered by OpenStreetMap</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-7">
        {/* Search + Location */}
        <Card className="border-blue-200 bg-blue-50/50 -mt-4 relative z-10 shadow">
          <CardContent className="pt-5 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Filter services…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11"
                />
              </div>
              <Button onClick={requestLocation} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                <Navigation className="w-4 h-4 mr-1" />Refresh
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="w-3 h-3 text-blue-500" />
              <span>{locationLabel}</span>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hospitals"><Hospital className="w-4 h-4 mr-1" />Hospitals</TabsTrigger>
            <TabsTrigger value="safe-spaces"><Shield className="w-4 h-4 mr-1" />Safe Spaces</TabsTrigger>
            <TabsTrigger value="pharmacies"><Pill className="w-4 h-4 mr-1" />Pharmacies</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Searching nearby…</span>
            </div>
          ) : (
            <>
              <TabsContent value="hospitals">
                <PlaceList places={filtered(hospitals)} onDirections={openDirections} emptyLabel="No hospitals or clinics found nearby." accentColor="blue" />
              </TabsContent>
              <TabsContent value="safe-spaces">
                <PlaceList places={filtered(safeSpaces)} onDirections={openDirections} emptyLabel="No safe spaces or shelters found nearby." accentColor="violet" />
              </TabsContent>
              <TabsContent value="pharmacies">
                <PlaceList places={filtered(pharmacies)} onDirections={openDirections} emptyLabel="No pharmacies found nearby." accentColor="emerald" />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Emergency Hotlines */}
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2 text-base">
              <Phone className="w-4 h-4" />Emergency Hotlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-2">
              {[
                {
                  label: "Emergency",
                  sub: `Police / Fire / Ambulance${emergencyDetails ? ` (${emergencyDetails.localityLabel})` : ""}`,
                  num: emergencyDetails?.emergencyNumber || "112",
                  color: "bg-red-600",
                },
                {
                  label: "Women's Helpline",
                  sub: "Domestic Violence",
                  num: emergencyDetails?.womensHelpline || "1-800-799-7233",
                  color: "bg-purple-600",
                },
                {
                  label: "Mental Health",
                  sub: "Crisis Line",
                  num: emergencyDetails?.mentalHealthLine || "988",
                  color: "bg-blue-600",
                },
              ].map((h) => (
                <div key={h.num} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                  <div>
                    <span className="text-sm" style={{ fontWeight: 600 }}>{h.label}</span>
                    <p className="text-xs text-gray-500">{h.sub}</p>
                  </div>
                  <Button size="sm" className={`${h.color} text-white`} asChild>
                    <a href={`tel:${h.num.replace(/\s+/g, "")}`}>
                      <Phone className="w-3 h-3 mr-1" />{h.num.length <= 4 ? h.num : "Call"}
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attribution */}
        <p className="text-center text-xs text-gray-400">
          Data from{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
            OpenStreetMap
          </a>{" "}
          contributors via Overpass API.
        </p>
      </div>
    </div>
  );
}

// ─── Place list sub-component ────────────────────────
function PlaceList({
  places,
  onDirections,
  emptyLabel,
  accentColor,
}: {
  places: Place[];
  onDirections: (lat: number, lon: number) => void;
  emptyLabel: string;
  accentColor: string;
}) {
  if (places.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">{emptyLabel}</p>;
  }

  const borderClass = accentColor === "blue" ? "border-l-blue-500" : accentColor === "violet" ? "border-l-violet-500" : "border-l-emerald-500";
  const badgeClass = accentColor === "blue" ? "text-blue-600" : accentColor === "violet" ? "text-violet-600" : "text-emerald-600";

  return (
    <div className="space-y-3">
      {places.map((p) => (
        <Card key={p.id} className={`border-l-4 ${borderClass} hover:shadow-sm transition-shadow`}>
          <CardContent className="py-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 600 }}>{p.name}</p>
                {p.address && <p className="text-xs text-gray-500 truncate">{p.address}</p>}
              </div>
              <div className="flex-shrink-0 text-right">
                <span className={`text-sm ${badgeClass}`} style={{ fontWeight: 600 }}>{p.distance}</span>
                {p.emergency && <Badge className="bg-red-600 ml-2 text-xs">ER</Badge>}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {p.hours && (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.hours}</span>
              )}
              {p.phone && (
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onDirections(p.lat, p.lon)}>
                <Navigation className="w-3 h-3 mr-1" />Directions
              </Button>
              {p.phone && (
                <Button size="sm" className={`flex-1 ${accentColor === "blue" ? "bg-blue-600 hover:bg-blue-700" : accentColor === "violet" ? "bg-violet-600 hover:bg-violet-700" : "bg-emerald-600 hover:bg-emerald-700"}`} asChild>
                  <a href={`tel:${p.phone}`}><Phone className="w-3 h-3 mr-1" />Call</a>
                </Button>
              )}
              {p.website && (
                <Button size="sm" variant="ghost" asChild>
                  <a href={p.website} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3" /></a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
