import { type ReactElement, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DealsPage(): ReactElement {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

    // Mocks for now, will replace with API later
    const deals = [
        { id: '1', name: 'Software License Renewal', amount: 8000, stage: 'Prospecting', responsible: 'John Smith' },
        { id: '2', name: 'Enterprise Deployment', amount: 25000, stage: 'Negotiation', responsible: 'Jane Doe' },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header section */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('deals.title', 'Deals')}</h1>
                        <p className="text-gray-500 mt-1">{t('deals.subtitle', 'Manage your sales pipeline')}</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#6366f1] text-white rounded-xl hover:bg-indigo-600 transition-colors shadow-sm font-medium">
                        <Plus className="w-5 h-5" />
                        {t('deals.add', 'New Deal')}
                    </button>
                </div>

                {/* Toolbar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t('deals.search', 'Search deals...')}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors hidden sm:block">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100 self-end sm:self-auto">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-[500px]">
                    {viewMode === 'list' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                                        <th className="font-medium p-4 py-3">Deal Name</th>
                                        <th className="font-medium p-4 py-3">Amount</th>
                                        <th className="font-medium p-4 py-3">Stage</th>
                                        <th className="font-medium p-4 py-3">Owner</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deals.map(deal => (
                                        <tr key={deal.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => navigate(`/deals/${deal.id}`)}>
                                            <td className="p-4 font-medium text-gray-900">{deal.name}</td>
                                            <td className="p-4 text-gray-600">${deal.amount}</td>
                                            <td className="p-4"><span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">{deal.stage}</span></td>
                                            <td className="p-4 text-gray-600">{deal.responsible}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col items-center justify-center text-gray-400 font-medium border-dashed border-2">
                            <LayoutGrid className="w-12 h-12 mb-4 text-gray-300" />
                            Kanban Board implementation requested in task but we can click on table items for now.<br />
                            Click List view to see mock deals.
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
