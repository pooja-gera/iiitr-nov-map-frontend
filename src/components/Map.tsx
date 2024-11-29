"use client";

import { Map, Marker, ZoomControl } from 'pigeon-maps'
import { useEffect, useState, useRef } from 'react'
import type { AnimalLocation } from '@/types'

const NEW_DELHI: [number, number] = [28.6139, 77.2090];

const HEATMAP_COLORS = [
  { threshold: 0, color: 'rgba(0, 255, 0, 0.4)' },    // Green (Low)
  { threshold: 3, color: 'rgba(255, 255, 0, 0.4)' },  // Yellow (Medium)
  { threshold: 5, color: 'rgba(255, 165, 0, 0.4)' },  // Orange (High)
  { threshold: 7, color: 'rgba(255, 0, 0, 0.4)' },    // Red (Very High)
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
  bounds: { project: (coords: [number, number]) => [number, number] },
  animalLocations: AnimalLocation[]
) => {
  const ctx = canvasRef.current?.getContext('2d');
  if (!ctx) return;

  // Clear previous drawing
  ctx.clearRect(0, 0, width, height);

  // Set canvas size to match map
  canvasRef.current!.width = width;
  canvasRef.current!.height = height;

  // Create grid cells (50x50 pixels each)
  const cellSize = 50;
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const grid: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));

  // Count animals in each grid cell
  animalLocations.forEach(location => {
    const pixel = bounds.project(
      [location.latitude, location.longitude]
    );

    const col = Math.floor(pixel[0] / cellSize);
    const row = Math.floor(pixel[1] / cellSize);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      grid[row][col]++;
    }
  });

  // Draw heatmap
  grid.forEach((row, rowIndex) => {
    row.forEach((count, colIndex) => {
      if (count > 0) {
        ctx.fillStyle = getHeatmapColor(count);
        ctx.fillRect(
          colIndex * cellSize,
          rowIndex * cellSize,
          cellSize,
          cellSize
        );
      }
    });
  });
};

export default function MapComponent() {
  const [animalLocations, setAnimalLocations] = useState<AnimalLocation[]>([]);
  const [center, setCenter] = useState<[number, number]>(NEW_DELHI);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
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
        zoom={15}
        onBoundsChanged={({ bounds, center, zoom }) => {
          const canvas = canvasRef.current;
          if (canvas) {
            drawHeatmap(canvasRef, canvas.width, canvas.height, bounds as any, animalLocations);
          }
        }}
      >
        {/* Heatmap Canvas Layer */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker width={50} anchor={userLocation}>
            <div style={{ 
              fontSize: '2rem',
              filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))',
              zIndex: 1000
            }}>
              👩🏻‍🏭
            </div>
          </Marker>
        )}

        {/* Emoji Markers Layer */}
        {animalLocations.map((location, index) => (
          <Marker
            key={index}
            width={50}
            anchor={[location.latitude, location.longitude]}
          >
            <div style={{ 
              fontSize: '2rem',
              filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))',  // Add shadow for better visibility
              zIndex: 1000  // Ensure emojis stay on top
            }}>
              {getAnimalEmoji(location.animalType)}
            </div>
          </Marker>
        ))}

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