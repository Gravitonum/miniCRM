import { type ReactElement } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MoreHorizontal, Plus } from 'lucide-react';

export function DealDetailsPage(): ReactElement {
    // const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Mock data based on the screenshot
    const deal = "SaaS Collaboration Tool Deal";

    // Stages from screenshot
    const stages = [
        { name: 'Prospecting', status: 'completed' },
        { name: 'Qualified', status: 'completed' },
        { name: 'Discovery', status: 'completed' },
        { name: 'Proposal Sent', status: 'current' },
        { name: 'Negotiation', status: 'pending' },
        { name: 'Closed', status: 'pending' },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full">

                {/* Header Back button */}
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Deals
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{deal}</h1>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-6 border-b border-gray-200">
                        <button className="pb-3 text-sm font-medium text-green-600 border-b-2 border-green-600">Overview</button>
                        <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700">Tasks</button>
                        <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700">Notes</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Main Content Column (2/3 width) */}
                    <div className="xl:col-span-2 flex flex-col gap-6">

                        {/* Stages Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-gray-900">Stages</h2>
                                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                                    Move to Next Stage
                                </button>
                            </div>

                            <div className="flex items-center justify-between relative">
                                <div className="absolute left-0 right-0 top-1/2 -mt-px h-0.5 bg-gray-200 -z-10"></div>

                                {stages.map((stage) => (
                                    <div key={stage.name} className="flex flex-col items-center">
                                        <div className="bg-white px-2 mb-2">
                                            {stage.status === 'completed' && <CheckCircle2 className="w-8 h-8 text-slate-900 bg-white rounded-full fill-slate-900" style={{ color: 'white' }} />}
                                            {stage.status === 'current' && <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center bg-white"><div className="w-3 h-3 rounded-full bg-transparent"></div></div>}
                                            {stage.status === 'pending' && <p className="text-sm text-gray-400 font-medium px-2 py-1 bg-white">{stage.name}</p>}
                                        </div>
                                        {stage.status !== 'pending' && <span className="text-sm font-bold text-gray-900">{stage.name}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Opportunity Details Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Opportunity Details</h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-4 mb-8">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Opportunity ID</p>
                                    <p className="font-medium text-gray-900">OP-001</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Industry</p>
                                    <p className="font-medium text-gray-900">Technology/Software</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Close Date</p>
                                    <p className="font-medium text-gray-900">2024-12-05</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Probability of Closure</p>
                                    <p className="font-medium text-gray-900">70%</p>
                                </div>
                            </div>

                            <h2 className="text-lg font-bold text-gray-900 mb-6">Financials</h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Expected Revenue</p>
                                    <p className="font-medium text-gray-900">$8,000</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Discount Offered</p>
                                    <p className="font-medium text-gray-900">10%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Subscription Details</p>
                                    <p className="font-medium text-gray-900">$80/user/year</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Competitor Pricing</p>
                                    <p className="font-medium text-gray-900">$85/user/year</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Sidebar Column (1/3 width) */}
                    <div className="flex flex-col gap-6">

                        {/* Contacts Widget */}
                        <div className="bg-white rounded-2xl shadow-sm border border-transparent p-0">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">Contacts <Plus className="w-4 h-4 ml-2 text-gray-400 cursor-pointer hover:text-gray-900" /></h3>
                                <button className="text-gray-400 hover:text-gray-900"><MoreHorizontal className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-4">
                                {/* Contact Card 1 */}
                                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-indigo-50 py-1.5 px-4 text-center text-xs font-semibold text-indigo-600 tracking-wide uppercase">Primary Contact</div>
                                    <div className="p-4 bg-white relative">
                                        <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-900"><MoreHorizontal className="w-4 h-4" /></button>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                <img src="https://i.pravatar.cc/150?img=1" alt="avatar" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">Jane Doe</p>
                                                <p className="text-xs text-gray-500">Product Manager</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> leslie@market.com</div>
                                            <div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> (208) 555-0112</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Company Widget */}
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Company</h3>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative">
                                <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-900"><MoreHorizontal className="w-4 h-4" /></button>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Code Sphere</p>
                                        <p className="text-sm text-gray-500">Technology</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Industry</p>
                                        <p className="text-sm font-medium text-gray-900">Technology</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Location</p>
                                        <p className="text-sm font-medium text-gray-900">Indonesia</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Employee Range</p>
                                        <p className="text-sm font-medium text-purple-600 bg-purple-50 inline-block px-2 py-0.5 rounded-md">100K+</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
