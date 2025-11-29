import React, { useEffect, useCallback } from 'react';
import './SecurityWrapper.css'; // Dùng file CSS nếu cần thêm @media print

const SecurityWrapper = ({ children }) => {

    const handleKeyDown = useCallback((e) => {
        const key = e.key;

        // 1. Vô hiệu hóa PrtSc (ngăn chặn sao chép vào clipboard)
        if (key === 'PrintScreen' || e.keyCode === 44) {
            e.preventDefault(); 
        }

        // 2. Vô hiệu hóa các tổ hợp phím Ctrl
        if (e.ctrlKey) {
            // Bao gồm 'p' (Print) và 'f' (Find) nếu cần thêm bảo vệ
            const forbiddenKeys = ['c', 'v', 'x', 's', 'a', 'u', 'p', 'f']; 
            const lowerKey = key.toLowerCase(); 

            if (forbiddenKeys.includes(lowerKey)) {
                e.preventDefault(); 
            }
        }
    }, []);

    useEffect(() => {
        // 🌟 Thêm listeners cho cả keydown và keyup
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyDown); 
        
        // Dọn dẹp (cleanup)
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyDown); 
        };
    }, [handleKeyDown]);
    
    // 3. Vô hiệu hóa chuột phải (Context Menu)
    const handleContextMenu = (e) => {
        e.preventDefault();
    };

    return (
        <div 
            onContextMenu={handleContextMenu}
            style={{ 
                // Ngăn chặn lựa chọn văn bản
                userSelect: 'none', 
                WebkitUserSelect: 'none', 
                MozUserSelect: 'none', 
                MsUserSelect: 'none', 
            }}
        >
            {children}
        </div>
    );
};

export default SecurityWrapper;