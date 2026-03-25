import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { CycleTracking } from "./components/CycleTracking";
import { NearbyServices } from "./components/NearbyServices";
import { Community } from "./components/Community";
import { SOS } from "./components/SOS";
import { Profile } from "./components/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "cycle-tracking", Component: CycleTracking },
      { path: "nearby-services", Component: NearbyServices },
      { path: "community", Component: Community },
      { path: "sos", Component: SOS },
      { path: "profile", Component: Profile },
    ],
  },
]);