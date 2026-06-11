import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';
import Pagination from '../../components/Pagination';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';

// Custom SVG Icons with strict dimensions to prevent layout shifts
const ClockIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const CheckCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const XCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const AlertIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const FileIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const DownloadDocIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><polyline points="8 12 12 16 16 12"/></svg>;
const DotsIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>;
const UsersQuestionIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8h.01"/><path d="M18.5 12c.33-1 1.5-1.5 2.5-1.5s2.5 1 2.5 2.5c0 1.5-1.5 2-2.5 3v1"/></svg>;

const ComplianceManagement = () => {
  const { user } = useSelector((state) => state.auth);

  const [complianceList, setComplianceList] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    missingDocs: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery;
      if (filterStatus) params.status = filterStatus;

      const response = await axiosInstance.get('/admin/compliance', { params });
      if (response.data.success) {
        setComplianceList(response.data.data);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, [filterStatus]); // Auto-fetch when filter status changes

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCompliance();
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  // Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentComplianceList = complianceList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(complianceList.length / itemsPerPage);

  const handleReview = async (requestId, status) => {
    try {
      const response = await axiosInstance.put(`/admin/compliance/${requestId}/review`, { status });
      if (response.data.success) {
        fetchCompliance();
      }
    } catch (error) {
      console.error(`Error updating compliance status:`, error);
    }
    setActiveDropdown(null);
  };

  const handleDownload = async (requestId) => {
    try {
      const response = await axiosInstance.get(`/admin/compliance/${requestId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `compliance_${requestId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      window.open(`${axiosInstance.defaults.baseURL}/admin/compliance/${requestId}/download`, '_blank');
    }
    setActiveDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (id) => {
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(id);
    }
  };

  return (
    <div className="w-full mx-auto space-y-6 relative font-sans">
      
      {/* Welcome Banner */}
      <div 
        className="bg-[#a2c8db] rounded-2xl relative flex items-center shadow-sm overflow-hidden w-full"
        style={{ height: '100px', padding: '1.5rem' }}
      >
        <div className="relative z-10">
          <h2 className="text-xl md:text-[22px] font-bold text-[#1b2b4d] flex items-center gap-2 m-0 p-0 leading-none">
            Welcome Back, Super admin 👋
          </h2>
          <p className="text-[#1b2b4d]/80 mt-2 text-sm font-medium leading-none">Have a good day..</p>
        </div>
      </div>

      {/* Stats Cards - Forced 5 columns using guaranteed flex layout */}
      <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full">
        {[
          { label: 'Total Requests', value: stats.totalRequests || '0', icon: UsersQuestionIcon, color: '#1b2b4d' },
          { label: 'Pending', value: stats.pending || '0', icon: ClockIcon, color: '#1b2b4d' },
          { label: 'Approved', value: stats.approved || '0', icon: CheckCircleIcon, color: '#1b2b4d' },
          { label: 'Rejected', value: stats.rejected || '0', icon: XCircleIcon, color: '#ef4444' },
          { label: 'Missing Docs', value: stats.missingDocs || '0', icon: AlertIcon, color: '#ef4444' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-white rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm flex-1"
            style={{ padding: '1.25rem', minWidth: '180px' }}
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-[13px] font-bold text-slate-500 m-0 leading-none">{stat.label}</h3>
              <p className="text-2xl font-black text-[#1b2b4d] m-0 leading-none">{stat.value}</p>
            </div>
            <div>
              <stat.icon style={{ width: '28px', height: '28px', color: stat.color, opacity: 0.8 }} strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm pb-4">
        
        {/* Table Header & Controls */}
        <div className="p-5 flex flex-wrap gap-4 items-center justify-between border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Compliance Management</h3>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by ID or Name" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-[#1b2b4d] text-sm w-64 transition-shadow"
                />
              </div>
              <button 
                onClick={handleSearch}
                className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-5 py-2 border border-[#1b2b4d] rounded-r-lg text-sm font-semibold transition-colors"
              >
                Search
              </button>
            </div>
            
            <div className="relative">
              <select
                value={filterStatus === '' ? 'default' : filterStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== 'default') {
                    handleFilterChange({ target: { value: val === 'all' ? '' : val } });
                  }
                }}
                className="appearance-none bg-[#1b2b4d] hover:bg-slate-800 text-white pl-9 pr-9 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm focus:outline-none cursor-pointer"
              >
                <option value="default" disabled hidden>Filter</option>
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-visible pb-16">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-slate-700 font-bold text-[13px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Request ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Entity Name</th>
                <th className="px-6 py-4">Entity Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4">Document</th>
                <th className="px-6 py-4 w-1/4">Notes</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentComplianceList.map((item, index) => (
                <tr key={item.requestId || index} className="hover:bg-slate-50 transition-colors text-slate-600 font-medium relative text-[13px]">
                  <td className="px-6 py-4 font-bold text-[#1b2b4d]">{item.requestId}</td>
                  
                  <td className="px-6 py-4">
                    <div 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        letterSpacing: '0.025em',
                        whiteSpace: 'nowrap',
                        width: 'max-content',
                        backgroundColor: item.type === 'KYC' ? '#eff6ff' : item.type === 'AML' ? '#faf5ff' : '#fff7ed',
                        color: item.type === 'KYC' ? '#3b82f6' : item.type === 'AML' ? '#a855f7' : '#f97316'
                      }}
                    >
                      {item.type}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 font-semibold text-slate-600">{item.entityName}</td>
                  
                  <td className="px-6 py-4">
                    <div 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        letterSpacing: '0.025em',
                        whiteSpace: 'nowrap',
                        width: 'max-content',
                        backgroundColor: item.entityType === 'Customer' ? '#eff6ff' : '#faf5ff',
                        color: item.entityType === 'Customer' ? '#3b82f6' : '#a855f7'
                      }}
                    >
                      {item.entityType}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div 
                      style={{
                        display: 'inline-flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        letterSpacing: '0.025em',
                        whiteSpace: 'nowrap',
                        width: 'max-content',
                        backgroundColor: item.status === 'Approved' ? '#ecfdf5' : item.status === 'Rejected' ? '#fef2f2' : '#fffbeb',
                        color: item.status === 'Approved' ? '#059669' : item.status === 'Rejected' ? '#dc2626' : '#d97706'
                      }}
                    >
                      {item.status === 'Approved' ? <CheckCircleIcon style={{ width: '14px', height: '14px', flexShrink: 0 }} /> : 
                       item.status === 'Rejected' ? <XCircleIcon style={{ width: '14px', height: '14px', flexShrink: 0 }} /> : 
                       <ClockIcon style={{ width: '14px', height: '14px', flexShrink: 0 }} />}
                      <span style={{ lineHeight: 1 }}>{item.status}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 font-semibold text-[#1b2b4d]">{item.submitted}</td>
                  
                  <td className="px-6 py-4">
                    <div 
                      style={{
                        display: 'inline-flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        width: 'max-content',
                        color: (item.document === 'Recieved' || item.document === 'Received') ? '#10b981' : '#ef4444'
                      }}
                    >
                      {(item.document === 'Recieved' || item.document === 'Received') ? <FileIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} /> : <AlertIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />}
                      <span>{item.document}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-normal min-w-[200px]">
                    <p className="text-[12px] text-slate-400 font-medium leading-tight">
                      {item.notes}
                    </p>
                  </td>
                  
                  <td className="px-6 py-4 text-center relative">
                    <button 
                      onClick={() => toggleDropdown(item.requestId)}
                      className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-800"
                    >
                      <DotsIcon className="w-5 h-5" />
                    </button>

                    {activeDropdown === item.requestId && (
                      <div 
                        ref={dropdownRef}
                        className="absolute bg-white rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.15)] border border-slate-100 z-50 py-2"
                        style={{ right: '40px', top: '100%', marginTop: '4px', width: '192px' }}
                      >
                        <button onClick={() => { setSelectedRequest(item); setActiveDropdown(null); }} className="w-full text-left px-5 py-2.5 text-sm font-bold text-[#1b2b4d]/80 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                          <Eye className="w-4 h-4 text-slate-500" strokeWidth={2.5} />
                          View details
                        </button>
                        <button onClick={() => handleReview(item.requestId, 'approved')} className="w-full text-left px-5 py-2.5 text-sm font-bold text-[#1b2b4d]/80 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                          <CheckCircleIcon className="w-4 h-4 text-slate-500" />
                          Approve
                        </button>
                        <button onClick={() => handleReview(item.requestId, 'rejected')} className="w-full text-left px-5 py-2.5 text-sm font-bold text-[#1b2b4d]/80 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                          <XCircleIcon className="w-4 h-4 text-slate-500" />
                          Reject
                        </button>
                        <button onClick={() => handleDownload(item.requestId)} className="w-full text-left px-5 py-2.5 text-sm font-bold text-[#1b2b4d] hover:bg-slate-50 flex items-center gap-3 transition-colors">
                          <DownloadDocIcon className="w-4 h-4 text-black" />
                          Download Document
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="p-4 border-t border-slate-200">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </div>
      </div>

      {/* View Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative border border-slate-200/50">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xl font-bold text-[#1b2b4d] flex items-center gap-3">
                  Request Details
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                    selectedRequest.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                    selectedRequest.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedRequest.status}
                  </span>
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1">ID: {selectedRequest.requestId}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="p-2.5 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Column: Info */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-bold text-[#1b2b4d] mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div> Basic Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entity Type</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.entityType || '-'}</span></div>
                      <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entity Name</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.entityName || '-'}</span></div>
                      <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</span><span className="text-[13px] font-bold text-slate-700 mt-1 truncate" title={selectedRequest.email}>{selectedRequest.email || '-'}</span></div>
                      <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Submitted On</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.submittedAt || selectedRequest.submitted || '-'}</span></div>
                    </div>
                  </div>

                  {/* Merchant/Customer Specific Info */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-bold text-[#1b2b4d] mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedRequest.entityType === 'Merchant' ? (
                        <>
                          <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Business Name</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.businessName || '-'}</span></div>
                          <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registration Number</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.registrationNumber || '-'}</span></div>
                          <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Owner Name</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.ownerFullName || '-'}</span></div>
                          <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.mobileNumber || '-'}</span></div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Document Type</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.documentType || '-'}</span></div>
                          <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Document Number</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.documentNumber || selectedRequest.nationalIdNumber || '-'}</span></div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bank Info (If present) */}
                  {selectedRequest.bankName && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <h4 className="text-sm font-bold text-[#1b2b4d] mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Bank Information
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bank Name</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.bankName}</span></div>
                        <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Number</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.accountNumber}</span></div>
                        <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Holder Name</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.bankHolderName}</span></div>
                        <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">IFSC Code</span><span className="text-[13px] font-bold text-slate-700 mt-1">{selectedRequest.ifscCode}</span></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Documents */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-[#1b2b4d] flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div> Documents Preview
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {['nationalIdDocument', 'documentFront', 'documentBack', 'selfiePhoto', 'bankPassbook'].map(key => {
                      const url = selectedRequest[key];
                      if (!url) return null;
                      const fullUrl = url.startsWith('http') ? url : `${axiosInstance.defaults.baseURL.replace('/api', '')}/${url}`;
                      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      return (
                        <div key={key} className="flex flex-col gap-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                          <a href={fullUrl} target="_blank" rel="noreferrer" className="w-full h-32 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden block group">
                            <img src={fullUrl} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                  {(!selectedRequest.nationalIdDocument && !selectedRequest.documentFront && !selectedRequest.selfiePhoto) && (
                    <div className="py-10 text-center text-slate-400 font-medium text-sm border-2 border-dashed border-slate-100 rounded-xl">
                      No documents available for preview
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              {(selectedRequest.status !== 'Approved' && selectedRequest.status !== 'Rejected') && (
                <>
                  <button 
                    onClick={() => { handleReview(selectedRequest.requestId, 'rejected'); setSelectedRequest(null); }} 
                    className="px-6 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors"
                  >
                    Reject KYC
                  </button>
                  <button 
                    onClick={() => { handleReview(selectedRequest.requestId, 'approved'); setSelectedRequest(null); }} 
                    className="px-6 py-2.5 rounded-xl bg-[#1b2b4d] text-white text-sm font-bold hover:bg-slate-800 transition-colors"
                  >
                    Approve KYC
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComplianceManagement;
