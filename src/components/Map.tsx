"use client";

import { Map, Marker, ZoomControl } from 'pigeon-maps'
import { useEffect, useState, useRef } from 'react'
import type { AnimalLocation } from '@/types'

const NEW_DELHI: [number, number] = [28.6139, 77.2090];

const HEATMAP_COLORS = [
  { threshold: 0, color: 'rgba(0, 255, 0, 1)' },    // Green (Low)
  { threshold: 3, color: 'rgba(255, 255, 0, 1)' },  // Yellow (Medium)
  { threshold: 5, color: 'rgba(255, 165, 0, 1)' },  // Orange (High)
  { threshold: 7, color: 'rgba(255, 0, 0, 1)' },    // Red (Very High)
];

const getHeatmapColor = (value: number): string => {
  for (const item of HEATMAP_COLORS) {
    if (value <= item.threshold) {
      return item.color;
    }
  }
  return HEATMAP_COLORS[HEATMAP_COLORS.length - 1].color;
}

const getAnimalEmoji = (type: string): string => {
  switch (type) {
    case 'CAT': return '🐱';
    case 'DOG': return '🐶';
    case 'COW': return '🐮';
    default: return '📍';
  }
}

const drawHeatmap = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  width: number, 
  height: number, 
  bounds: {
    ne: [number, number],
    sw: [number, number],
    center: [number, number],
  },
  animalLocations: AnimalLocation[]
) => {
  const ctx = canvasRef.current?.getContext('2d');
  if (!ctx) return;

  // Set canvas size to match map container size
  canvasRef.current!.width = width;
  canvasRef.current!.height = height;
  
  // Clear previous drawing
  ctx.clearRect(0, 0, width, height);

  // Create grid cells (larger squares)
  const cellSize = 60; // 3x size
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const grid: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));

  // Calculate conversion factors
  const latRange = bounds.ne[0] - bounds.sw[0];
  const lngRange = bounds.ne[1] - bounds.sw[1];

  // Count animals in each grid cell
  animalLocations.forEach(location => {
    try {
      // Convert lat/lng to pixel coordinates
      const x = ((location.longitude - bounds.sw[1]) / lngRange) * width;
      const y = height - ((location.latitude - bounds.sw[0]) / latRange) * height;
      
      // Center the cell by offsetting by half the cell size
      const col = Math.floor((x - cellSize/2) / cellSize);
      const row = Math.floor((y - cellSize/2) / cellSize);

      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        grid[row][col]++;
      }
    } catch (error) {
      console.error('Error projecting coordinates:', error);
    }
  });

  // Draw heatmap with alpha blending
  ctx.globalAlpha = 0.5;
  grid.forEach((row, rowIndex) => {
    row.forEach((count, colIndex) => {
      if (count > 0) {
        ctx.fillStyle = getHeatmapColor(count);
        // Draw the square centered on the point
        ctx.fillRect(
          colIndex * cellSize + cellSize/2,  // Add half cell size to center
          rowIndex * cellSize + cellSize/2,  // Add half cell size to center
          cellSize,
          cellSize
        );
      }
    });
  });
  ctx.globalAlpha = 1.0;
};

const getOffsetCoordinates = (
  latitude: number,
  longitude: number,
  zoom: number
): [number, number] => {
  // Only apply offset at high zoom levels (zoom > 16)
  if (zoom <= 16) {
    return [latitude, longitude];
  }
  
  // Add a small random offset (about 5-10 meters)
  const offset = 0.0002 * (Math.random() - 0.5);
  return [
    latitude + offset,
    longitude + offset
  ];
};

export default function MapComponent() {
  const [animalLocations, setAnimalLocations] = useState<AnimalLocation[]>([]);
  const [center, setCenter] = useState<[number, number]>(NEW_DELHI);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState(15);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(location);
          setCenter(location);
        },
        (error) => {
          console.log("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/locations`);
        const data = await response.json();
        setAnimalLocations(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    // Initial fetch
    fetchLocations();

    // Set up polling interval
    const intervalId = setInterval(fetchLocations, 5000);
    
    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array since we want this to run once on mount

  return (
    <div className='flex items-center justify-center' style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Map 
        height={720} 
        width={1280} 
        center={center}
        zoom={zoom}
        onBoundsChanged={({ bounds, center, zoom }) => {
          setZoom(zoom);
          const canvas = canvasRef.current;
          if (canvas) {
            drawHeatmap(canvasRef, canvas.width, canvas.height, bounds as any, animalLocations);
          }
        }}
      >
        {/* Heatmap Canvas Layer */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,  // Above map tiles but below markers
          pointerEvents: 'none'
        }}>
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            style={{
              width: '100%',
              height: '100%'
            }}
          />
        </div>

        {/* User Location Marker */}
        {userLocation && (
          <Marker width={50} anchor={userLocation}>
            <div style={{ 
              fontSize: '2rem',
              filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))',
              zIndex: 2  // Above heatmap
            }}>
              👩🏻‍🏭
            </div>
          </Marker>
        )}

        {/* Animal Markers Layer */}
        {animalLocations.map((location, index) => {
          const [offsetLat, offsetLng] = getOffsetCoordinates(
            location.latitude,
            location.longitude,
            zoom
          );
          
          return (
            <Marker
              key={index}
              width={50}
              anchor={[offsetLat, offsetLng]}
            >
              <div style={{ 
                fontSize: '2rem',
                filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))',
                zIndex: 2  // Above heatmap
              }}>
                {getAnimalEmoji(location.animalType)}
              </div>
            </Marker>
          );
        })}

        <ZoomControl />
      </Map>

      {/* Legend */}
      <div 
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'white',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Stray Animal Density</h3>
        {HEATMAP_COLORS.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div 
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: item.color,
                marginRight: '10px',
                border: '1px solid rgba(0,0,0,0.2)'  // Add border for better visibility
              }}
            />
            <span style={{ fontSize: '12px' }}>
              {index === HEATMAP_COLORS.length - 1 
                ? `${item.threshold}+ animals`
                : `${item.threshold}-${HEATMAP_COLORS[index + 1].threshold - 1} animals`}
            </span>
          </div>
        ))}
        <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
          <div style={{ fontSize: '12px', marginBottom: '5px' }}>Animal Types:</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span>🐱 Cat</span>
            <span>🐶 Dog</span>
            <span>🐮 Cow</span>
          </div>
        </div>
      </div>
    </div>
  )
}