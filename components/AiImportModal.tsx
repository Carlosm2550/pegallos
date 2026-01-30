
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Modal from './Modal';
import { Gallo, TipoGallo, TipoEdad, Cuerda, Torneo } from '../types';
import { RoosterIcon, PlusIcon, UsersIcon, KeyIcon, CheckIcon, PencilIcon } from './Icons';
import { CuerdaFormData } from '../App';

interface ScannedCuerdaInfo {
    name: string;
    owner: string;
    city: string;
    frontCount: number;
    breederPlateId: string;
}

interface ScannedFrontGroup {
    frontNumber: number;
    gallos: {
        ringId: string;
        color: string;
        weightLbsOz: string;
        ageMonths: number;
        markingId: string;
        breederPlateId: string;
        fenotipo: string;
        marca: number;
    }[];
}

interface ScannedData {
    isNewCuerda: boolean; 
    cuerdaInfo?: ScannedCuerdaInfo;
    fronts: ScannedFrontGroup[];
    gallosPerFront?: number;
}

interface AiImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    cuerdas: Cuerda[];
    gallos: Gallo[];
    torneo: Torneo;
    onImportFullData: (cuerdaData: CuerdaFormData, gallosByFront: { frontNumber: number, gallos: Omit<Gallo, 'id' | 'tipoEdad'>[] }[]) => void;
    onAddSingleGallo: (galloData: Omit<Gallo, 'id' | 'tipoEdad'>) => void;
    onSaveGallo: (galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => void;
    onAddGalloToPc: (galloData: Omit<Gallo, 'id' | 'tipoEdad'>, pc: string, frontNumber: number, targetTotalFronts?: number) => void;
}

