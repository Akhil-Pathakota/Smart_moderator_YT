import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddVideo from "./pages/AddVideo";
import VideoDetail from "./pages/VideoDetail";
import { Shield, LayoutGrid, Plus } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-void/80 backdrop-blur-glass">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-7 h-7 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center group-hover:shadow-glow transition-all">
            <Shield size={13} className="text-neon-cyan" />
          </div>
          <span className="font-display font-bold text-sm text-text-primary">
            Smart<span className="text-neon-cyan">Mod</span>
          </span>
        </button>

        <div className="flex items-center gap-1">
          <NavBtn
            icon={<LayoutGrid size={13} />}
            label="Dashboard"
            active={location.pathname === "/"}
            onClick={() => navigate("/")}
          />
          <NavBtn
            icon={<Plus size={13} />}
            label="Add Video"
            active={location.pathname === "/add"}
            onClick={() => navigate("/add")}
          />
        </div>
      </div>
    </nav>
  );
}

function NavBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-all ${
        active
          ? "bg-white/8 text-text-primary border border-white/10"
          : "text-text-muted hover:text-text-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="grid-line min-h-screen">
        <Navbar />
        <main className="pt-14">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddVideo />} />
            <Route path="/video/:id" element={<VideoDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
