"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  DocumentPlusIcon,
  BanknotesIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface TransactionForm {
  description: string;
  category: string;
  amount: string;
  date: string;
  paymentMethod: string;
  reference: string;
  notes: string;
  status: string;
}

const categories = [
  { value: '', label: 'Chọn loại giao dịch' },
  { value: 'Thu nhập', label: 'Thu nhập' },
  { value: 'Chi phí', label: 'Chi phí' }
];

const incomeSubcategories = [
  'Phí dịch vụ chăm sóc',
  'Phí ăn uống', 
  'Phí y tế',
  'Phí tiện ích',
  'Phí đặc biệt',
  'Thu nhập khác'
];

const expenseSubcategories = [
  'Lương nhân viên',
  'Chi phí y tế',
  'Thực phẩm & Dinh dưỡng',
  'Tiện ích & Vận hành',
  'Bảo trì & Sửa chữa',
  'Vật tư tiêu hao',
  'Chi phí khác'
];

const paymentMethods = [
  { value: '', label: 'Chọn phương thức thanh toán' },
  { value: 'Tiền mặt', label: 'Tiền mặt' },
  { value: 'Chuyển khoản', label: 'Chuyển khoản ngân hàng' },
  { value: 'Thẻ tín dụng', label: 'Thẻ tín dụng' },
  { value: 'Thẻ ghi nợ', label: 'Thẻ ghi nợ' },
  { value: 'Séc', label: 'Séc' }
];

const statuses = [
  { value: 'Đã xử lý', label: 'Đã xử lý' },
  { value: 'Đang xử lý', label: 'Đang xử lý' },
  { value: 'Chờ phê duyệt', label: 'Chờ phê duyệt' }
];

const formatCurrency = (value: string) => {
  const number = value.replace(/\D/g, '');
  return new Intl.NumberFormat('vi-VN').format(parseInt(number) || 0);
};

