"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, PhotoIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon, XMarkIcon, EyeIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/contexts/auth-context";
import { staffAPI } from "@/lib/api";
import { residentAPI } from "@/lib/api";
import { userAPI, photosAPI } from "@/lib/api";

export default function FamilyPhotosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [allPhotos, setAllPhotos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [detailPhoto, setDetailPhoto] = useState<any | null>(null);
  const [detailPhotoIndex, setDetailPhotoIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>('all');

  // CSS animations
  const styles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes modalScale {
      from { 
        transform: scale(0.9);
        opacity: 0;
      }
      to { 
        transform: scale(1);
        opacity: 1;
      }
    }
    
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;

     useEffect(() => {
     console.log('Modal states:', { detailPhoto});
     // Only hide header for modals, not the main page
     const hasModalOpen = detailPhoto;
     
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
      }, [detailPhoto]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      setLoading(false);
      setError("Không tìm thấy access token. Vui lòng đăng nhập lại.");
      return;
    }
    setLoading(true);
    setError(null);
    const familyId = user.id;
    photosAPI.getAll({ family_member_id: familyId })
      .then(async data => {
        // Map lại dữ liệu cho đúng định dạng UI mong muốn
        const mapped = await Promise.all(Array.isArray(data) ? data.map(async item => {
          let senderName = item.uploadedByName;
          let senderPosition = '';
          // Nếu uploaded_by là id user, fetch user info
          if (!senderName && item.uploaded_by && typeof item.uploaded_by === 'string' && item.uploaded_by.length === 24) {
            try {
              const userInfo = await userAPI.getById(item.uploaded_by);
              if (userInfo && userInfo.full_name) {
                senderName = userInfo.full_name;
                senderPosition = userInfo.position || '';
              }
            } catch (e) { /* Bỏ qua lỗi */ }
          }
          // Nếu không có, thử lấy từ staffList
          if (!senderName && item.uploadedBy && staffList.length > 0) {
            const staff = staffList.find(s => String(s._id) === String(item.uploadedBy));
            senderName = staff ? (staff.fullName || staff.name || staff.username || staff.email) : undefined;
            senderPosition = staff ? (staff.position || '') : '';
          }
          // Xử lý đường dẫn ảnh
          let imageUrl = item.file_path ? photosAPI.getPhotoUrl(item.file_path) : "";
          return {
            ...item,
            id: item._id,
            url: imageUrl,
            caption: item.caption || "",
            date: item.takenDate
              ? new Date(item.takenDate).toISOString().split("T")[0]
              : (item.created_at ? new Date(item.created_at).toISOString().split("T")[0] : ""),
            uploadedByName: senderName,
            uploadedByPosition: senderPosition,
            residentId: item.resident_id,
          };
        }) : []);
        setAllPhotos(mapped);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Lỗi không xác định");
        setLoading(false);
      });
  }, [user, staffList]);

  // Fetch staff list
  useEffect(() => {
    staffAPI.getAll().then(data => {
      setStaffList(Array.isArray(data) ? data : []);
    }).catch(() => setStaffList([]));
  }, []);

  // Fetch residents của user
  useEffect(() => {
    if (user?.id) {
      residentAPI.getByFamilyMemberId(user.id)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [data];
          setResidents(arr && arr.filter(r => r && r._id));
        })
        .catch(() => setResidents([]));
    } else {
      setResidents([]);
    }
  }, [user]);

  // Filter/search logic (thêm filter theo resident)
  const filteredPhotos = useMemo(() =>
    allPhotos.filter((photo: any) => {
      const matchSearch =
        photo.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (photo.uploadedBy && photo.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
        photo.date.includes(searchTerm);
      // Sửa logic lọc residentId: nếu chọn 'all' thì hiển thị tất cả, nếu không thì so sánh photo.residentId với selectedResidentId
      const matchResident = selectedResidentId === 'all' || String(photo.residentId) === String(selectedResidentId) || String(photo.resident_id) === String(selectedResidentId);
      return matchSearch && matchResident;
    }),
    [allPhotos, searchTerm, selectedResidentId]
  );

  // Group by date
  const groupedPhotos = useMemo(
    () =>
      filteredPhotos.reduce((groups: Record<string, any[]>, photo: any) => {
        const date = photo.date;
        if (!groups[date]) groups[date] = [];
        groups[date].push(photo);
        return groups;
      }, {} as Record<string, any[]>),
    [filteredPhotos]
  );
  const sortedDates = useMemo(
    () => Object.keys(groupedPhotos).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [groupedPhotos]
  );

  // Lightbox navigation
  const openLightbox = (photoId: any) => {
    const idx = filteredPhotos.findIndex((p: any) => p.id === photoId);
    setLightboxIndex(idx);
  };
  const closeLightbox = () => setLightboxIndex(null);
  const prevLightbox = () => setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i));
  const nextLightbox = () => setLightboxIndex(i => (i !== null && i < filteredPhotos.length - 1 ? i + 1 : i));

  // Download
  const downloadPhoto = async (url: string, name: string) => {
    try {
      // Sử dụng fetch như cũ vì đây là download file, không phải API business logic
      const accessToken = sessionStorage.getItem("access_token");
      const response = await fetch(url, {
        headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
      });
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = name || "photo.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(a.href);
    } catch (err) {
      alert("Không thể tải ảnh. Vui lòng thử lại!");
    }
  };

  // Keyboard navigation for photo modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events when modal is open and filteredPhotos is available
      if (!detailPhoto || detailPhotoIndex === null || !filteredPhotos || filteredPhotos.length === 0) return;

      switch (event.key) {
        case 'ArrowLeft':
          // Navigate to previous/newer photo
          event.preventDefault();
          if (detailPhotoIndex > 0) {
            const newIndex = detailPhotoIndex - 1;
            setDetailPhotoIndex(newIndex);
            setDetailPhoto(filteredPhotos[newIndex]);
          }
          break;
          
        case 'ArrowRight':
          // Navigate to next/older photo
          event.preventDefault();
          if (detailPhotoIndex < filteredPhotos.length - 1) {
            const newIndex = detailPhotoIndex + 1;
            setDetailPhotoIndex(newIndex);
            setDetailPhoto(filteredPhotos[newIndex]);
          }
          break;
          
        case 'Escape':
          // Close modal
          event.preventDefault();
          setDetailPhoto(null);
          setDetailPhotoIndex(null);
          break;
      }
    };

    // Add event listener when modal is open and filteredPhotos is ready
    if (detailPhoto && filteredPhotos && filteredPhotos.length > 0) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [detailPhoto, detailPhotoIndex, filteredPhotos]);

  if (loading) return <div style={{textAlign: 'center', marginTop: '3rem', color: '#64748b', fontSize: '1.2rem'}}>Đang tải ảnh...</div>;
  if (error) return <div style={{textAlign: 'center', marginTop: '3rem', color: 'red', fontSize: '1.2rem'}}>Lỗi: {error}</div>;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", padding: "0", fontFamily: 'Inter, sans-serif' }}>
      <style>{styles}</style>
      {/* Header */}
