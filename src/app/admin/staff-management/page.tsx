"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  UsersIcon,
  CheckCircleIcon,
  XMarkIcon,
  AtSymbolIcon,
  PhoneIcon,
  BriefcaseIcon,
  CalendarIcon,
  DocumentTextIcon,
  IdentificationIcon,
  AcademicCapIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { staffAPI } from '@/lib/api';

export default function StaffManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [staffList, setStaffList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Thêm state cho modal chi tiết
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // State cho avatar upload
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lấy danh sách nhân viên
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLoadingData(true);
    staffAPI.getAll()
      .then((data) => setStaffList(Array.isArray(data) ? data : []))
      .catch(() => setError('Không thể tải danh sách nhân viên.'))
      .finally(() => setLoadingData(false));
  }, [user]);

  // Lọc danh sách
  const filteredStaff = staffList
    .filter((staff) => staff.role === 'staff')
    .filter((staff) => {
      const matchesSearch =
        staff.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  // Xử lý xóa nhân viên
  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await staffAPI.delete(deleteId);
      setStaffList((prev) => prev.filter((s) => s._id !== deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch {
      setError('Xóa nhân viên thất bại.');
    }
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  // Xử lý redirect trực tiếp trong render thay vì useEffect
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p style={{ marginLeft: 16, color: '#6366f1', fontWeight: 600 }}>Đang tải...</p>
      </div>
    );
  }
  if (!user || user.role !== 'admin') {
    if (typeof window !== 'undefined') {
      router.replace('/');
    }
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}>
                <UsersIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Quản lý nhân viên
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Tổng số: {filteredStaff.length} nhân viên
                </p>
              </div>
            </div>
            
          </div>
        </div>
        {/* Search and Filter Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            alignItems: 'end'
          }}>
            {/* Search Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Tìm kiếm
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, SĐT..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                />
                <MagnifyingGlassIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  color: '#9ca3af'
                }} />
              </div>
            </div>
            {/* Status Filter */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Trạng thái
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang làm</option>
                <option value="inactive">Nghỉ việc</option>
              </select>
            </div>
            {/* Results Count */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#6366f1',
                margin: 0,
                fontWeight: 600
              }}>
                Hiển thị: {filteredStaff.length} nhân viên
              </p>
            </div>
          </div>
        </div>
        {/* Staff Table */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Nhân viên</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>SĐT</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Vị trí</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loadingData ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td></tr>
                ) : filteredStaff.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    <UsersIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: '#d1d5db' }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#374151' }}>Không tìm thấy nhân viên</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc</p>
                  </td></tr>
                ) : filteredStaff.map((staff, index) => (
                  <tr
                    key={staff._id}
                    style={{
                      borderBottom: index < filteredStaff.length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          overflow: 'hidden'
                        }}>
                          {staff.avatar ? (
                            <img src={staff.avatar} alt={staff.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            staff.full_name?.charAt(0) || 'N'
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0 }}>{staff.full_name}</p>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>ID: {staff._id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{staff.email}</td>
                    <td style={{ padding: '1rem' }}>{staff.phone}</td>
                    <td style={{ padding: '1rem' }}>{staff.position}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setShowDetailModal(true);
                          }}
                          title="Xem chi tiết"
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.background = '#3b82f6';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                            e.currentTarget.style.color = '#3b82f6';
                          }}
                        >
                          <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Modal xác nhận xóa */}
        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#111827' }}>
                Xác nhận xóa nhân viên
              </h3>
              <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
                Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={cancelDelete}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDelete}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal xem chi tiết nhân viên */}
        {showDetailModal && selectedStaff && selectedStaff.role === 'staff' && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15,23,42,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(12px)',
            padding: '1rem'
          }}>
            <div style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1.5rem',
              padding: '2rem',
              maxWidth: '1000px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 32px 80px -12px rgba(15,23,42,0.3), 0 0 0 1px rgba(226,232,240,0.5)',
              position: 'relative',
              animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(226,232,240,0.5)',
              marginTop: '90px',
              marginLeft: '100px'
            }}>
              {/* Button đóng */}
              <button
                title="Đóng"
                onClick={() => setShowDetailModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#475569',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  boxShadow: '0 4px 12px rgba(100,116,139,0.15), inset 0 1px 0 rgba(255,255,255,0.7)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                
                onMouseOver={e => { 
                  e.currentTarget.style.background = 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 100%)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={e => { 
                  e.currentTarget.style.background = 'linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>

              {/* Header với avatar và thông tin cơ bản */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  position: 'relative',
                  width: '80px',
                  height: '80px',
                  marginBottom: '1rem',
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1.75rem',
                    overflow: 'hidden',
                    boxShadow: '0 12px 32px rgba(99,102,241,0.25), 0 0 0 3px rgba(255,255,255,0.8)',
                    border: '2px solid rgba(255,255,255,0.9)',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                  }}
                    onClick={() => fileInputRef.current?.click()}
                    title="Đổi ảnh đại diện"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : selectedStaff.avatar ? (
                      <img src={selectedStaff.avatar} alt={selectedStaff.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      selectedStaff.full_name?.charAt(0) || 'N'
                    )}
                    {/* Overlay icon camera */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      borderRadius: '50%',
                      padding: 6,
                      boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
                      border: '2px solid #fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                      onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      title="Tải ảnh lên"
                    >
                      <CameraIcon style={{ width: 18, height: 18, color: 'white' }} />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => setAvatarPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
                {/* Nút lưu avatar nếu có preview */}
                {avatarPreview && (
                  <button
                    style={{
                      marginTop: 8,
                      padding: '0.5rem 1.25rem',
                      borderRadius: '1rem',
                      background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                      color: 'white',
                      fontWeight: 600,
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => {
                      // Demo: cập nhật avatar local, không gọi API
                      setSelectedStaff((prev: any) => ({ ...prev, avatar: avatarPreview }));
                      setAvatarPreview(null);
                    }}
                  >
                    Lưu ảnh đại diện
                  </button>
                )}
                
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  margin: '0 0 0.5rem 0', 
                  color: '#0f172a', 
                  letterSpacing: '-0.02em'
                }}>
                  {selectedStaff.full_name}
                </h2>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  padding: '0.5rem 1rem',
                  borderRadius: '1.5rem',
                  border: '1px solid rgba(226,232,240,0.8)',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.08)'
                }}>
                  <IdentificationIcon style={{ width: '1rem', height: '1rem', color: '#6366f1' }} />
                  <span style={{ 
                    color: '#334155', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    letterSpacing: '0.025em'
                  }}>
                    ID: {selectedStaff._id}
                  </span>
                </div>
              </div>

              {/* Thông tin chi tiết trong card */}
              <div style={{
                background: 'rgba(255,255,255,0.7)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(226,232,240,0.6)',
                boxShadow: '0 8px 24px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <UsersIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6366f1' }} />
                  Thông tin nhân viên
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  <DetailRow 
                    icon={<AtSymbolIcon style={{ width: '1rem', height: '1rem', color: '#6366f1' }} />} 
                    label="Email" 
                    value={selectedStaff.email} 
                  />
                  <DetailRow 
                    icon={<PhoneIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />} 
                    label="Số điện thoại" 
                    value={selectedStaff.phone} 
                  />
                  <DetailRow 
                    icon={<BriefcaseIcon style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />} 
                    label="Vị trí" 
                    value={selectedStaff.position} 
                  />
                  <DetailRow 
                    icon={<AcademicCapIcon style={{ width: '1rem', height: '1rem', color: '#0ea5e9' }} />} 
                    label="Bằng cấp" 
                    value={selectedStaff.qualification} 
                  />
                  <DetailRow 
                    icon={<CheckCircleIcon style={{ width: '1rem', height: '1rem', color: selectedStaff.status === 'active' ? '#10b981' : '#6b7280' }} />} 
                    label="Trạng thái" 
                    value={selectedStaff.status === 'active' ? 'Đang làm việc' : 'Nghỉ việc'} 
                    badge={selectedStaff.status} 
                  />
                  <DetailRow 
                    icon={<CalendarIcon style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />} 
                    label="Ngày vào làm" 
                    value={selectedStaff.join_date ? new Date(selectedStaff.join_date).toLocaleDateString('vi-VN') : ''} 
                  />
                  <div style={{
                    gridColumn: '1 / -1',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <DocumentTextIcon style={{ width: '1rem', height: '1rem', color: '#a78bfa', marginTop: '0.125rem' }} />
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#0f172a'
                      }}>
                        Ghi chú
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#374151',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      marginLeft: '1.5rem'
                    }}>
                      {selectedStaff.notes || 'Không có ghi chú'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer với action buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(226,232,240,0.6)'
              }}>
                
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component DetailRow được cải thiện
function DetailRow({ label, value, badge, icon }: { label: string, value: string, badge?: string, icon?: React.ReactNode }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '0.25rem',
      padding: '0.75rem',
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '0.5rem',
      border: '1px solid rgba(226,232,240,0.5)',
      boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem' 
      }}>
        {icon}
        <span style={{ 
          color: '#334155', 
          fontWeight: 600, 
          fontSize: '0.75rem',
          letterSpacing: '0.025em'
        }}>
          {label}
        </span>
      </div>
      
      {badge ? (
        <span style={{
          alignSelf: 'flex-start',
          background: badge === 'active' 
            ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%)' 
            : 'linear-gradient(135deg, rgba(156,163,175,0.15) 0%, rgba(107,114,128,0.1) 100%)',
          color: badge === 'active' ? '#059669' : '#6b7280',
          padding: '0.25rem 0.75rem',
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: `1px solid ${badge === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(156,163,175,0.2)'}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          {value}
        </span>
      ) : (
        <span style={{ 
          color: '#0f172a', 
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: '1.5'
        }}>
          {value || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>}
        </span>
      )}
    </div>
  );
} 