export default function NewTransactionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<TransactionForm>({
    description: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    reference: '',
    notes: '',
    status: 'Đã xử lý'
  });

  const [subcategory, setSubcategory] = useState('');
  const [errors, setErrors] = useState<Partial<TransactionForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (field: keyof TransactionForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      amount: numericValue
    }));
    
    if (errors.amount) {
      setErrors(prev => ({
        ...prev,
        amount: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TransactionForm> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả giao dịch';
    }

    if (!formData.category) {
      newErrors.category = 'Vui lòng chọn loại giao dịch';
    }

    if (!formData.amount || parseInt(formData.amount) <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
    }

    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày giao dịch';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán';
    }

    if (!formData.reference.trim()) {
      newErrors.reference = 'Vui lòng nhập mã tham chiếu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateReference = () => {
    const prefix = formData.category === 'Thu nhập' ? 'IN' : 'EX';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const reference = `${prefix}-${date}-${random}`;
    
    setFormData(prev => ({
      ...prev,
      reference
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowSuccess(true);
      
      // Reset form after 3 seconds and redirect
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/finance');
      }, 3000);
      
    } catch (error) {
      console.error('Error creating transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubcategories = () => {
    return formData.category === 'Thu nhập' ? incomeSubcategories : expenseSubcategories;
  };

  if (showSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1.5rem',
          padding: '3rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            animation: 'pulse 2s infinite'
          }}>
            <CheckCircleIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Giao dịch đã được tạo thành công!
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            Đang chuyển hướng về trang quản lý tài chính...
          </p>
          <div style={{
            width: '100%',
            height: '0.25rem',
            background: '#f3f4f6',
            borderRadius: '0.125rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              borderRadius: '0.125rem',
              animation: 'progress 3s linear'
            }} />
          </div>
        </div>
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
          radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        maxWidth: '800px', 
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
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex', 
            alignItems: 'center',
            gap: '1rem'
          }}>
            <Link href="/finance" style={{color: '#6b7280', display: 'flex'}}>
              <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
            </Link>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
            }}>
              <DocumentPlusIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
            </div>
            <div>
              <h1 style={{
                fontSize: '2rem', 
                fontWeight: 700, 
                margin: 0,
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.025em'
              }}>
                Tạo giao dịch mới
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: '0.25rem 0 0 0',
                fontWeight: 500
              }}>
                Thêm giao dịch thu chi mới vào hệ thống
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {/* Basic Information */}
            <div style={{marginBottom: '2rem'}}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ClipboardDocumentListIcon style={{width: '1.25rem', height: '1.25rem', color: '#16a34a'}} />
                Thông tin cơ bản
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Description */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Mô tả giao dịch *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Nhập mô tả chi tiết cho giao dịch"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      borderRadius: '0.75rem',
                      border: `1px solid ${errors.description ? '#ef4444' : '#e2e8f0'}`,
                      fontSize: '0.875rem',
                      background: 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  {errors.description && (
                    <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                      <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Loại giao dịch *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      handleInputChange('category', e.target.value);
                      setSubcategory(''); // Reset subcategory when category changes
                    }}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      borderRadius: '0.75rem',
                      border: `1px solid ${errors.category ? '#ef4444' : '#e2e8f0'}`,
                      fontSize: '0.875rem',
                      background: 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                      <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Subcategory */}
                {formData.category && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Danh mục chi tiết
                    </label>
                    <select
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.875rem',
                        background: 'white',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <option value="">Chọn danh mục chi tiết</option>
                      {getSubcategories().map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Số tiền *
                  </label>
                  <div style={{position: 'relative'}}>
                    <div style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      pointerEvents: 'none'
                    }}>
                      VND
                    </div>
                    <input
                      type="text"
                      value={formatCurrency(formData.amount)}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem 0.875rem 3.5rem',
                        borderRadius: '0.75rem',
                        border: `1px solid ${errors.amount ? '#ef4444' : '#e2e8f0'}`,
                        fontSize: '0.875rem',
                        background: 'white',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </div>
                  {errors.amount && (
                    <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                      <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                      {errors.amount}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Ngày giao dịch *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      borderRadius: '0.75rem',
                      border: `1px solid ${errors.date ? '#ef4444' : '#e2e8f0'}`,
                      fontSize: '0.875rem',
                      background: 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  {errors.date && (
                    <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                      <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                      {errors.date}
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Phương thức thanh toán *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      borderRadius: '0.75rem',
                      border: `1px solid ${errors.paymentMethod ? '#ef4444' : '#e2e8f0'}`,
                      fontSize: '0.875rem',
                      background: 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                  {errors.paymentMethod && (
                    <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                      <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div style={{marginBottom: '2rem'}}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CreditCardIcon style={{width: '1.25rem', height: '1.25rem', color: '#16a34a'}} />
                Thông tin bổ sung
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Reference */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Mã tham chiếu *
                  </label>
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) => handleInputChange('reference', e.target.value)}
                      placeholder="Nhập mã tham chiếu"
                      style={{
                        flex: 1,
                        padding: '0.875rem 1rem',
                        borderRadius: '0.75rem',
                        border: `1px solid ${errors.reference ? '#ef4444' : '#e2e8f0'}`,
                        fontSize: '0.875rem',
                        background: 'white',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={generateReference}
                      style={{
                        padding: '0.875rem',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Tự động
                    </button>
                  </div>
                  {errors.reference && (
                    <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                      <ExclamationTriangleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                      {errors.reference}
                    </p>
                  )}
                </div>

                {/* Status */}
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
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem',
                      background: 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div style={{marginTop: '1.5rem'}}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Nhập ghi chú bổ sung (không bắt buộc)"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    resize: 'vertical',
                    minHeight: '100px'
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e2e8f0'
            }}>
              <Link
                href="/finance"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#374151',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: isSubmitting 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                    : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                  gap: '0.5rem'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <DocumentPlusIcon style={{width: '1rem', height: '1rem'}} />
                    Tạo giao dịch
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
} 
