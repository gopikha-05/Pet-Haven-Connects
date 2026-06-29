import { useState, useEffect } from 'react';
import { useFetch } from '@/hooks/useFetch';
import ReportMetadataEditor from '@/components/admin/ReportMetadataEditor';
import ReportHistory from '@/components/admin/ReportHistory';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

// Print styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .report-print-area, .report-print-area * {
      visibility: visible;
    }
    .report-print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      margin: 0;
      padding: 20px;
      box-shadow: none;
    }
    button, .no-print {
      display: none !important;
    }
    @page {
      margin: 1cm;
    }
  }
`;

const REPORT_TYPES = [
  { id: 'adoptions', name: 'Adoption Report', description: 'Track all pet adoption applications, approvals, and completions' },
  { id: 'donations', name: 'Donation Report', description: 'Financial contributions and donation history' },
  { id: 'shelters', name: 'Shelter Performance Report', description: 'Shelter activity and performance metrics' },
  { id: 'veterinarians', name: 'Veterinarian Activity Report', description: 'Veterinarian engagement and service records' },
  { id: 'complaints', name: 'Complaint Report', description: 'User complaints and resolution tracking' },
  { id: 'users', name: 'User Registration Report', description: 'New user registrations and account status' },
  { id: 'pets', name: 'Pet Inventory Report', description: 'Pet listings, availability, and status' }
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [shelterFilter, setShelterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEditor, setShowEditor] = useState(null);
  const [generating, setGenerating] = useState(false);
  
  // Inject print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = printStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const { data: reportsMetadata, loading, refetch } = useFetch(() => 
    api.get('/reports/metadata/all').then(res => res.data).catch(() => ({}))
  );
  const { data: reportStats } = useFetch(() => 
    api.get('/reports/stats').then(res => res.data).catch(() => ({}))
  );
  const { data: shelters } = useFetch(() => 
    api.get('/admin/shelters').then(res => res.data).catch(() => [])
  );

  const handleViewReport = (reportType) => {
    setSelectedReport(reportType);
  };

  const handleEditMetadata = (reportType) => {
    setShowEditor(reportType);
  };

  const handleGenerateReport = async () => {
    // Validation
    if (!dateRange) {
      toast('Please select a date range', 'error');
      return;
    }
    
    setGenerating(true);
    try {
      // Update metadata for all reports with current date range
      const reportTypes = REPORT_TYPES.map(r => r.id);
      
      for (const reportType of reportTypes) {
        try {
          // Fetch current report data to get record count
          const reportResponse = await api.get(`/reports/${reportType}?period=${dateRange}`);
          const recordCount = reportResponse.data?.details?.length || 0;
          
          // Update metadata
          await api.put(`/reports/metadata/${reportType}`, {
            status: 'ready',
            lastUpdated: new Date().toISOString(),
            updatedBy: 'Admin',
            recordCount: recordCount
          });
        } catch (error) {
          console.error(`Failed to update metadata for ${reportType}:`, error);
        }
      }
      
      toast('Reports generated successfully with latest data', 'success');
      refetch();
    } catch (error) {
      console.error('Failed to generate reports:', error);
      toast('Failed to generate reports', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const { toast } = useToast();

  if (selectedReport) {
    return <DetailedReport reportType={selectedReport} onBack={() => setSelectedReport(null)} dateRange={dateRange} />;
  }

  if (showEditor) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowEditor(null)}
          className="mb-4 text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Back to Reports
        </button>
        <ReportMetadataEditor
          reportType={showEditor}
          metadata={reportsMetadata?.[showEditor]}
          onSave={async (data) => {
            try {
              await api.put(`/reports/metadata/${showEditor}`, data);
              toast('Metadata saved successfully', 'success');
              setShowEditor(null);
              refetch();
            } catch (error) {
              console.error('Failed to save metadata:', error);
              toast('Failed to save metadata', 'error');
            }
          }}
          onCancel={() => setShowEditor(null)}
        />
      </div>
    );
  }

  const filteredReports = REPORT_TYPES.filter(report => {
    if (reportTypeFilter !== 'all' && report.id !== reportTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Report Management</h1>
        <p className="text-slate-500 mt-1">Generate, manage, and export system reports</p>
      </div>

      {/* Report Management Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Total Reports</p>
          <p className="text-2xl font-bold text-slate-800">{REPORT_TYPES.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Generated Today</p>
          <p className="text-2xl font-bold text-emerald-600">{reportStats?.generatedToday || 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Pending Reports</p>
          <p className="text-2xl font-bold text-amber-600">{reportStats?.pending || 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Auto Sync Status</p>
          <p className="text-2xl font-bold text-blue-600">Active</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
            <select
              value={reportTypeFilter}
              onChange={(e) => setReportTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Reports</option>
              {REPORT_TYPES.map(report => (
                <option key={report.id} value={report.id}>{report.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Shelter</label>
            <select
              value={shelterFilter}
              onChange={(e) => setShelterFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Shelters</option>
              {shelters?.map(shelter => (
                <option key={shelter._id} value={shelter._id}>{shelter.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="ready">Ready</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={generating}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {filteredReports.map(report => {
          const metadata = reportsMetadata?.[report.id] || {};
          const status = metadata.status || 'ready';
          const statusColors = {
            ready: 'bg-emerald-100 text-emerald-700',
            draft: 'bg-slate-100 text-slate-700',
            published: 'bg-blue-100 text-blue-700'
          };

          return (
            <div key={report.id} className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-800">{report.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status]}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{report.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-slate-500">Generated Date</p>
                  <p className="font-medium text-slate-800">
                    {metadata.lastUpdated ? new Date(metadata.lastUpdated).toLocaleDateString() : 'Not generated'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Last Updated</p>
                  <p className="font-medium text-slate-800">
                    {metadata.lastUpdated ? new Date(metadata.lastUpdated).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Generated By</p>
                  <p className="font-medium text-slate-800">
                    {metadata.updatedBy ? 'Admin' : 'System'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Total Records</p>
                  <p className="font-medium text-slate-800">
                    {metadata.recordCount || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleViewReport(report.id)}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  View Report
                </button>
                <button
                  type="button"
                  onClick={() => handleEditMetadata(report.id)}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50"
                >
                  Edit Metadata
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(report.id, dateRange, toast)}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadCSV(report.id, dateRange, toast)}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50"
                >
                  Download CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleEmailReport(report.id, dateRange, toast)}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50"
                >
                  Email Report
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintReport(report.id)}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50"
                >
                  Print
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report History */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Report History</h2>
        <div className="space-y-3">
          {reportStats?.recentHistory?.map((history, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-800">{history.reportName}</p>
                <p className="text-sm text-slate-500">{history.action} by {history.performedBy}</p>
              </div>
              <p className="text-sm text-slate-500">
                {new Date(history.timestamp).toLocaleString()}
              </p>
            </div>
          )) || (
            <p className="text-slate-500 text-center py-4">No recent report history</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions for report actions
const handleDownloadPDF = async (reportType, dateRange, toast) => {
  try {
    const response = await api.get(`/reports/download/${reportType}/pdf?period=${dateRange}`, {
      responseType: 'blob'
    });
    
    // Check if response is valid
    if (!response.data || response.data.size === 0) {
      throw new Error('Empty response from server');
    }
    
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PetHavenConnect_${reportType.charAt(0).toUpperCase() + reportType.slice(1)}Report_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast('PDF downloaded successfully', 'success');
  } catch (error) {
    console.error('Error downloading PDF:', error);
    toast(error.response?.data?.message || 'Failed to download PDF', 'error');
  }
};

const handleDownloadCSV = async (reportType, dateRange, toast) => {
  try {
    const response = await api.get(`/reports/download/${reportType}/csv?period=${dateRange}`, {
      responseType: 'blob'
    });
    
    // Check if response is valid
    if (!response.data || response.data.size === 0) {
      throw new Error('Empty response from server');
    }
    
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast('CSV downloaded successfully', 'success');
  } catch (error) {
    console.error('Error downloading CSV:', error);
    toast(error.response?.data?.message || 'Failed to download CSV', 'error');
  }
};

const handleEmailReport = async (reportType, dateRange, toast) => {
  try {
    const response = await api.post(`/reports/share/${reportType}`, {
      email: 'admin@pethaven.com',
      format: 'txt',
      period: dateRange
    });
    
    if (response.data?.success) {
      toast('Report sent via email successfully', 'success');
    } else {
      toast('Failed to send email', 'error');
    }
  } catch (error) {
    console.error('Error emailing report:', error);
    toast(error.response?.data?.message || 'Failed to email report', 'error');
  }
};

const handlePrintReport = (reportType) => {
  window.print();
};

function DetailedReport({ reportType, onBack, dateRange }) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStep, setEmailStep] = useState('');
  const [emailHistory, setEmailHistory] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const { toast } = useToast();

  const { data: reportData, loading, refetch } = useFetch(() => 
    api.get(`/reports/${reportType}?period=${dateRange}`).then(res => res.data)
  );
  const { data: metadata } = useFetch(() => 
    api.get(`/reports/metadata/${reportType}`).then(res => res.data)
  );
  const { data: history } = useFetch(() => 
    api.get(`/reports/history/${reportType}`).then(res => res.data)
  );

  // Refetch data when report opens to ensure latest database values
  useEffect(() => {
    refetch();
  }, [reportType, dateRange]);

  const handleDownloadCSV = async () => {
    try {
      setDownloading('csv');
      const response = await api.get(`/reports/download/${reportType}/csv?period=${dateRange}`, {
        responseType: 'blob'
      });
      
      // Check if response is valid
      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast('CSV downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast(error.response?.data?.message || 'Failed to download CSV', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading('pdf');
      const response = await api.get(`/reports/download/${reportType}/pdf?period=${dateRange}`, {
        responseType: 'blob'
      });
      
      // Check if response is valid
      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PetHavenConnect_${reportType.charAt(0).toUpperCase() + reportType.slice(1)}Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast(error.response?.data?.message || 'Failed to download PDF', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const handleShareEmail = async () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast('Please enter a valid email address', 'error');
      return;
    }
    
    setSendingEmail(true);
    setEmailStep('Preparing report...');
    
    try {
      setEmailStep('Attaching PDF...');
      
      const response = await api.post(`/reports/share/${reportType}`, {
        email,
        subject: emailSubject,
        message: emailMessage,
        format: 'pdf',
        period: dateRange
      });
      
      setEmailStep('Sending email...');
      
      if (response.data?.success) {
        // Add to email history
        const newHistoryItem = {
          reportName: reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report',
          recipient: email,
          sentBy: 'Admin',
          sentAt: new Date().toLocaleString(),
          status: 'Delivered'
        };
        setEmailHistory(prev => [newHistoryItem, ...prev]);
        
        toast(`Report has been emailed successfully to ${email}`, 'success');
        setShowEmailModal(false);
        setEmail('');
        setEmailSubject('');
        setEmailMessage('');
      } else {
        toast('Failed to send email. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      toast(error.response?.data?.message || 'Failed to send email. Please check your connection.', 'error');
    } finally {
      setSendingEmail(false);
      setEmailStep('');
    }
  };

  const handleOpenEmailModal = () => {
    // Auto-fill with admin email (in real app, get from user context)
    const adminEmail = localStorage.getItem('userEmail') || 'admin@pethaven.com';
    setEmail(adminEmail);
    
    // Auto-generate subject
    const reportName = reportType.charAt(0).toUpperCase() + reportType.slice(1);
    setEmailSubject(`${reportName} Report - Pet Haven Connect`);
    
    // Default message
    setEmailMessage(`Hello,\n\nPlease find the attached report generated from the Pet Haven Connect system.\n\nThe report is attached as a PDF for your reference.\n\nRegards,\nPet Haven Connect Team`);
    
    setShowEmailModal(true);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Not Available';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Not Available';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatAdoptionDate = (adoptionCompletionDate, status) => {
    if (status === 'completed' && adoptionCompletionDate) {
      return formatDate(adoptionCompletionDate);
    }
    if (status === 'pending') return 'Pending Completion';
    if (status === 'approved' || status === 'payment_pending') return 'Awaiting Payment';
    if (status === 'payment_completed') return 'Awaiting Delivery Selection';
    if (status === 'pickup_scheduled') return 'Pickup Scheduled';
    if (status === 'out_for_delivery') return 'Out for Delivery';
    return 'Not Available';
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number' && isNaN(value)) return '-';
    if (key.includes('amount') || key.includes('total')) return `₹${Math.round(Number(value))}`;
    if (key.includes('avg') && (value === 0 || value === null || value === undefined)) return 'N/A';
    return value;
  };

  const handlePrint = () => {
    window.print();
  };

  const getTableColumns = () => {
    switch (reportType) {
      case 'donations':
        return [
          { key: 'adopterName', label: 'Donor' },
          { key: 'shelterName', label: 'Shelter' },
          { key: 'petName', label: 'Pet' },
          { key: 'amount', label: 'Amount' },
          { key: 'paymentMethod', label: 'Payment Method' },
          { key: 'date', label: 'Date' },
          { key: 'status', label: 'Status' }
        ];
      case 'adoptions':
        return [
          { key: 'adopterName', label: 'Applicant' },
          { key: 'petName', label: 'Pet' },
          { key: 'shelterName', label: 'Shelter' },
          { key: 'submittedAt', label: 'Application Date' },
          { key: 'status', label: 'Status' },
          { key: 'completedAt', label: 'Adoption Date' }
        ];
      default:
        return Object.keys(reportData?.details?.[0] || {}).map(key => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1) }));
    }
  };

  const getFilteredAndSortedData = () => {
    if (!reportData?.details) return [];
    
    let data = [...reportData.details];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item => 
        Object.values(item).some(val => {
          if (val === null || val === undefined) return false;
          const strVal = String(val).toLowerCase();
          return strVal.includes(query);
        })
      );
    }
    
    // Sort
    data.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      // Handle null/undefined values
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (sortBy === 'date' || sortBy === 'submittedAt' || sortBy === 'completedAt' || sortBy === 'updatedAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
        if (isNaN(aVal.getTime())) return 1;
        if (isNaN(bVal.getTime())) return -1;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    // Pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  };

  if (loading || !reportData) {
    return (
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Back to Reports
        </button>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading report...</p>
        </div>
      </div>
    );
  }

  const columns = getTableColumns();
  const filteredData = getFilteredAndSortedData();
  const totalPages = Math.ceil((reportData.details?.length || 0) / 10);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-primary-600 hover:text-primary-700 font-medium"
      >
        ← Back to Reports
      </button>
      
      <div className="report-print-area bg-white rounded-xl border p-6 shadow-sm mb-6">
        {/* Report Header */}
        <div className="flex justify-between items-start mb-6 pb-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h2>
            <div className="flex gap-4 mt-2 text-sm text-slate-500">
              <span>Generated: {metadata?.lastUpdated ? new Date(metadata.lastUpdated).toLocaleString() : new Date().toLocaleString()}</span>
              <span>By: {metadata?.updatedBy ? 'Admin' : 'System'}</span>
              <span>Status: <span className={`px-2 py-0.5 rounded-full text-xs ${
                metadata?.status === 'published' ? 'bg-blue-100 text-blue-700' :
                metadata?.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>{metadata?.status || 'Ready'}</span></span>
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={downloading === 'csv'}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              {downloading === 'csv' ? 'Downloading...' : 'Download CSV'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloading === 'pdf'}
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {downloading === 'pdf' ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={handleOpenEmailModal}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50"
            >
              Email
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50"
            >
              Print
            </button>
          </div>
        </div>

        {/* Summary Section */}
        <div className="grid sm:grid-cols-4 gap-4 mb-6">
          {Object.entries(reportData).filter(([key]) => key !== 'details' && typeof reportData[key] !== 'object').map(([key, value]) => (
            <div key={key} className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-500 mb-1 capitalize">{key}</p>
              <p className="text-xl font-bold text-slate-800">{formatValue(value, key)}</p>
            </div>
          ))}
        </div>

        {/* Executive Summary */}
        {metadata?.executiveSummary && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-slate-800 mb-2">Executive Summary</h3>
            <p className="text-sm text-slate-600">{metadata.executiveSummary}</p>
          </div>
        )}

        {/* Search and Sort */}
        <div className="flex gap-4 mb-4 no-print">
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {columns.map(col => (
              <option key={col.key} value={col.key}>Sort by {col.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border rounded-lg hover:bg-slate-50"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Detailed Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {columns.map(col => (
                  <th key={col.key} className="text-left py-3 px-4 font-medium text-slate-700">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={index} className="border-b hover:bg-slate-50">
                  {columns.map(col => (
                    <td key={col.key} className="py-3 px-4 text-slate-600">
                      {col.key.includes('amount') ? `₹${row[col.key] || 0}` : 
                       col.key === 'completedAt' ? formatAdoptionDate(row[col.key], row.status) :
                       col.key.includes('date') || col.key.includes('At') ? formatDate(row[col.key]) :
                       row[col.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 no-print">
            <p className="text-sm text-slate-500">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, reportData.details?.length || 0)} of {reportData.details?.length || 0} records
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">{page} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {metadata?.recommendations && (
          <div className="bg-emerald-50 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-emerald-900 mb-2">Recommendations</h3>
            <p className="text-sm text-emerald-800">{metadata.recommendations}</p>
          </div>
        )}
      </div>

      {/* Report History */}
      {history && history.length > 0 && (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Report History</h3>
          <div className="space-y-3">
            {history.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">{item.action}</p>
                  <p className="text-sm text-slate-500">by {item.performedBy}</p>
                </div>
                <p className="text-sm text-slate-500">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Share Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Send Report via Email</h3>
            
            {sendingEmail ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">{emailStep}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Report Name (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Report Name</label>
                  <input
                    type="text"
                    value={reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report'}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-600"
                  />
                </div>

                {/* Recipient Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message (Optional)</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                {/* Attachment Preview */}
                <div className="bg-slate-50 border rounded-lg p-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Attachment</label>
                  <div className="flex items-center gap-2">
                    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-slate-600">
                      {reportType.charAt(0).toUpperCase() + reportType.slice(1)}Report.pdf
                    </span>
                  </div>
                </div>

                {/* Email History */}
                {emailHistory.length > 0 && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Recent Email History</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {emailHistory.slice(0, 3).map((item, index) => (
                        <div key={index} className="text-xs bg-slate-50 p-2 rounded">
                          <div className="font-medium text-slate-700">{item.recipient}</div>
                          <div className="text-slate-500">{item.reportName} - {item.sentAt}</div>
                          <div className="text-green-600">{item.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={handleShareEmail}
                disabled={sendingEmail}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmail('');
                  setEmailSubject('');
                  setEmailMessage('');
                }}
                disabled={sendingEmail}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
