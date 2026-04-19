import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./views/Home";
import ThemeDetail from "./views/ThemeDetail";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/theme/:id" element={<ThemeDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
