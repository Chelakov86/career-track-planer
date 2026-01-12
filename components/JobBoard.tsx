import React, { useState } from 'react';
import { JobApplication, ApplicationStatus, RoleFocus, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, Trash2, ExternalLink, Filter, ChevronRight, MapPin, DollarSign, Search, Pencil, X, Download } from 'lucide-react';

interface JobBoardProps {
  jobs: JobApplication[];
  onAddJob: (job: JobApplication) => void;
  onEditJob: (job: JobApplication) => void;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onDeleteJob: (id: string) => void;
  language: Language;
}

export const JobBoard: React.FC<JobBoardProps> = ({ jobs, onAddJob, onEditJob, onUpdateStatus, onDeleteJob, language }) => {
  const [filter, setFilter] = useState<RoleFocus | 'All'>('All');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<JobApplication>>({});

  const t = TRANSLATIONS[language];
  const columns = Object.values(ApplicationStatus);

  const openAddModal = () => {
    setFormData({
      company: '',
      position: '',
      location: '',
      salary: '',
      link: '',
      notes: '',
      status: ApplicationStatus.RESEARCH,
      roleType: 'PM'
    });
    setShowModal(true);
  };

  const openEditModal = (job: JobApplication) => {
    setFormData({ ...job });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.company || !formData.position) return;
    
    if (formData.id) {
      // Edit existing
      onEditJob({
        ...formData,
        lastUpdated: new Date().toISOString().split('T')[0]
      } as JobApplication);
    } else {
      // Create new
      const job: JobApplication = {
        id: Math.random().toString(36).substr(2, 9),
        company: formData.company!,
        position: formData.position!,
        location: formData.location || 'Remote',
        status: formData.status || ApplicationStatus.RESEARCH,
        roleType: formData.roleType || 'PM',
        dateAdded: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        notes: formData.notes || '',
        salary: formData.salary,
        link: formData.link,
      };
      onAddJob(job);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteJob(deleteId);
      setDeleteId(null);
    }
  };

  const handleExportCSV = () => {
    // BOM for Excel to recognize UTF-8
    const BOM = "\uFEFF"; 
    
    const headers = [
      t.board.placeholders.company,
      t.board.placeholders.position,
      t.board.labels.status,
      t.board.labels.role,
      t.board.labels.location,
      t.board.labels.salary,
      t.board.labels.link,
      t.board.labels.dateAdded,
      t.board.labels.lastUpdated,
      t.board.labels.notes
    ];

    const escapeCsv = (str: string | undefined) => {
      if (!str) return '""';
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      headers.join(','),
      ...jobs.map(job => [
        escapeCsv(job.company),
        escapeCsv(job.position),
        escapeCsv(t.board.status[job.status]),
        escapeCsv(job.roleType),
        escapeCsv(job.location),
        escapeCsv(job.salary),
        escapeCsv(job.link),
        escapeCsv(job.dateAdded),
        escapeCsv(job.lastUpdated),
        escapeCsv(job.notes?.replace(/\n/g, ' '))
      ].join(','))
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `career_track_jobs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getNextStatus = (current: ApplicationStatus): ApplicationStatus | null => {
    const idx = columns.indexOf(current);
    if (idx < columns.length - 1) return columns[idx + 1];
    return null;
  };

  const filteredJobs = jobs.filter(j => filter === 'All' || j.roleType === filter);

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col relative">
      
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
             <div className="flex flex-col items-center text-center gap-4">
               <div className="p-3 bg-red-50 rounded-full">
                 <Trash2 className="w-8 h-8 text-red-500" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-gray-900">
                   {t.board.deleteTitle}
                 </h3>
                 <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                   {t.board.deleteMessage}
                 </p>
               </div>
               <div className="flex gap-3 w-full mt-2">
                 <button 
                   onClick={() => setDeleteId(null)}
                   className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                 >
                   {t.board.cancel}
                 </button>
                 <button 
                   onClick={confirmDelete}
                   className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                 >
                   {t.board.confirmDelete}
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Add/Edit Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-gray-800">
                 {formData.id ? t.board.editJob : t.board.newOpp}
               </h3>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             <div className="p-6 overflow-y-auto custom-scrollbar">
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.board.placeholders.company}*</label>
                    <input
                      placeholder={t.board.placeholders.company}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      value={formData.company}
                      onChange={e => setFormData({...formData, company: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.board.placeholders.position}*</label>
                    <input
                      placeholder={t.board.placeholders.position}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      value={formData.position}
                      onChange={e => setFormData({...formData, position: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.board.labels.status}</label>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as ApplicationStatus})}
                    >
                      {columns.map(status => (
                        <option key={status} value={status}>{t.board.status[status]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.board.labels.role}</label>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                      value={formData.roleType}
                      onChange={e => setFormData({...formData, roleType: e.target.value as RoleFocus})}
                    >
                      <option value="PM">PM</option>
                      <option value="QA">QA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.board.labels.location}</label>
                    <input
                      placeholder={t.board.placeholders.location}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.board.labels.salary}</label>
                    <input
                      placeholder={t.board.placeholders.salary}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      value={formData.salary || ''}
                      onChange={e => setFormData({...formData, salary: e.target.value})}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.board.labels.link}</label>
                    <div className="flex gap-2">
                      <input
                        placeholder={t.board.placeholders.link}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        value={formData.link || ''}
                        onChange={e => setFormData({...formData, link: e.target.value})}
                      />
                      {formData.link && (
                        <a href={formData.link} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200">
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t.board.labels.notes}</label>
                    <textarea
                      placeholder={t.board.placeholders.notes}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[80px]"
                      value={formData.notes || ''}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
               </div>
             </div>

             <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
               <button 
                 onClick={() => setShowModal(false)}
                 className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-white hover:border-gray-300 transition-colors"
               >
                 {t.board.cancel}
               </button>
               <button 
                 onClick={handleSave}
                 disabled={!formData.company || !formData.position}
                 className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {t.board.save}
               </button>
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">{t.board.title}</h2>
           <p className="text-gray-500 text-sm">{t.board.subtitle}</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
            title={t.board.exportCSV}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t.board.exportCSV}</span>
          </button>

          <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
            {['All', 'PM', 'QA'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t.board.addJob}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex gap-4 min-w-[1200px] h-full">
          {columns.map(status => (
            <div key={status} className="flex-1 flex flex-col bg-gray-50 rounded-xl border border-gray-200 min-w-[280px]">
              <div className={`p-3 border-b border-gray-200 rounded-t-xl font-semibold text-sm flex justify-between items-center ${
                status === ApplicationStatus.REJECTED ? 'bg-red-50 text-red-700' : 
                status === ApplicationStatus.OFFER ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {t.board.status[status]}
                <span className="bg-white px-2 py-0.5 rounded-full text-xs border shadow-sm">
                  {filteredJobs.filter(j => j.status === status).length}
                </span>
              </div>
              
              <div className="p-2 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                {filteredJobs.filter(j => j.status === status).map(job => (
                  <div key={job.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        job.roleType === 'PM' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'
                      }`}>
                        {job.roleType}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(job)}
                          className="text-gray-400 hover:text-indigo-600 p-1 hover:bg-gray-50 rounded"
                          title={t.board.editJob}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(job.id)}
                          className="text-gray-400 hover:text-red-500 p-1 hover:bg-gray-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-800 text-sm truncate pr-4">{job.position}</h4>
                    <p className="text-gray-500 text-xs mb-2 font-medium">{job.company}</p>
                    
                    <div className="flex flex-col gap-1 mb-3">
                       <div className="flex items-center gap-1 text-gray-400 text-xs">
                         <MapPin className="w-3 h-3" /> {job.location}
                       </div>
                       {job.salary && (
                         <div className="flex items-center gap-1 text-gray-400 text-xs">
                           <DollarSign className="w-3 h-3" /> {job.salary}
                         </div>
                       )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                      <span className="text-[10px] text-gray-400">{job.lastUpdated}</span>
                      
                      {getNextStatus(job.status) && (
                        <button 
                          onClick={() => onUpdateStatus(job.id, getNextStatus(job.status)!)}
                          className="p-1 rounded-full hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                          title={`-> ${t.board.status[getNextStatus(job.status)!]}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};