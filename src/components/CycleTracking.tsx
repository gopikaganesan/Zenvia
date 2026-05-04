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
  Loader2,
  Shield,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
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
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
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
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(getDateKey(new Date()));

  // Log form
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [flow, setFlow] = useState<"light" | "medium" | "heavy">("medium");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  useEffect(() => {
    const local = loadEntries();
    setEntries(local);
    setIsLoadingEntries(false);
  }, []);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

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

    if (editingEntryId) {
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

    setStartDate("");
    setEndDate("");
    setShowForm(false);
    setEditingEntryId(null);
  };

  const deleteEntry = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleDeleteAll = () => {
    localStorage.removeItem(ENTRIES_KEY);
    setEntries([]);
    setShowDeleteAllDialog(false);
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
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white py-3">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-pink-100 hover:text-white">
                  <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
                </button>
                <h1 className="text-2xl" style={{ fontWeight: 700 }}>Cycle Tracking</h1>
              </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <CycleOnboarding onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white py-3">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-pink-100 hover:text-white">
                <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
              </button>
              <Droplet className="w-5 h-5" />
              <h1 className="text-2xl" style={{ fontWeight: 700 }}>Cycle Tracking</h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-3 py-1 gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Privacy Protected
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setShowDeleteAllDialog(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Local Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete all dialog */}
      {showDeleteAllDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2 text-gray-900">Clear All Cycle Data</h2>
            <p className="text-sm text-gray-700 mb-6">Are you sure? This will permanently remove all cycle data from this device. It cannot be recovered.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteAll}>
                Yes, Delete Everything
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 py-6">
        <div className="p-4 bg-violet-50 rounded-xl border border-violet-100 flex items-start gap-4">
          <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-violet-900 mb-1">Local-Only Privacy</h3>
            <p className="text-xs text-violet-700 leading-relaxed">
              Your menstrual cycle data is stored <strong>only on this device</strong>. Zenvia does not upload this information to any server or cloud, ensuring maximum privacy for your health records.
            </p>
          </div>
        </div>

        {/* Phase summary strip */}
        <Card className="border-pink-200">
          <CardContent className="py-3">
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
        <Card className="max-w-lg mx-auto w-full mb-16">
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
            {isLoadingEntries && (
              <div className="flex items-center gap-2 py-4 justify-center text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-medium">Loading local history...</span>
              </div>
            )}

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
            <div className="mt-4 pt-3 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                <div className="flex items-start gap-2 rounded-lg border bg-white/70 px-3 py-2">
                  <span className="inline-block w-4 h-4 rounded-full bg-pink-500 border-2 border-pink-600 shadow-sm mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-gray-700 text-xs">Logged</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Your recorded period dates.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border bg-white/70 px-3 py-2">
                  <span className="inline-block w-4 h-4 rounded-full bg-pink-200 border-2 border-pink-400 shadow-sm mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-gray-700 text-xs">Predicted</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Estimated future period.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border bg-white/70 px-3 py-2">
                  <span className="inline-block w-4 h-4 rounded-full bg-violet-200 border-2 border-violet-400 shadow-sm mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-gray-700 text-xs">Fertile</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Potential conception days.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border bg-white/70 px-3 py-2">
                  <span className="inline-block w-4 h-4 rounded-full bg-rose-300 border-2 border-rose-500 shadow-sm mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-gray-700 text-xs">Ovulation</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Expected ovulation day.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Log button + form */}
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="w-full bg-pink-600 hover:bg-pink-700 mb-10 shadow-lg">
            <Plus className="w-4 h-4 mr-2" />Log Period
          </Button>
        ) : (
          <Card className="border-pink-200 mb-10">
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
              <CardTitle className="text-base">Cycle History</CardTitle>
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

        <div className="text-center space-y-2 mt-8">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Privacy by Design</p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Your data stays in your browser's local storage. No health data is transmitted to Zenvia servers.
          </p>
        </div>
      </div>
    </div>
  );
}
