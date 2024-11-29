import { NextResponse } from 'next/server';
import { AnimalLocation } from '@/types';

export async function GET() {
    // Mock data around Delhi NCR
    const mockLocations: AnimalLocation[] = [
        // Central Delhi
        {
            latitude: 28.6139,
            longitude: 77.2090,
            animalType: 'DOG' // Near India Gate
        },
        // Connaught Place
        {
            latitude: 28.6304,
            longitude: 77.2177,
            animalType: 'CAT'
        },
        // Lodhi Gardens
        {
            latitude: 28.5918,
            longitude: 77.2209,
            animalType: 'COW'
        },
        // Qutub Minar
        {
            latitude: 28.5245,
            longitude: 77.1855,
            animalType: 'DOG'
        },
        // Humayun's Tomb
        {
            latitude: 28.5933,
            longitude: 77.2507,
            animalType: 'CAT'
        },
        // Red Fort
        {
            latitude: 28.6562,
            longitude: 77.2410,
            animalType: 'COW'
        },
        // Hauz Khas
        {
            latitude: 28.5494,
            longitude: 77.2001,
            animalType: 'DOG'
        },
        // Noida
        {
            latitude: 28.5355,
            longitude: 77.3910,
            animalType: 'CAT'
        },
        // Gurgaon
        {
            latitude: 28.4595,
            longitude: 77.0266,
            animalType: 'COW'
        }
    ];

    return NextResponse.json(mockLocations);
} 