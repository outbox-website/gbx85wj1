export type PlantType = 'sunflower' | 'peashooter' | 'wallnut' | 'chomper' | 'shovel';

export interface Plant {
    x: number; y: number;
    type: PlantType;
    health: number; maxHealth: number;
    width: number; height: number;
    timer: number;
    state?: 'idle' | 'digesting';
}

export interface Zombie {
    x: number; y: number;
    width: number; height: number;
    health: number; speed: number; movement: number;
    type: 'normal' | 'conehead';
}

export interface Projectile {
    x: number; y: number;
    width: number; height: number;
    speed: number; power: number;
    markedForDeletion?: boolean;
}

export interface Sun {
    x: number; y: number;
    width: number; height: number;
    value: number; targetY: number;
    lifeTimer: number;
}

export interface GameCallbacks {
    onSunChange: (sun: number) => void;
    onGameOver: () => void;
    onPlantPlaced: () => void;
    onWaveStart: () => void;
}