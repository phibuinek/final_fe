"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  ChatBubbleLeftRightIcon, 
  CalendarDaysIcon, 
  PhotoIcon,
  DocumentTextIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  HeartIcon,
  UsersIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  CheckIcon,
  XCircleIcon,
  InformationCircleIcon,
  BellIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale';

// Add CSS animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Mock family member data - multiple family members
const residents = [
  { 
    id: 1, 
    name: 'Nguyễn Văn Nam', 
    gender: 'Nam',
    room: 'A01', 
    photo: 'https://randomuser.me/api/portraits/men/72.jpg',
    age: 78,
    relationship: 'Cha',
    status: 'Ổn định',
    activities: [
      { id: 1, name: 'Tập thể dục buổi sáng', time: '08:00', endTime: '09:00', participated: true },
      { id: 2, name: 'Nghệ thuật & Thủ công', time: '10:30', endTime: '11:30', participated: true },
      { id: 3, name: 'Liệu pháp âm nhạc', time: '14:00', endTime: '15:00', participated: false, reason: 'Cảm thấy mệt mỏi, cần nghỉ ngơi' }
    ],
    activityHistory: [
      { 
        date: '2024-05-10',
        activities: [
          { id: 1, name: 'Tập thể dục buổi sáng', time: '08:00', endTime: '09:00', participated: true },
          { id: 2, name: 'Nghệ thuật & Thủ công', time: '10:30', endTime: '11:30', participated: true },
          { id: 3, name: 'Liệu pháp âm nhạc', time: '14:00', endTime: '15:00', participated: false, reason: 'Cảm thấy mệt mỏi, cần nghỉ ngơi' }
        ]
      },
      { 
        date: '2024-05-09',
        activities: [
          { id: 1, name: 'Tập thể dục buổi sáng', time: '08:00', endTime: '09:00', participated: true },
          { id: 2, name: 'Hoạt động vẽ tranh', time: '10:00', endTime: '11:00', participated: true },
          { id: 3, name: 'Thư giãn nghe nhạc', time: '15:00', endTime: '16:00', participated: true },
          { id: 4, name: 'Chơi cờ', time: '16:30', endTime: '17:30', participated: false, reason: 'Không có bạn chơi cùng' }
        ]
      },
      { 
        date: '2024-05-08',
        activities: [
          { id: 1, name: 'Tập thể dục buổi sáng', time: '08:00', endTime: '09:00', participated: false, reason: 'Thời tiết xấu, không thể tập ngoài trời' },
          { id: 2, name: 'Nghệ thuật & Thủ công', time: '10:30', endTime: '11:30', participated: true },
          { id: 3, name: 'Liệu pháp âm nhạc', time: '14:00', endTime: '15:00', participated: true },
          { id: 4, name: 'Đọc sách', time: '16:00', endTime: '17:00', participated: true }
        ]
      },
      { 
        date: '2024-05-07',
        activities: [
          { id: 1, name: 'Tập thể dục buổi sáng', time: '08:00', endTime: '09:00', participated: true },
          { id: 2, name: 'Hoạt động vẽ tranh', time: '10:00', endTime: '11:00', participated: true },
          { id: 3, name: 'Thư giãn nghe nhạc', time: '15:00', endTime: '16:00', participated: false, reason: 'Thiết bị âm nhạc bị hỏng' },
          { id: 4, name: 'Chơi cờ', time: '16:30', endTime: '17:30', participated: true }
        ]
      },
      { 
        date: '2024-05-06',
        activities: [
          { id: 1, name: 'Tập thể dục buổi sáng', time: '08:00', endTime: '09:00', participated: true },
          { id: 2, name: 'Nghệ thuật & Thủ công', time: '10:30', endTime: '11:30', participated: false, reason: 'Không có đủ dụng cụ cho tất cả mọi người' },
          { id: 3, name: 'Liệu pháp âm nhạc', time: '14:00', endTime: '15:00', participated: true },
          { id: 4, name: 'Đọc sách', time: '16:00', endTime: '17:00', participated: true }
        ]
      }
    ],
    vitals: {
      lastUpdated: '10/05/2024 09:30',
      bloodPressure: '130/85',
      heartRate: 72,
      temperature: 36.8,
      weight: '65'
    },
    careNotes: [
      { id: 1, date: '2024-05-10', note: 'Tham gia tập thể dục buổi sáng rất tích cực. Ăn hết 100% bữa sáng.', staff: 'Nguyễn Thị Lan, Y tá trưởng' },
      { id: 2, date: '2024-05-09', note: 'Báo cáo khó chịu nhẹ ở đầu gối phải. Đã áp dụng túi chườm nóng. Sẽ theo dõi.', staff: 'Lê Thị Hoa, Nhân viên chăm sóc' },
      { id: 3, date: '2024-05-08', note: 'Được gia đình thăm. Tâm trạng cải thiện rõ rệt sau chuyến thăm.', staff: 'Vũ Thị Mai, Quản lý ca' }
    ],
    medications: [
      { id: 1, name: 'Lisinopril', dosage: '10mg', schedule: 'Mỗi ngày một lần', lastAdministered: '10/05/2024 08:00' },
      { id: 2, name: 'Simvastatin', dosage: '20mg', schedule: 'Mỗi ngày một lần trước giờ đi ngủ', lastAdministered: '09/05/2024 21:00' },
      { id: 3, name: 'Vitamin D', dosage: '1000 IU', schedule: 'Mỗi ngày một lần', lastAdministered: '10/05/2024 08:00' }
    ],
    appointments: [
      { id: 1, type: 'Khám bác sĩ', date: '2024-05-15', time: '10:00', provider: 'BS. Trần Văn Nam' },
      { id: 2, type: 'Vật lý trị liệu', date: '2024-05-12', time: '14:30', provider: 'KTV. Phạm Văn Minh' }
    ],
    vitalHistory: [
      { id: 1, date: '2024-05-10', time: '09:30', bloodPressure: '130/85', heartRate: 72, temperature: 36.8, weight: 65, notes: 'Chỉ số ổn định' },
      { id: 2, date: '2024-05-09', time: '09:15', bloodPressure: '128/82', heartRate: 74, temperature: 36.7, weight: 65, notes: 'Tất cả trong giới hạn bình thường' },
      { id: 3, date: '2024-05-08', time: '09:45', bloodPressure: '132/87', heartRate: 70, temperature: 36.9, weight: 65, notes: 'Huyết áp hơi cao, cần theo dõi' },
      { id: 4, date: '2024-05-07', time: '09:30', bloodPressure: '125/80', heartRate: 73, temperature: 36.6, weight: 64.8, notes: 'Chỉ số tốt' },
      { id: 5, date: '2024-05-06', time: '09:20', bloodPressure: '127/83', heartRate: 71, temperature: 36.8, weight: 64.9, notes: 'Ổn định' }
    ]
  },
  { 
    id: 2, 
    name: 'Lê Thị Hoa', 
    gender: 'Nữ',
    room: 'A02', 
    photo: 'https://randomuser.me/api/portraits/women/65.jpg',
    age: 75,
    relationship: 'Mẹ',
    status: 'Khá',
    activities: [
      { id: 1, name: 'Tập thể dục nhẹ', time: '08:30', endTime: '09:30', participated: true },
      { id: 2, name: 'Hoạt động vẽ tranh', time: '10:00', endTime: '11:00', participated: true },
      { id: 3, name: 'Thư giãn nghe nhạc', time: '15:00', endTime: '16:00', participated: true }
    ],
    activityHistory: [
      { 
        date: '2024-05-10',
        activities: [
          { id: 1, name: 'Tập thể dục nhẹ', time: '08:30', endTime: '09:30', participated: true },
          { id: 2, name: 'Hoạt động vẽ tranh', time: '10:00', endTime: '11:00', participated: true },
          { id: 3, name: 'Thư giãn nghe nhạc', time: '15:00', endTime: '16:00', participated: true }
        ]
      },
      { 
        date: '2024-05-09',
        activities: [
          { id: 1, name: 'Tập thể dục nhẹ', time: '08:30', endTime: '09:30', participated: true },
          { id: 2, name: 'Hoạt động vẽ tranh', time: '10:00', endTime: '11:00', participated: false, reason: 'Không có hứng thú vẽ hôm nay' },
          { id: 3, name: 'Thư giãn nghe nhạc', time: '15:00', endTime: '16:00', participated: true },
          { id: 4, name: 'Chơi cờ', time: '16:30', endTime: '17:30', participated: true }
        ]
      },
      { 
        date: '2024-05-08',
        activities: [
          { id: 1, name: 'Tập thể dục nhẹ', time: '08:30', endTime: '09:30', participated: true },
          { id: 2, name: 'Hoạt động vẽ tranh', time: '10:00', endTime: '11:00', participated: true },
          { id: 3, name: 'Thư giãn nghe nhạc', time: '15:00', endTime: '16:00', participated: false, reason: 'Đau đầu nhẹ, cần nghỉ ngơi' },
          { id: 4, name: 'Đọc sách', time: '16:00', endTime: '17:00', participated: true }
        ]
      },
      { 
        date: '2024-05-07',
        activities: [
          { id: 1, name: 'Tập thể dục nhẹ', time: '08:30', endTime: '09:30', participated: false, reason: 'Cảm thấy không khỏe, bác sĩ khuyên nghỉ ngơi' },
          { id: 2, name: 'Hoạt động vẽ tranh', time: '10:00', endTime: '11:00', participated: true },
          { id: 3, name: 'Thư giãn nghe nhạc', time: '15:00', endTime: '16:00', participated: true },
          { id: 4, name: 'Chơi cờ', time: '16:30', endTime: '17:30', participated: true }
        ]
      },
      { 
        date: '2024-05-06',
        activities: [
          { id: 1, name: 'Tập thể dục nhẹ', time: '08:30', endTime: '09:30', participated: true },
          { id: 2, name: 'Hoạt động vẽ tranh', time: '10:00', endTime: '11:00', participated: true },
          { id: 3, name: 'Thư giãn nghe nhạc', time: '15:00', endTime: '16:00', participated: true },
          { id: 4, name: 'Đọc sách', time: '16:00', endTime: '17:00', participated: false, reason: 'Mắt mỏi, không thể đọc sách' }
        ]
      }
    ],
    vitals: {
      lastUpdated: '10/05/2024 10:15',
      bloodPressure: '125/80',
      heartRate: 68,
      temperature: 36.6,
      weight: '58'
    },
    careNotes: [
      { id: 1, date: '2024-05-10', note: 'Tham gia hoạt động vẽ tranh với tinh thần rất vui vẻ. Hoàn thành một bức tranh đẹp.', staff: 'Phạm Văn Minh, Chuyên viên hoạt động' },
      { id: 2, date: '2024-05-09', note: 'Ăn uống tốt, ngủ đầy đủ. Không có vấn đề gì bất thường.', staff: 'Lê Thị Hoa, Nhân viên chăm sóc' },
      { id: 3, date: '2024-05-08', note: 'Rất vui khi được gia đình đến thăm. Kể nhiều câu chuyện vui.', staff: 'Nguyễn Thị Lan, Y tá trưởng' }
    ],
    medications: [
      { id: 1, name: 'Amlodipine', dosage: '5mg', schedule: 'Mỗi ngày một lần', lastAdministered: '10/05/2024 08:00' },
      { id: 2, name: 'Calcium', dosage: '500mg', schedule: 'Hai lần mỗi ngày', lastAdministered: '10/05/2024 08:00' },
      { id: 3, name: 'Omega-3', dosage: '1000mg', schedule: 'Mỗi ngày một lần', lastAdministered: '10/05/2024 08:00' }
    ],
    appointments: [
      { id: 1, type: 'Khám định kỳ', date: '2024-05-18', time: '09:00', provider: 'BS. Nguyễn Thị Minh' },
      { id: 2, type: 'Khám mắt', date: '2024-05-20', time: '15:00', provider: 'BS. Lê Văn Đức' }
    ],
    vitalHistory: [
      { id: 1, date: '2024-05-10', time: '10:15', bloodPressure: '125/80', heartRate: 68, temperature: 36.6, weight: 58, notes: 'Chỉ số rất tốt' },
      { id: 2, date: '2024-05-09', time: '10:00', bloodPressure: '123/78', heartRate: 70, temperature: 36.5, weight: 58.2, notes: 'Tất cả bình thường' },
      { id: 3, date: '2024-05-08', time: '10:30', bloodPressure: '127/82', heartRate: 69, temperature: 36.7, weight: 58.1, notes: 'Ổn định' },
      { id: 4, date: '2024-05-07', time: '10:15', bloodPressure: '124/79', heartRate: 67, temperature: 36.6, weight: 58, notes: 'Chỉ số lý tưởng' },
      { id: 5, date: '2024-05-06', time: '10:45', bloodPressure: '126/81', heartRate: 71, temperature: 36.8, weight: 58.3, notes: 'Tốt' }
    ]
  }
];

