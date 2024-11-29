export type AnimalType = 'CAT' | 'DOG' | 'COW';

export interface AnimalLocation {
    latitude: number;
    longitude: number;
    animalType: AnimalType;
} 