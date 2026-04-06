import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Plus,
  Check,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { CycleOnboarding } from "./CycleOnboarding";
import {
  createCycleEntry,
  updateCycleEntry,
  deleteCycleEntry,
  listCycleEntries,
  type CycleEntry as ApiCycleEntry,
} from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

// ─── Local storage helpers ───────────────────────────────────
const ONBOARDING_KEY = "zenvia_cycle_onboarded";
const ENTRIES_KEY = "zenvia_cycle_entries";

type LocalEntry = {
  id: string;
  periodStartDate: string;
  periodEndDate: string;
  flowLevel: "light" | "medium" | "heavy";
  createdAt: string;
};

function loadEntries(): LocalEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: LocalEntry[]) {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch {}
}

// ─── Date helpers ────────────────────────────────────────────
function getDateKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

type Phase = "period" | "follicular" | "ovulation" | "luteal";

function phaseOf(dayInCycle: number): Phase {
  if (dayInCycle <= 5) return "period";
  if (dayInCycle <= 13) return "follicular";
  if (dayInCycle <= 16) return "ovulation";
  return "luteal";
}

const phaseLabel: Record<Phase, string> = {
  period: "Period",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
};

const phaseDot: Record<Phase, string> = {
  period: "bg-pink-500",
  follicular: "bg-violet-500",
  ovulation: "bg-rose-400",
  luteal: "bg-amber-400",
};

const phaseRing: Record<Phase, string> = {
  period: "ring-pink-400",
  follicular: "ring-violet-400",
  ovulation: "ring-rose-300",
  luteal: "ring-amber-300",
};

const CYCLE_LEN = 28;

