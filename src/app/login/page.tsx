﻿"use client";

import { useState, useEffect, useRef, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { LOGIN_REDIRECT_DELAY } from '@/lib/constants/app';
import { 
  LockClosedIcon, 
  EnvelopeIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  HomeIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  ClockIcon,
  HeartIcon,
  UserGroupIcon,
  AcademicCapIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import type { User } from '@/lib/contexts/auth-context';
import { toast } from 'react-toastify';
import React from 'react';
import SuccessModal from '@/components/SuccessModal';
import './login-animations.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const hasRedirected = useRef(false);
  const [sessionDebug, setSessionDebug] = useState({});
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [messageDisplayed, setMessageDisplayed] = useState(false);
  const [randomValues, setRandomValues] = useState<{
    quantumParticles: Array<{
      left: number;
      top: number;
      width: number;
      height: number;
      color: string;
      duration: number;
      delay: number;
      blur: number;
      shadow: number;
    }>;
    bubbles: Array<{
      left: number;
      top: number;
      width: number;
      height: number;
      duration: number;
      delay: number;
    }>;
  }>({
    quantumParticles: [],
    bubbles: []
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const { login, user, loading } = useAuth();

  // Preload các trang đích để tăng tốc độ chuyển trang
  useEffect(() => {
    // Preload tất cả các trang có thể ngay lập tức
    router.prefetch('/family');
    router.prefetch('/admin');
    router.prefetch('/staff');
    if (returnUrl && returnUrl !== '/login') {
      router.prefetch(returnUrl);
    }
  }, [router, returnUrl]);

  // Immediate redirect nếu user đã đăng nhập
  useEffect(() => {
    // Reset hasRedirected khi user là null hoặc loading
    if (!user || loading) {
      hasRedirected.current = false;
      return;
    }
    
    // Chỉ redirect khi user thực sự hợp lệ và chưa redirect
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      
      const redirectTo = (url: string) => {
        startTransition(() => {
          router.push(url);
        });
      };

      if (user.role === 'family') {
        redirectTo('/family');
      } else if (user.role === 'admin') {
        redirectTo('/admin');
      } else if (user.role === 'staff') {
        redirectTo('/staff');
      } else if (returnUrl && returnUrl !== '/login') {
        redirectTo(returnUrl);
      } else {
        redirectTo('/');
      }
    }
  }, [user, loading, returnUrl]);

  // Preload thêm khi user bắt đầu nhập thông tin để tăng tốc độ
  useEffect(() => {
    if (email.length > 0 || password.length > 0) {
      // Khi user bắt đầu nhập, preload lại các trang để đảm bảo
      router.prefetch('/family');
      router.prefetch('/admin');
      router.prefetch('/staff');
      if (returnUrl && returnUrl !== '/login') {
        router.prefetch(returnUrl);
      }
    }
  }, [email, password, router, returnUrl]);

  // Khôi phục lỗi và thông báo thành công từ localStorage nếu có
  useEffect(() => {
    const savedError = localStorage.getItem('login_error');
    const savedSuccess = localStorage.getItem('login_success');
    const savedAttempts = localStorage.getItem('login_attempts');
    
    // Reset redirect flag khi component mount hoặc khi user thay đổi
    setShouldRedirect(false);
    hasRedirected.current = false;
    
    // Chỉ khôi phục thông báo nếu user chưa đăng nhập và chưa hiển thị thông báo
    if (!user && !loading && !messageDisplayed) {
      if (savedError) {
        setError(savedError);
        setMessageDisplayed(true);
        // Không xóa ngay lập tức, để thông báo hiển thị lâu hơn
      }
      if (savedSuccess) {
        setSuccess(savedSuccess);
        setMessageDisplayed(true);
        // Không xóa ngay lập tức, để thông báo hiển thị lâu hơn
      }
      if (savedAttempts) {
        setLoginAttempts(parseInt(savedAttempts));
      }
    } else if (user) {
      // Nếu user đã đăng nhập, chỉ xóa thông báo lỗi, giữ thông báo thành công
      localStorage.removeItem('login_error');
      setError('');
      setLoginAttempts(0);
      // Không xóa thông báo thành công để user có thể thấy
    }
  }, [user, loading]);

  // Tạo random values cho animations ở client side để tránh hydration mismatch
  useEffect(() => {
    const colors = ['#ff0844', '#00c9ff', '#8338ec', '#06ffa5', '#ff6b35'];
    
    const quantumParticles = Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: 8 + Math.random() * 16,
      height: 8 + Math.random() * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 10 + Math.random() * 15,
      delay: Math.random() * 10,
      blur: Math.random() * 2,
      shadow: 10 + Math.random() * 20
    }));
    
    const bubbles = Array.from({ length: 12 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: 20 + Math.random() * 40,
      height: 20 + Math.random() * 40,
      duration: 8 + Math.random() * 8,
      delay: Math.random() * 8
    }));
    
    setRandomValues({ quantumParticles, bubbles });
  }, []);

  // Wrapper function để lưu lỗi vào localStorage
  const setErrorWithStorage = (errorMessage: string) => {
    setError(errorMessage);
    setMessageDisplayed(true);
    // Không xóa thông báo thành công ngay lập tức
    if (errorMessage) {
      localStorage.setItem('login_error', errorMessage);
      // Tăng số lần thử đăng nhập sai
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());
    } else {
      localStorage.removeItem('login_error');
      // Reset số lần thử khi đăng nhập thành công
      setLoginAttempts(0);
      localStorage.removeItem('login_attempts');
    }
  };

  // Wrapper function để hiển thị thông báo thành công
  const setSuccessWithStorage = (successMessage: string) => {
    setSuccess(successMessage);
    setMessageDisplayed(true);
    // Không xóa lỗi ngay lập tức khi có thông báo thành công
    if (successMessage) {
      localStorage.setItem('login_success', successMessage);
    } else {
      localStorage.removeItem('login_success');
    }
  };

  useEffect(() => {
    if (!loading && user && !hasRedirected.current && shouldRedirect) {
      hasRedirected.current = true; // Đánh dấu đã redirect để tránh vòng lặp
      
      // Chuyển trang ngay lập tức không cần delay
      const redirectTo = (url: string) => {
        // Preload trang đích để tăng tốc độ
        router.prefetch(url);
        // Sử dụng startTransition để tối ưu hóa việc chuyển trang
        startTransition(() => {
          router.push(url);
        });
      };

      // Ưu tiên redirect dựa trên role trước, sau đó mới đến returnUrl
      if (user.role === 'family') {
        redirectTo('/family');
      } else if (user.role === 'admin') {
        redirectTo('/admin');
      } else if (user.role === 'staff') {
        redirectTo('/staff');
      } else if (returnUrl && returnUrl !== '/login') {
        redirectTo(returnUrl);
      } else {
        redirectTo('/');
      }
    }
  }, [user, loading, returnUrl, shouldRedirect]);

  useEffect(() => {
    setSessionDebug({
      access_token: localStorage.getItem('access_token'),
      user: localStorage.getItem('user'),
      session_start: localStorage.getItem('session_start'),
    });
  }, [user, loading]);

  // Xóa thông báo khi user logout
  useEffect(() => {
    if (!user && !loading) {
      // Chỉ xóa thông báo thành công khi user đã logout thực sự
      // Không xóa khi component mount lần đầu
      const hasLoggedOut = localStorage.getItem('has_logged_out');
      if (hasLoggedOut) {
        localStorage.removeItem('login_success');
        setSuccess('');
        setMessageDisplayed(false);
        localStorage.removeItem('has_logged_out');
      }
    }
  }, [user, loading]);

  // Đảm bảo thông báo không bị mất khi component re-render
  useEffect(() => {
    if (messageDisplayed && !error && !success) {
      // Nếu thông báo đã hiển thị nhưng bị mất, khôi phục lại
      const savedError = localStorage.getItem('login_error');
      const savedSuccess = localStorage.getItem('login_success');
      
      if (savedError) {
        setError(savedError);
      }
      if (savedSuccess) {
        setSuccess(savedSuccess);
      }
    }
  }, [messageDisplayed, error, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 handleSubmit called - preventing default reload');
    
    // Xóa lỗi khi bắt đầu đăng nhập lại
    setError('');
    localStorage.removeItem('login_error');
    
    // Validation cơ bản
    if (!email.trim() || !password.trim()) {
      console.log('❌ Validation failed - empty fields');
      setErrorWithStorage('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    
    console.log('✅ Starting login process...');
    setIsLoading(true);

    // Tạo timeout promise để tránh chờ quá lâu
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Yêu cầu hết thời gian chờ. Vui lòng thử lại.')), 5000);
    });

    try {
      console.log('🔄 Calling login API...');
      // Race giữa login và timeout
      const user = await Promise.race([
        login(email, password),
        timeoutPromise
      ]);
      const typedUser = user as User | null;
      if (typedUser) {
        console.log('✅ Login successful - redirecting...');
        setError('');
        localStorage.removeItem('login_error');
        setUserName(typedUser.name);
        // Lưu thông báo thành công vào localStorage
        localStorage.setItem('login_success', `Chào mừng bạn quay lại, ${typedUser.name || 'bạn'}!`);
        // Chuyển trang ngay lập tức
        if (typedUser.role === 'family') {
          router.push('/family');
        } else if (typedUser.role === 'admin') {
          router.push('/admin');
        } else if (typedUser.role === 'staff') {
          router.push('/staff');
        } else if (returnUrl && returnUrl !== '/login') {
          router.push(returnUrl);
        } else {
          router.push('/');
        }
      }
      // Không cần else, vì nếu không thành công sẽ vào catch
    } catch (err: any) {
      console.log('❌ Login failed:', err.message);
      setIsLoading(false);
      setShouldRedirect(false);
      setSuccess('');
      localStorage.removeItem('login_success');

      if (err.response?.status === 401) {
        setErrorWithStorage('Email hoặc mật khẩu không đúng');
      } else if (err.response?.status === 403) {
        setErrorWithStorage('Tài khoản không có quyền truy cập');
      } else if (err.response?.status === 423) {
        setErrorWithStorage('Tài khoản đã bị khóa');
      } else if (err.response?.status === 404) {
        setErrorWithStorage('Tài khoản không tồn tại');
      } else if (err.message?.includes('timeout')) {
        setErrorWithStorage('Kết nối chậm, vui lòng thử lại');
      } else {
        setErrorWithStorage('Email hoặc mật khẩu không đúng');
      }

      // Xóa setTimeout tự động xóa lỗi
      // setTimeout(() => {
      //   setErrorWithStorage('');
      // }, 5000);

      return;
    }

    setIsLoading(false);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Không xóa lỗi khi nhập lại email
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Không xóa lỗi khi nhập lại password
  };

  // Chặn mọi reload có thể xảy ra
  useEffect(() => {
    const handleUnload = () => {
      console.log('🔄 Page unload detected');
    };

    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  // Log khi component mount/unmount
  useEffect(() => {
    console.log('📱 LoginPage mounted');
    return () => {
      console.log('📱 LoginPage unmounted');
    };
  }, []);

  return (
    <>
      <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} name={userName} />
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #f9e7c4 0%, #fbc2eb 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}>
        {/* Glassmorphism overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(10px)',
          zIndex: 1
        }} />
        {/* Shine sweep effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(120deg, transparent 60%, rgba(255,255,255,0.18) 80%, transparent 100%)',
          mixBlendMode: 'lighten',
          animation: 'shineSweep 12s linear infinite',
          pointerEvents: 'none',
          zIndex: 3
        }} />

        {/* Subtle Animated Grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(90deg, transparent 98%, rgba(148, 163, 184, 0.1) 99%, transparent 100%),
            linear-gradient(0deg, transparent 98%, rgba(148, 163, 184, 0.1) 99%, transparent 100%)
          `,
          backgroundSize: '80px 80px',
          animation: 'subtleGridFloat 45s linear infinite',
          pointerEvents: 'none',
          opacity: 0.3
        }} />
        
        {/* Quantum Particle System */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle 2px at 20% 30%, #00ffff 100%, transparent 100%),
            radial-gradient(circle 1px at 40% 70%, #ff00ff 100%, transparent 100%),
            radial-gradient(circle 1px at 90% 40%, #ffff00 100%, transparent 100%),
            radial-gradient(circle 2px at 60% 10%, #00ff00 100%, transparent 100%),
            radial-gradient(circle 1px at 10% 90%, #ff0080 100%, transparent 100%),
            radial-gradient(circle 1px at 80% 20%, #0080ff 100%, transparent 100%),
            radial-gradient(circle 2px at 30% 60%, #ff8000 100%, transparent 100%),
            radial-gradient(circle 1px at 70% 80%, #8000ff 100%, transparent 100%)
          `,
          backgroundSize: '200px 200px, 300px 300px, 250px 250px, 180px 180px, 220px 220px, 280px 280px, 240px 240px, 260px 260px',
          animation: 'quantumParticles 30s linear infinite',
          pointerEvents: 'none'
        }} />
        
        {/* Ultra Advanced Energy Field */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            conic-gradient(from 0deg at 25% 25%, 
              rgba(255, 8, 68, 0.6) 0deg, 
              rgba(0, 201, 255, 0.6) 72deg, 
              rgba(131, 56, 236, 0.6) 144deg, 
              rgba(6, 255, 165, 0.6) 216deg, 
              rgba(255, 107, 53, 0.6) 288deg, 
              rgba(255, 8, 68, 0.6) 360deg),
            conic-gradient(from 180deg at 75% 75%, 
              rgba(233, 69, 96, 0.5) 0deg, 
              rgba(0, 114, 255, 0.5) 60deg, 
              rgba(255, 0, 110, 0.5) 120deg, 
              rgba(0, 180, 216, 0.5) 180deg, 
              rgba(255, 149, 0, 0.5) 240deg, 
              rgba(58, 12, 163, 0.5) 300deg, 
              rgba(233, 69, 96, 0.5) 360deg)
          `,
          pointerEvents: 'none',
          animation: 'advancedEnergyField 15s ease-in-out infinite alternate, slowRotate 60s linear infinite',
          filter: 'blur(1px)',
          mixBlendMode: 'screen'
        }} />
        
        {/* Futuristic Scanning Lines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(0, 255, 255, 0.1) 2px,
              rgba(0, 255, 255, 0.1) 4px
            )
          `,
          animation: 'scanLines 8s linear infinite',
          pointerEvents: 'none',
          opacity: 0.3
        }} />
        
        {/* Revolutionary Floating Elements with 3D Effects */}
        <div style={{
          position: 'absolute',
          top: '8%',
          left: '4%',
          width: '200px',
          height: '200px',
          background: `
            conic-gradient(from 45deg, #ff0844, #ff6b35, #00c9ff, #ff0844),
            radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, transparent 70%)
          `,
          borderRadius: '50%',
          animation: 'revolutionary3DFloat 8s ease-in-out infinite, holoGlow 4s ease-in-out infinite alternate',
        display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `
            0 0 100px rgba(255, 8, 68, 0.9),
            0 0 200px rgba(255, 107, 53, 0.7),
            0 0 300px rgba(0, 201, 255, 0.5),
            inset 0 0 50px rgba(255, 255, 255, 0.3),
            0 50px 100px rgba(0, 0, 0, 0.5)
          `,
          border: '3px solid rgba(255, 255, 255, 0.3)',
          transform: 'translateZ(0)',
          filter: 'drop-shadow(0 0 30px rgba(255, 8, 68, 0.8))',
          backdropFilter: 'blur(10px)'
      }}>
        <div style={{
            width: '100px',
            height: '100px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <HeartIcon style={{ 
              width: '60px', 
              height: '60px', 
    color: 'white',
              filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 1)) drop-shadow(0 0 40px rgba(255, 8, 68, 1))',
              animation: 'revolutionaryIconPulse 3s ease-in-out infinite'
            }} />
          </div>
        </div>
        
        {/* Holographic Medical Cross */}
        <div style={{
          position: 'absolute',
          top: '55%',
          right: '6%',
          width: '180px',
          height: '180px',
          background: `
            linear-gradient(45deg, 
              rgba(0, 201, 255, 0.8) 0%, 
              rgba(0, 114, 255, 0.9) 25%, 
              rgba(0, 78, 146, 0.8) 50%, 
              rgba(0, 201, 255, 0.9) 75%, 
              rgba(0, 114, 255, 0.8) 100%),
            conic-gradient(from 0deg, transparent 30%, rgba(255, 255, 255, 0.3) 35%, transparent 40%)
          `,
          clipPath: 'polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)',
          animation: 'revolutionary3DFloat 6s ease-in-out infinite reverse, holoCross 10s linear infinite',
          boxShadow: `
            0 0 80px rgba(0, 201, 255, 1),
            0 0 160px rgba(0, 114, 255, 0.8),
            0 0 240px rgba(0, 78, 146, 0.6),
            inset 0 0 40px rgba(255, 255, 255, 0.4)
          `,
          filter: 'drop-shadow(0 0 40px rgba(0, 201, 255, 0.9))',
          backdropFilter: 'blur(15px)'
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '12%',
          left: '2%',
          width: '160px',
          height: '300px',
          background: `
            repeating-linear-gradient(
              45deg,
              rgba(6, 255, 165, 0.6) 0px,
              rgba(0, 180, 216, 0.8) 20px,
              rgba(0, 119, 182, 0.6) 40px,
              rgba(6, 255, 165, 0.8) 60px
            )
          `,
          borderRadius: '50% 50% 50% 50% / 20% 20% 80% 80%',
          animation: 'quantumDNAHelix 12s ease-in-out infinite, revolutionary3DFloat 7s ease-in-out infinite',
          clipPath: 'ellipse(50% 85% at 50% 50%)',
          boxShadow: `
            0 0 100px rgba(6, 255, 165, 0.9),
            0 0 200px rgba(0, 180, 216, 0.7),
            inset 0 0 60px rgba(255, 255, 255, 0.3)
          `,
          filter: 'drop-shadow(0 0 50px rgba(6, 255, 165, 0.8))',
          transform: 'perspective(500px) rotateX(15deg)',
          backdropFilter: 'blur(10px)'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '35%',
          right: '20%',
          width: '120px',
          height: '120px',
          background: `
            conic-gradient(from 0deg, 
              rgba(255, 0, 110, 0.9), 
              rgba(131, 56, 236, 0.9), 
              rgba(58, 12, 163, 0.9), 
              rgba(255, 0, 110, 0.9)),
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 60%)
          `,
          borderRadius: '30%',
          animation: 'revolutionary3DFloat 9s ease-in-out infinite, technologicalSpin 20s linear infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `
            0 0 60px rgba(255, 0, 110, 1),
            0 0 120px rgba(131, 56, 236, 0.8),
            0 0 180px rgba(58, 12, 163, 0.6),
            inset 0 0 40px rgba(255, 255, 255, 0.4)
          `,
          border: '2px solid rgba(255, 255, 255, 0.5)',
          filter: 'drop-shadow(0 0 30px rgba(255, 0, 110, 0.9))',
          backdropFilter: 'blur(12px)'
        }}>
          <BuildingOffice2Icon style={{ 
            width: '60px', 
            height: '60px', 
            color: 'white', 
            filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 1)) drop-shadow(0 0 30px rgba(255, 0, 110, 1))',
            animation: 'revolutionaryIconFloat 4s ease-in-out infinite'
          }} />
        </div>
        
        {randomValues.quantumParticles.length > 0 && randomValues.quantumParticles.map((particle, i) => (
          <div key={`quantum-${i}`} style={{
            position: 'absolute',
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.width}px`,
            height: `${particle.height}px`,
            background: `
              radial-gradient(circle, 
                ${particle.color}, 
                transparent 70%)
            `,
            borderRadius: '50%',
            animation: `quantumEnergyFlow ${particle.duration}s linear infinite`,
            animationDelay: `${particle.delay}s`,
            filter: `blur(${particle.blur}px)`,
            pointerEvents: 'none',
            boxShadow: `0 0 ${particle.shadow}px currentColor`
          }} />
        ))}
        
          <div style={{
            position: 'absolute',
            inset: 0,
          background: `
            radial-gradient(circle at 10% 20%, rgba(255, 8, 68, 0.9) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 107, 53, 0.8) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(0, 201, 255, 0.9) 0%, transparent 60%),
            radial-gradient(circle at 70% 10%, rgba(255, 0, 110, 0.8) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(131, 56, 236, 0.9) 0%, transparent 55%),
            radial-gradient(circle at 90% 30%, rgba(6, 255, 165, 0.8) 0%, transparent 45%),
            radial-gradient(circle at 30% 60%, rgba(0, 116, 216, 0.7) 0%, transparent 50%),
            radial-gradient(circle at 60% 70%, rgba(233, 69, 96, 0.8) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
          animation: 'megaBackgroundShift 12s ease-in-out infinite alternate'
        }} />
        
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            conic-gradient(from 0deg at 25% 25%, rgba(255, 8, 68, 0.4) 0deg, rgba(255, 107, 53, 0.4) 90deg, rgba(0, 201, 255, 0.4) 180deg, rgba(255, 8, 68, 0.4) 360deg),
            conic-gradient(from 180deg at 75% 75%, rgba(131, 56, 236, 0.4) 0deg, rgba(6, 255, 165, 0.4) 90deg, rgba(233, 69, 96, 0.4) 180deg, rgba(131, 56, 236, 0.4) 360deg)
          `,
          pointerEvents: 'none',
          animation: 'neonPulse 6s ease-in-out infinite alternate, rotate 20s linear infinite'
        }} />
        
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(45deg, rgba(255, 8, 68, 0.3) 0%, transparent 25%, rgba(0, 201, 255, 0.4) 50%, transparent 75%, rgba(255, 107, 53, 0.3) 100%),
            linear-gradient(-45deg, rgba(131, 56, 236, 0.4) 0%, transparent 30%, rgba(6, 255, 165, 0.3) 70%, transparent 100%),
            linear-gradient(90deg, rgba(233, 69, 96, 0.3) 0%, transparent 50%, rgba(255, 149, 0, 0.4) 100%)
          `,
          pointerEvents: 'none',
          animation: 'energyWaves 10s ease-in-out infinite alternate-reverse'
        }} />
        
        {/* Ultra Dynamic Light Beams */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(45deg, transparent 40%, rgba(255, 8, 68, 0.1) 50%, transparent 60%),
            linear-gradient(-45deg, transparent 30%, rgba(0, 201, 255, 0.1) 50%, transparent 70%),
            linear-gradient(135deg, transparent 45%, rgba(6, 255, 165, 0.1) 55%, transparent 65%)
          `,
          pointerEvents: 'none',
          animation: 'lightSweep 15s linear infinite'
        }} />
        
        {/* Magical Floating Bubbles */}
        {randomValues.bubbles.length > 0 && randomValues.bubbles.map((bubble, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${bubble.left}%`,
            top: `${bubble.top}%`,
            width: `${bubble.width}px`,
            height: `${bubble.height}px`,
            background: `radial-gradient(circle, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))`,
            borderRadius: '50%',
            animation: `megaBubbleFloat ${bubble.duration}s ease-in-out infinite`,
            animationDelay: `${bubble.delay}s`,
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            pointerEvents: 'none'
          }} />
        ))}
          
          <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '180px',
        height: '180px',
        background: `
          radial-gradient(circle at 30% 30%, #ff0844, #ff6b35),
          linear-gradient(135deg, #ff0844 0%, #ff4081 50%, #ff6b35 100%)
        `,
        borderRadius: '50%',
        animation: 'megaFloat 6s ease-in-out infinite, megaGlow 3s ease-in-out infinite alternate, megaPulse 4s ease-in-out infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `
          0 0 60px rgba(255, 8, 68, 0.8),
          0 0 120px rgba(255, 107, 53, 0.6),
          0 30px 60px rgba(255, 64, 129, 0.4),
          inset 0 0 40px rgba(255, 255, 255, 0.3)
        `,
        border: '3px solid rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}>
        <HeartIcon style={{ 
          width: '80px', 
          height: '80px', 
          color: 'white', 
          filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 1)) drop-shadow(0 0 40px rgba(255, 8, 68, 0.8))',
          animation: 'iconPulse 2s ease-in-out infinite alternate'
        }} />
      </div>
      
      <div style={{
        position: 'absolute',
        top: '60%',
        right: '8%',
        width: '150px',
        height: '150px',
        background: `
          conic-gradient(from 45deg, #00c9ff, #0072ff, #004e92, #00c9ff),
          radial-gradient(circle at center, #00c9ff 0%, #0072ff 100%)
        `,
        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
        animation: 'megaFloat 4s ease-in-out infinite reverse, megaRotate 8s linear infinite, morphShape 6s ease-in-out infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `
          0 0 50px rgba(0, 201, 255, 0.9),
          0 0 100px rgba(0, 114, 255, 0.7),
          0 25px 50px rgba(0, 78, 146, 0.5),
          inset 0 0 35px rgba(255, 255, 255, 0.3)
        `,
        border: '2px solid rgba(255, 255, 255, 0.3)'
      }}>
        <UserGroupIcon style={{ 
          width: '70px', 
          height: '70px', 
          color: 'white', 
          filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 1)) drop-shadow(0 0 30px rgba(0, 201, 255, 0.8))',
          animation: 'iconFloat 3s ease-in-out infinite'
        }} />
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '3%',
        width: '160px',
        height: '160px',
        background: `
          linear-gradient(45deg, #06ffa5, #00b4d8, #0077b6),
          radial-gradient(circle at 40% 60%, #06ffa5 0%, #00b4d8 50%, #0077b6 100%)
        `,
        borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%',
        animation: 'megaFloat 5s ease-in-out infinite, megaPulse 4s ease-in-out infinite, shapeShift 8s ease-in-out infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `
          0 0 70px rgba(6, 255, 165, 0.8),
          0 0 140px rgba(0, 180, 216, 0.6),
          0 35px 70px rgba(0, 119, 182, 0.4),
          inset 0 0 45px rgba(255, 255, 255, 0.3)
        `,
        border: '3px solid rgba(255, 255, 255, 0.25)'
      }}>
        <AcademicCapIcon style={{ 
          width: '75px', 
          height: '75px', 
          color: 'white', 
          filter: 'drop-shadow(0 0 18px rgba(255, 255, 255, 1)) drop-shadow(0 0 36px rgba(6, 255, 165, 0.8))',
          animation: 'iconSpin 6s linear infinite'
        }} />
      </div>
      
      <div style={{
        position: 'absolute',
        top: '35%',
        right: '25%',
        width: '120px',
        height: '120px',
        background: `
          conic-gradient(from 0deg, #ff006e, #8338ec, #3a0ca3, #ff006e),
          radial-gradient(circle at center, #ff006e 20%, #8338ec 70%)
        `,
        borderRadius: '50%',
        animation: 'megaFloat 7s ease-in-out infinite, megaSparkle 2s ease-in-out infinite, continuousRotate 10s linear infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `
          0 0 40px rgba(255, 0, 110, 0.9),
          0 0 80px rgba(131, 56, 236, 0.7),
          0 20px 40px rgba(58, 12, 163, 0.5),
          inset 0 0 30px rgba(255, 255, 255, 0.3)
        `,
        border: '2px solid rgba(255, 255, 255, 0.4)'
      }}>
        <BuildingOffice2Icon style={{ 
          width: '60px', 
          height: '60px', 
          color: 'white', 
          filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 1)) drop-shadow(0 0 24px rgba(255, 0, 110, 0.8))',
          animation: 'iconGlow 4s ease-in-out infinite alternate'
        }} />
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '45%',
        left: '8%',
        width: '110px',
        height: '110px',
        background: `
          linear-gradient(135deg, #e94560, #533483, #16213e),
          radial-gradient(ellipse at top left, #e94560 0%, #533483 100%)
        `,
        borderRadius: '25%',
        animation: 'megaFloat 5.5s ease-in-out infinite reverse, megaSparkle 3s ease-in-out infinite, continuousRotate 15s linear infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `
          0 0 30px rgba(233, 69, 96, 0.9),
          0 0 60px rgba(83, 52, 131, 0.7),
          0 15px 30px rgba(22, 33, 62, 0.5),
          inset 0 0 25px rgba(255, 255, 255, 0.3)
        `,
        border: '2px solid rgba(255, 255, 255, 0.35)'
      }}>
        <ClockIcon style={{ 
          width: '50px', 
          height: '50px', 
          color: 'white', 
          filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 1)) drop-shadow(0 0 20px rgba(233, 69, 96, 0.8))',
          animation: 'iconFloat 5s ease-in-out infinite'
        }} />
      </div>
      
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '5%',
        width: '60px',
        height: '60px',
        background: `
          radial-gradient(circle, #ff0844 0%, #ff6b35 100%),
          conic-gradient(from 45deg, #ff0844, #ff6b35, #ff0844)
        `,
        borderRadius: '50%',
        animation: 'megaFloat 8s ease-in-out infinite, megaGlow 4s ease-in-out infinite alternate',
        boxShadow: '0 0 25px rgba(255, 8, 68, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '25%',
        right: '15%',
        width: '70px',
        height: '70px',
        background: `
          linear-gradient(135deg, #06ffa5, #00b4d8),
          radial-gradient(circle at center, #06ffa5 30%, #00b4d8 100%)
        `,
        borderRadius: '30%',
        animation: 'megaFloat 6s ease-in-out infinite reverse, shapeShift 10s ease-in-out infinite',
        boxShadow: '0 0 35px rgba(6, 255, 165, 0.7)',
        border: '2px solid rgba(255, 255, 255, 0.25)'
      }} />
      
      <div style={{
        position: 'absolute',
        top: '75%',
        left: '25%',
        width: '50px',
        height: '50px',
        background: `
          conic-gradient(from 0deg, #ff006e, #8338ec, #ff006e),
          radial-gradient(circle, #ff006e 20%, #8338ec 80%)
        `,
        borderRadius: '50%',
        animation: 'megaFloat 4s ease-in-out infinite, continuousRotate 12s linear infinite, megaPulse 6s ease-in-out infinite',
        boxShadow: '0 0 20px rgba(255, 0, 110, 0.8), 0 15px 30px rgba(84, 160, 255, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ShieldCheckIcon style={{ width: '45px', height: '45px', color: 'white', filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))' }} />
      </div>
      
      {/* Medical Cross Decorations */}
      <div style={{
        position: 'absolute',
        top: '25%',
        right: '15%',
        width: '60px',
        height: '60px',
        opacity: 0.1
      }}>
        <svg width="60" height="60" viewBox="0 0 60 60">
          <rect x="22" y="0" width="16" height="60" fill="#ef4444" rx="2" />
          <rect x="0" y="22" width="60" height="16" fill="#ef4444" rx="2" />
        </svg>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '30%',
        right: '20%',
        width: '40px',
        height: '40px',
        opacity: 0.15
      }}>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <rect x="15" y="0" width="10" height="40" fill="#10b981" rx="2" />
          <rect x="0" y="15" width="40" height="10" fill="#10b981" rx="2" />
        </svg>
      </div>

      <div style={{
        display: 'flex',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Elegant Left Panel - Refined Branding */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        background: 'linear-gradient(135deg, #fffbe9 0%, #fbc2eb 100%)',
        backdropFilter: 'blur(20px) saturate(1.05)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: `
          0 20px 40px rgba(0, 0, 0, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.9),
          0 0 60px rgba(16, 185, 129, 0.05)
        `,
        position: 'relative',
        animation: 'subtleGlow 12s ease-in-out infinite alternate'
      }}>
          {/* Refined Decorative Pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
            backgroundImage: `
              linear-gradient(45deg, rgba(16, 185, 129, 0.015) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(16, 185, 129, 0.015) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, rgba(14, 165, 233, 0.015) 75%),
              linear-gradient(-45deg, transparent 75%, rgba(14, 165, 233, 0.015) 75%)
            `,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px',
            opacity: 0.3
        }} />
        
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '400px' }}>
            {/* Refined Logo Section */}
          <div style={{
              width: '90px',
              height: '90px',
              background: `linear-gradient(135deg, #10b981 0%, #059669 100%), radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25) 0%, transparent 60%)`,
              borderRadius: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem auto',
              boxShadow: `0 0 25px rgba(16, 185, 129, 0.25), 0 10px 20px rgba(0, 0, 0, 0.1), inset 0 0 15px rgba(255, 255, 255, 0.2)`,
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              transform: 'perspective(300px) rotateX(2deg) rotateY(2deg)',
              animation: 'pulseLoop 1.8s cubic-bezier(.77,0,.18,1) infinite, glowLoop 2.5s ease-in-out infinite'
          }}>
              <BuildingOffice2Icon style={{ 
                width: '45px', 
                height: '45px', 
                color: 'white',
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))',
                animation: 'subtleIconFloat 5s ease-in-out infinite'
              }} />
              <div style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '24px',
                height: '24px',
                background: `
                  linear-gradient(135deg, #f59e0b 0%, #d97706 100%),
                  radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent 60%)
                `,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'subtleIconPulse 6s ease-in-out infinite',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.4)'
              }}>
                <HeartIcon style={{ 
                  width: '14px', 
                  height: '14px', 
                  color: 'white',
                  filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))'
                }} />
              </div>
          </div>
          
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
              background: 'linear-gradient(135deg, #059669 0%, #0ea5e9 50%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            margin: '0 0 1rem 0',
            letterSpacing: '-0.025em',
            animation: 'floatLoop 2.2s ease-in-out infinite'
          }}>
            CareHome
          </h1>
          
          <p style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              margin: '0 0 2.5rem 0',
              fontWeight: 500,
              lineHeight: 1.6,
              animation: 'pulseLoop 2.2s cubic-bezier(.77,0,.18,1) infinite'
            }}>
              Hệ thống quản lý viện dưỡng lão<br />
              <span style={{ color: '#059669', fontWeight: 600 }}>Chuyên nghiệp • An toàn • Tận tâm</span>
            </p>
            
                      
          <div
            style={{
              margin: '2rem 0',
              padding: '2.5rem',
              background: 'rgba(255,255,255,0.55)',
              borderRadius: '32px',
              border: '1.5px solid rgba(255,255,255,0.7)',
              boxShadow:
                '0 12px 48px 0 rgba(16, 185, 129, 0.10), 0 2px 8px 0 rgba(0,0,0,0.04), 0 0 0 1.5px rgba(255,255,255,0.25) inset',
              position: 'relative',
              overflow: 'hidden',
              transition: 'box-shadow 0.3s, transform 0.3s',
              backdropFilter: 'blur(18px) saturate(1.1)',
              WebkitBackdropFilter: 'blur(18px) saturate(1.1)',
              cursor: 'pointer',
            }}
            onMouseOver={e => {
              e.currentTarget.style.boxShadow =
                '0 24px 64px 0 rgba(16, 185, 129, 0.18), 0 4px 16px 0 rgba(0,0,0,0.08), 0 0 0 2px rgba(255,255,255,0.35) inset';
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.015)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.boxShadow =
                '0 12px 48px 0 rgba(16, 185, 129, 0.10), 0 2px 8px 0 rgba(0,0,0,0.04), 0 0 0 1.5px rgba(255,255,255,0.25) inset';
              e.currentTarget.style.transform = 'none';
            }}
          >
            {/* Subtle Decorative Corners */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '-12px',
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #e74c3c 60%, #f39c12 100%)',
              borderRadius: '50%',
              opacity: 0.18,
              filter: 'blur(2px)',
              zIndex: 2,
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-10px',
              left: '-10px',
              width: '28px',
              height: '28px',
              background: 'linear-gradient(135deg, #3498db 60%, #e91e63 100%)',
              borderRadius: '50%',
              opacity: 0.15,
              filter: 'blur(2px)',
              zIndex: 2,
              pointerEvents: 'none',
            }} />
            {/* Shine sweep overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(120deg, transparent 60%, rgba(255,255,255,0.18) 80%, transparent 100%)',
              mixBlendMode: 'lighten',
              animation: 'shineSweep 8s linear infinite',
              zIndex: 3,
              pointerEvents: 'none',
            }} />
            {/* Soft light overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(120deg, rgba(255,255,255,0.10) 0%, transparent 100%)',
              zIndex: 2,
              pointerEvents: 'none',
            }} />
            {/* Beautiful Care Illustration */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '280px',
              overflow: 'hidden',
              borderRadius: '24px',
              position: 'relative',
              zIndex: 4,
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            }}>
              <img
                src="https://th.bing.com/th/id/OIP.nJ4wfcDXbII6LeT_CkbhOAHaHa?r=0&w=740&h=740&rs=1&pid=ImgDetMain"
                alt="Elderly Care Services - Caregiver Support Illustration"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '18px',
                  filter:
                    'drop-shadow(0 4px 12px rgba(0,0,0,0.10)) brightness(1.08) contrast(1.08) saturate(1.15)',
                  transition: 'all 0.3s cubic-bezier(.77,0,.18,1)',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'scale(1.025)';
                  e.currentTarget.style.filter =
                    'drop-shadow(0 8px 24px rgba(0,0,0,0.13)) brightness(1.13) contrast(1.13) saturate(1.22)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter =
                    'drop-shadow(0 4px 12px rgba(0,0,0,0.10)) brightness(1.08) contrast(1.08) saturate(1.15)';
                }}
              />
              {/* Overlay gradient for better text readability */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '60px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.18), transparent)',
                  borderRadius: '0 0 18px 18px',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
            
            {/* Feature Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                {
                  icon: HeartIcon,
                  title: 'Chăm sóc tận tâm',
                  description: 'Theo dõi sức khỏe 24/7 với đội ngũ y bác sĩ chuyên nghiệp',
                  color: '#ef4444'
                },
                {
                  icon: UserGroupIcon,
                  title: 'Kết nối gia đình',
                  description: 'Cập nhật thông tin real-time cho người thân',
                  color: '#8b5cf6'
                },
                {
                  icon: ShieldCheckIcon,
                  title: 'Bảo mật cao',
                  description: 'Dữ liệu được bảo vệ theo tiêu chuẩn y tế quốc tế',
                  color: '#0ea5e9'
                }
              ].map((feature, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  cursor: 'default'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{
                    width: '45px',
                    height: '45px',
                    background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: `1px solid ${feature.color}30`
                  }}>
                    <feature.icon style={{ width: '24px', height: '24px', color: feature.color }} />
              </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      {feature.title}
              </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      lineHeight: 1.4
                    }}>
                      {feature.description}
              </div>
            </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)'
      }}>
        <div style={{
          width: '100%',
            maxWidth: '520px',
            maxHeight: '1100px',
          background: 'white',
            borderRadius: '20px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
              padding: '2.5rem 2.5rem 1.5rem 2.5rem',
              background: 'linear-gradient(135deg,rgb(153, 228, 203) 0%,rgb(136, 209, 240) 100%)',
              borderBottom: '1px solid #f3f4f6',
              position: 'relative'
          }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #10b981 0%, #0ea5e9 50%, #f59e0b 100%)'
              }} />
              
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                  position: 'relative'
                }}>
                  <LockClosedIcon style={{ width: '28px', height: '28px', color: 'white' }} />
                  {/* Small decorative elements */}
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '20px',
                    height: '20px',
                    background: '#f59e0b',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 8px rgba(245, 158, 11, 0.3)'
                  }}>
                    <HeartIcon style={{ width: '12px', height: '12px', color: 'white' }} />
                  </div>
                </div>
                
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1e293b',
                  margin: '0 0 0.5rem 0'
            }}>
              Đăng nhập
            </h2>
            <p style={{
              fontSize: '0.875rem',
                  color: '#64748b',
              margin: 0,
                  lineHeight: 1.5
            }}>
                  
            </p>
              </div>
          </div>
          
          {/* Form */}
            <div style={{ padding: '2.5rem' }}>
            {loginAttempts >= 3 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: '#fef3c7',
                color: '#92400e',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                border: '1px solid #fbbf24',
                fontWeight: 500
              }}>
                <ExclamationTriangleIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span>Quá nhiều lần đăng nhập sai. Vui lòng kiểm tra lại thông tin.</span>
              </div>
            )}
            
            {success && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.25rem',
                background: '#f0fdf4',
                color: '#166534',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                border: '1px solid #bbf7d0',
                fontWeight: 500
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
                <span style={{ fontWeight: 500 }}>{success}</span>
              </div>
            )}
            
                        {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.25rem',
                background: '#fef2f2',
                color: '#dc2626',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                border: '1px solid #fecaca',
                fontWeight: 500
              }}>
                <ExclamationTriangleIcon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                <span style={{ fontWeight: 500 }}>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}} noValidate>
              {/* Email Input */}
              <div>
                <label 
                  htmlFor="email" 
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}
                >
                  Địa chỉ email
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                      left: '1rem',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                      <EnvelopeIcon style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={"example@email.com"}
                    value={email}
                    onChange={handleEmailChange}
                    style={{
                      width: '100%',
                        padding: '0.875rem 1rem 0.875rem 2.75rem',
                      fontSize: '0.875rem',
                      color: '#1e293b',
                      background: 'white',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                      boxSizing: 'border-box',
                        transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#10b981';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              
              {/* Password Input */}
              <div>
                <label 
                  htmlFor="password" 
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}
                >
                  Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                      left: '1rem',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                      <LockClosedIcon style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChange={handlePasswordChange}
                    style={{
                      width: '100%',
                        padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                      fontSize: '0.875rem',
                      color: '#1e293b',
                      background: 'white',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                      boxSizing: 'border-box',
                        transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#10b981';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      top: '50%',
                        right: '1rem',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = '#6b7280';
                        e.currentTarget.style.background = '#f3f4f6';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = '#9ca3af';
                        e.currentTarget.style.background = 'none';
                    }}
                  >
                    {showPassword ? 
                        <EyeSlashIcon style={{ width: '18px', height: '18px' }} /> :
                        <EyeIcon style={{ width: '18px', height: '18px' }} />
                    }
                  </button>
                </div>
              </div>
              
              {/* Security Notice */}
              <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
              }}>
                    <ShieldCheckIcon style={{ width: '16px', height: '16px', color: 'white' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Bảo mật thông tin
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#047857', lineHeight: 1.4 }}>
                      Dữ liệu được mã hóa và bảo mật theo tiêu chuẩn y tế quốc tế
                    </div>
                  </div>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'white',
                  background: isLoading 
                    ? '#6b7280'
                    : error 
                    ? '#ef4444'
                    : success
                    ? '#22c55e'
                    : '#10b981',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  marginTop: '0.5rem',
                  boxShadow: isLoading 
                    ? 'none' 
                    : '0 4px 12px rgba(0, 0, 0, 0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                  transform: 'scale(1)'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }
                }}
              >
                {isLoading ? (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'}}>
                    <div style={{
                        width: '18px',
                        height: '18px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Đang xác thực...
                  </div>
                ) : (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                    <LockClosedIcon style={{ width: '18px', height: '18px' }} />
                    Đăng nhập
                  </div>
                )}
              </button>
            </form>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </>
  );
} 