import React, { useState } from 'react';
import { MatchmakingResults, Torneo, Cuerda, Pelea, Gallo } from '../types';
import { PrinterIcon } from './Icons';

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

const MatchmakingScreen: React.FC<MatchmakingScreenProps> = ({ results, torneo, cuerdas, onStartTournament, onBack, onCreateManualFight, isReadOnly }) => {
    
    const getCuerdaName = (id: string) => cuerdas.find(p => p.id === id)?.name || 'Desconocido';

    const formatWeight = (totalOunces: number): string => {
        const lbs = Math.floor(totalOunces / 16);
        const oz = Math.round(totalOunces % 16);
        return `${lbs}.${String(oz).padStart(2, '0')}`;
    };

    const manualFightsCount = results.mainFights.filter(f => f.id.startsWith('pelea-manual-')).length;
    const autoFightsCount = results.mainFights.length - manualFightsCount;

    return (
        <div className="space-y-6">
            {/* --- SECCIÓN DE IMPRESIÓN (SOLO VISIBLE AL IMPRIMIR) --- */}
            <div id="printable-programming">
                <div className="report-title">{torneo.name}</div>
                <div className="report-subtitle">PROGRAMACIÓN OFICIAL - FECHA: {torneo.date}</div>
                <table>
                    <thead>
                        <tr>
                            <th rowSpan={2} style={{width: '30px'}}>N°</th>
                            <th colSpan={8}>GALLO A (LADO ROJO)</th>
                            <th className="vs-cell" rowSpan={2}>VS</th>
                            <th colSpan={8}>GALLO B (LADO AZUL)</th>
                        </tr>
                        <tr>
                            <th>CUERDA</th>
                            <th>ANILLO(A)</th>
                            <th>PLACA(Pm)</th>
                            <th>PLACA(Pc)</th>
                            <th>COLOR</th>
                            <th>FENOTIPO</th>
                            <th>TIPO</th>
                            <th>PESO</th>
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
                        {results.mainFights.map((p, idx) => (
                            <tr key={p.id}>
                                <td>{idx + 1}</td>
                                <td className="cuerda-name">{getCuerdaName(p.roosterA.cuerdaId)}</td>
                                <td>{p.roosterA.ringId}</td>
                                <td>{p.roosterA.markingId}</td>
                                <td>{p.roosterA.breederPlateId}</td>
                                <td>{p.roosterA.color}</td>
                                <td>{p.roosterA.tipoGallo}</td>
                                <td>{p.roosterA.tipoEdad}</td>
                                <td>{formatWeight(p.roosterA.weight)}</td>
                                <td className="vs-cell">VS</td>
                                <td className="cuerda-name">{getCuerdaName(p.roosterB.cuerdaId)}</td>
                                <td>{p.roosterB.ringId}</td>
                                <td>{p.roosterB.markingId}</td>
                                <td>{p.roosterB.breederPlateId}</td>
                                <td>{p.roosterB.color}</td>
                                <td>{p.roosterB.tipoGallo}</td>
                                <td>{p.roosterB.tipoEdad}</td>
                                <td>{formatWeight(p.roosterB.weight)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- SECCIÓN DE PANTALLA (LO QUE VES EN LA APP) --- */}
            <div className="text-center no-print">
                <h2 className="text-3xl font-bold text-white">Cartelera de Peleas</h2>
                <p className="text-gray-400 mt-2">Revisa los emparejamientos antes de comenzar.</p>
            </div>
            
            {/* CUADRO DE ESTADÍSTICAS (RESTAURADO) */}
            <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4 no-print">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-amber-400">Estadísticas de la Contienda</h3>
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform hover:scale-105"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        <span>Imprimir Programación</span>
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{autoFightsCount}</p>
                        <p className="text-sm text-gray-400">Peleas de Cotejo</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{manualFightsCount}</p>
                        <p className="text-sm text-gray-400">Peleas Manuales</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{results.stats.mainTournamentRoostersCount}</p>
                        <p className="text-sm text-gray-400">Gallos Aptos</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{results.unpairedRoosters.length}</p>
                        <p className="text-sm text-gray-400">Sin Pelea</p>
                    </div>
                </div>
            </div>

            {/* LISTA VISUAL DE PANTALLA */}
            <div className="space-y-4 no-print">
                {results.mainFights.map(p => (
                    <div key={p.id} className="bg-gray-700/40 p-4 rounded-xl border border-gray-600 flex justify-between items-center">
                        <div className="text-right flex-1">
                            <div className="text-amber-400 font-bold text-lg">{getCuerdaName(p.roosterA.cuerdaId)}</div>
                            <div className="text-white text-sm">{p.roosterA.color} - {formatWeight(p.roosterA.weight)}</div>
                        </div>
                        <div className="px-6 text-red-500 font-black text-2xl">VS</div>
                        <div className="text-left flex-1">
                            <div className="text-amber-400 font-bold text-lg">{getCuerdaName(p.roosterB.cuerdaId)}</div>
                            <div className="text-white text-sm">{p.roosterB.color} - {formatWeight(p.roosterB.weight)}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center no-print mt-8">
                <button onClick={onBack} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg">Atrás</button>
                <button onClick={onStartTournament} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg">Comenzar Torneo</button>
            </div>
        </div>
    );
};

export default MatchmakingScreen;