// ─── Component ───────────────────────────────────────────────
export function CycleTracking() {
  const navigate = useNavigate();

  const [isOnboarded, setIsOnboarded] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [storageMode, setStorageMode] = useState<"local" | "server">("local");
  const [syncMessage, setSyncMessage] = useState("");
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(getDateKey(new Date()));

  // Log form
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [flow, setFlow] = useState<"light" | "medium" | "heavy">("medium");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const toLocalEntry = (entry: ApiCycleEntry): LocalEntry => ({
    id: entry._id,
    periodStartDate: entry.periodStartDate,
    periodEndDate: entry.periodEndDate,
    flowLevel: entry.flowLevel,
    createdAt: entry.createdAt,
  });

  const loadCycleEntries = useCallback(async () => {
    const local = loadEntries();

    if (!isAuthenticated()) {
      setStorageMode("local");
      setSyncMessage("");
      setEntries(local);
      setIsLoadingEntries(false);
      return;
    }

    setIsLoadingEntries(true);
    try {
      const response = await listCycleEntries();
      setEntries(response.data.map(toLocalEntry));
      setStorageMode("server");
      setSyncMessage("");
    } catch {
      setEntries(local);
      setStorageMode("local");
      setSyncMessage("Server sync unavailable. Using local device storage.");
    } finally {
      setIsLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    loadCycleEntries();
  }, [loadCycleEntries]);

  useEffect(() => {
    if (storageMode === "local") {
      saveEntries(entries);
    }
  }, [entries, storageMode]);

  const handleOnboardingComplete = () => {
    try { localStorage.setItem(ONBOARDING_KEY, "true"); } catch {}
    setIsOnboarded(true);
  };

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          b.periodStartDate.localeCompare(a.periodStartDate) || b.createdAt.localeCompare(a.createdAt),
      ),
    [entries],
  );

  // Logged day keys
  const loggedDays = useMemo(() => {
    const s = new Set<string>();
    sortedEntries.forEach((e) => {
      let cur = new Date(e.periodStartDate + "T00:00:00");
      const end = new Date(e.periodEndDate + "T00:00:00");
      while (cur <= end) {
        s.add(getDateKey(cur));
        cur = addDays(cur, 1);
      }
    });
    return s;
  }, [sortedEntries]);

  // Anchor for predictions
  const anchor =
    sortedEntries.length > 0
      ? new Date(sortedEntries[0].periodStartDate + "T00:00:00")
      : new Date();

  // Predicted sets
  const predicted = useMemo(() => {
    const period = new Set<string>();
    const fertile = new Set<string>();
    const ovulation = new Set<string>();
    for (let ci = -2; ci <= 3; ci++) {
      const cycleStart = addDays(anchor, ci * CYCLE_LEN);
      for (let d = 0; d < 5; d++) period.add(getDateKey(addDays(cycleStart, d)));
      for (let d = 10; d <= 15; d++) fertile.add(getDateKey(addDays(cycleStart, d)));
      ovulation.add(getDateKey(addDays(cycleStart, 13)));
    }
    return { period, fertile, ovulation };
  }, [anchor]);

  // Selected day info
  const selDate = new Date(selectedDate + "T00:00:00");
  const diffDays = Math.floor((selDate.getTime() - anchor.getTime()) / 86400000);
  const cycleDay = ((diffDays % CYCLE_LEN) + CYCLE_LEN) % CYCLE_LEN + 1;
  const phase = phaseOf(cycleDay);

  // Calendar grid
  const monthStart = startOfMonth(viewMonth);
  const startDay = monthStart.getDay(); // 0=Sun
  const calendarCells = useMemo(() => {
    return Array.from({ length: 42 }).map((_, i) => {
      const cellDate = addDays(monthStart, i - startDay);
      return {
        key: getDateKey(cellDate),
        day: cellDate.getDate(),
        inCurrentMonth: cellDate.getMonth() === viewMonth.getMonth(),
      };
    });
  }, [monthStart, startDay, viewMonth]);

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  const handleSave = async () => {
    if (!startDate || !endDate) { setError("Both dates required"); return; }
    if (new Date(endDate) < new Date(startDate)) { setError("End must be after start"); return; }
    setError("");

    try {
      if (editingEntryId) {
        if (storageMode === "server" && isAuthenticated()) {
          const response = await updateCycleEntry(editingEntryId, {
            periodStartDate: startDate,
            periodEndDate: endDate,
            flowLevel: flow,
          });
          setEntries((prev) =>
            prev.map((entry) => (entry.id === editingEntryId ? toLocalEntry(response.data) : entry)),
          );
        } else {
          setEntries((prev) =>
            prev.map((entry) =>
              entry.id === editingEntryId
                ? {
                    ...entry,
                    periodStartDate: startDate,
                    periodEndDate: endDate,
                    flowLevel: flow,
                  }
                : entry,
            ),
          );
        }
      } else {
        if (storageMode === "server" && isAuthenticated()) {
          const response = await createCycleEntry({
            periodStartDate: startDate,
            periodEndDate: endDate,
            flowLevel: flow,
          });
          setEntries((prev) => [toLocalEntry(response.data), ...prev]);
        } else {
          const entry: LocalEntry = {
            id: Date.now().toString(),
            periodStartDate: startDate,
            periodEndDate: endDate,
            flowLevel: flow,
            createdAt: new Date().toISOString(),
          };
          setEntries((prev) => [entry, ...prev]);
        }
      }

      setStartDate("");
      setEndDate("");
      setShowForm(false);
      setEditingEntryId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save entry");
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      if (storageMode === "server" && isAuthenticated()) {
        await deleteCycleEntry(id);
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Could not delete entry");
    }
  };

  const editEntry = (entry: LocalEntry) => {
    setStartDate(entry.periodStartDate);
    setEndDate(entry.periodEndDate);
    setFlow(entry.flowLevel);
    setEditingEntryId(entry.id);
    setShowForm(true);
  };

  if (!isOnboarded) {
    return (
      <div className="min-h-screen pb-12">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-pink-100 hover:text-white">
                  <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
                </button>
                <h1 className="text-2xl" style={{ fontWeight: 700 }}>Cycle Tracking</h1>
              </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <CycleOnboarding onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-pink-100 hover:text-white">
                <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
              </button>
              <Droplet className="w-5 h-5" />
              <h1 className="text-2xl" style={{ fontWeight: 700 }}>Cycle Tracking</h1>
            </div>
            <Badge className="bg-white/20 text-white border-0">
              {storageMode === "server" ? "Synced" : "Local mode"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-7">
        {/* Phase summary strip */}
        <Card className="border-pink-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Selected</p>
                <p className="text-sm" style={{ fontWeight: 600 }}>{selDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${phaseDot[phase]}`} />
                <span className="text-sm" style={{ fontWeight: 600 }}>Day {cycleDay} — {phaseLabel[phase]}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="max-w-lg mx-auto w-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
              <CardTitle className="text-base">
                {viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingEntries && <p className="text-xs text-gray-500 mb-2">Loading cycle history...</p>}
            {syncMessage && <p className="text-xs text-amber-600 mb-2">{syncMessage}</p>}

            {/* Weekday headers */}
            <div className="grid text-center mb-1" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <span key={d} className="text-xs text-gray-400 py-1">{d}</span>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
              {calendarCells.map((cell) => {
                const key = cell.key;
                const isSelected = key === selectedDate;
                const isToday = key === getDateKey(new Date());
                const isLogged = loggedDays.has(key);
                const isPredPeriod = predicted.period.has(key);
                const isFertile = predicted.fertile.has(key);
                const isOvulation = predicted.ovulation.has(key);

                let bg = "";
                let ring = "";
                if (isLogged) bg = "bg-pink-500 text-white";
                else if (isOvulation) bg = "bg-rose-200 text-rose-800";
                else if (isFertile) bg = "bg-violet-100 text-violet-700";
                else if (isPredPeriod) bg = "bg-pink-100 text-pink-700";

                if (isSelected) ring = `ring-2 ${phaseRing[phase]}`;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(key)}
                    className={`relative w-full aspect-square min-h-7 md:min-h-8 flex items-center justify-center rounded-full text-[11px] md:text-xs transition-all ${bg} ${ring} ${
                      !bg && !isSelected ? "hover:bg-gray-100" : ""
                    } ${
                      !cell.inCurrentMonth ? "text-gray-300" : ""
                    }`}
                  >
                    {cell.day}
                    {isToday && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-violet-600" />}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500" />Logged</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-200" />Predicted</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-200" />Fertile</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-300" />Ovulation</span>
            </div>
          </CardContent>
        </Card>

        {/* Log button + form */}
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="w-full bg-pink-600 hover:bg-pink-700">
            <Plus className="w-4 h-4 mr-2" />Log Period
          </Button>
        ) : (
          <Card className="border-pink-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-pink-600" />{editingEntryId ? "Edit Period" : "Log Period"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Flow</label>
                <div className="flex gap-2">
                  {(["light", "medium", "heavy"] as const).map((l) => (
                    <Button key={l} type="button" size="sm" variant={flow === l ? "default" : "outline"}
                      className={flow === l ? "bg-pink-600 hover:bg-pink-700" : ""}
                      onClick={() => setFlow(l)}
                    >
                      {flow === l && <Check className="w-3 h-3 mr-1" />}{l}
                    </Button>
                  ))}
                </div>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1 bg-pink-600 hover:bg-pink-700">
                  {editingEntryId ? "Update" : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEntryId(null);
                    setStartDate("");
                    setEndDate("");
                    setFlow("medium");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent entries */}
        {entries.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Entries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedEntries.slice(0, 8).map((e) => (
                <div key={e.id} className="flex items-center justify-between border rounded-lg px-3 py-2 gap-2">
                  <div>
                    <p className="text-sm" style={{ fontWeight: 500 }}>
                      {new Date(e.periodStartDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {" — "}
                      {new Date(e.periodEndDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-xs text-gray-500">Flow: {e.flowLevel}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => editEntry(e)} className="text-gray-400 hover:text-violet-600">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteEntry(e.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-center text-gray-400">
          {storageMode === "server"
            ? "Cycle data is synced to your account so it is available across devices."
            : "Cycle data is currently stored only on this device."}
        </p>
      </div>
    </div>
  );
}
