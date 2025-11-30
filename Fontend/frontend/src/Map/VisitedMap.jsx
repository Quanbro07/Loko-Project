import React, { useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import './VisitedMap.css'; 
import { useLanguage } from '../Language/LanguageContext';

const GEOJSON_URL = '/vietnam-geojson-data/geojson/country-wide/vietnam-tinh-thanh-34.geojson';

const VISITED_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#F333FF', 
  '#FFC300', '#00C9A7', '#845EC2'
];

// Hàm bỏ dấu tiếng Việt
function removeDiacritics(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim();
}

// === LOGIC MỚI: Hàm làm sạch tên tỉnh (Xóa "Tỉnh", "Thành phố") ===
function cleanProvinceName(str) {
  if (!str) return '';
  // Regex xóa các tiền tố hành chính (không phân biệt hoa thường)
  return str.replace(/^(Tỉnh|Thành phố|Thành Phố)\s+/i, '');
}

// === LOGIC MỚI: Hàm Slugify sử dụng cleanProvinceName ===
function slugify(str) {
  if (!str) return '';
  
  // 1. Làm sạch tiền tố trước (Tỉnh Điện Biên -> Điện Biên)
  const cleanName = cleanProvinceName(str);
  
  // 2. Bỏ dấu và chuyển thành slug (Điện Biên -> dien-bien)
  const noDia = removeDiacritics(cleanName);
  
  return noDia.toLowerCase()
    .replace(/\s+/g, '-')          // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/[^a-z0-9-]/g, '-')   // Bỏ ký tự đặc biệt
    .replace(/-+/g, '-')           // Gộp nhiều dấu gạch ngang
    .replace(/(^-|-$)/g, '');      // Xóa gạch ngang ở đầu/cuối
}

function getColorForProvince(slug) {
  if (!slug) return VISITED_COLORS[0];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % VISITED_COLORS.length;
  return VISITED_COLORS[index];
}

const VisitedMap = ({ visited = [] }) => {
  const [geoData, setGeoData] = useState(null);
  const { translate } = useLanguage();

  useEffect(() => {
    let mounted = true;
    fetch(GEOJSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error('File not found');
        return res.json();
      })
      .then((data) => {
        if (mounted) setGeoData(data);
      })
      .catch((err) => {
        console.error('Failed to load geojson', err);
      });
    return () => { mounted = false; };
  }, []);

  // Tạo Set các slug có trong bản đồ để tính toán % chính xác
  const geoSlugSet = useMemo(() => {
    if (!geoData || !Array.isArray(geoData.features)) return new Set();
    return new Set(
      geoData.features.map((f) => {
        const p = f.properties || {};
        // Lấy tên từ nhiều trường có thể có trong GeoJSON
        const nm = p.ten_tinh || p.NAME_1 || p.NAME || p.name || p.ten || '';
        return slugify(nm || '');
      })
    );
  }, [geoData]);

  if (!geoData) return <div className="visited-map-loading">Đang tải bản đồ...</div>;

  // Tính toán số liệu thống kê
  const totalProvinces = geoSlugSet.size || 34; // Tổng số tỉnh trên bản đồ tìm thấy
  const visitedCount = visited.filter((s) => geoSlugSet.has(s)).length; // Số tỉnh đã đi (khớp với bản đồ)
  const percent = totalProvinces > 0 ? Math.round((visitedCount / totalProvinces) * 100) : 0;

  return (
    <div className="visited-map-container">
      
      {/* PHẦN 1: BẢN ĐỒ (BÊN TRÁI) */}
      <div className="map-area">
        <ComposableMap 
          projection="geoMercator" 
          projectionConfig={{ scale: 2100, center: [106.0, 17.0] }}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map((g) => {
                const props = g.properties || {};
                const rawName = props.ten_tinh || props.NAME_1 || props.NAME || props.name || props.ten || 'Không rõ';
                
                // Tạo slug chuẩn từ tên trong GeoJSON (đã xóa Tỉnh/TP)
                const slug = slugify(rawName);
                
                // Kiểm tra xem slug này có trong danh sách đã đi (visited) không
                const isVisited = visited.includes(slug);
                
                // Chọn màu
                const fillColor = isVisited ? getColorForProvince(slug) : '#e6e6e6';
                
                // Tạo nội dung tooltip (Hiển thị tên ngắn gọn cho đẹp)
                const displayName = cleanProvinceName(rawName);
                const tooltipText = `${displayName} — ${isVisited ? 'Đã đến' : 'Chưa'}`;

                return (
                  <Geography
                    key={g.rsmKey || slug}
                    geography={g}
                    data-tooltip-id="visited-tooltip"
                    data-tooltip-content={tooltipText}
                    style={{
                      default: { fill: fillColor, stroke: '#fff', strokeWidth: 0.75, outline: 'none' },
                      hover: { fill: isVisited ? fillColor : '#bdbdbd', stroke: '#222', strokeWidth: 1, outline: 'none', opacity: 0.8, cursor: 'pointer' },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* PHẦN 2: BIỂU ĐỒ TRÒN (BÊN PHẢI) */}
      <div className="percent-panel">
        <div className='progress-container'>
          <svg className="progress-circle" viewBox="0 0 36 36">
            <path
              className="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#eee"
              strokeWidth="2.5"
            />
            <path
              className="circle"
              strokeDasharray={`${percent}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e63946"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <text x="18" y="20.35" className="percentage" textAnchor="middle">{percent}%</text>
          </svg>
          <div className="percent-label">
            <span style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#e63946'}}>{visitedCount}</span>
            <span style={{fontSize: '1rem', color: '#666'}}>/ {totalProvinces} tỉnh</span>
          </div>
        </div>
      </div>
      
      <Tooltip id="visited-tooltip" place="top" />
    </div>
  );
};

export default VisitedMap;