// MOVED OUTSIDE to prevent re-renders and focus loss
const InputLike = ({ value, onChange, label, className = "", placeholder = "" }: { value: string | number, onChange: (val: string) => void, label?: string, className?: string, placeholder?: string }) => (
    <div className="relative group w-full">
        {label && <label className="text-[10px] text-gray-500 uppercase font-bold absolute -top-3 left-1 bg-[#1a1d29] px-1 z-10">{label}</label>}
        <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full bg-gray-900/50 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors ${className}`}
        />
        <PencilIcon className="w-3 h-3 text-gray-600 absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 pointer-events-none" />
    </div>
);

const AiImportModal: React.FC<AiImportModalProps> = ({ isOpen, onClose, cuerdas, gallos, torneo, onImportFullData, onAddSingleGallo, onSaveGallo, onAddGalloToPc }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannedData, setScannedData] = useState<ScannedData | null>(null);
    const [status, setStatus] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // API Key Management State
    const [userApiKey, setUserApiKey] = useState('');
    const [isKeyInputOpen, setIsKeyInputOpen] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('gallerapro_gemini_key');
        if (storedKey) setUserApiKey(storedKey);
    }, []);

    const handleSaveKey = () => {
        localStorage.setItem('gallerapro_gemini_key', userApiKey);
        setIsKeyInputOpen(false);
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`;

    const processImage = async (base64Data: string) => {
        const activeKey = userApiKey || process.env.API_KEY || "AQ.Ab8RN6LMYxXIKIOFj3zGPFgjDLjJamlkifsOUdUR_JIvZZ4pZwes";

        if (!activeKey) {
            setStatus('Error: No se encontró una API Key.');
            return;
        }

        const ai = new GoogleGenAI({ apiKey: activeKey });

        setIsProcessing(true);
        setStatus('Analizando documento con IA...');
        
        try {
            const prompt = `
                Actúa como un analista de datos experto en torneos de gallos. Tu tarea es extraer información estructurada de una imagen (manuscrita o impresa) siguiendo ESTRICTAMENTE los siguientes pasos lógicos.

                PASO 1: ANÁLISIS DE TIPO DE DOCUMENTO
                - Observa la parte superior de la imagen.
                - ¿Hay campos explícitos etiquetados como "Cuerda", "Dueño/Propietario", "Ciudad"?
                - SI LOS HAY: Establece 'isNewCuerda' = true. Ve al PASO 2.
                - SI NO LOS HAY (es solo una lista de gallos): Establece 'isNewCuerda' = false. Salta al PASO 4.

                PASO 2: EXTRACCIÓN DE CABECERA (Solo si isNewCuerda = true)
                - Busca el nombre de la Cuerda.
                - Busca el Dueño. IMPORTANTE: Extrae SOLO el nombre de la persona. Si al lado del nombre hay una ciudad, un teléfono o una dirección, NO LOS INCLUYAS en el campo 'owner'. Ponlos en sus campos respectivos o ignóralos.
                - Busca la Ciudad. Si no está explícita, búscala al lado del nombre del dueño.
                - Busca la 'Placa de Criadero' etiquetada como 'Pc', 'Placa', o un código alfanumérico destacado (ej: 'LMS-34').
                - Busca texto como "X gallos por frente" para llenar 'gallosPerFront'.

                PASO 3: DETECCIÓN DE FRENTES
                - Busca palabras clave como "Frente 1", "Frente 2", "F1", "F2" encima de grupos de filas.
                - Si no hay distinción visual, asume que todos son del "Frente 1".

                PASO 4: EXTRACCIÓN DE FILAS (GALLOS)
                - Extrae cada fila de la tabla o lista.
                - Columna 'Anillo' (A): Es el ID vital. No confundir con la Placa.
                - Columna 'Placa Marcaje' (Pm): Número de placa metálica.
                - Columna 'Placa Criadero' (Pc): Si el documento es una "Nota Rápida" (Paso 1 fue NO), este dato es OBLIGATORIO por cada gallo para saber a qué cuerda pertenece.
                - Peso: Formatos posibles "3.14", "3-14", "3,14", "3 libras 14 onzas". Convertir a formato texto "Lb.Oz".
                - Edad: En meses.
                - Fenotipo/Color: "Giro", "Jabao", etc. Si dice "pava" o "liso", eso va en 'fenotipo'.

                REGLAS DE LIMPIEZA DE DATOS (CRÍTICO):
                1. Campo 'owner': NO debe contener la ciudad. Ejemplo INCORRECTO: "Juan Perez Bogotá". CORRECTO: Owner="Juan Perez", City="Bogotá".
                2. Campo 'breederPlateId' (Pc): Elimina espacios extra. Ejemplo: " Lms 123 " -> "Lms123".

                Salida JSON estricta basada en el esquema proporcionado.
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Data.split(',')[1] || ""
                            }
                        }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            isNewCuerda: { type: Type.BOOLEAN },
                            gallosPerFront: { type: Type.INTEGER, nullable: true },
                            cuerdaInfo: {
                                type: Type.OBJECT,
                                nullable: true,
                                properties: {
                                    name: { type: Type.STRING },
                                    owner: { type: Type.STRING },
                                    city: { type: Type.STRING },
                                    frontCount: { type: Type.INTEGER },
                                    breederPlateId: { type: Type.STRING }
                                }
                            },
                            fronts: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        frontNumber: { type: Type.INTEGER },
                                        gallos: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    ringId: { type: Type.STRING },
                                                    color: { type: Type.STRING },
                                                    weightLbsOz: { type: Type.STRING },
                                                    ageMonths: { type: Type.INTEGER },
                                                    markingId: { type: Type.STRING },
                                                    breederPlateId: { type: Type.STRING },
                                                    fenotipo: { type: Type.STRING },
                                                    marca: { type: Type.INTEGER }
                                                },
                                                required: ["ringId", "color", "weightLbsOz", "ageMonths", "fenotipo", "marca", "breederPlateId"]
                                            }
                                        }
                                    },
                                    required: ["frontNumber", "gallos"]
                                }
                            }
                        },
                        required: ["isNewCuerda", "fronts"]
                    }
                }
            });

            const text = response.text;
            if (!text) throw new Error("No response from AI");
            const data = JSON.parse(text) as ScannedData;
            setScannedData(data);
            setStatus(''); // Limpiar status al éxito para ahorrar espacio
        } catch (error) {
            console.error("AI Import Error:", error);
            setStatus('Error al procesar la imagen.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Funciones para actualizar el estado editable
    const updateCuerdaField = (field: keyof ScannedCuerdaInfo, value: any) => {
        if (!scannedData || !scannedData.cuerdaInfo) return;
        setScannedData({
            ...scannedData,
            cuerdaInfo: { ...scannedData.cuerdaInfo, [field]: value }
        });
    };

    const updateGalloField = (frontIndex: number, galloIndex: number, field: string, value: any) => {
        if (!scannedData) return;
        const newFronts = [...scannedData.fronts];
        const newGallos = [...newFronts[frontIndex].gallos];
        newGallos[galloIndex] = { ...newGallos[galloIndex], [field]: value };
        newFronts[frontIndex] = { ...newFronts[frontIndex], gallos: newGallos };
        setScannedData({ ...scannedData, fronts: newFronts });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => ev.target?.result && processImage(ev.target.result as string);
        reader.readAsDataURL(file);
        e.target.value = ''; 
    };

    const confirmImport = () => {
        if (!scannedData) return;

        const targetFrontCount = scannedData.gallosPerFront;

        if (scannedData.isNewCuerda && scannedData.cuerdaInfo) {
            const { cuerdaInfo, fronts } = scannedData;
            
            const processedGallosByFront = fronts.map(f => ({
                frontNumber: f.frontNumber,
                gallos: f.gallos.map(g => {
                    const weightParts = (g.weightLbsOz || "0.0").split('.');
                    const lbs = parseInt(weightParts[0]) || 0;
                    const oz = parseInt(weightParts[1]) || 0;
                    return {
                        ringId: g.ringId, 
                        color: g.color, 
                        weight: (lbs * 16) + oz, 
                        ageMonths: g.ageMonths,
                        markingId: g.markingId, 
                        breederPlateId: g.breederPlateId || cuerdaInfo.breederPlateId,
                        tipoGallo: g.fenotipo.toLowerCase().includes('pava') ? TipoGallo.PAVA : TipoGallo.LISO,
                        marca: g.marca, 
                        cuerdaId: ''
                    };
                })
            }));

            const finalFrontCount = targetFrontCount || cuerdaInfo.frontCount || fronts.length;

            onImportFullData({
                name: cuerdaInfo.name, 
                owner: cuerdaInfo.owner, 
                city: cuerdaInfo.city,
                frontCount: finalFrontCount, 
                breederPlateId: cuerdaInfo.breederPlateId
            }, processedGallosByFront);
            
        } else {
            let addedCount = 0;
            let missingPcs = new Set<string>();

            scannedData.fronts.forEach(frontGroup => {
                frontGroup.gallos.forEach(g => {
                    const scanPc = g.breederPlateId ? g.breederPlateId.trim().toLowerCase() : '';
                    if (!scanPc) return;

                    const matchingCuerdas = cuerdas.filter(c => 
                        c.breederPlateId && c.breederPlateId.trim().toLowerCase() === scanPc
                    );
                    
                    if (matchingCuerdas.length > 0) {
                        const weightParts = (g.weightLbsOz || "0.0").split('.');
                        const lbs = parseInt(weightParts[0]) || 0;
                        const oz = parseInt(weightParts[1]) || 0;

                        const galloData = {
                            ringId: g.ringId, 
                            color: g.color, 
                            weight: (lbs * 16) + oz, 
                            ageMonths: g.ageMonths,
                            markingId: g.markingId, 
                            breederPlateId: g.breederPlateId,
                            tipoGallo: g.fenotipo.toLowerCase().includes('pava') ? TipoGallo.PAVA : TipoGallo.LISO,
                            marca: g.marca, 
                            cuerdaId: ''
                        };

                        onAddGalloToPc(galloData, g.breederPlateId, frontGroup.frontNumber, targetFrontCount);
                        addedCount++;
                    } else {
                        missingPcs.add(g.breederPlateId);
                    }
                });
            });

            if (addedCount === 0 && missingPcs.size > 0) {
                const pcs = Array.from(missingPcs).join(', ');
               alert(`No se encontraron cuerdas registradas con las placas (Pc): ${pcs}. \n\nPrimero crea la cuerda manualmente con su Pc correspondiente.`);
            }
        }
        
        onClose();
        setScannedData(null);
    };

    const totalGallosCount = scannedData?.fronts.reduce((acc, f) => acc + f.gallos.length, 0) || 0;

    const renderHeaderContent = () => (
        <div className="flex items-center space-x-2">
            {isKeyInputOpen ? (
                <div className="flex items-center bg-gray-900 rounded-lg p-1 border border-amber-500/50 animate-fade-in-down">
                    <input 
                        type="password" 
                        value={userApiKey} 
                        onChange={(e) => setUserApiKey(e.target.value)}
                        placeholder="Pegar API Key de Gemini..."
                        className="bg-transparent border-none text-xs text-white px-2 py-1 outline-none w-48 placeholder-gray-500"
                        autoFocus
                    />
                    <button onClick={handleSaveKey} className="bg-amber-500 hover:bg-amber-600 text-black p-1 rounded transition-colors"><CheckIcon className="w-3 h-3" /></button>
                </div>
            ) : (
                <button onClick={() => setIsKeyInputOpen(true)} className={`p-2 rounded-lg transition-colors ${userApiKey ? 'text-green-400 hover:text-green-300 bg-green-900/20' : 'text-gray-400 hover:text-white bg-gray-700/30'}`}>
                    <KeyIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Importación Inteligente (IA)" 
            size="wide"
            headerContent={renderHeaderContent()}
        >
            <div className="space-y-4">
                {!scannedData && !isProcessing ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="text-center space-y-4 border-r border-gray-700 pr-4">
                            <h4 className="text-amber-400 font-bold uppercase text-sm tracking-wider">Escanear desde Móvil</h4>
                            <div className="bg-white p-3 inline-block rounded-xl shadow-2xl">
                                <img src={qrUrl} alt="QR Code" className="w-32 h-32" />
                            </div>
                            <p className="text-xs text-gray-400 max-w-[200px] mx-auto">Escanea para abrir la app y capturar la imagen directamente con tu cámara.</p>
                        </div>
                        <div className="space-y-4">
                            <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-gray-600 rounded-2xl p-12 hover:border-amber-500 hover:bg-amber-500/5 transition-all cursor-pointer text-center bg-gray-700/20">
                                <PlusIcon className="w-16 h-16 text-gray-500 group-hover:text-amber-500 mx-auto mb-4 transition-colors" />
                                <p className="text-base font-bold text-gray-200">Subir Formulario Escaneado</p>
                                <p className="text-xs text-gray-500 mt-3 leading-relaxed">Detecta automáticamente Cuerdas, Dueños y Gallos.</p>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {status && <div className="p-2 rounded bg-red-900/40 text-red-300 text-center text-sm font-bold">{status}</div>}
                        
                        {scannedData && (
                            <div className="space-y-4">
                                {/* BARRA DE ESTADO COMPACTA */}
                                <div className="flex items-center justify-between bg-gray-800 rounded-lg p-2 px-4 border border-gray-700">
                                    <div className="flex items-center space-x-3">
                                        {scannedData.isNewCuerda ? <UsersIcon className="w-4 h-4 text-amber-400"/> : <RoosterIcon className="w-4 h-4 text-blue-400"/>}
                                        <span className="text-sm font-bold text-white uppercase">{scannedData.isNewCuerda ? 'Registro Completo' : 'Nota Rápida'}</span>
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs font-mono text-gray-400">
                                        <span>{totalGallosCount} gallos</span>
                                        {scannedData.gallosPerFront && <span>{scannedData.gallosPerFront} frentes detectados</span>}
                                    </div>
                                </div>

                                {/* FORMULARIO DE CUERDA (SOLO SI ES NUEVA) */}
                                {scannedData.isNewCuerda && scannedData.cuerdaInfo && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-[#1a1d29] p-4 pt-5 rounded-xl border border-gray-700/50 shadow-md">
                                        <InputLike label="Nombre Cuerda" value={scannedData.cuerdaInfo.name} onChange={(v) => updateCuerdaField('name', v)} />
                                        <InputLike label="Dueño" value={scannedData.cuerdaInfo.owner} onChange={(v) => updateCuerdaField('owner', v)} />
                                        <InputLike label="Ciudad" value={scannedData.cuerdaInfo.city} onChange={(v) => updateCuerdaField('city', v)} />
                                        <InputLike label="Placa Pc" value={scannedData.cuerdaInfo.breederPlateId} onChange={(v) => updateCuerdaField('breederPlateId', v)} className="font-mono text-amber-400" />
                                    </div>
                                )}

                                {/* LISTADO DE GALLOS EDITABLE */}
                                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                                    {/* GRID PARA FRENTES EN 2 COLUMNAS */}
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {scannedData.fronts.map((f, i) => (
                                            <div key={i} className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                                                {/* HEADER DEL FRENTE ENCIMA DEL SEGMENTO */}
                                                <div className="text-[11px] font-bold text-amber-500 uppercase flex items-center gap-2 mb-3">
                                                    <div className="h-[1px] flex-grow bg-gray-700"></div>Frente {f.frontNumber}<div className="h-[1px] flex-grow bg-gray-700"></div>
                                                </div>
                                                
                                                {/* GALLOS EN UNA SOLA COLUMNA DENTRO DEL FRENTE PARA MEJOR EDICIÓN */}
                                                <div className="grid grid-cols-1 gap-2">
                                                    {f.gallos.map((g, gi) => (
                                                        <div key={gi} className="bg-gray-900/60 p-2 rounded-lg border border-gray-700 hover:border-amber-500/30 transition-colors shadow-sm grid grid-cols-12 gap-2 items-center">
                                                            <div className="col-span-3">
                                                                <InputLike placeholder="Anillo" value={g.ringId} onChange={(v) => updateGalloField(i, gi, 'ringId', v)} className="text-center font-bold" />
                                                                <div className="mt-1"><InputLike placeholder="Pc" value={g.breederPlateId} onChange={(v) => updateGalloField(i, gi, 'breederPlateId', v)} className="text-[10px] text-center h-6" /></div>
                                                            </div>
                                                            <div className="col-span-5 space-y-1">
                                                                <InputLike placeholder="Color" value={g.color} onChange={(v) => updateGalloField(i, gi, 'color', v)} />
                                                                <div className="flex gap-1">
                                                                    <InputLike placeholder="Meses" value={g.ageMonths} onChange={(v) => updateGalloField(i, gi, 'ageMonths', v)} className="text-center h-7 text-xs" />
                                                                    <InputLike placeholder="Fenotipo" value={g.fenotipo} onChange={(v) => updateGalloField(i, gi, 'fenotipo', v)} className="text-center h-7 text-xs" />
                                                                </div>
                                                            </div>
                                                            <div className="col-span-4 text-right">
                                                                <InputLike placeholder="Peso" value={g.weightLbsOz} onChange={(v) => updateGalloField(i, gi, 'weightLbsOz', v)} className="text-right font-mono text-amber-400 font-bold" />
                                                                <span className="text-[9px] text-gray-500 block pr-1">Lb.Oz</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {isProcessing && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                                <div className="text-amber-400 font-bold animate-pulse uppercase tracking-widest text-sm">Procesando imagen...</div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-700">
                            <button onClick={() => {setScannedData(null); onClose();}} className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-2 px-6 rounded-lg transition-colors text-sm">Cancelar</button>
                            <button 
                                onClick={confirmImport} 
                                disabled={isProcessing || !scannedData} 
                                className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-10 rounded-lg disabled:opacity-30 shadow-lg transition-all transform active:scale-95 text-sm"
                            >
                                Confirmar Importación
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AiImportModal;
