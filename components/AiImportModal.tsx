
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Modal from './Modal';
import { Gallo, TipoGallo, TipoEdad, Cuerda, Torneo } from '../types';
import { RoosterIcon, PlusIcon, UsersIcon, KeyIcon, CheckIcon } from './Icons';
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
    gallosPerFront?: number; // Nueva propiedad detectada
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
        // Prioridad: 1. Clave Usuario, 2. Variable Entorno, 3. Clave Default Solicitada
        const activeKey = userApiKey || process.env.API_KEY || "AQ.Ab8RN6LMYxXIKIOFj3zGPFgjDLjJamlkifsOUdUR_JIvZZ4pZwes";

        if (!activeKey) {
            setStatus('Error: No se encontró una API Key. Por favor configura tu clave haciendo clic en el icono de llave.');
            return;
        }

        const ai = new GoogleGenAI({ apiKey: activeKey });

        setIsProcessing(true);
        setStatus('Analizando documento con IA (Procesamiento Avanzado)...');
        
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
                model: "gemini-2.0-flash", // Modelo más rápido y económico
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
                            isNewCuerda: { type: Type.BOOLEAN, description: "True si hay cabecera con Nombre Cuerda/Dueño. False si es solo lista de gallos." },
                            gallosPerFront: { type: Type.INTEGER, nullable: true },
                            cuerdaInfo: {
                                type: Type.OBJECT,
                                nullable: true,
                                properties: {
                                    name: { type: Type.STRING },
                                    owner: { type: Type.STRING, description: "Solo el nombre de la persona. Sin ciudad." },
                                    city: { type: Type.STRING, description: "La ciudad extraída." },
                                    frontCount: { type: Type.INTEGER },
                                    breederPlateId: { type: Type.STRING }
                                }
                            },
                            fronts: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        frontNumber: { type: Type.INTEGER, description: "El número de frente detectado (1 por defecto)." },
                                        gallos: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    ringId: { type: Type.STRING, description: "Anillo (A)" },
                                                    color: { type: Type.STRING },
                                                    weightLbsOz: { type: Type.STRING },
                                                    ageMonths: { type: Type.INTEGER },
                                                    markingId: { type: Type.STRING, description: "Placa de Marcaje (Pm)" },
                                                    breederPlateId: { type: Type.STRING, description: "Placa del Criadero (Pc). Crítico en notas rápidas." },
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
            setStatus('¡Lectura completada con éxito!');
        } catch (error) {
            console.error("AI Import Error:", error);
            setStatus('Error al procesar la imagen. Verifica tu API Key o la legibilidad de la foto.');
        } finally {
            setIsProcessing(false);
        }
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

        // Pasamos todos los datos a App.tsx. 
        // La lógica de duplicados (Ring ID único) y agrupación (Pc única) se maneja allí de forma insensible a mayúsculas.
        
        if (scannedData.isNewCuerda && scannedData.cuerdaInfo) {
            // ESCENARIO 1: Datos de Cuerda + Gallos (CABECERA DETECTADA)
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
                        breederPlateId: g.breederPlateId || cuerdaInfo.breederPlateId, // Si el gallo no tiene Pc específica, usa la de la cabecera
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
            // ESCENARIO 2: Solo gallos (NOTA RÁPIDA - Buscan su cuerda por Pc)
            let addedCount = 0;
            let missingPcs = new Set<string>();

            scannedData.fronts.forEach(frontGroup => {
                frontGroup.gallos.forEach(g => {
                    // En notas rápidas, el PC del gallo es vital para encontrar su cuerda
                    const scanPc = g.breederPlateId ? g.breederPlateId.trim().toLowerCase() : '';
                    
                    if (!scanPc) {
                        // Si es nota rápida y un gallo no tiene Pc, no sabemos a dónde va.
                        return;
                    }

                    // Buscamos si existe la cuerda por Pc (insensible a mayúsculas)
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

                        // Intentamos añadirlo al frente específico detectado en la nota
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
            } else if (addedCount > 0) {
                // Éxito parcial o total handled by notifications in App.tsx
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
                    <button 
                        onClick={handleSaveKey}
                        className="bg-amber-500 hover:bg-amber-600 text-black p-1 rounded transition-colors"
                        title="Guardar Key"
                    >
                        <CheckIcon className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => setIsKeyInputOpen(true)}
                    className={`p-2 rounded-lg transition-colors ${userApiKey ? 'text-green-400 hover:text-green-300 bg-green-900/20' : 'text-gray-400 hover:text-white bg-gray-700/30'}`}
                    title={userApiKey ? "API Key Configurada" : "Configurar API Key"}
                >
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
            <div className="space-y-6">
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
                            <div 
                                onClick={() => fileInputRef.current?.click()} 
                                className="group border-2 border-dashed border-gray-600 rounded-2xl p-12 hover:border-amber-500 hover:bg-amber-500/5 transition-all cursor-pointer text-center bg-gray-700/20"
                            >
                                <PlusIcon className="w-16 h-16 text-gray-500 group-hover:text-amber-500 mx-auto mb-4 transition-colors" />
                                <p className="text-base font-bold text-gray-200">Subir Formulario Escaneado</p>
                                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                                    El sistema detectará automáticamente si es un <strong>Formulario Completo</strong> (Crea cuerda nueva) o una <strong>Nota Rápida</strong> (Asigna gallos a cuerdas existentes por Pc).
                                </p>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {status && (
                            <div className={`p-3 rounded-lg text-base font-semibold text-center ${status.includes('Error') ? 'bg-red-900/40 text-red-300' : 'bg-blue-900/40 text-blue-300'}`}>
                                {status}
                            </div>
                        )}
                        
                        {scannedData && (
                            <div className="bg-gray-800/40 p-4 md:p-6 rounded-2xl border border-gray-700 space-y-5">
                                <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                                    <h4 className="font-bold text-amber-400 flex items-center space-x-2 text-lg">
                                        {scannedData.isNewCuerda ? <UsersIcon className="w-6 h-6"/> : <RoosterIcon className="w-6 h-6"/>}
                                        <span className="uppercase tracking-wide">
                                            {scannedData.isNewCuerda ? 'Detección: Registro Completo' : 'Detección: Nota Rápida (Solo Gallos)'}
                                        </span>
                                    </h4>
                                    <span className="text-sm font-mono bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20">
                                        {totalGallosCount} gallos detectados
                                    </span>
                                </div>

                                {scannedData.gallosPerFront && (
                                    <div className="bg-green-900/30 p-2 rounded text-center border border-green-700/50">
                                        <p className="text-green-400 text-base font-bold">
                                            ¡Detectado! Se crearán {scannedData.gallosPerFront} frentes por cuerda.
                                        </p>
                                    </div>
                                )}
                                
                                {scannedData.isNewCuerda && scannedData.cuerdaInfo && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-[#1a1d29] p-5 rounded-xl border border-gray-700/50 shadow-md">
                                        <div className="space-y-1">
                                            <span className="text-gray-400 block uppercase font-semibold">Cuerda:</span> 
                                            <span className="text-white font-bold text-base">{scannedData.cuerdaInfo.name}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-gray-400 block uppercase font-semibold">Dueño:</span> 
                                            <span className="text-white text-base">{scannedData.cuerdaInfo.owner}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-gray-400 block uppercase font-semibold">Ciudad:</span> 
                                            <span className="text-white text-base">{scannedData.cuerdaInfo.city}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-gray-400 block uppercase font-semibold">Placa Pc:</span> 
                                            <span className="text-amber-400 font-mono font-bold text-base">{scannedData.cuerdaInfo.breederPlateId}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4 pr-2">
                                    {scannedData.fronts.map((f, i) => (
                                        <div key={i} className="space-y-2 bg-[#1a1d29]/40 p-4 rounded-xl">
                                            <div className="text-xs font-black text-gray-500 uppercase flex items-center gap-2 mb-2">
                                                <div className="h-[1px] flex-grow bg-gray-700"></div>
                                                Frente {f.frontNumber} <span className="text-gray-500 font-normal ml-1">(Detectado en Nota)</span>
                                                <div className="h-[1px] flex-grow bg-gray-700"></div>
                                            </div>
                                            {/* Cambio a Grid de 3 columnas en pantallas grandes para aprovechar el ancho */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {f.gallos.map((g, gi) => (
                                                    <div key={gi} className="bg-gray-800/80 p-3 rounded-lg text-sm border border-gray-700 flex justify-between items-center group hover:border-amber-500/50 transition-colors shadow-sm">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white font-bold text-base">A: {g.ringId}</span>
                                                                <span className="text-gray-300">| {g.color}</span>
                                                            </div>
                                                            <div className="text-xs text-gray-400 font-mono">Pc: {g.breederPlateId}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-amber-400 text-base">{g.weightLbsOz} <span className="text-xs font-normal opacity-70">Lb.Oz</span></div>
                                                            <div className="text-xs text-gray-400">{g.ageMonths}m | {g.fenotipo}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {isProcessing && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                                <div className="text-amber-400 font-bold animate-pulse uppercase tracking-widest text-sm">Extrayendo datos con IA...</div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                            <button onClick={() => {setScannedData(null); onClose();}} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg transition-colors">Cancelar</button>
                            <button 
                                onClick={confirmImport} 
                                disabled={isProcessing || !scannedData} 
                                className="bg-amber-500 hover:bg-amber-600 text-black font-black py-3 px-12 rounded-xl disabled:opacity-30 shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all transform active:scale-95"
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
