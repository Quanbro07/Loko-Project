import React, { useEffect, useState } from 'react';
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

  if (!geoData) return <div className="visited-map-loading">Đang tải bản đồ...</div>;
  return (
    <div className="visited-map-container">
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 1800, center: [106.0, 16.0] }}>
        <Geographies geography={geoData}>
          {({ geographies }) =>
            geographies.map((g) => {
              const props = g.properties || {};
              // try common property names, fallback to first string property
              const name = props.NAME_1 || props.NAME || props.name || props.ten || Object.values(props).find((v) => typeof v === 'string') || 'Không rõ';
              const slug = slugify(name);
              const isVisited = visited.includes(slug);

              return (
                <Geography
                  key={g.rsmKey || slug}
                  geography={g}
                  data-tooltip-id="visited-tooltip"
                  data-tooltip-content={`${name} — ${isVisited ? 'Đã đến' : 'Chưa'}`}
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
  <Tooltip id="visited-tooltip" place="top" />
    </div>
  );
};

export default VisitedMap;
