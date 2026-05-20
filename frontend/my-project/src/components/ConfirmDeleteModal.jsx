import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  itemDetails,
  itemImage,
  icon: IconComponent = Package
}) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={onClose}>
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()}
        style={{
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3), var(--glass-shadow)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '24px',
          padding: '2.25rem',
          transform: 'scale(1)',
          animation: 'modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div 
            style={{ 
              padding: '0.5rem', 
              borderRadius: '12px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              display: 'flex', 
              alignItems: 'center' 
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h2 className="modal-title" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-color)' }}>
            {title || t('confirmDelete')}
          </h2>
        </div>

        <div className="modal-body" style={{ color: 'var(--text-color)', opacity: 0.85, fontSize: '0.975rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          <p style={{ marginBottom: '1.25rem', color: '#475569' }}>
            {message || t('deleteWarning')}
          </p>
          
          {/* Item details card inside modal */}
          <div 
            style={{ 
              padding: '0.75rem 1rem', 
              borderRadius: '16px', 
              background: 'var(--secondary-color)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              border: '1px solid var(--glass-border)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            {itemImage ? (
              <img 
                src={itemImage} 
                alt={itemName} 
                style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
              />
            ) : (
              <div 
                style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '10px', 
                  backgroundColor: '#334155', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <IconComponent size={22} style={{ color: '#94a3b8' }} />
              </div>
            )}
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-color)', fontSize: '1rem' }}>
                {itemName}
              </div>
              {itemDetails && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                  {itemDetails}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ 
              background: 'var(--secondary-color)', 
              color: 'var(--text-color)', 
              margin: 0,
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)'
            }} 
            onClick={onClose}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button 
            className="btn btn-danger" 
            style={{ 
              margin: 0,
              background: '#ef4444',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              boxShadow: '0 4px 12px 0 rgba(239, 68, 68, 0.2)'
            }} 
            onClick={onConfirm}
          >
            {t('delete') || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
