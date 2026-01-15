import React, { useState } from 'react';
import { MatchmakingResults, Torneo, Cuerda, Pelea, Gallo } from '../types';
import { PrinterIcon, PencilIcon } from './Icons';

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
    const [selectedRoosters, setSelectedRoosters] = useState<string[]>([]);
    
    const getCuerdaName = (id: string) => cuerdas.find(p => p.id === id)?.name || 'Desconocido';

    const formatWeight = (totalOunces: number): string => {
        const lbs = Math.floor(totalOunces / 16);
        const oz = Math.round(totalOunces % 16);
        return `${lbs}.${String(oz).padStart(2, '0')}`;
    };

    const handleSelectRooster = (roosterId: string) => {
        if (isReadOnly) return;
        setSelectedRoosters(prev => {
            if (prev.includes(roosterId)) return prev.filter(id => id !== roosterId);
            if (prev.length < 2) return [...prev, roosterId];
            return prev;
        });
    };

    const handleCreateManualFightClick = () => {
        if (selectedRoosters.length === 2) {
            onCreateManualFight(selectedRoosters[0], selectedRoosters[1]);
            setSelectedRoosters([]);
        }
    };

    const manualFightsCount = results.mainFights.filter(f => f.id.startsWith('pelea-manual-')).length;
    const autoFightsCount = results.mainFights.length - manualFightsCount;

    return (
        <div className="space-y-6">
            {/* --- SECCIÓN DE IMPRESIÓN (SOLO VISIBLE AL IMPRIMIR) --- */}
            <div id="printable-programming">
                <div className="report-title">{torneo.name}</div>
                <div className="report-subtitle">PROGRAMACIÓN OFICIAL DE PELEAS - FECHA: {torneo.date}</div>
                <table>
                    <thead>
                        <tr>
                            <th rowSpan={2} style={{width: '25pt'}}>N°</th>
                            <th colSpan={8}>GALLO A (LADO ROJO)</th>
                            <th className="vs-cell" rowSpan={2}>VS</th>
                            <th colSpan={8}>GALLO B (LADO AZUL)</th>
                        </tr>
                        <tr>
                            <th style={{width: '15%'}}>Cuerda</th>
                            <th>Anillo(A)</th>
                            <th>Placa(Pm)</th>
                            <th>Placa(Pc)</th>
                            <th>Color</th>
                            <th>Fenotipo</th>
                            <th>Tipo</th>
                            <th>Peso</th>

                            <th style={{width: '15%'}}>Cuerda</th>
                            <th>Anillo(A)</th>
                            <th>Placa(Pm)</th>
                            <th>Placa(Pc)</th>
                            <th>Color</th>
                            <th>Fenotipo</th>
                            <th>Tipo</th>
                            <th>Peso</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.mainFights.map((p, idx) => (
                            <tr key={p.id}>
                                <td>{idx + 1}</td>
                                {/* Gallo A */}
                                <td className="cuerda-name">{getCuerdaName(p.roosterA.cuerdaId)}</td>
                                <td>{p.roosterA.ringId}</td>
                                <td>{p.roosterA.markingId}</td>
                                <td>{p.roosterA.breederPlateId}</td>
                                <td>{p.roosterA.color}</td>
                                <td>{p.roosterA.tipoGallo}</td>
                                <td>{p.roosterA.tipoEdad}</td>
                                <td>{formatWeight(p.roosterA.weight)}</td>
                                
                                <td className="vs-cell">VS</td>

                                {/* Gallo B */}
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
                <div style={{marginTop: '20pt', fontSize: '8pt', textAlign: 'right', fontStyle: 'italic'}} className="only-print">
                    Generado por GalleraPro © {new Date().getFullYear()}
                </div>
            </div>

            {/* --- SECCIÓN DE PANTALLA (LO QUE VES EN LA APP) --- */}
            <div className="text-center no-print">
                <h2 className="text-3xl font-bold text-white">Cartelera de Peleas</h2>
                <p className="text-gray-400 mt-2">Revisa los emparejamientos y descarga o imprime la programación oficial.</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4 no-print">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="text-xl font-bold text-amber-400">Estadísticas de la Contienda</h3>
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
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
                <h3 className="text-xl font-bold text-amber-400">Cartelera Principal</h3>
                {results.mainFights.length > 0 ? (
                    <div className="space-y-3">
                        {results.mainFights.map(p => (
                            <div key={p.id} className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-amber-500/50 transition-colors">
                                <div className="text-center md:text-right flex-1 w-full">
                                    <div className="text-amber-400 font-bold text-xl mb-1">{getCuerdaName(p.roosterA.cuerdaId)}</div>
                                    <div className="text-white text-base">{p.roosterA.color} • {formatWeight(p.roosterA.weight)} Lb.Oz</div>
                                    <div className="text-gray-400 text-xs mt-1">Anillo: {p.roosterA.ringId} | Pm: {p.roosterA.markingId}</div>
                                </div>
                                <div className="px-6 flex flex-col items-center">
                                    <div className="text-red-500 font-black text-3xl">VS</div>
                                    <div className="bg-gray-800 px-3 py-1 rounded text-xs text-gray-500 font-bold mt-2">PELEA {p.fightNumber}</div>
                                </div>
                                <div className="text-center md:text-left flex-1 w-full">
                                    <div className="text-amber-400 font-bold text-xl mb-1">{getCuerdaName(p.roosterB.cuerdaId)}</div>
                                    <div className="text-white text-base">{p.roosterB.color} • {formatWeight(p.roosterB.weight)} Lb.Oz</div>
                                    <div className="text-gray-400 text-xs mt-1">Anillo: {p.roosterB.ringId} | Pm: {p.roosterB.markingId}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-400 py-10 bg-gray-800/30 rounded-xl border border-dashed border-gray-600">No hay peleas programadas.</p>
                )}
            </div>

            {/* CONTIENDAS MANUALES (SI HAY GALLOS SIN PELEA) */}
            {!isReadOnly && results.unpairedRoosters.length > 0 && (
                <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-6 mt-8 no-print">
                    <h3 className="text-xl font-bold text-amber-400 mb-4">Contiendas Manuales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.unpairedRoosters.map(gallo => {
                            const isSelected = selectedRoosters.includes(gallo.id);
                            return (
                                <div 
                                    key={gallo.id} 
                                    onClick={() => handleSelectRooster(gallo.id)}
                                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'bg-amber-900/40 border-amber-500' : 'bg-gray-700/40 border-gray-600 hover:border-gray-500'}`}
                                >
                                    <div className="flex-grow">
                                        <div className="font-bold text-amber-400">{getCuerdaName(gallo.cuerdaId)}</div>
                                        <div className="text-white">{gallo.color} • {formatWeight(gallo.weight)} Lb.Oz</div>
                                    </div>
                                    <div className="text-xs text-gray-500 text-right">
                                        {gallo.ringId}<br/>{gallo.tipoEdad}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {selectedRoosters.length === 2 && (
                        <div className="mt-6 text-center">
                            <button onClick={handleCreateManualFightClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-10 rounded-xl shadow-xl transform hover:scale-105 transition-transform">
                                Crear Pelea con Selección
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center no-print mt-12 pt-6 border-t border-gray-700">
                <button onClick={onBack} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-8 rounded-lg transition-colors">Volver</button>
                <button onClick={onStartTournament} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded-lg shadow-lg transform hover:scale-105 transition-all">Comenzar Torneo</button>
            </div>
        </div>
    );
};

export default MatchmakingScreen;