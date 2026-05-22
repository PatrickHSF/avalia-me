import { motion } from 'motion/react';
import { Home, Search, Star, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center text-gray-500">
        <NavLink 
          to="/" 
          className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? "text-blue-600" : ""}`}
        >
          <Home size={24} />
          <span className="text-[10px] font-medium">Início</span>
        </NavLink>
        <NavLink 
          to="/search" 
          className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? "text-blue-600" : ""}`}
        >
          <Search size={24} />
          <span className="text-[10px] font-medium">Buscar</span>
        </NavLink>
        <NavLink 
          to="/reviews" 
          className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? "text-blue-600" : ""}`}
        >
          <Star size={24} />
          <span className="text-[10px] font-medium">Avaliações</span>
        </NavLink>
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? "text-blue-600" : ""}`}
        >
          <User size={24} />
          <span className="text-[10px] font-medium">Perfil</span>
        </NavLink>
      </div>
    </nav>
  );
}
