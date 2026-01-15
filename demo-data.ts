import { Cuerda, Gallo, TipoGallo, TipoEdad } from './types';

const OUNCES_PER_POUND = 16;
const fromLbsOz = (lbs: number, oz: number) => (lbs * OUNCES_PER_POUND) + oz;

export const demoCuerdas: Cuerda[] = [
  { id: 'c-demo-1', name: 'El Diamante (F1)', owner: 'Juan Pérez', city: 'Medellín' },
  { id: 'c-demo-2', name: 'La Esperanza (F1)', owner: 'Carlos Ruiz', city: 'Cali' },
  { id: 'c-demo-3', name: 'Rancho Grande (F1)', owner: 'Luis Gómez', city: 'Pereira' },
  { id: 'c-demo-4', name: 'San José (F1)', owner: 'Andrés Castro', city: 'Bogotá' },
  { id: 'c-demo-5', name: 'Los Gavilanes (F1)', owner: 'Pedro Marín', city: 'Manizales' }
];

const colors = ['Colorado', 'Cenizo', 'Giro', 'Pinto', 'Jabao', 'Marañón', 'Canelo', 'Blanco', 'Negro'];
const tipos = [TipoGallo.LISO, TipoGallo.PAVA];

const generateDemoGallos = (): Gallo[] => {
  const gallos: Gallo[] = [];
  for (let i = 1; i <= 50; i++) {
    const cuerda = demoCuerdas[Math.floor(Math.random() * demoCuerdas.length)];
    const lbs = Math.floor(Math.random() * (4 - 3 + 1)) + 3; // 3 to 4 lbs
    const oz = Math.floor(Math.random() * 16);
    const age = Math.floor(Math.random() * (22 - 8 + 1)) + 8; // 8 to 22 months
    
    gallos.push({
      id: `gallo-demo-${i}`,
      ringId: `AN-${1000 + i}`,
      color: colors[Math.floor(Math.random() * colors.length)],
      cuerdaId: cuerda.id,
      weight: fromLbsOz(lbs, oz),
      ageMonths: age,
      markingId: `M-${2000 + i}`,
      breederPlateId: `PC-${3000 + i}`,
      tipoGallo: tipos[Math.floor(Math.random() * tipos.length)],
      tipoEdad: age < 12 ? TipoEdad.POLLO : TipoEdad.GALLO,
      marca: Math.floor(Math.random() * 12) + 1
    });
  }
  return gallos;
};

export const demoGallos = generateDemoGallos();