export default function FamilyPortalPage() {
  const router = useRouter();
  
  const [selectedResident, setSelectedResident] = useState(residents[0]);
  
  // Add notifications state
  interface Notification {
    id: number;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: string;
  }
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Modal states
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Thêm modal xem nhân viên phụ trách
  const [showStaffModal, setShowStaffModal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    title: string;
    message: string;
    actionType: string;
    timestamp: string;
    id?: string;
  } | null>(null);
  
  // Form states
  const [contactMessage, setContactMessage] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [allPhotos, setAllPhotos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(null);

  // Activity history states
  const [selectedActivityDate, setSelectedActivityDate] = useState('2024-05-10');
  const [showActivityHistory, setShowActivityHistory] = useState(false);

  // Lấy danh sách nhân viên phụ trách (không trùng lặp)
  const staffInCharge = useMemo(() => {
    const staffSet = new Set<string>();
    selectedResident.careNotes.forEach(note => {
      let staffName = note.staff;
      if (note.staff.includes(',')) {
        staffName = note.staff.split(',')[0].trim();
      }
      staffSet.add(staffName);
    });
    return Array.from(staffSet);
  }, [selectedResident]);

  // Handler functions for button actions
  const handleContactStaff = () => {
    router.push('/family/contact-staff');
  };

  const handleSendMessage = () => {
    setShowMessageModal(true);
  };

  const handleVisitSchedule = () => {
    router.push('/family/schedule-visit');
  };

  const handleViewPhotos = () => {
    router.push('/family/photos');
  };
  
  // Submit handlers
  const submitContactRequest = () => {
    if (contactMessage.trim() && selectedStaff) {
      const requestId = `REQ-${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // Create professional notification
      setNotifications((prev: Notification[]) => [...prev, {
        id: Date.now(),
        type: 'success',
        title: 'Yêu cầu liên hệ đã được gửi',
        message: `Yêu cầu liên hệ đã được gửi thành công.`,
        timestamp: timestamp
      }]);

      // Show success modal
      setSuccessModalData({
        title: 'Đã gửi tin nhắn thành công!!!',
        message: `Nhân viên sẽ phản hồi trong vòng 30 phút đến 2 tiếng.`,
        actionType: 'contact',
        timestamp: timestamp,
        id: requestId
      });
      setShowSuccessModal(true);

      setContactMessage('');
      setSelectedStaff('');
    }
  };

  const submitMessage = () => {
    if (messageContent.trim()) {
      const messageId = `MSG-${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // Create professional notification
      setNotifications((prev: Notification[]) => [...prev, {
        id: Date.now(),
        type: 'success',
        title: 'Tin nhắn đã được gửi thành công',
        message: `Tin nhắn của bạn đã được gửi và đang được xử lý.`,
        timestamp: timestamp
      }]);

      // Show success modal for important actions
      setSuccessModalData({
        title: 'Đã gửi tin nhắn thành công',
        message: `Người nhận sẽ trả lời sau từ 30 phút đến 2 tiếng.`,
        actionType: 'message',
        timestamp: timestamp,
        id: messageId
      });
      setShowSuccessModal(true);

      setMessageContent('');
      setShowMessageModal(false);
    }
  };

  const submitVisitSchedule = () => {
    if (visitDate && visitTime && visitPurpose) {
      const scheduleId = `SCH-${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // Create professional notification
      setNotifications((prev: Notification[]) => [...prev, {
        id: Date.now(),
        type: 'success',
        title: 'Đã đặt lịch thăm thành công',
        message: `Lịch thăm đã được đặt thành công.`,
        timestamp: timestamp
      }]);

      // Show success modal
      setSuccessModalData({
        title: 'Đã đặt lịch thăm thành công',
        message: `Chúng tôi sẽ xác nhận lịch hẹn với bạn trong vòng 3 đến 12 tiếng.`,
        actionType: 'schedule',
        timestamp: timestamp,
        id: scheduleId
      });
      setShowSuccessModal(true);

      setVisitDate('');
      setVisitTime('');
      setVisitPurpose('');
    }
  };

  // Mock data
  const mockPhotos = [
    { id: 1, url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=200&fit=crop', caption: 'Hoạt động tập thể dục buổi sáng', date: '2024-01-15' },
    { id: 2, url: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=200&fit=crop', caption: 'Bữa ăn tối cùng bạn bè', date: '2024-01-14' },
    { id: 3, url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop', caption: 'Chăm sóc vườn hoa', date: '2024-01-13' },
    { id: 4, url: 'https://images.unsplash.com/photo-1573764446-fbca3cefb9c9?w=300&h=200&fit=crop', caption: 'Sinh nhật tháng 1', date: '2024-01-12' },
    { id: 5, url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=300&h=200&fit=crop', caption: 'Thư giãn đọc sách', date: '2024-01-11' },
    { id: 6, url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300&h=200&fit=crop', caption: 'Hoạt động vẽ tranh', date: '2024-01-10' }
  ];

  // Định nghĩa staffMembers chuẩn (object, giống contact-staff)
  const staffMembers = [
    { id: 1, name: 'Nguyễn Thị Lan', role: 'Y tá trưởng', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: 2, name: 'Dr. Trần Văn Nam', role: 'Bác sĩ', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 3, name: 'Lê Thị Hoa', role: 'Nhân viên chăm sóc', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
    { id: 4, name: 'Phạm Văn Minh', role: 'Chuyên viên hoạt động', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
    { id: 5, name: 'Vũ Thị Mai', role: 'Quản lý ca', avatar: 'https://randomuser.me/api/portraits/women/22.jpg' }
  ];

  const residentMembers = [
    'Nguyễn Văn Nam - Cha',
    ' Lê Thị Hoa - Mẹ'
  ];

  useEffect(() => {
    // Load uploaded photos from localStorage and combine with mock photos
    try {
      const uploadedPhotos = localStorage.getItem('uploadedPhotos');
      if (uploadedPhotos) {
        const parsedPhotos = JSON.parse(uploadedPhotos);
        // Filter photos for current resident and format them
        const residentPhotos = parsedPhotos
          .filter((photo: any) => photo.residentId.toString() === selectedResident.id.toString())
          .map((photo: any) => ({
            id: `uploaded_${photo.id}`,
            url: photo.url,
            caption: photo.caption,
            date: new Date(photo.uploadDate).toISOString().split('T')[0],
            uploadedBy: photo.uploadedBy,
            isUploaded: true
          }));
        
        // Combine with mock photos
        const combinedPhotos = [...mockPhotos, ...residentPhotos];
        // Sort by date (newest first)
        combinedPhotos.sort((a, b) => new Date(b.date).getTime() - new Date(a).getTime());
        setAllPhotos(combinedPhotos);
      } else {
        setAllPhotos(mockPhotos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      setAllPhotos(mockPhotos);
    }
  }, [selectedResident]);

  useEffect(() => {
    console.log('Modal states:', { showMessageModal, showStaffModal });
    // Only hide header for modals, not the main page
    const hasModalOpen = showMessageModal || showStaffModal;
    
    if (hasModalOpen) {
      console.log('Modal is open - adding hide-header class');
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      console.log('No modal open - removing hide-header class');
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showMessageModal, showStaffModal]);

  // Ensure header is shown when component mounts
  useEffect(() => {
    // Make sure header is visible when page loads
    document.body.classList.remove('hide-header');
    document.body.style.overflow = 'unset';
  }, []);

  // Remove notification after 5 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 5000); // Remove after 5 seconds
      
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Inject CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* Professional Notification Banner */}
      {notifications.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          zIndex: 10000,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '1rem 2rem',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'slideDown 0.4s ease-out'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </div>
              <div>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: '0 0 0.25rem 0'
                }}>
                  {notifications[notifications.length - 1]?.title}
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  margin: 0,
                  opacity: 0.9
                }}>
                  {notifications[notifications.length - 1]?.message}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setNotifications(prev => prev.slice(0, -1))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal for Important Actions */}
      {showSuccessModal && successModalData && (
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
          zIndex: 10001,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Success Icon */}
            <div style={{
              width: '5rem',
              height: '5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircleIcon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            </div>

            {/* Modal Content */}
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              margin: '0 0 1rem 0'
            }}>
              {successModalData.title}
            </h2>

            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              margin: '0 0 1.5rem 0',
              lineHeight: 1.6
            }}>
              {successModalData.message}
            </p>

            {/* Close Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  padding: '1rem 3rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  minWidth: '120px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)
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
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                <UsersIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Thông tin người thân 
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Theo dõi và kết nối với người thân của bạn
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Family Member Selector */}
        {residents.length > 1 && (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <UsersIcon style={{width: '1.25rem', height: '1.25rem', color: '#8b5cf6'}} />
              Chọn người thân để xem thông tin
            </h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem'}}>
              {residents.map((resident) => (
                <div
                  key={resident.id}
                  onClick={() => setSelectedResident(resident)}
                  style={{
                    background: selectedResident.id === resident.id ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'white',
                    border: selectedResident.id === resident.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    if (selectedResident.id !== resident.id) {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedResident.id !== resident.id) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <img 
                      src={resident.photo} 
                      alt={resident.name} 
                      style={{
                        height: '3.5rem', 
                        width: '3.5rem', 
                        borderRadius: '1rem', 
                        objectFit: 'cover',
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <div style={{flex: 1}}>
                      <div style={{fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem'}}>
                        {resident.name}
                      </div>
                      <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                        <span style={{fontWeight: 600}}>Quan hệ:</span> {resident.relationship} • <span style={{fontWeight: 600}}>Phòng:</span> {resident.room}
                      </div>
                    </div>
                    {selectedResident.id === resident.id && (
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        color: '#3b82f6'
                      }}>
                        <CheckCircleIcon style={{width: '1.5rem', height: '1.5rem'}} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resident Overview */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '0.75rem',
          boxShadow: '0 2px 8px -2px #000000',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '3rem', alignItems: 'flex-start'}}>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '3.5rem', alignItems: 'center', width: '100%'}}>
              <div>
                <img 
                  src={selectedResident.photo} 
                  alt={selectedResident.name} 
                  style={{
                    height: '10rem', 
                    width: '10rem', 
                    borderRadius: '1.5rem', 
                    objectFit: 'cover', 
                    border: '4px solid white', 
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                    marginLeft: '2rem'
                  }}
                />
              </div>
              <div style={{flex: 1, marginTop: '1.5rem'}}>
                
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 800, color: '#374151'}}>Tên: </span>{selectedResident.name}
                </div>
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 800, color: '#374151'}}>Mối quan hệ: </span>{selectedResident.relationship}
                </div>
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 800, color: '#374151'}}>Giới tính: </span>{selectedResident.gender}
                </div>
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 800, color: '#374151'}}>Phòng: </span>{selectedResident.room}
                </div>
                <div style={{marginBottom: '0.5rem'}}>
                  <span style={{fontWeight: 800, color: '#374151'}}>Tuổi: </span>{selectedResident.age} tuổi
                </div>
                <div style={{marginBottom: '1.5rem'}}>
                  <span style={{display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, background: selectedResident.status === 'Ổn định' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: selectedResident.status === 'Ổn định' ? '#166534' : '#92400e', border: selectedResident.status === 'Ổn định' ? '1px solid #86efac' : '1px solid #fbbf24'}}>
                    <div style={{width: '0.5rem', height: '0.5rem', background: selectedResident.status === 'Ổn định' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '9999px', marginRight: '0.5rem'}}></div>
                    Trạng thái sức khỏe: {selectedResident.status}
                  </span>
                </div>
                <div style={{display: 'flex', gap: '1.5rem', flexWrap: 'wrap'}}>
                  {/* Nút xem nhân viên phụ trách */}
                  <button
                    onClick={() => setShowStaffModal(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
                    }}
                  >
                    <UsersIcon style={{width: '1.25rem', height: '1.25rem', color: 'white'}} />
                    Nhân viên chăm sóc
                  </button>
                </div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '1rem',
                padding: '0.125rem',
                flexShrink: 0,
                maxWidth: '300px',
                width: '100%',
                marginRight: '4rem'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
                  borderRadius: '0.875rem',
                  padding: '1.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg style={{width: '0.875rem', height: '0.875rem', color: 'white'}} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </div>
                    <h3 style={{
                      fontSize: '0.875rem', 
                      fontWeight: 700, 
                      color: '#1f2937', 
                      margin: 0
                    }}>
                      Chỉ số sức khỏe của {selectedResident.name}
                    </h3>
                  </div>
                  
                  <p style={{
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    margin: '0 0 1rem 0'
                  }}>
                    <span style={{fontWeight: 600}}>Lần cập nhật gần nhất:</span> {selectedResident.vitals.lastUpdated}
                  </p>
                  
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.8rem'}}>
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                      <div style={{color: '#6b7280', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 600}}>Huyết áp (mmHg)</div>
                      <div style={{fontWeight: 700, color: '#ef4444', fontSize: '0.8rem'}}>{selectedResident.vitals.bloodPressure}</div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <div style={{color: '#6b7280', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 600}}>Nhịp tim (bpm)</div>
                      <div style={{fontWeight: 700, color: '#10b981', fontSize: '0.8rem'}}>{selectedResident.vitals.heartRate}</div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      <div style={{color: '#6b7280', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 600}}>Nhiệt độ cơ thể</div>
                      <div style={{fontWeight: 700, color: '#f59e0b', fontSize: '0.8rem'}}>{selectedResident.vitals.temperature}°C</div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                      <div style={{color: '#6b7280', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 600}}>Cân nặng hiện tại</div>
                      <div style={{fontWeight: 700, color: '#6366f1', fontSize: '0.8rem'}}>{selectedResident.vitals.weight} kg</div>
                    </div>
                  </div>
                  
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '0.375rem',
                      height: '0.375rem',
                      background: '#10b981',
                      borderRadius: '50%'
                    }} />
                    <span style={{fontSize: '0.7rem', color: '#059669', fontWeight: 600}}>
                      Tình trạng: Tất cả chỉ số đều bình thường
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabbed Information */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          <Tab.Group>
            <Tab.List style={{
              display: 'flex',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selected 
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }`
              }>
                Hoạt động sinh hoạt
              </Tab>
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selected 
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }`
              }>
                Ghi chú chăm sóc
              </Tab>
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selected 
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }`
              }>
                Chỉ số sức khỏe
              </Tab>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel style={{padding: '2rem'}}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0
                  }}>
                    {showActivityHistory ? 'Lịch sử hoạt động' : 'Hoạt động hôm nay'}
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    {showActivityHistory && (
                      <DatePicker
                        selected={new Date(selectedActivityDate)}
                        onChange={date => {
                          if (!date) return;
                          // Chỉ cho phép chọn ngày có trong activityHistory
                          const iso = date.toISOString().slice(0, 10);
                          if (selectedResident.activityHistory.some(day => day.date === iso)) {
                            setSelectedActivityDate(iso);
                          }
                        }}
                        includeDates={selectedResident.activityHistory.map(day => new Date(day.date))}
                        dateFormat="EEEE, d 'tháng' M, yyyy"
                        locale={vi}
                        popperPlacement="bottom"
                        showPopperArrow={false}
                        customInput={
                          <button
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '0.75rem',
                              border: '2px solid #3b82f6',
                              background: 'white',
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: '#374151',
                              cursor: 'pointer',
                              minWidth: '220px',
                              textAlign: 'left',
                              boxShadow: '0 2px 8px rgba(59,130,246,0.07)'
                            }}
                          >
                            {new Date(selectedActivityDate).toLocaleDateString('vi-VN', {
                              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                          </button>
                        }
                      />
                    )}
                    <button
                      onClick={() => setShowActivityHistory(!showActivityHistory)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #8b5cf6',
                        background: showActivityHistory ? 'white' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: showActivityHistory ? '#8b5cf6' : 'white',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        if (showActivityHistory) {
                          e.currentTarget.style.background = '#f3f4f6';
                        } else {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (showActivityHistory) {
                          e.currentTarget.style.background = 'white';
                        } else {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                        }
                      }}
                    >
                      <CalendarDaysIcon style={{width: '1rem', height: '1rem'}} />
                      {showActivityHistory ? 'Xem hôm nay' : 'Xem lịch sử hoạt động'}
                    </button>
                  </div>
                </div>

                {showActivityHistory ? (
                  <div>
                    <div style={{
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      marginBottom: '1.5rem',
                      border: '1px solid #bae6fd'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <InformationCircleIcon style={{width: '1.25rem', height: '1.25rem', color: '#0369a1'}} />
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#0369a1'
                        }}>
                          Lịch sử hoạt động - {new Date(selectedActivityDate).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#0c4a6e',
                        margin: 0
                      }}>
                        Xem lại các hoạt động đã tham gia trong ngày được chọn. 
                      </p>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                      {selectedResident.activityHistory
                        .find(day => day.date === selectedActivityDate)?.activities.map((activity) => (
                        <div
                          key={activity.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            background: activity.participated 
                              ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
                              : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                            border: '1px solid',
                            borderColor: activity.participated ? '#86efac' : '#d1d5db'
                          }}
                        >
                          <div style={{marginRight: '1rem'}}>
                            {activity.participated ? (
                              <CheckCircleIcon style={{width: '1.5rem', height: '1.5rem', color: '#16a34a'}} />
                            ) : (
                              <XCircleIcon style={{width: '1.5rem', height: '1.5rem', color: '#dc2626'}} />
                            )}
                          </div>
                          <div style={{flex: 1}}>
                            <div style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem'}}>
                              <span style={{fontWeight: 600, color: '#374151'}}>Hoạt động: </span>{activity.name}
                            </div>
                            <div style={{fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem'}}>
                              <span style={{fontWeight: 600}}>Thời gian: </span>{activity.time}{activity.endTime ? ` - ${activity.endTime}` : ''}
                            </div>
                            <span style={{fontSize: '0.75rem', fontWeight: 500, color: activity.participated ? '#166534' : '#dc2626', display: 'block', marginBottom: !activity.participated && activity.reason ? '0.25rem' : 0}}>
                              <span style={{fontWeight: 600}}>Trạng thái: </span>{activity.participated ? 'Đã tham gia' : 'Không tham gia'}
                            </span>
                            {!activity.participated && activity.reason && (
                              <div style={{
                                fontSize: '0.75rem', 
                                color: '#dc2626', 
                                fontStyle: 'italic',
                                background: 'rgba(220, 38, 38, 0.07)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                border: '1px solid rgba(220, 38, 38, 0.15)',
                                marginTop: 0
                              }}>
                                <span style={{fontWeight: 600}}>Lý do: </span>{activity.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    {selectedResident.activities.map((activity) => (
                      <div
                        key={activity.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          background: activity.participated 
                            ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
                            : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                          border: '1px solid',
                          borderColor: activity.participated ? '#86efac' : '#d1d5db'
                        }}
                      >
                        <div style={{marginRight: '1rem'}}>
                          {activity.participated ? (
                            <CheckCircleIcon style={{width: '1.5rem', height: '1.5rem', color: '#16a34a'}} />
                          ) : (
                            <ClockIcon style={{width: '1.5rem', height: '1.5rem', color: '#6b7280'}} />
                          )}
                        </div>
                        <div style={{flex: 1}}>
                          <div style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem'}}>
                            <span style={{fontWeight: 600, color: '#374151'}}>Hoạt động: </span>{activity.name}
                          </div>
                          <div style={{fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem'}}>
                            <span style={{fontWeight: 600}}>Thời gian: </span>{activity.time}{activity.endTime ? ` - ${activity.endTime}` : ''}
                          </div>
                          <span style={{fontSize: '0.75rem', fontWeight: 500, color: activity.participated ? '#166534' : '#6b7280'}}>
                            <span style={{fontWeight: 600}}>Trạng thái: </span>{activity.participated ? 'Đã tham gia' : 'Chưa tham gia'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Tab.Panel>
              
              <Tab.Panel style={{padding: '2rem'}}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem'
                }}>
                  Ghi chú chăm sóc gần đây
                </h3>
                <div style={{overflowX: 'auto'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderRadius: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                    <thead>
                      <tr>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Ngày</th>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Nội dung ghi chú</th>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Nhân viên chăm sóc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResident.careNotes.map((note) => {
                        let staffName = note.staff;
                        let staffRole = '';
                        if (note.staff.includes(',')) {
                          const parts = note.staff.split(',');
                          staffName = parts[0].trim();
                          staffRole = parts[1].trim();
                        }
                        return (
                          <tr key={note.id} style={{borderTop: '1px solid #e5e7eb'}}>
                            <td style={{padding: '0.75rem', fontSize: '0.95em', color: '#6b7280', whiteSpace: 'nowrap'}}><span style={{fontWeight: 600}}></span>{new Date(note.date).toLocaleDateString('vi-VN')}</td>
                            <td style={{padding: '0.75rem', fontSize: '0.95em', color: '#374151'}}><span style={{fontWeight: 600}}></span>{note.note}</td>
                            <td style={{padding: '0.75rem', fontSize: '0.95em'}}><span style={{fontWeight: 600}}></span><span style={{fontWeight: 700, color: '#8b5cf6'}}>{staffName}</span>{staffRole && (<span style={{fontWeight: 500, color: '#6366f1', fontSize: '0.85em', marginLeft: 4}}>&nbsp;({staffRole})</span>)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Tab.Panel>
              
              <Tab.Panel style={{padding: '2rem'}}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem'
                }}>
                  Lịch sử chỉ số sức khỏe
                </h3>
                <div style={{overflowX: 'auto'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderRadius: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                    <thead>
                      <tr>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Ngày</th>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Thời gian đo</th>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Huyết áp</th>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Nhịp tim</th>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Nhiệt độ</th>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Cân nặng</th>
                        <th style={{padding: '0.75rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.95em'}}>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResident.vitalHistory.map((vital, index) => (
                        <tr key={vital.id} style={{
                          borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
                          background: index % 2 === 0 ? 'white' : 'rgba(248, 250, 252, 0.5)'
                        }}>
                          <td style={{
                            padding: '0.75rem', 
                            fontSize: '0.95em', 
                            color: '#374151', 
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}>
                            {new Date(vital.date).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{
                            padding: '0.75rem', 
                            fontSize: '0.95em', 
                            color: '#6b7280',
                            whiteSpace: 'nowrap',
                            
                          }}>
                            {vital.time} am
                          </td>
                          <td style={{
                            padding: '0.75rem', 
                            fontSize: '0.95em', 
                            color: '#374151',
                            fontWeight: 600
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                              color: '#92400e',
                              border: '1px solid #fbbf24'
                            }}>
                              {vital.bloodPressure} mmHg
                            </span>
                          </td>
                          <td style={{
                            padding: '0.75rem', 
                            fontSize: '0.95em', 
                            color: '#374151',
                            fontWeight: 600
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                              color: '#1e40af',
                              border: '1px solid #60a5fa'
                            }}>
                              {vital.heartRate} bpm
                            </span>
                          </td>
                          <td style={{
                            padding: '0.75rem', 
                            fontSize: '0.95em', 
                            color: '#374151',
                            fontWeight: 600
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                              color: '#166534',
                              border: '1px solid #86efac'
                            }}>
                              {vital.temperature}°C
                            </span>
                          </td>
                          <td style={{
                            padding: '0.75rem', 
                            fontSize: '0.95em', 
                            color: '#374151',
                            fontWeight: 600
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                              color: '#be185d',
                              border: '1px solid #f9a8d4'
                            }}>
                              {vital.weight} kg
                            </span>
                          </td>
                          <td style={{
                            padding: '0.75rem', 
                            fontSize: '0.95em', 
                            color: '#6b7280',
                            fontStyle: 'italic'
                          }}>
                            {vital.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Modal hiển thị danh sách nhân viên phụ trách */}
      {showStaffModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 10002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out',
          marginLeft: '140px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '0',
            width: '520px',
            maxWidth: '120vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Header đơn giản */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '1rem 1rem 0 0',
              padding: '1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: '#6366f1',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UsersIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: '#1f2937',
                      margin: '0 0 0.25rem 0'
                    }}>
                      Đội ngũ chăm sóc
                    </h2>
                    <p style={{
                      fontSize: '0.85rem',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      Nhân viên đang chăm sóc người cao tuổi {selectedResident.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStaffModal(false)}
                  title="Đóng"
                  style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.color = '#374151';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  <XMarkIcon style={{width: '1.125rem', height: '1.125rem'}} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{
              padding: '1.5rem',
              background: 'white'
            }}>
              {/* Staff list đơn giản */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {staffMembers.map((staff) => (
                  <div key={staff.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        background: '#6366f1',
                        borderRadius: '0.375rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg style={{width: '1rem', height: '1rem', color: 'white'}} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          marginBottom: '0.25rem'
                        }}>
                          {staff.name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          {staff.role}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStaffModal(false);
                        router.push(`/family/contact-staff?staffId=${staff.id}`);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = '#5b21b6';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = '#6366f1';
                      }}
                    >
                      <ChatBubbleLeftRightIcon style={{width: '0.875rem', height: '0.875rem'}} />
                      Nhắn tin
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer message đơn giản */}
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#fef3c7',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#92400e',
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
