import React from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "./ui/button";

const features = [
  {
    icon: Calendar,
    title: "Cycle Tracking",
    desc: "Private period tracking stored only on your device.",
    path: "/cycle-tracking",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: MapPin,
    title: "Nearby Services",
    desc: "Find hospitals, pharmacies and safe spaces near you via open-source APIs.",
    path: "/nearby-services",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Users,
    title: "Community",
    desc: "Share experiences and support each other.",
    path: "/community",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: AlertTriangle,
    title: "SOS Emergency",
    desc: "Send your location to contacts and alert nearby users instantly.",
    path: "/sos",
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero — clean, text-focused like MongoDB */}
      <section className="bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-18 md:py-22">
          <h1 className="text-4xl md:text-5xl mb-4 leading-tight" style={{ fontWeight: 700 }}>
            Your wellness.<br />Your safety.
          </h1>
          <p className="text-lg text-purple-100 max-w-xl mb-8">
            Privacy-first cycle tracking, community support, nearby services, and instant SOS — all in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-white text-violet-700 hover:bg-violet-50 px-6"
              onClick={() => navigate("/cycle-tracking")}
            >
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white bg-white/10 hover:bg-white/20 px-6"
              onClick={() => navigate("/sos")}
            >
              <AlertTriangle className="w-4 h-4 mr-2" /> SOS
            </Button>
          </div>
        </div>
      </section>

      {/* Feature cards — flat, minimal */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-18 pb-14">
        <h2 className="text-2xl mb-10 text-gray-900" style={{ fontWeight: 700 }}>Features</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.path}
                onClick={() => navigate(f.path)}
                className={`text-left rounded-xl border p-5 transition-shadow hover:shadow-md ${f.bg} border-gray-200`}
              >
                <Icon className={`w-6 h-6 mb-3 ${f.color}`} />
                <h3 className="text-base mb-1 text-gray-900" style={{ fontWeight: 600 }}>{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Privacy note */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-18">
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-6">
          <h3 className="text-base mb-2 text-violet-800" style={{ fontWeight: 600 }}>Privacy by design</h3>
          <p className="text-sm text-violet-700">
            Period data never leaves your device. Only community posts and SOS location are stored on the server — nothing else.
          </p>
        </div>
      </section>
    </div>
  );
}