<div style={{
  position: 'sticky',
  top: 0,
  zIndex: 10,
  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
  border: '1px solid #e2e8f0',
  borderRadius: '2rem',
  padding: '1.5rem 2rem',
  marginBottom: '2rem',
  width: '100%',
  maxWidth: 1240,
  marginLeft: 'auto',
  marginRight: 'auto',
  fontFamily: 'Inter, Roboto, Arial, Helvetica, sans-serif',
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.05)',
  backdropFilter: 'blur(10px)',
  marginTop: '30px'
}}>

  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
    {/* Trái: Icon + Tiêu đề */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
      

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{
          width: 54,
          height: 54,
          background: 'linear-gradient(135deg, #ffb347 0%, #ff5858 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(255,88,88,0.15)'
        }}>
          <PhotoIcon style={{ width: 32, height: 32, color: 'white' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #ef4444 0%, #f59e42 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
            letterSpacing: '-0.025em'
          }}>
            Nhật ký hình ảnh
          </span>
          <span style={{
            fontSize: '1.125rem',
            color: '#64748b',
            fontWeight: 500
          }}>
            Khoảnh khắc đáng nhớ của người thân tại viện
          </span>
        </div>
      </div>
    </div>

    {/* Phải: Ô tìm kiếm */}
    <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: 300 }}>
      <div style={{ position: 'relative', minWidth: 320, maxWidth: 420, width: '100%' }}>
        <span style={{
          position: 'absolute',
          left: 22,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#cbd5e1',
          fontSize: 24,
          pointerEvents: 'none',
          zIndex: 2
        }}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input
          type="text"
          placeholder="Tìm kiếm ảnh, chú thích, người gửi..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '1.05rem 1.3rem 1.05rem 3.3rem',
            borderRadius: '2.2rem',
            border: '1.5px solid #e5e7eb',
            fontSize: '1.13rem',
            background: '#f8fafc',
            color: '#374151',
            boxShadow: '0 2px 8px rgba(30,41,59,0.04)',
            outline: 'none',
            fontWeight: 500,
            letterSpacing: '0.01em',
            transition: 'border 0.2s, box-shadow 0.2s',
            fontFamily: 'inherit'
          }}
          onFocus={e => {
            e.currentTarget.style.border = '1.5px solid #ff5858';
            e.currentTarget.style.boxShadow = '0 0 0 2px #ffe4e6';
          }}
          onBlur={e => {
            e.currentTarget.style.border = '1.5px solid #e5e7eb';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,41,59,0.04)';
          }}
        />
      </div>
    </div>
  </div>
