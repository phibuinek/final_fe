"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, SparklesIcon, ClipboardDocumentListIcon, UserGroupIcon, ClockIcon, MapPinIcon, UserIcon, CalendarIcon, EyeIcon, MagnifyingGlassIcon, CheckIcon, XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useResidents } from '@/lib/contexts/residents-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { activitiesAPI, activityParticipationsAPI, userAPI, staffAssignmentsAPI, staffAPI } from '@/lib/api';
import { Dialog } from '@headlessui/react';
import ConfirmModal from '@/components/ConfirmModal';
import NotificationModal from '@/components/NotificationModal';

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { residents, loading: residentsLoading, error: residentsError } = useResidents();
  const { user } = useAuth();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participations, setParticipations] = useState<any[]>([]);
  const [evaluationMode, setEvaluationMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluations, setEvaluations] = useState<{[key: string]: {participated: boolean, reason?: string}}>({});
  const [saving, setSaving] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Staff assignment states
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assignStaffModalOpen, setAssignStaffModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [currentAssignedStaff, setCurrentAssignedStaff] = useState<any>(null);
  const [assignedStaffList, setAssignedStaffList] = useState<any[]>([]);
  
  // Confirm modal states
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger' as 'danger' | 'warning' | 'info'
  });
  
  // Notification modal state
  const [notificationModal, setNotificationModal] = useState({
    open: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  });
  
  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.role || !['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const activityId = id;
        const apiActivity = await activitiesAPI.getById(activityId);
        if (apiActivity) {
          setActivity(mapActivityFromAPI(apiActivity));
        } else {
          setError('Không tìm thấy hoạt động');
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
        setError('Không thể tải thông tin hoạt động. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [id]);

  // Fetch staff list
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        // Lấy danh sách staff thật từ API
        const users = await staffAPI.getAll();
        // Chỉ lấy staff có _id hợp lệ
        const staff = users.filter((u: any) => u.role === 'staff' && typeof u._id === 'string' && u._id.length === 24);
        setStaffList(staff.map((u: any) => ({ id: u._id, name: u.full_name, role: u.role })));
      } catch (error) {
        console.error('Error fetching staff list:', error);
      }
    };
    fetchStaffList();
  }, []);

  // Function to cleanup duplicate participations
  const cleanupDuplicateParticipations = async (participationsData: any[]) => {
    const seen = new Set();
    const duplicates: any[] = [];
    const uniqueParticipations: any[] = [];
    
    participationsData.forEach((participation: any) => {
      const participationActivityId = participation.activity_id?._id || participation.activity_id;
      const participationResidentId = participation.resident_id?._id || participation.resident_id;
      const participationDate = participation.date ? new Date(participation.date).toISOString().split('T')[0] : null;
      
      const key = `${participationActivityId}-${participationResidentId}-${participationDate}`;
      
      if (seen.has(key)) {
        duplicates.push(participation);
      } else {
        seen.add(key);
        uniqueParticipations.push(participation);
      }
    });
    
    // Xóa duplicate participations
    for (const duplicate of duplicates) {
      try {
        await activityParticipationsAPI.delete(duplicate._id);
        console.log('Deleted duplicate participation:', duplicate._id);
      } catch (error) {
        console.error('Error deleting duplicate participation:', error);
      }
    }
    
    if (duplicates.length > 0) {
      console.log(`Cleaned up ${duplicates.length} duplicate participations`);
    }
    
    return uniqueParticipations;
  };

  // Fetch participations for this activity
  useEffect(() => {
    const fetchParticipations = async () => {
      if (!activity?.id) return;
      
      try {
        // Sử dụng endpoint mới để lấy participations theo activity_id và date
        const participationsData = await activityParticipationsAPI.getByActivityId(
          activity.id, 
          activity.date
        );
        console.log('Fetched participations for activity:', activity.id, 'date:', activity.date, participationsData);
        console.log('Available residents:', residents);
        console.log('Using new endpoint: getByActivityId');
        console.log('Participation data structure:', participationsData.map((p: any) => ({
          residentId: p.resident_id?._id || p.resident_id,
          residentName: p.resident_id?.full_name,
          attendanceStatus: p.attendance_status,
          performanceNotes: p.performance_notes
        })));
        
        // Dọn dẹp duplicate participations (nếu có)
        const cleanedParticipations = await cleanupDuplicateParticipations(participationsData);
        setParticipations(cleanedParticipations);
        
        // Update assigned staff from participations for this specific activity
        // Kiểm tra cả activity_id và activity_id._id vì có thể có cấu trúc nested
        const currentActivityParticipations = participationsData.filter((p: any) => {
          const participationActivityId = p.activity_id?._id || p.activity_id;
          return participationActivityId === activity.id;
        });
        
        // Lấy danh sách tất cả nhân viên được phân công cho hoạt động này
        const staffIds = new Set();
        const assignedStaffs: any[] = [];
        
        currentActivityParticipations.forEach((participation: any) => {
          if (participation.staff_id) {
            let staffId = participation.staff_id;
            let staffName = 'Nhân viên chưa xác định';
            let staffRole = 'Nhân viên';
            
            if (typeof participation.staff_id === 'object' && participation.staff_id._id) {
              staffId = participation.staff_id._id;
              staffName = participation.staff_id.full_name || staffName;
              staffRole = participation.staff_id.role || staffRole;
            } else {
              const foundStaff = staffList.find(staff => staff.id === participation.staff_id);
              if (foundStaff) {
                staffName = foundStaff.name;
                staffRole = foundStaff.role;
              }
            }
            
            if (!staffIds.has(staffId)) {
              staffIds.add(staffId);
              assignedStaffs.push({
                id: staffId,
                name: staffName,
                role: staffRole
              });
            }
          }
        });
        
        setAssignedStaffList(assignedStaffs);
        
        // Giữ lại currentAssignedStaff cho backward compatibility (lấy nhân viên đầu tiên)
        if (assignedStaffs.length > 0) {
          setCurrentAssignedStaff(assignedStaffs[0]);
        } else {
          setCurrentAssignedStaff(null);
        }
        
        // Initialize evaluations from existing participations
        // Sử dụng trực tiếp resident_id từ participation data
        const initialEvaluations: {[key: string]: {participated: boolean, reason?: string}} = {};
        participationsData.forEach((participation: any) => {
          // Extract resident_id from the nested object structure
          const residentId = participation.resident_id?._id || participation.resident_id;
          const participated = participation.attendance_status === 'attended';
          const reason = participation.performance_notes || '';
          
          if (residentId) {
            console.log('Processing participation for residentId:', residentId, 'name:', participation.resident_id?.full_name);
            // Sử dụng trực tiếp resident_id từ participation, không cần match với residents array
            initialEvaluations[residentId] = {
                  participated,
                  reason
                };
          }
        });
        console.log('Initialized evaluations:', initialEvaluations);
        console.log('Evaluations keys:', Object.keys(initialEvaluations));
        setEvaluations(initialEvaluations);
      } catch (error) {
        console.error('Error fetching participations:', error);
      }
    };
    
    fetchParticipations();
  }, [activity?.id, refreshTrigger]);

  // Debug: Log when evaluations change
  useEffect(() => {
    console.log('Evaluations state changed:', evaluations);
  }, [evaluations]);

  // Map API data to match component expectations
  const mapActivityFromAPI = (apiActivity: any) => {
    try {
      // Validate schedule_time
      if (!apiActivity.schedule_time || typeof apiActivity.schedule_time !== 'string') {
        console.warn('Invalid schedule_time for activity:', apiActivity._id);
        return null;
      }

      // Parse schedule_time as UTC and keep it as is, don't add timezone offset
      const scheduleTimeStr = apiActivity.schedule_time.endsWith('Z') 
        ? apiActivity.schedule_time 
        : `${apiActivity.schedule_time}Z`;
      const scheduleTime = new Date(scheduleTimeStr);

      // Check if date is valid
      if (isNaN(scheduleTime.getTime())) {
        console.error('Invalid date after parsing for activity:', apiActivity._id, apiActivity.schedule_time);
        return null;
      }

      // Calculate end time safely
      const durationInMinutes = typeof apiActivity.duration === 'number' ? apiActivity.duration : 0;
      const endTime = new Date(scheduleTime.getTime() + durationInMinutes * 60000);

      // Check if end time is valid
      if (isNaN(endTime.getTime())) {
        console.error('Invalid end time calculated for activity:', apiActivity._id);
        return null;
      }

      // Chuyển đổi thời gian từ UTC về múi giờ Việt Nam (+7)
      const convertToVietnamTime = (utcTime: Date) => {
        const vietnamTime = new Date(utcTime.getTime() + (7 * 60 * 60 * 1000)); // +7 giờ
        return vietnamTime.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      };

      return {
        id: apiActivity._id,
        name: apiActivity.activity_name,
        description: apiActivity.description,
        category: getCategoryLabel(apiActivity.activity_type),
        scheduledTime: convertToVietnamTime(scheduleTime), // Convert to Vietnam time
        startTime: convertToVietnamTime(scheduleTime), // Convert to Vietnam time
        endTime: convertToVietnamTime(endTime), // Convert to Vietnam time
        duration: apiActivity.duration,
        date: scheduleTime.toLocaleDateString('en-CA'), // Format YYYY-MM-DD cho local date
        location: apiActivity.location,
        capacity: apiActivity.capacity,
        participants: 0, // API không có field này, sẽ cần fetch riêng
        facilitator: 'Chưa phân công',
        status: 'Đã lên lịch',
        level: 'Trung bình',
        recurring: 'Không lặp lại',
        materials: '',
        specialNotes: '',
        ageGroupSuitability: ['Người cao tuổi'],
        healthRequirements: ['Không có yêu cầu đặc biệt'],
        createdAt: apiActivity.created_at || '',
        updatedAt: apiActivity.updated_at || '',
        residentEvaluations: [],
        benefits: ['Cải thiện sức khỏe', 'Tăng cường tinh thần', 'Giao lưu xã hội'],
        notes: 'Không có ghi chú đặc biệt.',
      };
    } catch (error) {
      console.error('Error mapping activity:', apiActivity._id, error);
      return null;
    }
  };

  // Helper functions for data mapping
  const getCategoryLabel = (activityType: string) => {
    const categoryMap: { [key: string]: string } = {
      'Nhận thức': 'Nhận thức',
      'Thể thao': 'Thể chất',
      'Y tế': 'Y tế',
      'Tâm lý': 'Tâm lý',
      'Xã hội': 'Xã hội',
      'Học tập': 'Giáo dục',
      'Sáng tạo': 'Sáng tạo',
      'the_thao': 'Thể chất',
      'giai_tri': 'Giải trí'
    };
    return categoryMap[activityType] || activityType;
  };

  const formatTime = (time: string | undefined) => {
    if (!time || typeof time !== 'string' || !time.includes(':')) {
      return '';
    }
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getRecurringLabel = (recurring: string) => {
    const recurringMap: { [key: string]: string } = {
      'none': 'Không lặp lại',
      'daily': 'Hàng ngày',
      'weekly': 'Hàng tuần', 
      'biweekly': 'Hai tuần một lần',
      'monthly': 'Hàng tháng'
    };
    return recurringMap[recurring] || recurring;
  };
  
  const handleEditClick = () => {
    router.push(`/activities/${activity.id}/edit`);
  };

  // Evaluation functions
  const handleEvaluationChange = (residentId: string, participated: boolean) => {
    setEvaluations(prev => ({
      ...prev,
      [residentId]: {
        ...prev[residentId],
        participated,
        reason: participated ? '' : (prev[residentId]?.reason || '')
      }
    }));
  };

  const handleReasonChange = (residentId: string, reason: string) => {
    setEvaluations(prev => ({
      ...prev,
      [residentId]: {
        ...prev[residentId],
        reason
      }
    }));
  };

  const handleSelectAll = (participated: boolean) => {
    setEvaluations(prev => {
      const newEvaluations: {[key: string]: {participated: boolean, reason?: string}} = {};
      filteredResidents.forEach(resident => {
        newEvaluations[resident.id] = {
          participated,
          reason: participated
            ? ''
            : (prev[resident.id]?.reason || '')
        };
      });
      return newEvaluations;
    });
  };

  const handleSaveEvaluations = async () => {
    if (!activity?.id) return;
    
    // Validate evaluations before saving
    const invalidEvaluations = Object.entries(evaluations).filter(([_, evaluation]) => {
      return !evaluation.participated && (!evaluation.reason || evaluation.reason.trim() === '');
    });
    
    if (invalidEvaluations.length > 0) {
      setNotificationModal({
        open: true,
        title: 'Thiếu thông tin',
        message: `Vui lòng nhập lý do vắng mặt cho ${invalidEvaluations.length} cư dân đã chọn "Không tham gia".`,
        type: 'warning'
      });
      return;
    }
    
    setSaving(true);
    try {
      // Update or create participations for each resident
      for (const [residentId, evaluation] of Object.entries(evaluations)) {
        // Find existing participation by matching resident_id and date
        const existingParticipation = participations.find(p => {
          const pResidentId = p.resident_id?._id || p.resident_id;
          const pDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
          return (
            pResidentId === residentId &&
            pDate === activity.date
          );
        });
        
        if (existingParticipation) {
          // Update existing participation - only update necessary fields
          const updateData: any = {
            performance_notes: evaluation.participated ? 
              'Tham gia tích cực, tinh thần tốt' : 
              (evaluation.reason || 'Không có lý do cụ thể'),
            attendance_status: evaluation.participated ? 'attended' : 'absent'
          };
          
          // Only update staff_id if it's different or missing
          const currentStaffId = existingParticipation.staff_id?._id || existingParticipation.staff_id;
          const newStaffId = assignedStaffList.length > 0 ? assignedStaffList[0].id : (user?.id || "664f1b2c2f8b2c0012a4e750");
          if (currentStaffId !== newStaffId) {
            updateData.staff_id = newStaffId;
          }
          
          await activityParticipationsAPI.update(existingParticipation._id, updateData);
        } else {
          // Create new participation
          // Find the resident to get their API ID
          const resident = residents.find(r => r.id === residentId);
          if (resident) {
            // Use the resident's actual ID and follow API schema
            await activityParticipationsAPI.create({
              staff_id: assignedStaffList.length > 0 ? assignedStaffList[0].id : (user?.id || "664f1b2c2f8b2c0012a4e750"), // Sử dụng staff đầu tiên hoặc user hiện tại
              activity_id: activity.id,
              resident_id: resident.id, // Use actual resident ID
              date: activity.date + "T00:00:00Z", // Send as ISO string
              performance_notes: evaluation.participated ? 
                'Tham gia tích cực, tinh thần tốt' : 
                (evaluation.reason || 'Không có lý do cụ thể'),
              attendance_status: evaluation.participated ? 'attended' : 'absent'
            });
          }
        }
      }
      
      // Refresh participations
      const participationsData = await activityParticipationsAPI.getByActivityId(
        activity.id, 
        activity.date
      );
      setParticipations(participationsData);
      
      // Cập nhật evaluations state với dữ liệu mới
      const updatedEvaluations: {[key: string]: {participated: boolean, reason?: string}} = {};
      participationsData.forEach((participation: any) => {
        const residentId = participation.resident_id?._id || participation.resident_id;
        const participated = participation.attendance_status === 'attended';
        const reason = participation.performance_notes || '';
        
        if (residentId) {
          updatedEvaluations[residentId] = {
            participated,
            reason
          };
        }
      });
      console.log('Updated evaluations after save:', updatedEvaluations);
      setEvaluations(updatedEvaluations);
      
      // Force re-render để cập nhật UI
      setRefreshTrigger(prev => prev + 1);
      
      // Cập nhật thông tin nhân viên hướng dẫn sau khi refresh
      // Kiểm tra cả activity_id và activity_id._id vì có thể có cấu trúc nested
      const currentActivityParticipations = participationsData.filter((p: any) => {
        const participationActivityId = p.activity_id?._id || p.activity_id;
        return participationActivityId === activity.id;
      });
      
      // Lấy danh sách tất cả nhân viên được phân công cho hoạt động này
      const staffIds = new Set();
      const assignedStaffs: any[] = [];
      
      currentActivityParticipations.forEach((participation: any) => {
        if (participation.staff_id) {
          let staffId = participation.staff_id;
          let staffName = 'Nhân viên chưa xác định';
          let staffRole = 'Nhân viên';
          
          if (typeof participation.staff_id === 'object' && participation.staff_id._id) {
            staffId = participation.staff_id._id;
            staffName = participation.staff_id.full_name || staffName;
            staffRole = participation.staff_id.role || staffRole;
          } else {
            const foundStaff = staffList.find(staff => staff.id === participation.staff_id);
            if (foundStaff) {
              staffName = foundStaff.name;
              staffRole = foundStaff.role;
            }
          }
          
          if (!staffIds.has(staffId)) {
            staffIds.add(staffId);
            assignedStaffs.push({
              id: staffId,
              name: staffName,
              role: staffRole
            });
          }
        }
      });
      
      setAssignedStaffList(assignedStaffs);
      
      // Giữ lại currentAssignedStaff cho backward compatibility (lấy nhân viên đầu tiên)
      if (assignedStaffs.length > 0) {
        setCurrentAssignedStaff(assignedStaffs[0]);
      } else {
        setCurrentAssignedStaff(null);
      }
      
      setEvaluationMode(false);
      setNotificationModal({
        open: true,
        title: 'Thành công',
        message: 'Đánh giá đã được lưu thành công!',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error saving evaluations:', error);
      let errorMessage = 'Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMessage = `Lỗi: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Lỗi: ${error.message}`;
      }
      
      setNotificationModal({
        open: true,
        title: 'Lỗi',
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Debug: Log residents data
  console.log('Residents data:', residents);
  console.log('Residents loading:', residentsLoading);
  console.log('Residents error:', residentsError);
  console.log('Participations data:', participations);
  console.log('Activity ID:', activity?.id);
  console.log('Activity date:', activity?.date);
  
  const activityDate = activity?.date ? new Date(activity.date).toISOString().split('T')[0] : null;
  type ActivityResident = {
    id: string;
    name: string;
    room: string;
    age: string | number;
    participationId: string;
    participated: boolean;
    reason: string;
    evaluationDate: string;
  };
  // Map participations to ActivityResident[]
  console.log('All participations before filter:', participations);
  const allResidentsForDay: ActivityResident[] = participations
    .filter((p: any) => {
      // Lọc đúng hoạt động và đúng ngày
      const participationActivityId = p.activity_id?._id || p.activity_id;
      const participationDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
      const isMatch = participationActivityId === activity?.id && activityDate && participationDate === activityDate;
      console.log('AllResidentsForDay filter:', {
        participationActivityId,
        activityId: activity?.id,
        participationDate,
        activityDate,
        isMatch,
        participation: p
      });
      return isMatch;
    })
    .map((p: any) => {
      const residentId = p.resident_id?._id || p.resident_id;
      const residentInfo = residents.find((r: any) => r.id === residentId);
      return {
        id: residentId,
        name: p.resident_id?.full_name || residentInfo?.name || 'N/A',
        room: residentInfo?.room || '',
        age: residentInfo?.age || '',
        participationId: p._id,
        participated: p.attendance_status === 'attended',
        reason: p.performance_notes || '',
        evaluationDate: p.date
      };
    });
// Chỉ giữ lại 1 bản ghi cho mỗi cư dân/ngày, ưu tiên bản ghi 'Không tham gia'
const activityResidents: ActivityResident[] = Object.values(
  allResidentsForDay.reduce((acc, curr) => {
    // Key theo residentId
    const key = curr.id;
    // Nếu chưa có hoặc bản ghi hiện tại là 'Không tham gia', thì ghi đè
    if (!acc[key] || (!curr.participated)) {
      acc[key] = curr;
    }
    return acc;
  }, {} as { [residentId: string]: ActivityResident })
);
  // Tạo danh sách cư dân từ evaluations state, chỉ lấy những cư dân tham gia hoạt động này
  const residentsFromEvaluations: ActivityResident[] = Object.entries(evaluations)
    .filter(([residentId, evaluation]) => {
      // Chỉ lấy những cư dân có participation record cho hoạt động này
      const participation = participations.find((p: any) => {
        const pResidentId = p.resident_id?._id || p.resident_id;
        const participationActivityId = p.activity_id?._id || p.activity_id;
        const participationDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
        const activityDate = activity?.date ? new Date(activity.date).toISOString().split('T')[0] : null;
        
        return pResidentId === residentId && 
               participationActivityId === activity?.id && 
               participationDate === activityDate;
      });
      
      return participation !== undefined;
    })
    .map(([residentId, evaluation]) => {
      const participation = participations.find((p: any) => {
        const pResidentId = p.resident_id?._id || p.resident_id;
        return pResidentId === residentId;
      });
      
      // Sử dụng thông tin từ participation data, fallback về residents array nếu cần
      const residentInfo = residents.find((r: any) => r.id === residentId);
      
      return {
        id: residentId,
        name: participation?.resident_id?.full_name || residentInfo?.name || 'N/A',
        room: residentInfo?.room || '',
        age: residentInfo?.age || '',
        participationId: participation?._id || '',
        participated: evaluation.participated,
        reason: evaluation.reason || '',
        evaluationDate: participation?.date || activity?.date || ''
      };
    });

  // Filter residents from evaluations based on search term
  const filteredResidents: ActivityResident[] = residentsFromEvaluations.filter((resident: ActivityResident) =>
    resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resident.room?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
  
  // Lấy danh sách cư dân chưa tham gia hoạt động này vào đúng ngày
  const joinedResidentIds = Array.from(new Set(
    participations
      .filter((p: any) => {
        const participationActivityId = p.activity_id?._id || p.activity_id;
        const participationDate = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
        const isMatch = participationActivityId === activity?.id && activityDate && participationDate === activityDate;
        console.log('Participation filter:', {
          participationActivityId,
          activityId: activity?.id,
          participationDate,
          activityDate,
          isMatch,
          participation: p
        });
        return isMatch;
      })
      .map((p: any) => p.resident_id?._id || p.resident_id)
  ));
  console.log('Joined resident IDs:', joinedResidentIds);
  console.log('Activity residents count:', activityResidents.length);
  console.log('Current evaluations state:', evaluations);
  console.log('Residents from evaluations:', residentsFromEvaluations);
  console.log('Total evaluations entries:', Object.keys(evaluations).length);
  console.log('Filtered residents for this activity:', residentsFromEvaluations.length);
  console.log('Residents from evaluations details:', residentsFromEvaluations.map(r => ({
    id: r.id,
    name: r.name,
    participated: r.participated,
    reason: r.reason
  })));
  
  // Đếm số lượng tham gia một cách rõ ràng
  const participationCount = activityResidents.length;
  console.log('Participation count:', participationCount);
  




  // Xóa nhân viên được phân công
  const handleRemoveStaff = async (staffId: string) => {
    if (!activity?.id) return;
    
    // Kiểm tra quyền - chỉ admin mới có thể xóa staff
    if (user?.role !== 'admin') {
      setNotificationModal({
        open: true,
        title: 'Không có quyền',
        message: 'Bạn không có quyền xóa nhân viên khỏi hoạt động.',
        type: 'error'
      });
      return;
    }
    
    // Hiển thị modal xác nhận
    setConfirmModal({
      open: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa nhân viên này khỏi hoạt động?',
      onConfirm: () => performRemoveStaff(staffId),
      type: 'danger'
    });
  };

  // Thực hiện xóa nhân viên sau khi xác nhận
  const performRemoveStaff = async (staffId: string) => {
    setConfirmModal(prev => ({ ...prev, open: false }));
    
    try {
      // Tìm tất cả participations của nhân viên này trong hoạt động hiện tại
      const currentActivityParticipations = participations.filter(p => {
        const participationActivityId = p.activity_id?._id || p.activity_id;
        const participationStaffId = p.staff_id?._id || p.staff_id;
        return participationActivityId === activity.id && participationStaffId === staffId;
      });
      
      if (currentActivityParticipations.length === 0) {
        setNotificationModal({
          open: true,
          title: 'Không tìm thấy',
          message: 'Không tìm thấy nhân viên này trong hoạt động.',
          type: 'error'
        });
        return;
      }
      
      // Xóa tất cả participations của nhân viên này
      for (const participation of currentActivityParticipations) {
        await activityParticipationsAPI.delete(participation._id);
      }
      
      // Refresh participations để cập nhật danh sách
      const participationsData = await activityParticipationsAPI.getByActivityId(
        activity.id, 
        activity.date
      );
      setParticipations(participationsData);
      
      // Cập nhật danh sách staff được phân công
      const staffIds = new Set();
      const assignedStaffs: any[] = [];
      
      participationsData.forEach((participation: any) => {
        if (participation.staff_id) {
          let staffId = participation.staff_id;
          let staffName = 'Nhân viên chưa xác định';
          let staffRole = 'Nhân viên';
          
          if (typeof participation.staff_id === 'object' && participation.staff_id._id) {
            staffId = participation.staff_id._id;
            staffName = participation.staff_id.full_name || staffName;
            staffRole = participation.staff_id.role || staffRole;
          } else {
            const foundStaff = staffList.find(staff => staff.id === participation.staff_id);
            if (foundStaff) {
              staffName = foundStaff.name;
              staffRole = foundStaff.role;
            }
          }
          
          if (!staffIds.has(staffId)) {
            staffIds.add(staffId);
            assignedStaffs.push({
              id: staffId,
              name: staffName,
              role: staffRole
            });
          }
        }
      });
      
      setAssignedStaffList(assignedStaffs);
      
      // Cập nhật currentAssignedStaff
      if (assignedStaffs.length > 0) {
        setCurrentAssignedStaff(assignedStaffs[0]);
      } else {
        setCurrentAssignedStaff(null);
      }
      
      setNotificationModal({
        open: true,
        title: 'Thành công',
        message: 'Đã xóa nhân viên khỏi hoạt động thành công!',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error removing staff:', error);
      let errorMessage = 'Không thể xóa nhân viên khỏi hoạt động. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMessage = `Lỗi: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Lỗi: ${error.message}`;
      }
      
      setNotificationModal({
        open: true,
        title: 'Lỗi',
        message: errorMessage,
        type: 'error'
      });
    }
  };

  // Phân công nhân viên hướng dẫn
  const handleAssignStaff = async () => {
    if (!selectedStaffId || !activity?.id) return;
    
    // Kiểm tra quyền - chỉ admin mới có thể phân công staff
    if (user?.role !== 'admin') {
      setNotificationModal({
        open: true,
        title: 'Không có quyền',
        message: 'Bạn không có quyền phân công nhân viên cho hoạt động.',
        type: 'error'
      });
      return;
    }
    setAssigningStaff(true);
    try {
      // Lấy danh sách cư dân được phân công cho staff này
      const staffAssignments = await staffAssignmentsAPI.getByStaff(selectedStaffId);
      const assignedResidentIds = staffAssignments.map((assignment: any) => assignment.resident_id._id || assignment.resident_id);
      
      console.log('Staff assignments:', staffAssignments);
      console.log('Assigned resident IDs:', assignedResidentIds);
      
      // Lấy danh sách cư dân đã tham gia hoạt động này
      const currentActivityParticipations = participations.filter(p => {
        const participationActivityId = p.activity_id?._id || p.activity_id;
        return participationActivityId === activity.id;
      });
      
      const currentParticipantIds = currentActivityParticipations.map(p => 
        p.resident_id?._id || p.resident_id
      );
      
      console.log('Current participant IDs:', currentParticipantIds);
      
      // Tìm cư dân chưa tham gia hoạt động
      const newResidentIds = assignedResidentIds.filter((residentId: string) => 
        !currentParticipantIds.includes(residentId)
      );
      
      console.log('New resident IDs to add:', newResidentIds);
      
      // Kiểm tra sức chứa
      const currentParticipantCount = currentParticipantIds.length;
      const totalAfterAdding = currentParticipantCount + newResidentIds.length;
      
      if (totalAfterAdding > activity.capacity) {
        const canAddCount = activity.capacity - currentParticipantCount;
        setNotificationModal({
          open: true,
          title: 'Cảnh báo',
          message: `Hoạt động chỉ còn ${canAddCount} chỗ trống, nhưng staff này quản lý ${assignedResidentIds.length} cư dân. Chỉ có thể thêm ${canAddCount} cư dân đầu tiên.`,
          type: 'warning'
        });
        
        // Chỉ thêm số lượng có thể
        newResidentIds.splice(canAddCount);
      }
      
      // Thêm cư dân mới vào hoạt động
      let addedCount = 0;
      for (const residentId of newResidentIds) {
        try {
          await activityParticipationsAPI.create({
            staff_id: selectedStaffId,
            activity_id: activity.id,
            resident_id: residentId,
            date: activity.date + 'T00:00:00Z',
            attendance_status: 'attended',
            performance_notes: 'Tham gia tích cực, tinh thần tốt'
          });
          addedCount++;
        } catch (error) {
          console.error(`Error adding resident ${residentId}:`, error);
        }
      }
      
      // Cập nhật tất cả participations hiện có với staff mới
      for (const participation of currentActivityParticipations) {
        await activityParticipationsAPI.update(participation._id, {
          staff_id: selectedStaffId
        });
      }
      
      // Update current assigned staff
      const assignedStaff = staffList.find(staff => staff.id === selectedStaffId);
      setCurrentAssignedStaff(assignedStaff);
      
      // Refresh participations to get updated data
      const participationsData = await activityParticipationsAPI.getByActivityId(
        activity.id, 
        activity.date
      );
      setParticipations(participationsData);
      
      // Cập nhật danh sách staff được phân công
      const staffIds = new Set();
      const assignedStaffs: any[] = [];
      
      participationsData.forEach((participation: any) => {
        if (participation.staff_id) {
          let staffId = participation.staff_id;
          let staffName = 'Nhân viên chưa xác định';
          let staffRole = 'Nhân viên';
          
          if (typeof participation.staff_id === 'object' && participation.staff_id._id) {
            staffId = participation.staff_id._id;
            staffName = participation.staff_id.full_name || staffName;
            staffRole = participation.staff_id.role || staffRole;
          } else {
            const foundStaff = staffList.find(staff => staff.id === participation.staff_id);
            if (foundStaff) {
              staffName = foundStaff.name;
              staffRole = foundStaff.role;
            }
          }
          
          if (!staffIds.has(staffId)) {
            staffIds.add(staffId);
            assignedStaffs.push({
              id: staffId,
              name: staffName,
              role: staffRole
            });
          }
        }
      });
      
      setAssignedStaffList(assignedStaffs);
      
      setAssignStaffModalOpen(false);
      setSelectedStaffId('');
      
      // Thông báo kết quả
      if (addedCount > 0) {
        setNotificationModal({
          open: true,
          title: 'Thành công',
          message: `Phân công nhân viên hướng dẫn thành công! Đã tự động thêm ${addedCount} cư dân vào hoạt động.`,
          type: 'success'
        });
      } else {
        setNotificationModal({
          open: true,
          title: 'Thành công',
          message: 'Phân công nhân viên hướng dẫn thành công!',
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Error assigning staff:', error);
      let errorMessage = 'Không thể phân công nhân viên hướng dẫn. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMessage = `Lỗi: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Lỗi: ${error.message}`;
      }
      
      setNotificationModal({
        open: true,
        title: 'Lỗi',
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setAssigningStaff(false);
    }
  };
  
  if (loading || residentsLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e5e7eb',
            borderTopColor: '#f59e0b',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            {loading ? 'Đang tải thông tin hoạt động...' : 'Đang tải danh sách cư dân...'}
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error || residentsError || !activity) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            background: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <SparklesIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
          </div>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            {error || residentsError || 'Không tìm thấy hoạt động'}
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            {error || residentsError || 'Hoạt động này không tồn tại hoặc đã bị xóa.'}
          </p>
          <Link href="/activities" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none'
          }}>
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Quay lại danh sách hoạt động
          </Link>
        </div>
      </div>
    );
  }

  // Helper function to render category with appropriate color
  const renderCategory = (category: string) => {
    const bgColor = 
      category === 'Thể chất' ? 'rgba(16, 185, 129, 0.1)' : 
      category === 'Sáng tạo' ? 'rgba(139, 92, 246, 0.1)' :
      category === 'Trị liệu' ? 'rgba(245, 158, 11, 0.1)' :
      category === 'Nhận thức' ? 'rgba(59, 130, 246, 0.1)' :
      category === 'Xã hội' ? 'rgba(236, 72, 153, 0.1)' : 
      category === 'Giáo dục' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(156, 163, 175, 0.1)';
      
    const textColor = 
      category === 'Thể chất' ? '#10b981' : 
      category === 'Sáng tạo' ? '#8b5cf6' :
      category === 'Trị liệu' ? '#f59e0b' :
      category === 'Nhận thức' ? '#3b82f6' :
      category === 'Xã hội' ? '#ec4899' : 
      category === 'Giáo dục' ? '#06b6d4' : '#9ca3af';
      
    return (
      <span style={{
        display: 'inline-flex', 
        padding: '0.375rem 0.875rem', 
        fontSize: '0.75rem', 
        fontWeight: 600, 
        borderRadius: '9999px',
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${textColor}20`
      }}>
        {category}
      </span>
    );
  };



  // Helper function to render status with appropriate color
  const renderStatus = (status: string) => {
    const bgColor = 
      status === 'Đã lên lịch' ? 'rgba(99, 102, 241, 0.1)' : 
      status === 'Đang diễn ra' ? 'rgba(16, 185, 129, 0.1)' :
      status === 'Đã hoàn thành' ? 'rgba(156, 163, 175, 0.1)' :
      status === 'Đã hủy' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)';
      
    const textColor = 
      status === 'Đã lên lịch' ? '#6366f1' : 
      status === 'Đang diễn ra' ? '#10b981' :
      status === 'Đã hoàn thành' ? '#9ca3af' :
      status === 'Đã hủy' ? '#ef4444' : '#9ca3af';
      
    return (
      <span style={{
        display: 'inline-flex', 
        padding: '0.375rem 0.875rem', 
        fontSize: '0.75rem', 
        fontWeight: 600, 
        borderRadius: '9999px',
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${textColor}20`
      }}>
        {status}
      </span>
    );
  };
  
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
          radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.02) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
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
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <Link
                href="/activities"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  background: '#f1f5f9',
                  color: '#64748b',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </Link>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '1rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  boxShadow: '0 8px 20px -5px rgba(245, 158, 11, 0.3)'
                }}>
                  <EyeIcon style={{ 
                    width: '2rem', 
                    height: '2rem',
                    color: 'white'
                  }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                    fontWeight: 700,
                    margin: 0,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.025em'
                  }}>
                    Chi tiết hoạt động
                  </h1>
                  <p style={{
                    fontSize: '1rem',
                    color: '#92400e',
                    margin: '0.25rem 0 0 0',
                    fontWeight: 500
                  }}>
                    Thông tin đầy đủ về chương trình sinh hoạt
                  </p>
                </div>
              </div>
        </div>
        
        <button
          onClick={handleEditClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
                borderRadius: '0.75rem',
            border: 'none',
            fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.25)'
              }}
            >
              <PencilIcon style={{ width: '1rem', height: '1rem' }} />
          Chỉnh sửa
        </button>
          </div>
      </div>
      
        {/* Main Activity Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden'
        }}>
          {/* Activity Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '2rem'
          }}>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              marginBottom: '1.5rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    opacity: 0.8,
                    display: 'block',
                    marginBottom: '0.25rem'
                  }}>
                    Tên hoạt động:
                  </label>
                  <h2 style={{
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    fontWeight: 700, 
                    margin: 0,
                    lineHeight: 1.2,
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    {activity.name}
                  </h2>
                </div>
                <div>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    opacity: 0.8,
                    display: 'block',
                    marginBottom: '0.25rem'
                  }}>
                    Mô tả:
                  </label>
                  <p style={{
                    fontSize: '1.125rem', 
                    margin: 0, 
                    opacity: 0.95,
                    lineHeight: 1.5,
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}>
                    {activity.description}
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.5rem', 
                marginLeft: '1.5rem',
                alignItems: 'flex-end'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  alignItems: 'flex-end'
                }}>

                </div>
              </div>
            </div>
            
            {/* Quick Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <CalendarIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Ngày:</label>
                  <span>{new Date(activity.date + 'T00:00:00').toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <ClockIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Thời gian:</label>
                  <span>{activity.scheduledTime} - {activity.endTime}</span>
                </div>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <MapPinIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Địa điểm:</label>
                  <span>{activity.location}</span>
                </div>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <UserGroupIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Số người tham gia:</label>
                  <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                    {participationCount}/{activity.capacity} người
                  </span>
                </div>
            </div>
          </div>
        </div>
        
          {/* Content Section */}
          <div style={{ padding: '2rem' }}>
            <div style={{
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
              gap: '1.5rem'
            }}>
            
            {/* Schedule Information */}
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1rem', 
                border: '1px solid #e5e7eb', 
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 style={{
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  color: '#111827', 
                  marginTop: 0, 
                  marginBottom: '1.25rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem'
                }}>
                  <ClockIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6366f1' }} />
                Thông tin lịch trình
              </h3>
              
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Ngày:</span>
                    <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                    {new Date(activity.date + 'T00:00:00').toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Thời gian bắt đầu:</span>
                    <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                      {activity.scheduledTime}
                    </span>
                </div>
                
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Thời gian kết thúc:</span>
                    <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                      {activity.endTime}
                    </span>
                </div>
                
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Thời lượng:</span>
                    <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 600 }}>
                      {activity.duration} phút
                    </span>
                </div>
                
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Địa điểm:</span>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#111827', 
                      fontWeight: 600,
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem' 
                    }}>
                      <MapPinIcon style={{ width: '0.875rem', height: '0.875rem', color: '#6366f1' }} />
                    {activity.location}
                    </span>
                </div>
                


              </div>
            </div>
            
            {/* Participation Information */}
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1rem', 
                border: '1px solid #e5e7eb', 
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 style={{
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  color: '#111827', 
                  marginTop: 0, 
                  marginBottom: '1.25rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem'
                }}>
                  <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6366f1' }} />
                Thông tin tham gia
              </h3>
              
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    <div style={{ fontSize: '0.95rem', color: '#374151', fontWeight: 500 }}>Sức chứa: {activity.capacity} người</div>
                    <div style={{ fontSize: '0.95rem', color: '#374151', fontWeight: 500 }}>
                      Đã đăng ký: {participationCount} người
                      {participationCount >= activity.capacity ? (
                        <span style={{ color: '#ef4444', marginLeft: 8, fontWeight: 600 }}>
                          Đã đạt sức chứa tối đa!
                        </span>
                      ) : (
                      <span style={{ color: '#10b981', marginLeft: 8 }}>
                          Còn {activity.capacity - participationCount} chỗ
                      </span>
                      )}
                    </div>
                  </div>




                  {/* Staff Assignment Section */}
                  <div style={{
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '1rem',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ fontSize: '0.95rem', color: '#374151', fontWeight: 500 }}>
                        Nhân viên hướng dẫn:
                      </div>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => setAssignStaffModalOpen(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <UserPlusIcon style={{ width: '1rem', height: '1rem' }} />
                          Phân công
                        </button>
                      )}
                    </div>
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      {assignedStaffList.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {assignedStaffList.map((staff, index) => (
                            <div key={staff.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}>
                            <div style={{
                              width: '2rem',
                              height: '2rem',
                              borderRadius: '50%',
                              background: '#3b82f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.875rem'
                            }}>
                                  {staff.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                                    {staff.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {staff.role || 'Nhân viên'}
                              </div>
                            </div>
                          </div>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleRemoveStaff(staff.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '1.5rem',
                                height: '1.5rem',
                                borderRadius: '50%',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                transition: 'all 0.2s ease'
                              }}
                              title="Xóa nhân viên khỏi hoạt động"
                            >
                              ×
                            </button>
                          )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}>
                          <UserIcon style={{ width: '1rem', height: '1rem' }} />
                          Chưa phân công nhân viên hướng dẫn
                        </div>
                      )}
                    </div>
                  </div>
                  
                 

              </div>
            </div>
            
            
          </div>
          
          
          


          {/* Bảng đánh giá tham gia */}
          <div style={{
            marginTop: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
                  Đánh giá tham gia hoạt động
                  {activity.date && (
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#6b7280',
                      marginLeft: '0.5rem'
                    }}>
                      - Ngày {new Date(activity.date + 'T00:00:00').toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </h3>
                {residentsFromEvaluations.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    <span>Tham gia: <strong style={{ color: '#10b981' }}>{residentsFromEvaluations.filter(r => r.participated).length}</strong></span>
                    <span>Vắng: <strong style={{ color: '#dc2626' }}>{residentsFromEvaluations.filter(r => !r.participated).length}</strong></span>
                    <span>Tổng: <strong>{residentsFromEvaluations.length}</strong></span>
                  </div>
                )}
              </div>
              {!evaluationMode && (
                <button
                  onClick={() => setEvaluationMode(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                  Đánh giá tham gia
                </button>
              )}
            </div>

            {evaluationMode ? (
              <div>
                {/* Search and bulk actions */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  alignItems: 'center'
                }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <MagnifyingGlassIcon style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '1rem',
                      height: '1rem',
                      color: '#9ca3af'
                    }} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm cư dân theo tên hoặc phòng..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        paddingLeft: '2.5rem',
                        paddingRight: '1rem',
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleSelectAll(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <CheckIcon style={{ width: '1rem', height: '1rem' }} />
                    Chọn tất cả Có
                  </button>
                  <button
                    onClick={() => handleSelectAll(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                    Chọn tất cả Không
                  </button>
                </div>

                {/* Participants list */}
                <div style={{ maxHeight: '400px', overflowY: 'auto' }} key={`participants-${refreshTrigger}`}>
                  {filteredResidents.map((resident) => {
                    const evaluation = evaluations[resident.id] || { participated: false, reason: '' };
                    return (
                      <div
                        key={`${resident.id}-${refreshTrigger}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem',
                          borderBottom: '1px solid #e5e7eb',
                          background: evaluation.participated ? '#f0fdf4' : '#fef2f2'
                        }}
                      >
                        <div style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '50%',
                          background: '#6366f1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          marginRight: '1rem'
                        }}>
                          {resident.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                            {resident.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Phòng: {resident.room || 'N/A'} | Tuổi: {resident.age || 'N/A'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`participation-${resident.id}`}
                              checked={evaluation.participated}
                              onChange={() => handleEvaluationChange(resident.id, true)}
                              style={{ cursor: 'pointer' }}
                              key={`yes-${resident.id}-${refreshTrigger}`}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Có</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`participation-${resident.id}`}
                              checked={!evaluation.participated}
                              onChange={() => handleEvaluationChange(resident.id, false)}
                              style={{ cursor: 'pointer' }}
                              key={`no-${resident.id}-${refreshTrigger}`}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Không</span>
                          </label>
                        </div>
                        {!evaluation.participated && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <input
                              type="text"
                              placeholder="Lý do vắng mặt..."
                              value={evaluation.reason || ''}
                              onChange={(e) => handleReasonChange(resident.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #d1d5db',
                                fontSize: '0.875rem',
                                background: '#fef2f2'
                              }}
                              key={`reason-${resident.id}-${refreshTrigger}`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredResidents.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      {residentsFromEvaluations.length === 0 ? 'Chưa có đánh giá tham gia nào cho hoạt động này.' : 'Không tìm thấy cư dân nào phù hợp với từ khóa tìm kiếm.'}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    onClick={() => setEvaluationMode(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEvaluations}
                    disabled={saving}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: saving ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {saving && (
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid transparent',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    )}
                    {saving ? 'Đang lưu...' : 'Lưu đánh giá'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>Tên cư dân</th>
                      <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Tham gia</th>
                      <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Lý do (nếu vắng)</th>
                      <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Ngày đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residentsFromEvaluations.map((resident) => {
                      const participated = resident.participated;
                      
                      // Validate performance notes for absent residents
                      const performanceNotes = resident.reason;
                      const isValidAbsenceReason = !participated && performanceNotes && 
                        !performanceNotes.includes('Tham gia tích cực') && 
                        !performanceNotes.includes('tinh thần tốt');
                      
                      return (
                        <tr key={resident.id} style={{ background: participated ? '#f0fdf4' : '#fef2f2' }}>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>
                            {resident.name}
                          </td>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: participated ? '#10b981' : '#dc2626', fontWeight: 600 }}>
                            {participated ? 'Có' : 'Không'}
                          </td>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>
                            {participated ? '-' : (
                              isValidAbsenceReason ? performanceNotes : 
                              <span style={{ color: '#f59e0b' }}>Chưa nhập lý do hoặc lý do không hợp lệ</span>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '0.875rem' }}>
                            {resident.evaluationDate ? new Date(resident.evaluationDate).toLocaleDateString('vi-VN') : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                    {residentsFromEvaluations.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
                          Chưa có đánh giá tham gia nào cho ngày này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>



      {/* Modal phân công nhân viên hướng dẫn */}
      <Dialog open={assignStaffModalOpen} onClose={() => setAssignStaffModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-2 sm:px-4">
          <div className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-auto p-6 z-15">
            <h2 className="text-lg font-bold mb-4">Phân công nhân viên hướng dẫn</h2>
            <select
              value={selectedStaffId || ''}
              onChange={e => setSelectedStaffId(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="">-- Chọn nhân viên --</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>{staff.name} ({staff.role})</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAssignStaffModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold"
                disabled={assigningStaff}
              >
                Hủy
              </button>
              <button
                onClick={handleAssignStaff}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                disabled={assigningStaff || !selectedStaffId}
              >
                {assigningStaff ? 'Đang phân công...' : 'Phân công'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        type={confirmModal.type}
      />

      {/* Notification Modal */}
      <NotificationModal
        open={notificationModal.open}
        title={notificationModal.title}
        message={notificationModal.message}
        type={notificationModal.type}
        onClose={() => setNotificationModal(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
} 