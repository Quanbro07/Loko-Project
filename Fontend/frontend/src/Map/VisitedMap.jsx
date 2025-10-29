import React, { useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import './VisitedMap.css';

const GEOJSON_URL = '/vietnam-geojson-data/geojson/country-wide/vietnam-tinh-thanh-34.geojson';

function removeDiacritics(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim();
}

function slugify(str) {
  if (!str) return '';
  const noDia = removeDiacritics(str);
  return noDia
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const VisitedMap = ({ visited = [] }) => {
  const [geoData, setGeoData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    let mounted = true;
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setGeoData(data);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load geojson', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // prevent body scroll when fullscreen
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prev;
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isFullscreen]);

  // close on Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  // build a set of geo slugs to compute percent (call hook unconditionally)
  const geoSlugSet = useMemo(() => {
    if (!geoData || !Array.isArray(geoData.features)) return new Set();
    return new Set(
      geoData.features.map((f) => {
        const p = f.properties || {};
        const nm = p.ten_tinh || p.NAME_1 || p.NAME || p.name || p.ten || '';
        return slugify(nm || '');
      })
    );
  }, [geoData]);

  if (!geoData) return <div className="visited-map-loading">Đang tải bản đồ...</div>;

  const totalProvinces = geoSlugSet.size || 34;
  const visitedCount = visited.filter((s) => geoSlugSet.has(s)).length;
  const percent = Math.round((visitedCount / totalProvinces) * 100);

  return (
    <div className={`visited-map-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <button
        className="map-expand-button"
        aria-pressed={isFullscreen}
        aria-label={isFullscreen ? 'Thu nhỏ bản đồ' : 'Phóng to bản đồ'}
        onClick={() => setIsFullscreen((v) => !v)}
      >
        {isFullscreen ? '×' : '⤢'}
      </button>
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 1800, center: [106.0, 16.0] }}>
        <Geographies geography={geoData}>
          {({ geographies }) =>
            geographies.map((g) => {
              const props = g.properties || {};
              // try common property names, fallback to first string property
              const name = props.ten_tinh || props.NAME_1 || props.NAME || props.name || props.ten || Object.values(props).find((v) => typeof v === 'string') || 'Không rõ';
              const slug = slugify(name);
              const isVisited = visited.includes(slug);

              // province code: prefer ma_tinh then stt
              const rawCode = props.ma_tinh || props.stt || props.code || '';
              const code = (() => {
                if (rawCode === undefined || rawCode === null || rawCode === '') return '';
                const s = String(rawCode);
                if (/^\d+$/.test(s) && s.length === 1) return s.padStart(2, '0');
                return s;
              })();

              const tooltipText = `${code ? code + ' — ' : ''}${name} — ${isVisited ? 'Đã đến' : 'Chưa'}`;

              return (
                <Geography
                  key={g.rsmKey || slug}
                  geography={g}
                  data-tooltip-id="visited-tooltip"
                  data-tooltip-content={tooltipText}
                  style={{
                    default: {
                      fill: isVisited ? '#e63946' : '#e6e6e6',
                      stroke: '#666',
                      strokeWidth: 0.5,
                      outline: 'none',
                    },
                    hover: {
                      fill: isVisited ? '#ff6b6b' : '#bdbdbd',
                      stroke: '#222',
                      strokeWidth: 0.75,
                      outline: 'none',
                    },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      <div className="percent-panel" aria-hidden={isFullscreen}>
        <svg className="progress-circle" viewBox="0 0 36 36">
          <circle className="circle-bg" cx="18" cy="18" r="15.9155" fill="none" stroke="#eee" strokeWidth="2" />
          <circle
            className="circle"
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke="#e63946"
            strokeWidth="2.8"
            strokeDasharray={`${percent}, 100`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
          <text x="18" y="20.35" className="percentage" textAnchor="middle">{percent}%</text>
        </svg>
        <div className="percent-label">{visitedCount}/{totalProvinces} tỉnh đã đi</div>
      </div>
      <Tooltip id="visited-tooltip" place="top" />
    </div>
  );
};

export default VisitedMap;
