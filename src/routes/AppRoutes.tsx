import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Registration } from "../pages/Registration/Registration";
import { RegistrationSuccess } from "../pages/RegistrationSuccess/RegistrationSuccess";
import { SmartPCLobby } from "../pages/SmartPC/SmartPCLobby";
import { SmartPCCashOut } from "../pages/SmartPC/SmartPCCashOut";
import { GamePlayPage } from "../pages/SmartPC/GamePlayPage";
import { NotAuthorized } from "../pages/NotAuthorized/NotAuthorized";

export const AppRoutes: React.FC = () => {
  const hasRegisteredMachine = Boolean(localStorage.getItem("winbet_machine_id"));

  return (
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
  );
};

