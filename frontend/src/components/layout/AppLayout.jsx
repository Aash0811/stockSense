import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import BarcodeScannerModal from "../common/BarcodeScannerModal";

export default function AppLayout({ children }) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar onOpenScanner={() => setIsScannerOpen(true)} />
        <main className="content-container">{children}</main>
      </div>
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}
