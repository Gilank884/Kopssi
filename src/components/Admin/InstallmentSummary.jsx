import React from 'react';
import { Clock, Wallet } from 'lucide-react';

const InstallmentSummary = ({ loan, installments, userLoans, formatCurrency, selectedInstallments = [], onToggleInstallment, onToggleAllInstallments }) => {
    if (!loan) return null;

    const loanId = loan.id;
    // Stats untuk PINJAMAN SAAT INI (Current Loan)
    const currentInstallments = installments.filter(i => i.pinjaman_id === loanId);
    const hasCurrentInstallments = currentInstallments.length > 0;
    const paidCurrentInstallments = currentInstallments.filter(i => i.status === 'PROCESSED' || i.status === 'PAID');
    const unpaidCurrentInstallments = currentInstallments.filter(i => i.status !== 'PROCESSED' && i.status !== 'PAID');

    const currentTotalPaid = paidCurrentInstallments.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const currentRemaining = unpaidCurrentInstallments.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const currentPaidCount = paidCurrentInstallments.length;

    // Kalkulasi Potongan & Net Pencairan
    const totalDeduction = selectedInstallments.reduce((sum, inst) => sum + parseFloat(inst.amount), 0);
    const netDisbursement = parseFloat(loan.jumlah_pinjaman) - totalDeduction;

    const otherLoans = userLoans.filter(l => l.id !== loanId && l.status === 'DICAIRKAN');
    const resolvedOtherLoans = otherLoans.filter(l => {
        const paidCount = installments.filter(i => i.pinjaman_id === l.id && (i.status === 'PROCESSED' || i.status === 'PAID')).length;
        return paidCount < (l.tenor_bulan || 0);
    });

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <Clock size={18} className="text-emerald-600" />
                <h3 className="font-black italic uppercase tracking-widest text-xs text-gray-800">
                    Ringkasan Angsuran
                </h3>
            </div>

            <div className="p-8 space-y-8">
                {/* Pinjaman Saat Ini - Hanya muncul jika sudah ada angsuran (sudah jalan) */}
                {hasCurrentInstallments && (
                    <div className="p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase italic tracking-widest mb-1">
                                    Pinjaman Aktif ({loan.no_pinjaman})
                                </p>
                                <p className="text-lg font-black text-gray-900 italic">
                                    {formatCurrency(loan.jumlah_pinjaman)}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                        ${currentPaidCount === loan.tenor_bulan
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                            >
                                {currentPaidCount === loan.tenor_bulan ? 'FULLY PROCESSED' : 'BERJALAN'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase italic text-gray-500">
                                <span>Progress Angsuran</span>
                                <span>{currentPaidCount} / {loan.tenor_bulan} Bulan</span>
                            </div>
                            <div className="w-full bg-gray-200/50 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-emerald-600 h-1.5 transition-all duration-500 shadow-sm shadow-emerald-200"
                                    style={{
                                        width: `${(currentPaidCount / loan.tenor_bulan) * 100}%`
                                    }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black text-emerald-700 uppercase italic">
                                <span>Terbayar: {formatCurrency(currentTotalPaid)}</span>
                                <span>Sisa: {formatCurrency(currentRemaining)}</span>
                            </div>
                        </div>

                        {/* Jadwal Pinjaman Table */}
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between px-1 text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest leading-none">
                                    Jadwal Pinjaman (Official Schedule)
                                </p>
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase italic shrink-0">
                                    Amortisasi Flat
                                </span>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase italic tracking-tight">Tanggal Tagih</th>
                                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase italic tracking-tight text-right">Pokok</th>
                                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase italic tracking-tight text-right">Bunga</th>
                                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase italic tracking-tight text-right">Jumlah</th>
                                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase italic tracking-tight text-right">Saldo Pokok</th>
                                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase italic tracking-tight text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {(() => {
                                                const principalAmt = parseFloat(loan.jumlah_pinjaman) || 0;
                                                const tenorMonths = loan.tenor_bulan || 1;

                                                let totalBungaAmt = 0;
                                                if (loan.tipe_bunga === 'PERSENAN') {
                                                    totalBungaAmt = principalAmt * (parseFloat(loan.nilai_bunga || 0) / 100) * (tenorMonths / 12);
                                                } else if (loan.tipe_bunga === 'NOMINAL') {
                                                    totalBungaAmt = parseFloat(loan.nilai_bunga || 0);
                                                }

                                                const stdPokok = Math.floor(principalAmt / tenorMonths);
                                                const stdBunga = Math.round(totalBungaAmt / tenorMonths);

                                                let sumPokok = 0;
                                                let sumBunga = 0;
                                                let sumTotal = 0;
                                                let runningSaldo = principalAmt;

                                                return (
                                                    <>
                                                        {/* Row 0: Starting Balance */}
                                                        {currentInstallments.length > 0 && (
                                                            <tr className="bg-gray-50/30">
                                                                <td className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase italic">
                                                                    {/* Empty month as requested */}
                                                                </td>
                                                                <td className="px-4 py-3 text-[10px] font-black text-gray-300 italic text-right">-</td>
                                                                <td className="px-4 py-3 text-[10px] font-black text-gray-300 italic text-right">-</td>
                                                                <td className="px-4 py-3 text-[10px] font-black text-gray-300 italic text-right">-</td>
                                                                <td className="px-4 py-3 text-[10px] font-black text-gray-900 italic text-right">
                                                                    {formatCurrency(principalAmt)}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="text-[8px] font-black text-gray-300 uppercase italic">START</span>
                                                                </td>
                                                            </tr>
                                                        )}

                                                        {currentInstallments.map((inst, idx) => {
                                                            const isLast = idx === currentInstallments.length - 1;

                                                            let currentPokok = stdPokok;
                                                            let currentBunga = stdBunga;

                                                            if (isLast) {
                                                                currentPokok = principalAmt - (stdPokok * (tenorMonths - 1));
                                                                currentBunga = totalBungaAmt - (stdBunga * (tenorMonths - 1));
                                                            }

                                                            const currentTotal = currentPokok + currentBunga;
                                                            runningSaldo -= currentPokok;

                                                            sumPokok += currentPokok;
                                                            sumBunga += currentBunga;
                                                            sumTotal += currentTotal;

                                                            return (
                                                                <tr key={inst.id} className={`group hover:bg-gray-50/50 transition-colors ${inst.status === 'PAID' ? 'bg-blue-50/10' : ''}`}>
                                                                    <td className="px-4 py-3 text-[10px] font-bold text-gray-600 uppercase italic">
                                                                        {new Date(inst.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-[10px] font-black text-gray-700 italic text-right">
                                                                        {formatCurrency(currentPokok)}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-[10px] font-black text-emerald-600 italic text-right">
                                                                        {formatCurrency(currentBunga)}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-[11px] font-black text-gray-900 italic text-right">
                                                                        {formatCurrency(currentTotal)}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-[10px] font-black text-gray-400 italic text-right">
                                                                        {formatCurrency(Math.max(0, runningSaldo))}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic ${(inst.status === 'PROCESSED' || inst.status === 'PAID')
                                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                            : new Date(inst.tanggal_bayar) < new Date()
                                                                                ? 'bg-red-50 text-red-600 border border-red-100'
                                                                                : 'bg-gray-50 text-gray-400 border border-gray-100 uppercase'
                                                                            }`}>
                                                                            {(inst.status === 'PROCESSED' || inst.status === 'PAID') ? 'LUNAS' : ''}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                        <tr className="bg-gray-100/50 font-black border-t-2 border-gray-200">
                                                            <td className="px-4 py-4 text-[11px] uppercase italic text-gray-900">JUMLAH</td>
                                                            <td className="px-4 py-4 text-[11px] italic text-right text-gray-900">{formatCurrency(sumPokok)}</td>
                                                            <td className="px-4 py-4 text-[11px] italic text-right text-emerald-700">{formatCurrency(sumBunga)}</td>
                                                            <td className="px-4 py-4 text-[12px] italic text-right text-emerald-600 font-black">{formatCurrency(sumTotal)}</td>
                                                            <td className="px-4 py-4" colSpan="2"></td>
                                                        </tr>
                                                    </>
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pinjaman & Angsuran Lain */}
                {resolvedOtherLoans.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest px-1">
                            Bayar Angsuran Berjalan (Potong Pencairan)
                        </p>
                        <div className="grid grid-cols-1 gap-4">
                            {resolvedOtherLoans.map((ol) => {
                                const olInstallments = installments.filter(i => i.pinjaman_id === ol.id);
                                const paidOlInstallments = olInstallments.filter(i => i.status === 'PROCESSED' || i.status === 'PAID');
                                const unpaidOlInstallments = olInstallments.filter(i => i.status !== 'PROCESSED' && i.status !== 'PAID');

                                const tenor = ol.tenor_bulan || 1;
                                const paidCount = paidOlInstallments.length;
                                const unpaidCount = Math.max(tenor - paidCount, 0);

                                const principal = parseFloat(ol.jumlah_pinjaman || 0);
                                let totalBunga = 0;
                                if (ol.tipe_bunga === 'PERSENAN') {
                                    totalBunga = principal * (parseFloat(ol.nilai_bunga || 0) / 100) * (tenor / 12);
                                } else if (ol.tipe_bunga === 'NOMINAL') {
                                    totalBunga = parseFloat(ol.nilai_bunga || 0);
                                }

                                const outstandingPokok = Math.round((principal / tenor) * unpaidCount);
                                const outstandingBunga = Math.round((totalBunga / tenor) * unpaidCount);

                                const allSelected = unpaidOlInstallments.length > 0 && unpaidOlInstallments.every(ui => selectedInstallments.some(si => si.id === ui.id));

                                return (
                                    <div key={ol.id} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                        <div className="p-4 bg-gray-100/50 border-b border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-400">
                                                    <Wallet size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-900 uppercase italic leading-none">{ol.no_pinjaman}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter italic">Terbayar: {paidCount} / {tenor} • Sisa: {unpaidCount} Bulan</p>
                                                </div>
                                            </div>
                                            {unpaidOlInstallments.length > 0 && (
                                                <button
                                                    onClick={() => onToggleAllInstallments(ol.id, unpaidOlInstallments)}
                                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${allSelected ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50'
                                                        }`}
                                                >
                                                    {allSelected ? 'Batal Semua' : 'Pilih Semua'}
                                                </button>
                                            )}
                                        </div>

                                        <div className="px-4 py-3 bg-white border-b border-gray-100">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase italic text-gray-500">
                                                <span>Outstanding Pokok</span>
                                                <span className="text-red-500">{outstandingPokok > 0 ? formatCurrency(outstandingPokok) : '-'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase italic text-gray-500 mt-1">
                                                <span>Outstanding Bunga</span>
                                                <span className="text-red-400">{outstandingBunga > 0 ? formatCurrency(outstandingBunga) : '-'}</span>
                                            </div>
                                        </div>

                                        {unpaidOlInstallments.length > 0 ? (
                                            <div className="p-2 divide-y divide-gray-100 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                                                {unpaidOlInstallments.map((inst) => {
                                                    const isSelected = selectedInstallments.some(si => si.id === inst.id);
                                                    return (
                                                        <div
                                                            key={inst.id}
                                                            className={`p-3 flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-white'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => onToggleInstallment(inst)}
                                                                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                />
                                                                <span className="text-[10px] font-bold text-gray-600 uppercase italic">Bulan Ke-{inst.bulan_ke}</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-blue-700 italic">{formatCurrency(inst.amount)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-[10px] font-bold text-gray-400 italic">
                                                Semua angsuran sudah PROCESSED.
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Rekap Pencairan (Hanya jika belum cair) */}
                {loan.status !== 'DICAIRKAN' && (
                    <div className="pt-6 border-t border-gray-100">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">
                                    Plafon Pinjaman Baru
                                </p>
                                <p className="text-sm font-black text-gray-900 italic">
                                    {formatCurrency(loan.jumlah_pinjaman)}
                                </p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-red-500 uppercase italic tracking-widest">
                                    Total Potongan Angsuran
                                </p>
                                <p className="text-sm font-black text-red-600 italic">
                                    - {formatCurrency(totalDeduction)}
                                </p>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-dashed border-gray-200">
                                <p className="text-xs font-black text-emerald-600 uppercase italic tracking-widest">
                                    Estimasi Pencairan Bersih
                                </p>
                                <p className="text-xl font-black text-emerald-600 italic">
                                    {formatCurrency(netDisbursement)}
                                </p>
                            </div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase italic leading-relaxed mt-2">
                                * Estimasi nilai yang akan dikirimkan ke rekening anggota setelah dikurangi angsuran pinjaman lama yang dipilih.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default InstallmentSummary;
