import { useState } from "react";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Laboratory } from "./pages/Laboratory";
import { AddExpense } from "./pages/AddExpense";
import { Login } from "./pages/Login";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "dashboard" && <Dashboard />}
      {activeTab === "laboratory" && <Laboratory />}
      {activeTab === "add-expense" && <AddExpense />}
      {activeTab === "login" && <Login />}
    </AppLayout>
  );
}

export default App;
