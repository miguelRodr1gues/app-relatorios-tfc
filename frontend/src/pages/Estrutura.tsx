import { useState } from "react";
import SearchBar from "../components/SearchBar";

export default function Estrutura() {
    const [q, setQ] = useState("");

    return (
        <div className="flex-1 overflow-y-auto px-8 py-8 bg-[#fafafa] dark:bg-[#1a1a1a]">
            <div className="mb-6">
                <h1 className="text-[28px] font-bold text-[#1f2937] dark:text-white leading-tight">
                    Estrutura do Sistema
                </h1>
                <p className="text-[14px] text-[#9ca3af] dark:text-[#6b7280] mt-1">
                    Visão geral de como as diferentes partes do sistema se ligam e como a informação está estruturada
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <SearchBar
                    placeholder="Procurar tabelas..."
                    value={q}
                    onChange={setQ}
                />
            </div>

            <div className="bg-[#f9fafb] dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] rounded-[20px] p-6">
                <div className="text-[14px] font-semibold text-[#1f2937] dark:text-white">
                    Diagrama ER (em breve)
                </div>
                <div className="text-[13px] text-[#6b7280] dark:text-[#9ca3af] mt-2">
                    Aqui irá aparecer o diagrama entidade-relação da base de dados.
                </div>
            </div>
        </div>
    );
}