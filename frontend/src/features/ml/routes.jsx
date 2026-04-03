import React from 'react';
import { Route } from 'react-router-dom';
import CrowdDashboard from './pages/CrowdDashboard';
import MessCrowdDetail from './pages/MessCrowdDetail';
import ManagerCrowdOverview from './pages/ManagerCrowdOverview';
import CrowdAnalytics from './pages/CrowdAnalytics';

/**
 * ML / Crowd Monitoring feature routes.
 *
 * | Route                        | Component              | Access           |
 * |------------------------------|------------------------|------------------|
 * | /crowd                       | CrowdDashboard         | All auth users   |
 * | /crowd/mess/:messId          | MessCrowdDetail        | All auth users   |
 * | /manager/crowd               | ManagerCrowdOverview   | Mess Manager     |
 * | /manager/crowd/analytics     | CrowdAnalytics         | Mess Manager     |
 */
export const mlRoutes = (
  <>
    {/* Student views */}
    <Route path="/crowd" element={<CrowdDashboard />} />
    <Route path="/crowd/mess/:messId" element={<MessCrowdDetail />} />

    {/* Manager views */}
    <Route path="/manager/crowd" element={<ManagerCrowdOverview />} />
    <Route path="/manager/crowd/analytics" element={<CrowdAnalytics />} />
  </>
);

export default mlRoutes;
