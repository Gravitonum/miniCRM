import { type ReactElement } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export function DashboardPage(): ReactElement {

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">
                {/* Header Section */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Overview of your activity and metrics.</p>
                </div>

                {/* Placeholder Blocks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Card 1 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-40 flex items-center justify-center text-gray-400 font-medium border-dashed border-2">
                        Block 1: Metrics
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-40 flex items-center justify-center text-gray-400 font-medium border-dashed border-2">
                        Block 2: Recent Activity
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-40 flex items-center justify-center text-gray-400 font-medium border-dashed border-2">
                        Block 3: Tasks
                    </div>
                </div>

                {/* Large Block */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-96 flex items-center justify-center text-gray-400 font-medium border-dashed border-2">
                    Main Content / Chart Area
                </div>
            </div>
        </DashboardLayout>
    );
}
