import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Droplet,
  Calendar,
  Heart,
  Moon,
  Sun,
  Check,
  Info,
  Clock,
  Activity,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";

const cycleLengthOptions = [
  { value: 21, label: "21 days" },
  { value: 24, label: "24 days" },
  { value: 26, label: "26 days" },
  { value: 28, label: "28 days" },
  { value: 30, label: "30 days" },
  { value: 32, label: "32 days" },
  { value: 35, label: "35 days" },
];

const periodLengthOptions = [
  { value: 3, label: "3 days" },
  { value: 4, label: "4 days" },
  { value: 5, label: "5 days" },
  { value: 6, label: "6 days" },
  { value: 7, label: "7 days" },
  { value: 8, label: "8+ days" },
];

const flowOptions = [
  { value: "light", label: "Light", emoji: "💧", description: "Barely noticeable" },
  { value: "medium", label: "Medium", emoji: "💧💧", description: "Moderate flow" },
  { value: "heavy", label: "Heavy", emoji: "💧💧💧", description: "Quite heavy" },
  { value: "varies", label: "Varies", emoji: "🔄", description: "Changes each cycle" },
];

const symptomOptions = [
  { name: "Cramps", emoji: "💢" },
  { name: "Bloating", emoji: "🫧" },
  { name: "Mood Swings", emoji: "🎭" },
  { name: "Headaches", emoji: "🤕" },
  { name: "Fatigue", emoji: "😴" },
  { name: "Breast Tenderness", emoji: "💗" },
  { name: "Acne", emoji: "✨" },
  { name: "Backache", emoji: "🔙" },
  { name: "Cravings", emoji: "🍫" },
  { name: "Nausea", emoji: "🤢" },
];

const goalOptions = [
  { value: "track", label: "Track my period", icon: Calendar, color: "from-pink-500 to-rose-500" },
  { value: "fertility", label: "Monitor fertility", icon: Heart, color: "from-violet-500 to-purple-500" },
  { value: "health", label: "Understand my health", icon: Activity, color: "from-blue-500 to-cyan-500" },
  { value: "symptoms", label: "Manage symptoms", icon: Moon, color: "from-amber-500 to-orange-500" },
];

interface CycleOnboardingProps {
  onComplete: () => void;
}

