import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useApp();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(phone ? `+212 ${phone}` : email);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-4 md:p-8">
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          aria-label="Retour accueil"
          className="w-10 h-10 rounded-full bg-white border border-[#0B1020]/10 flex items-center justify-center text-[#0B1020] hover:text-[#FF5A00] transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Link to="/">
          <img src="/images/logohor.png" alt="Foodi Agadir" className="h-9 w-auto object-contain" />
        </Link>
        <div className="w-10" />
      </div>

      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#0B1020]/8 shadow-xl shadow-[#0B1020]/4 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-[#0B1020]">Créer un compte Foodi</h1>
            <p className="text-xs text-[#7A8194]">
              Rejoignez des milliers de gourmands à Agadir
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                Nom complet *
              </label>
              <div className="flex items-center bg-[#FAF8F5] border border-[#0B1020]/10 rounded-2xl px-3.5 py-3 focus-within:border-[#FF5A00] focus-within:bg-white transition-all">
                <User className="w-4 h-4 text-[#7A8194] mr-2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Youssef Amrani"
                  className="w-full text-xs font-bold text-[#0B1020] bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                Numéro de téléphone *
              </label>
              <div className="flex items-center bg-[#FAF8F5] border border-[#0B1020]/10 rounded-2xl overflow-hidden focus-within:border-[#FF5A00] focus-within:bg-white transition-all">
                <span className="px-3 text-xs font-black text-[#0B1020] border-r border-[#0B1020]/10">
                  🇲🇦 +212
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="6 00 00 00 00"
                  className="w-full px-3 py-3 text-xs font-bold text-[#0B1020] bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                Email *
              </label>
              <div className="flex items-center bg-[#FAF8F5] border border-[#0B1020]/10 rounded-2xl px-3.5 py-3 focus-within:border-[#FF5A00] focus-within:bg-white transition-all">
                <Mail className="w-4 h-4 text-[#7A8194] mr-2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="youssef@exemple.ma"
                  className="w-full text-xs font-bold text-[#0B1020] bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                Mot de passe *
              </label>
              <div className="flex items-center bg-[#FAF8F5] border border-[#0B1020]/10 rounded-2xl px-3.5 py-3 focus-within:border-[#FF5A00] focus-within:bg-white transition-all">
                <Lock className="w-4 h-4 text-[#7A8194] mr-2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full text-xs font-bold text-[#0B1020] bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="foodi-btn-primary w-full py-3.5 rounded-2xl text-xs font-black shadow-md shadow-[#FF5A00]/25 cursor-pointer mt-4"
            >
              <span>Créer mon compte Foodi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#0B1020]/6">
            <p className="text-xs text-[#7A8194]">
              Vous avez déjà un compte ?{" "}
              <Link to="/login" className="font-extrabold text-[#FF5A00] hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-[#7A8194]">
        © 2026 Foodi Maroc • Livraison de repas à Agadir
      </div>
    </div>
  );
};