</div>

      {/* Filter resident dropdown */}
      <div style={{
        maxWidth: 1240,
        margin: 0,
        padding: '0 2.5rem 0.5rem 2.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginLeft: '150px',
        marginBottom: '17px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1.5px solid #bbf7d0',
          borderRadius: '1.5rem',
          boxShadow: '0 1px 6px rgba(16,185,129,0.05)',
          padding: '0.6rem 1.3rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
          minWidth: 0,
          maxWidth: 'unset',
          width: 'auto',
          margin: 0,
          flexWrap: 'nowrap',
        }}>
          <UsersIcon style={{ width: 24, height: 24, color: '#10b981', flexShrink: 0 }} />
          <label htmlFor="resident-filter" style={{ fontWeight: 700, color: '#222', fontSize: '1.08rem', letterSpacing: '-0.01em', marginRight: 2, whiteSpace: 'nowrap' }}>
            Lọc theo người thân:
          </label>
          <select
            id="resident-filter"
            value={selectedResidentId}
            onChange={e => setSelectedResidentId(e.target.value)}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '0.9rem',
              border: '1.5px solid #bbf7d0',
              fontSize: '1.02rem',
              background: 'white',
              color: '#222',
              fontWeight: 600,
              minWidth: 120,
              boxShadow: '0 1px 3px rgba(16,185,129,0.07)',
              outline: 'none',
              transition: 'border 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onFocus={e => { e.currentTarget.style.border = '1.5px solid #10b981'; e.currentTarget.style.boxShadow = '0 0 0 3px #bbf7d0'; }}
            onBlur={e => { e.currentTarget.style.border = '1.5px solid #bbf7d0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(16,185,129,0.07)'; }}
          >
            <option value="all">Tất cả người thân</option>
            {residents.map((r: any) => {
              const value = r._id || r.id;
              const label = r.name || r.full_name || value || 'Không rõ tên';
              return <option key={value} value={value}>{label}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Gallery */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 2.5rem 3rem 2.5rem' }}>
        {sortedDates.length === 0 ? (
          <div style={{ textAlign: "center", color: "#6b7280", fontSize: "1.2rem", margin: "2.5rem 0" }}>Không tìm thấy ảnh phù hợp.</div>
        ) : (
          sortedDates.map(date => (
            <div key={date} style={{ marginBottom: "2.5rem" }}>
              <div style={{ fontWeight: 700, fontSize: "1.13rem", color: "#64748b", margin: "0 0 1.2rem 0", letterSpacing: "0.01em", textShadow: "0 1px 4px rgba(30,41,59,0.07)" }}>{new Date(date).toLocaleDateString("vi-VN")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2.1rem" }}>
                {groupedPhotos[date].map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    style={{ position: "relative", borderRadius: "14px", overflow: "hidden", background: '#f8fafc', boxShadow: '0 2px 12px rgba(30,41,59,0.07)', fontFamily: 'Inter, Roboto, Arial, Helvetica, sans-serif' }}
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.caption} 
                      onClick={() => {
                        const idx = filteredPhotos.findIndex((p: any) => p.id === photo.id);
                        setDetailPhoto(photo);
                        setDetailPhotoIndex(idx);
                      }}
                      style={{ 
                        width: "100%", 
                        height: "220px", 
                        objectFit: "cover", 
                        display: "block", 
                        background: "#f3f4f6", 
                        borderRadius: "14px",
                        cursor: "pointer",
                        transition: "transform 0.2s ease"
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
                      onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                      onError={(e) => {
                        console.error('Image failed to load:', photo.url);
                        e.currentTarget.style.display = 'none';
                        // Hiển thị placeholder khi ảnh lỗi
                        const placeholder = document.createElement('div');
                        placeholder.innerHTML = `
                          <div style="
                            width: 100%; 
                            height: 220px; 
                            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); 
                            border-radius: 14px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #6b7280;
                            font-size: 0.875rem;
                            font-weight: 500;
                          ">
                            <div style="text-align: center;">
                              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style="margin-bottom: 8px; opacity: 0.5;">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                              </svg>
                              <div>Không thể tải ảnh</div>
                            </div>
                          </div>
                        `;
                        e.currentTarget.parentNode?.appendChild(placeholder.firstElementChild!);
                      }}
                    />
                    
                    {/* Nút tải ảnh */}
                      <button
                      onClick={() => downloadPhoto(photo.url, photo.fileName || photo.caption || "photo.jpg")}
                      style={{ 
                        position: 'absolute', 
                        top: 12, 
                        right: 12, 
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
                        border: '1.5px solid #ef4444', 
                        borderRadius: '8px', 
                        color: '#ef4444', 
                        padding: '6px', 
                        cursor: 'pointer', 
                        fontSize: '1em', 
                        fontWeight: 500, 
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2), 0 1px 3px rgba(0, 0, 0, 0.08)', 
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)'
                      }}
                      onMouseOver={e => { 
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'; 
                        e.currentTarget.style.color = '#ffffff'; 
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3), 0 2px 6px rgba(0, 0, 0, 0.12)';
                      }}
                      onMouseOut={e => { 
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'; 
                        e.currentTarget.style.color = '#ef4444'; 
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2), 0 1px 3px rgba(0, 0, 0, 0.08)';
                      }}
                      title="Tải ảnh xuống"
                    >
                      <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
                      </button>
                    
                    {/* Nút xem chi tiết */}
                    <button
                      onClick={() => {
                        const idx = filteredPhotos.findIndex((p: any) => p.id === photo.id);
                        setDetailPhoto(photo);
                        setDetailPhotoIndex(idx);
                      }}
                      title="Xem chi tiết ảnh"
                      style={{ 
                        position: 'absolute', 
                        top: 52, 
                        right: 12, 
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
                        border: '1.5px solid #3b82f6', 
                        borderRadius: '8px', 
                        color: '#3b82f6', 
                        padding: '6px', 
                        cursor: 'pointer', 
                        fontSize: '1em', 
                        fontWeight: 500, 
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2), 0 1px 3px rgba(0, 0, 0, 0.08)', 
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)'
                      }}
                      onMouseOver={e => { 
                        e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'; 
                        e.currentTarget.style.color = '#ffffff'; 
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3), 0 2px 6px rgba(0, 0, 0, 0.12)';
                      }}
                      onMouseOut={e => { 
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'; 
                        e.currentTarget.style.color = '#3b82f6'; 
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2), 0 1px 3px rgba(0, 0, 0, 0.08)';
                      }}
                    >
                      <EyeIcon style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Lightbox */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(30,41,59,0.93)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s" }} onClick={closeLightbox}>

          <button onClick={closeLightbox}
           title="Đóng"
           style={{
             position: "absolute",
             top: 100,
             right: 60,
             background: "rgba(255, 255, 255, 0.25)",
             color: "white",
             border: "1px solid rgba(255, 255, 255, 0.2)",
             borderRadius: "50%",
             fontSize: 18,
             cursor: "pointer",
             zIndex: 10,
             padding: 16,
             fontWeight: 200,
             backdropFilter: "blur(10px)",
             WebkitBackdropFilter: "blur(10px)",
             boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
             transition: "all 0.3s ease",
             display: "flex",
             alignItems: "center",
             justifyContent: "center"
           }}
           onMouseOver={e => {
             e.currentTarget.style.transform = "translateY(-2px)";
             e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
             e.currentTarget.style.background = "rgba(255, 255, 255, 0.35)";
           }}
           onMouseOut={e => {
             e.currentTarget.style.transform = "translateY(0)";
             e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
             e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
           }}
         >
           <XMarkIcon style={{ width: 15, height: 15 }} />
         </button>
         
          <button onClick={e => { e.stopPropagation(); prevLightbox(); }} style={{ position: "absolute", left: 38, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.13)', color: 'white', border: 'none', borderRadius: 18, fontSize: 36, cursor: 'pointer', zIndex: 10, padding: '0 22px', fontWeight: 700, boxShadow: '0 2px 8px rgba(239,68,68,0.10)' }}><ChevronLeftIcon style={{width: 36, height: 36}} /></button>
          <img src={filteredPhotos[lightboxIndex].url} alt={filteredPhotos[lightboxIndex].caption} style={{ maxWidth: "84vw", maxHeight: "84vh", borderRadius: 28, boxShadow: "0 12px 48px rgba(0,0,0,0.30)", background: "#fff", objectFit: "contain" }} onClick={e => e.stopPropagation()} />
          <button onClick={e => { e.stopPropagation(); nextLightbox(); }} style={{ position: "absolute", right: 38, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.13)', color: 'white', border: 'none', borderRadius: 18, fontSize: 36, cursor: 'pointer', zIndex: 10, padding: '0 22px', fontWeight: 700, boxShadow: '0 2px 8px rgba(239,68,68,0.10)' }}><ChevronRightIcon style={{width: 36, height: 36}} /></button>
          <div style={{ position: "absolute", bottom: 56, left: 0, right: 0, textAlign: "center", display: "flex", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ background: "rgba(30,41,59,0.68)", borderRadius: 20, padding: "22px 36px", display: "inline-block", color: "#fff", minWidth: 260, fontWeight: 700, textShadow: "0 2px 8px rgba(30,41,59,0.5)", fontSize: '1.18rem' }}>
              <div style={{ fontSize: "1.32rem", fontWeight: 700, marginBottom: 10 }}>{filteredPhotos[lightboxIndex].caption}</div>
              <div style={{ fontSize: "1.09em", fontWeight: 500, opacity: 0.92, marginBottom: 6 }}>
                Người gửi: {filteredPhotos[lightboxIndex].uploadedByPosition && filteredPhotos[lightboxIndex].uploadedByName
                  ? `${filteredPhotos[lightboxIndex].uploadedByPosition} ${filteredPhotos[lightboxIndex].uploadedByName}`
                  : (filteredPhotos[lightboxIndex].uploadedByName || filteredPhotos[lightboxIndex].uploadedBy || "Không rõ")}
              </div>
              <div style={{ fontSize: "1.09em", fontWeight: 500, opacity: 0.92 }}>
                Ngày gửi: {filteredPhotos[lightboxIndex].date && new Date(filteredPhotos[lightboxIndex].date).toLocaleDateString("vi-VN")}
              </div>
              <button
                onClick={e => { e.stopPropagation(); downloadPhoto(filteredPhotos[lightboxIndex].url, filteredPhotos[lightboxIndex].fileName || filteredPhotos[lightboxIndex].caption || "photo.jpg"); }}
                style={{ marginTop: 18, background: 'linear-gradient(90deg, #ff5858 0%, #ffb347 100%)', color: 'white', border: 'none', borderRadius: 14, padding: '12px 34px', fontWeight: 700, fontSize: '1.13rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(255,88,88,0.08)', transition: 'background 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #ff5858 0%, #ff9147 100%)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #ff5858 0%, #ffb347 100%)'; }}
                title="Tải ảnh này"
              >
                <ArrowDownTrayIcon style={{ width: 16, height: 16, marginRight: 10, verticalAlign: 'middle' }} /> Tải ảnh
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal xem chi tiết ảnh */}
      {detailPhoto && (
        <div 
          onClick={() => setDetailPhoto(null)} 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.93) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(30, 41, 59, 0.97) 100%)', 
            backdropFilter: 'blur(24px) saturate(120%)',
            WebkitBackdropFilter: 'blur(24px) saturate(120%)',
            zIndex: 3000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            animation: 'fadeIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)', 
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '32px',
            marginLeft: '15rem',
           
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.98)', 
              borderRadius: '28px', 
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)', 
              border: '1px solid rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              padding: '0', 
              minWidth: '480px', 
              maxWidth: '580px', 
              width: '100%', 
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden',
              transform: 'scale(0.94)',
              animation: 'modalScale 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
                         {/* Professional Header với navigation */}
             <div style={{ 
               position: 'relative', 
               padding: '20px 24px', 
               display: 'flex', 
               justifyContent: 'space-between',
               alignItems: 'center',
               background: 'rgba(255, 255, 255, 0.7)',
               borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
               backdropFilter: 'blur(20px)'
             }}>
               {/* Counter và navigation buttons trái */}
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                   {/* Photo counter: ảnh mới nhất = 1, ảnh cũ nhất = max */}
                  {detailPhotoIndex !== null && (
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.9)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                      letterSpacing: '0.02em',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {detailPhotoIndex + 1} / {filteredPhotos.length}
                    </div>
                  )}
                 
                                   {/* Navigation buttons: ← về ảnh mới hơn, → đến ảnh cũ hơn */}
                  {detailPhotoIndex !== null && (
                    <>
                      <button 
                        onClick={() => {
                          if (detailPhotoIndex > 0) {
                            const newIndex = detailPhotoIndex - 1;
                            setDetailPhotoIndex(newIndex);
                            setDetailPhoto(filteredPhotos[newIndex]);
                          }
                        }}
                        disabled={detailPhotoIndex <= 0}
                        style={{ 
                          background: detailPhotoIndex > 0 ? 'rgba(99, 102, 241, 0.85)' : 'rgba(0, 0, 0, 0.08)',
                          color: detailPhotoIndex > 0 ? 'white' : 'rgba(0, 0, 0, 0.4)',
                          border: 'none',
                          borderRadius: '50%',
                          padding: '8px',
                          cursor: detailPhotoIndex > 0 ? 'pointer' : 'not-allowed',
                          opacity: detailPhotoIndex > 0 ? 1 : 0.5,
                          boxShadow: detailPhotoIndex > 0 ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          backdropFilter: 'blur(10px)',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Ảnh mới hơn"
                      >
                        <ChevronLeftIcon style={{ width: 16, height: 16 }} />
                      </button>

                      <button 
                        onClick={() => {
                          if (detailPhotoIndex < filteredPhotos.length - 1) {
                            const newIndex = detailPhotoIndex + 1;
                            setDetailPhotoIndex(newIndex);
                            setDetailPhoto(filteredPhotos[newIndex]);
                          }
                        }}
                        disabled={detailPhotoIndex >= filteredPhotos.length - 1}
                        style={{ 
                          background: detailPhotoIndex < filteredPhotos.length - 1 ? 'rgba(99, 102, 241, 0.85)' : 'rgba(0, 0, 0, 0.08)',
                          color: detailPhotoIndex < filteredPhotos.length - 1 ? 'white' : 'rgba(0, 0, 0, 0.4)',
                          border: 'none',
                          borderRadius: '50%',
                          padding: '8px',
                          cursor: detailPhotoIndex < filteredPhotos.length - 1 ? 'pointer' : 'not-allowed',
                          opacity: detailPhotoIndex < filteredPhotos.length - 1 ? 1 : 0.5,
                          boxShadow: detailPhotoIndex < filteredPhotos.length - 1 ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          backdropFilter: 'blur(10px)',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Ảnh cũ hơn"
                      >
                        <ChevronRightIcon style={{ width: 16, height: 16 }} />
                      </button>
                    </>
                  )}
               </div>

               {/* Close button phải */}
               <button 
                 onClick={() => {
                   setDetailPhoto(null);
                   setDetailPhotoIndex(null);
                 }} 
                 style={{ 
                   background: 'rgba(0, 0, 0, 0.05)',
                   border: 'none',
                   borderRadius: '50%',
                   color: 'rgba(0, 0, 0, 0.5)',
                   padding: '8px',
                   cursor: 'pointer',
                   boxShadow: 'none',
                   transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   width: '36px',
                   height: '36px',
                   backdropFilter: 'blur(10px)'
                 }} 
                 title="Đóng"
                 onMouseEnter={(e) => {
                   e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
                   e.currentTarget.style.color = 'white';
                   e.currentTarget.style.transform = 'scale(1.1)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                   e.currentTarget.style.color = 'rgba(0, 0, 0, 0.5)';
                   e.currentTarget.style.transform = 'scale(1)';
                 }}
               >
                 <XMarkIcon style={{ width: 16, height: 16 }} />
               </button>
             </div>

            {/* Enhanced Ảnh chính */}
            <div style={{ padding: '0 24px', marginTop: '8px' }}>
              <div style={{ 
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
                border: 'none'
              }}>
                <img 
                  src={detailPhoto.url} 
                  alt={detailPhoto.caption} 
                  style={{ 
                    width: '100%', 
                    maxHeight: '360px', 
                    objectFit: 'cover', 
                    display: 'block',
                    background: 'rgba(248, 250, 252, 0.8)',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                {/* Enhanced gradient overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.03) 100%)',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>

            {/* Enhanced Thông tin ảnh */}
            <div style={{ 
              padding: '24px 24px 24px 24px', 
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.6)'
            }}>
              <h3 style={{ 
                fontWeight: 600, 
                fontSize: '1.3rem', 
                marginBottom: '12px', 
                color: 'rgba(0, 0, 0, 0.8)', 
                letterSpacing: '-0.02em', 
                lineHeight: 1.3,
                margin: '0 0 12px 0',
                textShadow: 'none'
              }}>
                {detailPhoto.caption}
              </h3>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '6px', 
                marginBottom: '20px',
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.02)',
                borderRadius: '20px',
                border: 'none',
                boxShadow: 'none'
              }}>
                <div style={{ 
                  fontSize: '0.95rem', 
                  color: 'rgba(0, 0, 0, 0.6)', 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  letterSpacing: '0.01em'
                }}>
                                     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ opacity: 0.6 }}>
                     <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                     <line x1="16" y1="2" x2="16" y2="6"/>
                     <line x1="8" y1="2" x2="8" y2="6"/>
                     <line x1="3" y1="10" x2="21" y2="10"/>
                   </svg>
                  Ngày gửi: {new Date(detailPhoto.date).toLocaleDateString('vi-VN')}
                </div>
                
                <div style={{ 
                 fontSize: '0.95rem', 
                 color: 'rgba(0, 0, 0, 0.6)', 
                 fontWeight: 500,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 gap: '8px',
                 letterSpacing: '0.01em'
               }}>
                 <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ opacity: 0.6 }}>
                   <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                   <circle cx="12" cy="7" r="4"/>
                 </svg>
                 Người gửi: {detailPhoto.uploadedByName || detailPhoto.uploadedBy || "Không rõ"}
               </div>
              </div>

              {/* Enhanced Nút tải ảnh */}
            <button
              onClick={() => downloadPhoto(detailPhoto.url, detailPhoto.fileName || detailPhoto.caption || "photo.jpg")}
                style={{ 
                  background: 'rgba(59, 130, 246, 0.9)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '24px', 
                  padding: '12px 24px', 
                  fontWeight: 500, 
                  fontSize: '0.95rem', 
                  cursor: 'pointer', 
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                  letterSpacing: '0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: '0 auto',
                  minWidth: '160px',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={e => { 
                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.95)'; 
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.35)';
                }}
                onMouseOut={e => { 
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.9)'; 
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.25)';
                }}
                title="Tải ảnh xuống máy"
              >
                <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
                Tải ảnh xuống
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 