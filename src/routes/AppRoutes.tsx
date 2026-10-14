import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loading } from "../components/common/Loading";

const Registration = lazy(() =>
  import("../pages/Registration/Registration").then((m) => ({ default: m.Registration }))
);
const RegistrationSuccess = lazy(() =>
  import("../pages/RegistrationSuccess/RegistrationSuccess").then((m) => ({ default: m.RegistrationSuccess }))
);
const SmartPCLobby = lazy(() =>
  import("../pages/SmartPC/SmartPCLobby").then((m) => ({ default: m.SmartPCLobby }))
);
const SmartPCCashOut = lazy(() =>
  import("../pages/SmartPC/SmartPCCashOut").then((m) => ({ default: m.SmartPCCashOut }))
);
const GamePlayPage = lazy(() =>
  import("../pages/SmartPC/GamePlayPage").then((m) => ({ default: m.GamePlayPage }))
);
const NotAuthorized = lazy(() =>
  import("../pages/NotAuthorized/NotAuthorized").then((m) => ({ default: m.NotAuthorized }))
);

export const AppRoutes: React.FC = () => {
  const hasRegisteredMachine = Boolean(localStorage.getItem("winbet_machine_id"));

  return (
    <Suspense fallback={<Loading message="Loading Winbet Gaming Machine..." />}>
      <Routes>
        {/* Root redirect: Go directly to Smart PC Lobby if already registered, else go to register */}
        <Route path="/" element={<Navigate to={hasRegisteredMachine ? "/smart-pc" : "/register"} replace />} />

        {/* Smart PC Registration & Login Flow */}
        <Route path="/register" element={<Registration defaultMachineType="smart-pc" />} />
        <Route path="/smart-pc/register" element={<Registration defaultMachineType="smart-pc" />} />
        <Route path="/smart-pc/login" element={<Registration defaultMachineType="smart-pc" />} />
        <Route path="/register/smart-pc" element={<Registration defaultMachineType="smart-pc" />} />

        <Route path="/register/success" element={<RegistrationSuccess />} />

        {/* Security / Unbind */}
        <Route path="/not-authorized" element={<NotAuthorized />} />

        {/* Smart PC Flow */}
        <Route path="/smart-pc" element={<SmartPCLobby />} />
        <Route path="/smart-pc/play/:gameId" element={<GamePlayPage />} />
        <Route path="/smart-pc/play" element={<GamePlayPage />} />
        <Route path="/play/:gameId" element={<GamePlayPage />} />
        <Route path="/smart-pc/cashout" element={<SmartPCCashOut />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </Suspense>
  );
};


