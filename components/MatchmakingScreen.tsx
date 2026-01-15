import React, { useState } from 'react';
import { MatchmakingResults, Torneo, Cuerda, Pelea, Gallo } from '../types';
import { PrinterIcon, ChevronDownIcon } from './Icons';

interface MatchmakingScreenProps {
    results: MatchmakingResults;
    torneo: Torneo;
    cuerdas: Cuerda[];
    gallos: Gallo[];
    onStartTournament: () => void;
    onBack: () => void;
    onCreateManualFight: (roosterAId: string, roosterBId: string) => void;
    isReadOnly: boolean;
}

const OUNCES_PER_POUND = 16;
const toLbsOz = (totalOunces: number) => {
    const lbs = Math.floor(totalOunces / OUNCES_PER_POUND);
    const oz = totalOunces % OUNCES_PER_POUND;
    return { lbs, oz };
};
const formatWeightLbsOz = (totalOunces: number): string => {
    const { lbs, oz } = toLbsOz(totalOunces);
    return `${lbs}.${String(oz).padStart(2, '0')}`;
};

const MatchmakingScreen: React.FC<MatchmakingScreenProps> = ({ results, torneo, cuerdas, onStartTournament, onBack, onCreateManualFight, isReadOnly }) => {
    const [selectedRoosters, setSelectedRoosters] = useState<string[]>([]);
    
    const getCuerdaName = (id: string) => cuerdas.find(p => p.id === id)?.name || 'Desconocido';

    const handlePrint = () => { window.print(); };

    return (
        <div className="space-y-6">
            {/* TABLA DE IMPRESIÓN (OCULTA EN PANTALLA) */}
            <div id="printable-programming">
                <div className="report-title">{torneo.name}</div>
                <div className="report-subtitle">
                    PROGRAMACIÓN OFICIAL DE PELEAS - FECHA: {torneo.date}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th rowSpan={2}>N°</th>
                            <th colSpan={8}>PRIMER GALLO (A)</th>
                            <th className="vs-cell" rowSpan={2}>VS</th>
                            <th colSpan={8}>SEGUNDO GALLO (B)</th>
                        </tr>
                        <tr>
                            {/* Subcabeceras Gallo A */}
                            <th>CUERDA</th>
                            <th>ANILLO(A)</th>
                            <th>PLACA(Pm)</th>
                            <th>PLACA(Pc)</th>
                            <th>COLOR</th>
                            <th>FENOTIPO</th>
                            <th>TIPO</th>
                            <th>PESO</th>
                            {/* Subcabeceras Gallo B */}
                            <th>CUERDA</th>
                            <th>ANILLO(A)</th>
                            <th>PLACA(Pm)</th>
                            <th>PLACA(Pc)</th>
                            <th>COLOR</th>
                            <th>FENOTIPO</th>
                            <th>TIPO</th>
                            <th>PESO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.mainFights.map((p, index) => (
                            <tr key={p.id}>
                                <td>{index + 1}</td>
                                {/* Datos Gallo A */}
                                <td className="cuerda-name">{getCuerdaName(p.roosterA.cuerdaId)}</td>
                                <td>{p.roosterA.ringId}</td>
                                <td>{p.roosterA.markingId}</td>
                                <td>{p.roosterA.breederPlateId}</td>
                                <td>{p.roosterA.color}</td>
                                <td>{p.roosterA.tipoGallo}</td>
                                <td>{p.roosterA.tipoEdad}</td>
                                <td>{formatWeightLbsOz(p.roosterA.weight)}</td>
                                
                                <td className="vs-cell">VS</td>

                                {/* Datos Gallo B */}
                                <td className="cuerda-name">{getCuerdaName(p.roosterB.cuerdaId)}</td>
                                <td>{p.roosterB.ringId}</td>
                                <td>{p.roosterB.markingId}</td>
                                <td>{p.roosterB.breederPlateId}</td>
                                <td>{p.roosterB.color}</td>
                                <td>{p.roosterB.tipoGallo}</td>
                                <td>{p.roosterB.tipoEdad}</td>
                                <td>{formatWeightLbsOz(p.roosterB.weight)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CONTENIDO DE PANTALLA (NO IMPRIMIBLE) */}
            <div className="text-center no-print">
                <h2 className="text-3xl font-bold text-white">Cartelera Generada</h2>
                <p className="text-gray-400 mt-2">Revisa el cotejo y prepara la impresión.</p>
            </div>

            <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-6 no-print">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-amber-400">Panel de Control</h3>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg transform hover:scale-105"
                    >
                        <PrinterIcon className="w-6 h-6" />
                        <span>Imprimir Reporte A4</span>
                    </button>
                </div>
            </div>

            {/* Aquí puedes mantener el resto de tu diseño de "fight-cards" para ver en el celular/pc */}
            <div className="space-y-4 no-print">
                {results.mainFights.map(p => (
                    <div key={p.id} className="bg-gray-700/50 p-4 rounded-lg flex justify-between items-center border border-gray-600">
                        <div className="text-2xl font-bold text-gray-500">#{p.fightNumber}</div>
                        <div className="text-right flex-1 px-4">
                            <div className="text-amber-400 font-bold">{getCuerdaName(p.roosterA.cuerdaId)}</div>
                            <div className="text-sm text-gray-300">{p.roosterA.color} - {formatWeightLbsOz(p.roosterA.weight)}</div>
                        </div>
                        <div className="text-red-500 font-black px-4">VS</div>
                        <div className="text-left flex-1 px-4">
                            <div className="text-amber-400 font-bold">{getCuerdaName(p.roosterB.cuerdaId)}</div>
                            <div className="text-sm text-gray-300">{p.roosterB.color} - {formatWeightLbsOz(p.roosterB.weight)}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between mt-8 no-print">
                <button onClick={onBack} className="bg-gray-600 text-white py-2 px-6 rounded-lg">Volver</button>
                {!isReadOnly && (
                    <button onClick={onStartTournament} className="bg-green-600 text-white py-2 px-8 rounded-lg font-bold">Comenzar Torneo</button>
                )}
            </div>
        </div>
    );
};

export default MatchmakingScreen;
