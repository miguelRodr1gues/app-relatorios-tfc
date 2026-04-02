import { useMemo, useState } from "react";
import { TABLES } from "../data/mockData";
import SearchBar from "../components/SearchBar";

export default function Estrutura() {
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        if (!query) return TABLES;
        return TABLES.filter(
            (t) =>
                t.name.toLowerCase().includes(query) ||
                t.key.toLowerCase().includes(query) ||
                t.columns.some(
                    (c) => c.label.toLowerCase().includes(query) || c.n.toLowerCase().includes(query)
                )
        );
    }, [q]);

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

            <div className="grid grid-cols-3 gap-5">
                {filtered.map((t) => (
                    <div
                        key={t.key}
                        className="bg-white dark:bg-[#2a2a2a] rounded-[18px] shadow-sm border border-[#f3f4f6] dark:border-[#3a3a3a] p-5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] dark:from-[#1b4332] dark:to-[#2d6a4f] flex items-center justify-center text-[18px]">
                                    {t.emoji ?? "📄"}
                                </div>
                                <div>
                                    <div className="font-semibold text-[15px] text-[#1f2937] dark:text-white">
                                        {t.name}
                                    </div>
                                    <div className="text-[12px] text-[#9ca3af] dark:text-[#6b7280]">
                                        {t.key}
                                    </div>
                                </div>
                            </div>
                            <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af] bg-[#f9fafb] dark:bg-[#1a1a1a] px-3 py-1.5 rounded-lg">
                                {t.columns.length} col.
                            </div>
                        </div>

                        <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                            {t.description ?? "—"}
                        </div>

                        <div className="mt-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a] pt-4">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] mb-2">
                                Colunas
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {t.columns.slice(0, 10).map((c) => (
                                    <span
                                        key={c.n}
                                        className="text-[12px] px-2.5 py-1 rounded-full bg-[#f3f4f6] dark:bg-[#1a1a1a] text-[#374151] dark:text-[#9ca3af] border border-[#e5e7eb] dark:border-[#3a3a3a]"
                                    >
                                        {c.label}
                                    </span>
                                ))}
                                {t.columns.length > 10 && (
                                    <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#f3f4f6] dark:bg-[#1a1a1a] text-[#6b7280] dark:text-[#9ca3af] border border-[#e5e7eb] dark:border-[#3a3a3a]">
                                        +{t.columns.length - 10}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 bg-[#f9fafb] dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] rounded-[20px] p-6">
                <div className="text-[14px] font-semibold text-[#1f2937] dark:text-white">
                    Diagrama ER (em breve)
                </div>
            </div>
        </div>
    );
}