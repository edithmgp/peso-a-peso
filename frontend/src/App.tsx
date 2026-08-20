import { useState } from "react";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Laboratory } from "./pages/Laboratory";
import { AddExpense } from "./pages/AddExpense";
import { Login } from "./pages/Login";
import { ExpenseList } from "./pages/ExpenseList";
import { BudgetSetup } from "./pages/BudgetSetup";
import { FixedExpenses } from "./pages/FixedExpenses";
import { ProfileSettings } from "./pages/ProfileSettings";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "dashboard" && <Dashboard />}
      {activeTab === "laboratory" && <Laboratory />}
      {activeTab === "add-expense" && <AddExpense />}
      {activeTab === "expenses" && <ExpenseList />}
      {activeTab === "budget" && <BudgetSetup />}
      {activeTab === "fixed-expenses" && <FixedExpenses />}
      {activeTab === "profile" && <ProfileSettings />}
      {activeTab === "login" && <Login />}
    </AppLayout>
  );
}

export default App;
