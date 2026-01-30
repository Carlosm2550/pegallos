
import React from 'react';
import { Pelea, Cuerda } from '../types';
import { TrophyIcon } from './Icons';

const OUNCES_PER_POUND = 16;
const formatWeightRaw = (totalOunces: number): string => {
    const total = Math.round(totalOunces);
    const lbs = Math.floor(total / OUNCES_PER_POUND);
    const oz = total % OUNCES_PER_POUND;
    return `${lbs}.${String(oz).padStart(2, '0')}`;
};

interface PrintableProgramacionProps {
    peleas: Pelea[];
    cuerdas: Cuerda[];
    torneoName: string;
    date: string;
    day?: number;
}

const PrintableProgramacion: React.FC<PrintableProgramacionProps> = ({ peleas, cuerdas, torneoName, date, day }) => {
    
    const getCuerdaInfo = (id: string) => {
        const cuerda = cuerdas.find(p => p.id === id);
        if (!cuerda) return { name: 'Desconocido', front: '' };
        
        const nameOnly = cuerda.name.replace(/\s\(F\d+\)$/, '').trim();
        const match = cuerda.name.match(/\(F(\d+)\)$/);
        const front = match ? match[1] : '1'; // Si no tiene (Fn), asumimos F1
        
        return { name: nameOnly, front };
    };

    return (
        <div className="printable-programacion-container">
            <div className="header-print">
                <h1>{torneoName}</h1>
                <p>PROGRAMACIÓN DE PELEAS {day ? `- DÍA ${day}` : ''} | FECHA: {date}</p>
            </div>
            
            <table className="programacion-table">
                <thead>
                    <tr>
                        <th style={{ width: '25px' }} rowSpan={2}>N°</th>
                        
                        {/* LADO ROJO HEADERS */}
                        <th colSpan={8} style={{borderBottom: '2px solid red'}}>LADO ROJO (GALLO A)</th>
                        
                        <th style={{ width: '25px' }} rowSpan={2}>VS</th>
                        
                        {/* LADO AZUL HEADERS */}
                        <th colSpan={8} style={{borderBottom: '2px solid blue'}}>LADO AZUL (GALLO B)</th>
                        
                        {/* FINAL HEADERS */}
                        <th colSpan={2}>FINAL</th>
                        
                        <th style={{ width: '25px' }} rowSpan={2}>N°</th>
                    </tr>
                    <tr>
                        {/* Red Sub-headers */}
                        <th style={{ width: '90px' }}>Cuerda</th>
                        <th style={{ width: '20px' }}>F</th>
                        <th style={{ width: '40px' }}>Anillo</th>
                        <th style={{ width: '40px' }}>Placa(Pm)</th>
                        <th style={{ width: '40px' }}>Placa(Pc)</th>
                        <th style={{ width: '50px' }}>Color</th>
                        <th style={{ width: '50px' }}>Fenotipo/Tipo</th>
                        <th style={{ width: '35px' }}>Peso</th>
                        
                        {/* Blue Sub-headers */}
                        <th style={{ width: '90px' }}>Cuerda</th>
                        <th style={{ width: '20px' }}>F</th>
                        <th style={{ width: '40px' }}>Anillo</th>
                        <th style={{ width: '40px' }}>Placa(Pm)</th>
                        <th style={{ width: '40px' }}>Placa(Pc)</th>
                        <th style={{ width: '50px' }}>Color</th>
                        <th style={{ width: '50px' }}>Fenotipo/Tipo</th>
                        <th style={{ width: '35px' }}>Peso</th>

                        {/* Final Sub-headers */}
                        <th style={{ width: '25px' }}>G</th>
                        <th style={{ width: '40px' }}>Tiempo</th>
                    </tr>
                </thead>
                <tbody>
                    {peleas.map((pelea) => {
                        const infoA = getCuerdaInfo(pelea.roosterA.cuerdaId);
                        const infoB = getCuerdaInfo(pelea.roosterB.cuerdaId);

                        return (
                            <tr key={pelea.id}>
                                <td style={{ fontWeight: 'bold' }}>{pelea.fightNumber}</td>
                                
                                {/* ROJO */}
                                <td style={{ textAlign: 'left', paddingLeft: '2px', fontSize: '7pt' }}>{infoA.name}</td>
                                <td>{infoA.front}</td>
                                <td>{pelea.roosterA.ringId}</td>
                                <td>{pelea.roosterA.markingId}</td>
                                <td>{pelea.roosterA.breederPlateId}</td>
                                <td>{pelea.roosterA.color}</td>
                                <td style={{ lineHeight: '1' }}>
                                    <div>{pelea.roosterA.tipoGallo}</div>
                                    <div style={{ fontSize: '6pt', marginTop: '1px' }}>{pelea.roosterA.tipoEdad}</div>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{formatWeightRaw(pelea.roosterA.weight)}</td>
                                
                                <td style={{ fontWeight: 'bold' }}>VS</td>
                                
                                {/* AZUL */}
                                <td style={{ textAlign: 'left', paddingLeft: '2px', fontSize: '7pt' }}>{infoB.name}</td>
                                <td>{infoB.front}</td>
                                <td>{pelea.roosterB.ringId}</td>
                                <td>{pelea.roosterB.markingId}</td>
                                <td>{pelea.roosterB.breederPlateId}</td>
                                <td>{pelea.roosterB.color}</td>
                                <td style={{ lineHeight: '1' }}>
                                    <div>{pelea.roosterB.tipoGallo}</div>
                                    <div style={{ fontSize: '6pt', marginTop: '1px' }}>{pelea.roosterB.tipoEdad}</div>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{formatWeightRaw(pelea.roosterB.weight)}</td>

                                {/* FINAL */}
                                <td></td> {/* G */}
                                <td></td> {/* Tiempo */}
                                
                                <td style={{ fontWeight: 'bold' }}>{pelea.fightNumber}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="print-footer">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{ color: 'black' }}>
                         <TrophyIcon className="w-5 h-5" />
                    </div>
                    <span>GalleraPro - 100% Peleas de gallos - 3197633335</span>
                </div>
            </div>
        </div>
    );
};

export default PrintableProgramacion;
