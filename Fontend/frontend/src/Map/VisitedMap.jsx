import React, { useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import './VisitedMap.css'; 
import { useLanguage } from '../Language/LanguageContext';

const GEOJSON_URL = '/vietnam-geojson-data/geojson/country-wide/vietnam-tinh-thanh-34.geojson';

const VISITED_COLORS = [
  '#F0E491', '#BBC863', '#658C58', '#31694E', '#8FABD4', '#A18D6D', '#F5AD18'
];

// 1. Hàm làm sạch tên tỉnh (Xóa "Tỉnh", "Thành phố", "TP.", "TP")
function cleanProvinceName(str) {
  if (!str) return '';
  // Xóa tiền tố hành chính để lấy tên thuần (VD: "Tỉnh Đồng Tháp" -> "Đồng Tháp")
  return str.replace(/^(Tỉnh|Thành phố|Thành Phố|TP\.?|TP)\s+/i, '');
}

// 2. Hàm bỏ dấu tiếng Việt (FIX QUAN TRỌNG: Xử lý chữ 'đ')
function removeDiacritics(str) {
    if (!str) return '';
    str = str.replace(/[đĐ]/g, 'd'); // Thay thế Đ trước khi chuẩn hóa
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim();
}


// 3. Hàm Slugify cốt lõi
function slugify(str) {
  if (!str) return '';
  const cleanName = cleanProvinceName(str);
  const noDia = removeDiacritics(cleanName);
  return noDia.toLowerCase()
    .replace(/\s+/g, '-')          // Khoảng trắng thành gạch ngang
    .replace(/[^a-z0-9-]/g, '-')   // Bỏ ký tự đặc biệt
    .replace(/-+/g, '-')           // Gộp gạch ngang liên tiếp
    .replace(/(^-|-$)/g, '');      // Xóa gạch ngang đầu/cuối
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
        if (!res.ok) throw new Error("File not found");
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

  const geoSlugSet = useMemo(() => {
    if (!geoData || !Array.isArray(geoData.features)) return new Set();
    return new Set(
      geoData.features.map((f) => {
        const p = f.properties || {};
        // Lấy tên từ GeoJSON, ưu tiên biến ten_tinh
        const nm = p.ten_tinh || p.NAME_1 || p.NAME || p.name || p.ten || '';
        return slugify(nm || '');
      })
    );
  }, [geoData]);

  if (!geoData) return <div className="visited-map-loading">Đang tải bản đồ...</div>;

  const totalProvinces = geoSlugSet.size || 34;
  const visitedCount = visited.filter((s) => geoSlugSet.has(s)).length;
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
                
                // Tạo slug chuẩn cho tỉnh này trên bản đồ
                const slug = slugify(rawName);
                
                // Kiểm tra xem tỉnh này có trong danh sách đã đi hay không
                const isVisited = visited.includes(slug);
                
                const fillColor = isVisited ? getColorForProvince(slug) : '#e6e6e6';
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