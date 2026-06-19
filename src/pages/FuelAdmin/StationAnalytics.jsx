import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie
} from 'recharts';
import { ArrowLeft, Download, TrendingUp, Zap, Clock, Star, CircleDot, Loader2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const FUEL_COLORS = ['#FBBF24', '#8B5CF6', '#10B981', '#3B82F6', '#EC4899'];

const StationAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [chartType, setChartType] = useState('Revenue');

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/admin/stations/${id}/analytics`);
        if (response.data?.success) {
          setAnalyticsData(response.data.data);
        } else {
          setError('Failed to load station analytics');
        }
      } catch (err) {
        console.error('Error fetching station analytics:', err);
        setError('An error occurred while loading station analytics.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnalytics();
    }
  }, [id]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await axiosInstance.get(`/admin/stations/${id}/export?format=json`);

      let exportData = response.data;
      if (typeof exportData === 'string') {
        try { exportData = JSON.parse(exportData); } catch (e) { console.warn('Failed to parse exportData', e); }
      }

      if (exportData && !Array.isArray(exportData) && Array.isArray(exportData.data)) {
        exportData = exportData.data;
      }

      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.setTextColor(236, 161, 42); // #ECA12A
      doc.text(`Station Analytics Report - ${id}`, 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      if (!Array.isArray(exportData) || exportData.length === 0) {
        doc.text('No data available for this period.', 14, 40);
      } else {
        const tableColumn = ["Date", "Revenue (INR)", "Tokens", "Fuel Type", "Avg Filling Time", "Rating"];

        const tableRows = exportData.map(row => [
          row.date || '-',
          row['Revenue (₹)'] ? `Rs. ${Number(row['Revenue (₹)']).toLocaleString('en-IN')}` : '-',
          row['Tokens'] || '-',
          row['Fuel Type'] || '-',
          row['Avg Filling Time (min)'] ? `${row['Avg Filling Time (min)']} min` : '-',
          row['Customer Rating'] || '-'
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 35,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [236, 161, 42] } // #ECA12A
        });
      }

      doc.save(`${id}_Station_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8]">
        <Loader2 className="w-8 h-8 text-[#ECA12A] animate-spin" />
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto text-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold">
          {error || 'Unable to load analytics data.'}
        </div>
      </div>
    );
  }

  // Fallbacks if data is missing
  const metrics = analyticsData.metricCards || {};
  const trendData = analyticsData.revenueTrends || [];
  const fuelData = analyticsData.fuelTypeDistribution || [];
  const pumps = analyticsData.pumpEfficiency || [];
  const timelineEvents = analyticsData.performancePeaks || [];

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6 pb-12">

      {/* Welcome Banner */}
      <div className="bg-[#ECA12A] rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          Welcome Back, {user?.username ? `Mr. ${user.username.split(' ')[0]}` : 'Mr. John'} 👋
        </h2>
        <p className="text-slate-800 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 hover:text-black mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">{analyticsData.stationName}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${analyticsData.status?.toLowerCase() === 'active' || analyticsData.status?.toLowerCase() === 'online'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
                }`}>
                {analyticsData.status || 'Unknown'}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">{analyticsData.stationId} • {analyticsData.location || 'No Location'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-white border border-slate-300 text-slate-700 px-3 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ECA12A]/20 focus:border-[#ECA12A]">
            <option>Last {analyticsData.period || 7} Days</option>
            <option>Today</option>
            <option>This Month</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${exporting
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-black text-white'
              }`}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Weekly Revenue</p>
          <p className="text-2xl font-black text-slate-900 mb-2">₹{(metrics.weeklyRevenue || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] font-bold text-slate-400">Total revenue generated</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
            <Zap className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Tokens Redeemed</p>
          <p className="text-2xl font-black text-slate-900 mb-2">{(metrics.tokensRedeemed || 0).toLocaleString()}</p>
          <p className="text-[10px] font-bold text-slate-400">Total tokens processed</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Avg. Filling Time</p>
          <p className="text-2xl font-black text-slate-900 mb-2">{metrics.avgFillingTime || 0} min</p>
          <p className="text-[10px] font-bold text-slate-400">Per vehicle average</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
            <Star className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Customer Satisfaction</p>
          <p className="text-2xl font-black text-slate-900 mb-2">{metrics.customerSatisfaction || '0.0'} / 5.0</p>
          <p className="text-[10px] font-bold text-slate-400">Based on user ratings</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-800">Revenue & Token Trends (Daily)</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setChartType('Revenue')}
                className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${chartType === 'Revenue' ? 'bg-[#ECA12A] text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Revenue
              </button>
              <button
                onClick={() => setChartType('Tokens')}
                className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${chartType === 'Tokens' ? 'bg-[#ECA12A] text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Tokens
              </button>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[280px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey={chartType === 'Revenue' ? 'revenue' : 'tokens'}
                    stroke="#ECA12A"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#ECA12A', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#ECA12A', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No trend data available</div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-2">Fuel Type Distribution</h3>
          <div className="flex-1 min-h-[280px] relative">
            {fuelData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fuelData}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                    >
                      {fuelData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={FUEL_COLORS[index % FUEL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Custom Legend */}
                <div className="absolute bottom-0 w-full flex flex-wrap justify-center gap-4 text-[9px] font-bold text-slate-500">
                  {fuelData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: FUEL_COLORS[idx % FUEL_COLORS.length] }}></div>
                      {item.name} - {item.value}%
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No distribution data</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pump Operational Efficiency */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-6">Pump Operational Efficiency</h3>
          <div className="space-y-6 flex-1">
            {pumps.length > 0 ? (
              pumps.map((pump, idx) => (
                <div key={pump.id || pump.pump || `pump-${idx}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-700">{pump.pump || pump.id || `Pump ${idx + 1}`}</span>
                    <span className="text-sm font-black text-slate-900">{pump.efficiency}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className="bg-slate-900 h-2.5 rounded-full"
                      style={{ width: `${pump.efficiency || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm pb-8">No pump efficiency data</div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-800">Performance Peaks</h3>
            {timelineEvents.length > 0 && (
              <button className="text-[10px] font-bold text-blue-500 hover:text-blue-700">View All &gt;</button>
            )}
          </div>

          <div className="relative flex-1">
            {timelineEvents.length > 0 ? (
              <>
                {/* Vertical Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-100"></div>

                <div className="space-y-6">
                  {timelineEvents.map((ev, idx) => (
                    <div key={ev.id || `${ev.title}-${ev.time}`} className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 z-10">
                        <CircleDot className="w-3 h-3 text-blue-500" />
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex justify-between items-start">
                          <p className="text-[11px] font-bold text-slate-800">{ev.title}</p>
                          <span className="text-[10px] font-medium text-slate-400">{ev.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{ev.desc}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 border border-emerald-200 text-emerald-600 bg-emerald-50 rounded text-[9px] font-bold">
                          {ev.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm pb-8">No performance peaks today</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default StationAnalytics;
