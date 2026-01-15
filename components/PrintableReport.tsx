import React from 'react';
import { Pelea, Torneo, Cuerda } from '../types';

interface PrintableReportProps {
  peleas: Pelea[];
  torneo: Torneo;
  cuerdas: Cuerda[];
  title: string;
}

const OUNCES_PER_POUND = 16;
const formatWeightLbsOz = (totalOunces: number): string => {
    const lbs = Math.floor(totalOunces / OUNCES_PER_POUND);
    const oz = Math.round(totalOunces % OUNCES_PER_POUND);
    return `${lbs}.${String(oz).padStart(2, '0')}`;
};

const PrintableReport: React.FC<PrintableReportProps> = ({ peleas, torneo, cuerdas, title }) => {
  const getCuerdaName = (id: string) => cuerdas.find(c => c.id === id)?.name || 'N/A';
  
  const getWinnerName = (pelea: Pelea) => {
    if (pelea.winner === 'A') return getCuerdaName(pelea.roosterA.cuerdaId);
    if (pelea.winner === 'B') return getCuerdaName(pelea.roosterB.cuerdaId);
    if (pelea.winner === 'DRAW') return 'EMPATE';
    return 'Pte.';
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div id="full-printable-report">
      <div className="report-header">
        <h1>{torneo.name}</h1>
        <p>Reporte Detallado de Peleas - {title}</p>
        <p>Fecha: {torneo.date} | Responsable: {torneo.tournamentManager || 'N/A'}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th rowSpan={2}>No.</th>
            <th colSpan={8}>BLOQUE 1 (GALLO A)</th>
            <th className="vs-cell" rowSpan={2}>VS</th>
            <th colSpan={8}>BLOQUE 2 (GALLO B)</th>
            <th rowSpan={2}>GANADOR</th>
            <th rowSpan={2}>TIEMPO</th>
          </tr>
          <tr>
            <th>CRIADERO</th>
            <th>FRENTE</th>
            <th>ANILLO</th>
            <th>PM</th>
            <th>PC</th>
            <th>TIPO</th>
            <th>COLOR</th>
            <th>PESO</th>
            <th>CRIADERO</th>
            <th>FRENTE</th>
            <th>ANILLO</th>
            <th>PM</th>
            <th>PC</th>
            <th>TIPO</th>
            <th>COLOR</th>
            <th>PESO</th>
          </tr>
        </thead>
        <tbody>
          {peleas.map((pelea) => {
            const frontA = pelea.roosterA.cuerdaId;
            const frontB = pelea.roosterB.cuerdaId;
            const cA = cuerdas.find(c => c.id === frontA);
            const cB = cuerdas.find(c => c.id === frontB);

            return (
              <tr key={pelea.id}>
                <td>{pelea.fightNumber}</td>
                {/* Bloque 1 */}
                <td>{cA?.name.replace(/\s\(F\d+\)$/, '') || 'N/A'}</td>
                <td>{cA?.name.match(/\(F(\d+)\)$/)?.[1] || '1'}</td>
                <td>{pelea.roosterA.ringId}</td>
                <td>{pelea.roosterA.markingId}</td>
                <td>{pelea.roosterA.breederPlateId}</td>
                <td>{pelea.roosterA.tipoEdad}</td>
                <td>{pelea.roosterA.color}</td>
                <td>{formatWeightLbsOz(pelea.roosterA.weight)}</td>
                
                <td className="vs-cell">vs</td>

                {/* Bloque 2 */}
                <td>{cB?.name.replace(/\s\(F\d+\)$/, '') || 'N/A'}</td>
                <td>{cB?.name.match(/\(F(\d+)\)$/)?.[1] || '1'}</td>
                <td>{pelea.roosterB.ringId}</td>
                <td>{pelea.roosterB.markingId}</td>
                <td>{pelea.roosterB.breederPlateId}</td>
                <td>{pelea.roosterB.tipoEdad}</td>
                <td>{pelea.roosterB.color}</td>
                <td>{formatWeightLbsOz(pelea.roosterB.weight)}</td>

                <td style={{ fontWeight: 'bold' }}>{getWinnerName(pelea)}</td>
                <td>{formatDuration(pelea.duration)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PrintableReport;