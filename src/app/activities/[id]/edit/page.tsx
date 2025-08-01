"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  InformationCircleIcon, 
  CalendarIcon, 
  UserGroupIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { activitiesAPI } from '@/lib/api';
import { format, parseISO } from 'date-fns';

type ActivityFormData = {
  name: string;
  description: string;
  category: string;
  location: string;
  scheduledTime: string;
  duration: number;
  capacity: number;
  date: string;
};


const categories = ['Thể chất', 'Sáng tạo', 'Trị liệu', 'Nhận thức', 'Xã hội', 'Giáo dục', 'Y tế', 'Tâm lý', 'Giải trí'];
const baseLocations = ['Thư viện', 'Vườn hoa', 'Phòng y tế', 'Sân vườn', 'Phòng thiền', 'Phòng giải trí', 'Phòng sinh hoạt chung', 'Nhà bếp', 'Phòng nghệ thuật'];


// Map giá trị activity_type từ API về đúng option
function mapActivityType(type: string): string {
  const map: Record<string, string> = {
    'Thể thao': 'Thể chất',
    'Học tập': 'Giáo dục',
    'the_thao': 'Thể chất',
    'giai_tri': 'Giải trí',
  };
  return map[type] || type;
}

export default function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [selectedResident, setSelectedResident] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Get activityId from params using React.use()
  const activityId = use(params).id;
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    setValue
  } = useForm<ActivityFormData>();
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const apiActivity = await activitiesAPI.getById(activityId);
        if (apiActivity) {
          setActivity(apiActivity);
          reset({
            name: apiActivity.activity_name || '',
            description: apiActivity.description || '',
            category: mapActivityType(apiActivity.activity_type || ''),
            location: apiActivity.location || '',
            scheduledTime: apiActivity.schedule_time ? format(parseISO(apiActivity.schedule_time), 'HH:mm') : '',
            duration: apiActivity.duration || 0,
            capacity: apiActivity.capacity || 0,
            date: apiActivity.schedule_time ? format(parseISO(apiActivity.schedule_time), 'yyyy-MM-dd') : '',
          });
        } else {
          router.push('/activities');
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [activityId, router, reset]);
  
  const onSubmit = async (data: ActivityFormData) => {
    setIsSubmitting(true);
    try {
      // Chuẩn hóa dữ liệu gửi lên backend - gửi local time string
      const schedule_time = data.date && data.scheduledTime
        ? `${data.date}T${data.scheduledTime}:00`
        : '';
      const payload = {
        activity_name: data.name,
          description: data.description,
        activity_type: data.category,
          location: data.location,
        schedule_time,
        duration: Number(data.duration),
        capacity: Number(data.capacity)
      };
      await activitiesAPI.update(activityId, payload);
      
      // Hiển thị modal thành công
      setSuccessMessage(`Hoạt động "${data.name}" đã được cập nhật thành công!`);
      setShowSuccessModal(true);
      
      // Tự động chuyển hướng sau 3 giây
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push('/activities');
      }, 3000);
      
    } catch (error) {
      console.error('Error updating activity:', error);
      alert('Có lỗi xảy ra khi cập nhật hoạt động. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock residents data - in real app this would come from API
  const allResidents = [
    'Alice Johnson', 'Robert Smith', 'Mary Williams', 'James Brown', 'Patricia Davis',
    'Michael Johnson', 'Linda Wilson', 'David Anderson', 'Barbara Taylor', 'William Moore',
    'Elizabeth Jackson', 'Richard White', 'Susan Harris', 'Joseph Martin', 'Jessica Thompson',
    'Christopher Garcia', 'Sarah Martinez', 'Matthew Robinson', 'Ashley Clark', 'Anthony Rodriguez',
    'Amanda Lewis', 'Daniel Lee', 'Stephanie Walker', 'Mark Hall', 'Michelle Young',
    'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Văn D', 'Phạm Thị E',
    'Vũ Văn F', 'Đặng Thị G', 'Bùi Văn H', 'Lý Thị I', 'Ngô Văn J',
    'Võ Thị K', 'Phan Văn L', 'Đỗ Thị M', 'Tạ Văn N', 'Hồ Thị O',
    'Lưu Văn P', 'Mai Thị Q', 'Cao Văn R', 'Nguyễn Thị S', 'Trần Văn T'
  ];

  // Get available residents (not already selected)
  const availableResidents = allResidents.filter(resident => !participants.includes(resident));

  // Participant management functions
  const addParticipant = () => {
    if (selectedResident && !participants.includes(selectedResident)) {
      setParticipants(prev => [...prev, selectedResident]);
      setSelectedResident('');
    }
  };

  const removeParticipant = (participantToRemove: string) => {
    setParticipants(prev => prev.filter(p => p !== participantToRemove));
  };
  
  // Lấy giá trị location hiện tại từ form (nếu có)
  const currentLocation = activity?.location || '';
  let locations = baseLocations;
  if (currentLocation && !baseLocations.includes(currentLocation)) {
    locations = [currentLocation, ...baseLocations];
  }
  
  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Đang tải thông tin...</p>
      </div>
    );
  }
  
  if (!activity) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Không tìm thấy thông tin hoạt động.</p>
      </div>
    );
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
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <Link
                href="/activities"
                style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                }}
              >
                <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem', color: '#64748b'}} />
              </Link>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}>
                    <PencilSquareIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                  </div>
                  <div>
                    <h1 style={{
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      color: '#065f46',
                      margin: 0,
                      letterSpacing: '-0.025em'
                    }}>
                      Chỉnh sửa hoạt động
                    </h1>
                    <p style={{
                      fontSize: '1rem',
                      color: '#059669',
                      margin: '0.25rem 0 0 0',
                      fontWeight: 500
                    }}>
                      Cập nhật thông tin chi tiết hoạt động
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        {/* Main Form Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Basic Information */}
            <section>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                padding: '1rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '1rem',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <InformationCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                </div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'white',
                  margin: 0,
                  letterSpacing: '-0.025em'
                }}>
                  Thông tin hoạt động
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Tên hoạt động */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Tên hoạt động <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={`block w-full rounded-lg border ${errors.name ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('name', { required: 'Tên hoạt động là bắt buộc' })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>
                {/* Loại hoạt động */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Loại hoạt động <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    className={`block w-full rounded-lg border ${errors.category ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('category', { required: 'Loại hoạt động là bắt buộc' })}
                  >
                    <option value="">Chọn loại hoạt động</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
                  )}
                </div>
                {/* Địa điểm */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Địa điểm <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="location"
                    className={`block w-full rounded-lg border ${errors.location ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('location', { required: 'Địa điểm là bắt buộc' })}
                  >
                    <option value="">Chọn địa điểm</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                  {errors.location && (
                    <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>
                  )}
                </div>
                {/* Thời lượng */}
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Thời lượng (phút) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="duration"
                    type="number"
                    min="15"
                    max="300"
                    className={`block w-full rounded-lg border ${errors.duration ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('duration', {
                      required: 'Thời lượng là bắt buộc',
                      min: { value: 15, message: 'Thời lượng tối thiểu 15 phút' },
                      max: { value: 300, message: 'Thời lượng tối đa 300 phút' }
                    })}
                  />
                  {errors.duration && (
                    <p className="mt-1 text-xs text-red-600">{errors.duration.message}</p>
                  )}
                </div>
                {/* Sức chứa */}
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Sức chứa <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    min="1"
                    max="100"
                    className={`block w-full rounded-lg border ${errors.capacity ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('capacity', {
                      required: 'Sức chứa là bắt buộc',
                      min: { value: 1, message: 'Sức chứa tối thiểu 1 người' },
                      max: { value: 100, message: 'Sức chứa tối đa 100 người' }
                    })}
                  />
                  {errors.capacity && (
                    <p className="mt-1 text-xs text-red-600">{errors.capacity.message}</p>
                  )}
                </div>
                {/* Ngày */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    className={`block w-full rounded-lg border ${errors.date ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('date', { required: 'Ngày là bắt buộc' })}
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>
                  )}
                </div>
                {/* Thời gian */}
                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="scheduledTime"
                    type="time"
                    className={`block w-full rounded-lg border ${errors.scheduledTime ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                    {...register('scheduledTime', { required: 'Thời gian là bắt buộc' })}
                  />
                  {errors.scheduledTime && (
                    <p className="mt-1 text-xs text-red-600">{errors.scheduledTime.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả hoạt động <span className="text-red-500">*</span>
                  </label>
                  <textarea
                  id="description"
                    rows={3}
                  className={`block w-full rounded-lg border ${errors.description ? 'border-red-400' : 'border-gray-300'} focus:ring-green-600 focus:border-green-600 shadow-sm py-2 px-3 text-sm`}
                  {...register('description', { required: 'Mô tả hoạt động là bắt buộc' })}
                  />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
                )}
              </div>
            </section>
            {/* Form Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '2rem',
              padding: '1.5rem 0',
              borderTop: '1px solid #e5e7eb'
            }}>
              <Link
                href="/activities"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  background: 'white',
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                }}
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  background: isSubmitting 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: isSubmitting 
                    ? '0 2px 4px rgba(0, 0, 0, 0.05)' 
                    : '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease',
                  transform: isSubmitting ? 'none' : 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }
                }}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật hoạt động'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            {/* Success Icon */}
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
              animation: 'successIconBounce 0.6s ease-out'
            }}>
              <CheckCircleIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            
            {/* Success Title */}
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#065f46',
              margin: '0 0 1rem 0',
              letterSpacing: '-0.025em'
            }}>
              Cập nhật thành công!
            </h2>
            
            {/* Success Message */}
            <p style={{
              fontSize: '1rem',
              color: '#4b5563',
              margin: '0 0 2rem 0',
              lineHeight: 1.6
            }}>
              {successMessage}
            </p>
            
            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '0.25rem',
              background: '#e5e7eb',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '9999px',
                animation: 'progressBar 3s linear forwards'
              }} />
            </div>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/activities');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                Xem danh sách
              </button>
              
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes successIconBounce {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes progressBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 