export function CycleOnboarding({ onComplete }: CycleOnboardingProps) {
  const [step, setStep] = useState(0);
  const [lastPeriodDate, setLastPeriodDate] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [flowType, setFlowType] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isRegular, setIsRegular] = useState<string>("");

  const totalSteps = 7;
  const progressValue = ((step + 1) / totalSteps) * 100;

  const toggleSymptom = (name: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const toggleGoal = (value: string) => {
    setSelectedGoals((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // Welcome
      case 1: return lastPeriodDate !== "";
      case 2: return cycleLength > 0;
      case 3: return periodLength > 0;
      case 4: return flowType !== "";
      case 5: return isRegular !== "";
      case 6: return selectedGoals.length > 0;
      default: return true;
    }
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="w-full max-w-2xl mx-auto">
        {/* Progress Bar */}
        {step > 0 && (
          <div className="mb-8 px-4">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Step {step} of {totalSteps - 1}</span>
              <span>{Math.round(progressValue)}% complete</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        )}

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-pink-200">
              <Droplet className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
              Let's set up your cycle tracker
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-3">
              We'll ask you a few quick questions to personalize your experience and give you accurate predictions.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-pink-600 mb-10">
              <Clock className="w-4 h-4" />
              <span>Takes less than 2 minutes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
              {[
                { icon: Calendar, text: "Period predictions", color: "bg-pink-100 text-pink-600" },
                { icon: Heart, text: "Fertility insights", color: "bg-violet-100 text-violet-600" },
                { icon: Activity, text: "Health tracking", color: "bg-blue-100 text-blue-600" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 border">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{item.text}</span>
                  </div>
                );
              })}
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 px-10 shadow-lg shadow-pink-200"
              onClick={() => setStep(1)}
            >
              Get Started
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-xs text-gray-400 mt-6 max-w-sm mx-auto">
              Your data stays private and is only used to personalize your cycle predictions.
            </p>
          </div>
        )}

        {/* Step 1: Last Period Date */}
        {step === 1 && (
          <Card className="border-2 border-pink-100 shadow-lg mx-4">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                  When did your last period start?
                </h3>
                <p className="text-gray-500 text-sm">
                  This helps us calculate where you are in your cycle right now.
                </p>
              </div>

              <div className="max-w-sm mx-auto">
                <label className="text-sm text-gray-600 mb-2 block" style={{ fontWeight: 500 }}>
                  First day of your last period
                </label>
                <Input
                  type="date"
                  value={lastPeriodDate}
                  onChange={(e) => setLastPeriodDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="text-center text-lg h-14 border-2 border-pink-200 focus:border-pink-400"
                />
                <div className="flex items-start gap-2 mt-4 p-3 bg-pink-50 rounded-lg">
                  <Info className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-pink-700">
                    If you're not sure of the exact date, your best estimate works just fine. You can always update it later.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Cycle Length */}
        {step === 2 && (
          <Card className="border-2 border-pink-100 shadow-lg mx-4">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Moon className="w-8 h-8 text-violet-600" />
                </div>
                <h3 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                  How long is your typical cycle?
                </h3>
                <p className="text-gray-500 text-sm">
                  Count from the first day of one period to the first day of the next.
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {cycleLengthOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCycleLength(option.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        cycleLength === option.value
                          ? "border-violet-400 bg-violet-50 shadow-sm"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <span className="text-xl text-gray-900" style={{ fontWeight: 700 }}>
                        {option.value}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">days</p>
                    </button>
                  ))}
                  <button
                    onClick={() => setCycleLength(-1)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      cycleLength === -1
                        ? "border-violet-400 bg-violet-50 shadow-sm"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <span className="text-xl" style={{ fontWeight: 700 }}>?</span>
                    <p className="text-xs text-gray-500 mt-1">Not sure</p>
                  </button>
                </div>

                <div className="flex items-start gap-2 mt-6 p-3 bg-violet-50 rounded-lg">
                  <Info className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-violet-700">
                    The average cycle is 28 days, but anywhere from 21-35 days is considered normal. We'll use 28 days as default if you're not sure.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Period Length */}
        {step === 3 && (
          <Card className="border-2 border-pink-100 shadow-lg mx-4">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Droplet className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                  How many days does your period usually last?
                </h3>
                <p className="text-gray-500 text-sm">
                  From the first day of bleeding to the last.
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {periodLengthOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPeriodLength(option.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        periodLength === option.value
                          ? "border-rose-400 bg-rose-50 shadow-sm"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <span className="text-xl text-gray-900" style={{ fontWeight: 700 }}>
                        {option.value}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">days</p>
                    </button>
                  ))}
                </div>

                <div className="flex items-start gap-2 mt-6 p-3 bg-rose-50 rounded-lg">
                  <Info className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-rose-700">
                    Most periods last between 3-7 days. If yours regularly lasts more than 7 days, consider consulting your healthcare provider.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Flow Type */}
        {step === 4 && (
          <Card className="border-2 border-pink-100 shadow-lg mx-4">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                  How would you describe your flow?
                </h3>
                <p className="text-gray-500 text-sm">
                  This helps us provide better insights about your cycle.
                </p>
              </div>

              <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
                {flowOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFlowType(option.value)}
                    className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                      flowType === option.value
                        ? "border-blue-400 bg-blue-50 shadow-sm"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <div>
                      <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                    {flowType === option.value && (
                      <div className="ml-auto w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Regular or Irregular */}
        {step === 5 && (
          <Card className="border-2 border-pink-100 shadow-lg mx-4">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sun className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                  Is your cycle regular?
                </h3>
                <p className="text-gray-500 text-sm">
                  A regular cycle comes around the same time each month with similar duration.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-3">
                {[
                  { value: "regular", label: "Yes, it's regular", desc: "My cycle is fairly predictable each month", emoji: "✅" },
                  { value: "somewhat", label: "Somewhat regular", desc: "It varies by a few days here and there", emoji: "〰️" },
                  { value: "irregular", label: "No, it's irregular", desc: "My cycle is unpredictable and varies a lot", emoji: "🔀" },
                  { value: "unsure", label: "I'm not sure", desc: "I haven't tracked it closely before", emoji: "🤔" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setIsRegular(option.value)}
                    className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                      isRegular === option.value
                        ? "border-amber-400 bg-amber-50 shadow-sm"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500">{option.desc}</p>
                    </div>
                    {isRegular === option.value && (
                      <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Goals */}
        {step === 6 && (
          <Card className="border-2 border-pink-100 shadow-lg mx-4">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-violet-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                  What are your tracking goals?
                </h3>
                <p className="text-gray-500 text-sm">
                  Select all that apply. We'll tailor your experience accordingly.
                </p>
              </div>

              <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
                {goalOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedGoals.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleGoal(option.value)}
                      className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-violet-400 bg-violet-50 shadow-sm"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm text-gray-900 flex-1" style={{ fontWeight: 500 }}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Common symptoms to optionally select */}
              <div className="max-w-md mx-auto mt-8">
                <p className="text-sm text-gray-600 mb-3" style={{ fontWeight: 500 }}>
                  Do you commonly experience any of these symptoms?
                </p>
                <div className="flex flex-wrap gap-2">
                  {symptomOptions.map((symptom) => {
                    const isSelected = selectedSymptoms.includes(symptom.name);
                    return (
                      <button
                        key={symptom.name}
                        onClick={() => toggleSymptom(symptom.name)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm transition-all ${
                          isSelected
                            ? "border-pink-400 bg-pink-50 text-pink-700"
                            : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"
                        }`}
                      >
                        <span>{symptom.emoji}</span>
                        <span style={{ fontWeight: isSelected ? 500 : 400 }}>{symptom.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        {step > 0 && (
          <div className="flex items-center justify-between mt-8 px-4">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              className="text-gray-500"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {step < totalSteps - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 px-8 shadow-lg shadow-pink-200"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500 hover:from-pink-600 hover:via-rose-600 hover:to-violet-600 px-8 shadow-lg shadow-pink-200"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Tracking
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
