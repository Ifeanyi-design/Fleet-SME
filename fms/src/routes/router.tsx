import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { AppShell } from '@/components/layouts/AppShell';
import { DriverShell } from '@/components/layouts/DriverShell';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { RequireAuth } from '@/routes/RequireAuth';
import { RootRedirect } from '@/routes/RootRedirect';

// Login stays eager — it is the entry point and is tiny. Every other route is split
// into its own chunk so the initial payload stays small (NFR7).
import { Login } from '@/pages/Login';

const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Vehicles = lazy(() => import('@/pages/Vehicles').then((m) => ({ default: m.Vehicles })));
const VehicleDetail = lazy(() =>
  import('@/pages/VehicleDetail').then((m) => ({ default: m.VehicleDetail })),
);
const Drivers = lazy(() => import('@/pages/Drivers').then((m) => ({ default: m.Drivers })));
const DriverDetail = lazy(() =>
  import('@/pages/DriverDetail').then((m) => ({ default: m.DriverDetail })),
);
const Dispatch = lazy(() => import('@/pages/Dispatch').then((m) => ({ default: m.Dispatch })));
const NewDelivery = lazy(() =>
  import('@/pages/NewDelivery').then((m) => ({ default: m.NewDelivery })),
);
const Maintenance = lazy(() =>
  import('@/pages/Maintenance').then((m) => ({ default: m.Maintenance })),
);
const Customers = lazy(() => import('@/pages/Customers').then((m) => ({ default: m.Customers })));
const Reports = lazy(() => import('@/pages/Reports').then((m) => ({ default: m.Reports })));
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })));
const Notifications = lazy(() =>
  import('@/pages/Notifications').then((m) => ({ default: m.Notifications })),
);

const DriverHome = lazy(() =>
  import('@/pages/DriverHome').then((m) => ({ default: m.DriverHome })),
);
const DriverHistory = lazy(() =>
  import('@/pages/DriverHistory').then((m) => ({ default: m.DriverHistory })),
);
const DriverProfile = lazy(() =>
  import('@/pages/DriverProfile').then((m) => ({ default: m.DriverProfile })),
);
const DriverTrip = lazy(() =>
  import('@/pages/DriverTrip').then((m) => ({ default: m.DriverTrip })),
);

const PublicTrack = lazy(() =>
  import('@/pages/PublicTrack').then((m) => ({ default: m.PublicTrack })),
);
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));

/** Route tree — see plan.md §1.1. Suspense boundaries live in the layout shells. */
export const router = createBrowserRouter([
  // Public
  { path: '/', element: <RootRedirect /> },
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <Login /> }],
  },
  {
    element: <PublicLayout />,
    children: [
      // /track is the bare lookup form; /track/:code deep-links a specific waybill.
      { path: '/track', element: <PublicTrack /> },
      { path: '/track/:trackingCode', element: <PublicTrack /> },
    ],
  },

  // Admin shell
  {
    element: <RequireAuth role="admin" />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/vehicles', element: <Vehicles /> },
          { path: '/vehicles/:vehicleId', element: <VehicleDetail /> },
          { path: '/drivers', element: <Drivers /> },
          { path: '/drivers/:driverId', element: <DriverDetail /> },
          { path: '/dispatch', element: <Dispatch /> },
          { path: '/dispatch/new', element: <NewDelivery /> },
          { path: '/maintenance', element: <Maintenance /> },
          { path: '/customers', element: <Customers /> },
          { path: '/reports', element: <Reports /> },
          { path: '/profile', element: <Profile /> },
          { path: '/notifications', element: <Notifications /> },
        ],
      },
    ],
  },

  // Driver shell (mobile-first)
  {
    element: <RequireAuth role="driver" />,
    children: [
      {
        element: <DriverShell />,
        children: [
          { path: '/driver', element: <DriverHome /> },
          { path: '/driver/history', element: <DriverHistory /> },
          { path: '/driver/profile', element: <DriverProfile /> },
          { path: '/driver/trips/:deliveryId', element: <DriverTrip /> },
        ],
      },
    ],
  },

  { path: '*', element: <NotFound /> },
]);
