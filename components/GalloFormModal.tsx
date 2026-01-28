import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Cuerda, Gallo, Torneo, TipoGallo, TipoEdad } from '../types';
import { ChevronDownIcon, PencilIcon, XIcon, PlusIcon } from './Icons';
import { AGE_OPTIONS_BY_MARCA } from '../constants';

// --- Lbs.Oz Weight Conversion Utilities ---
const OUNCES_PER_POUND = 16;

const toLbsOz = (totalOunces: number) => {
    if (isNaN(totalOunces) || totalOunces < 0) return { lbs: 0, oz: 0 };
    const total = Math.round(totalOunces);
    const lbs = Math.floor(total / OUNCES_PER_POUND);
    const oz = total % OUNCES_PER_POUND;
    return { lbs, oz };
};

const fromLbsOz = (lbs: number, oz: number) => {
    return Math.round((lbs * OUNCES_PER_POUND) + oz);
};

const formatWeightLbsOz = (totalOunces: number, withUnit = false): string => {
    const { lbs, oz } = toLbsOz(totalOunces);
    const unit = withUnit ? ' Lb.Oz' : '';
    return `${lbs}.${String(oz).padStart(2, '0')}${unit}`;
};

const parseWeightLbsOz = (value: string): number => {
    let cleanValue = value.replace(/[^0-9.]/g, '');
    if (!cleanValue.includes('.') && cleanValue.length === 3) {
        cleanValue = `${cleanValue.substring(0, 1)}.${cleanValue.substring(1)}`;
    }
    const parts = cleanValue.split('.');
    let lbs = parseInt(parts[0], 10) || 0;
    let oz_input = parts[1] || '0';
    let oz = parseInt(oz_input, 10) || 0;
    if (oz >= OUNCES_PER_POUND) {
        lbs += Math.floor(oz / OUNCES_PER_POUND);
        oz = oz % OUNCES_PER_POUND;
    }
    return fromLbsOz(lbs, oz);
};

// --- HELPER COMPONENTS ---
interface LbsOzInputProps {
  label: string;
  value: number;
  onChange: (newValue: number) => void;
  disabled?: boolean;
  validator?: (value: number) => boolean;
}
export const LbsOzInput: React.FC<LbsOzInputProps> = ({ label, value, onChange, disabled, validator }) => {
    const [displayValue, setDisplayValue] = useState(formatWeightLbsOz(value));
    const [isValid, setIsValid] = useState(true);
    const [isGridOpen, setIsGridOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setDisplayValue(formatWeightLbsOz(value));
        setIsValid(validator ? validator(value) : true);
    }, [value, validator]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsGridOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const weightOptions = useMemo(() => {
        const opts = [];
        const start = fromLbsOz(2, 10);
        const end = fromLbsOz(5, 4);
        for (let oz = start; oz <= end; oz++) opts.push(oz);
        return opts;
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={displayValue}
                    onChange={(e) => setDisplayValue(e.target.value)}
                    onFocus={() => setIsGridOpen(true)}
                    onBlur={() => onChange(parseWeightLbsOz(displayValue))}
                    disabled={disabled}
                    className={`w-full bg-[#2a2f3e] border ${isValid ? 'border-gray-700' : 'border-red-500'} text-gray-200 rounded-md px-3 py-2 outline-none text-center font-mono font-bold shadow-inner`}
                />
                <button type="button" onClick={() => setIsGridOpen(!isGridOpen)} className="absolute right-2 text-gray-500">
                    <ChevronDownIcon className="w-4 h-4" />
                </button>
            </div>
            {isGridOpen && !disabled && (
                <div className="absolute top-full mt-1 w-full bg-[#1e2230] border border-gray-700 rounded shadow-xl z-50 max-h-40 overflow-y-auto grid grid-cols-4 p-1 gap-1">
                    {weightOptions.map(w => (
                        <button key={w} onClick={() => { onChange(w); setIsGridOpen(false); }} className="p-1 text-[10px] hover:bg-amber-500 hover:text-black rounded text-gray-300 font-mono">
                            {formatWeightLbsOz(w)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const InputField: React.FC<{
    label: string, 
    value: string | number, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
    placeholder?: string, 
    disabled?: boolean,
    type?: string,
    required?: boolean,
    min?: string | number,
    inputClassName?: string
}> = ({ label, value, onChange, placeholder, disabled, type = 'text', required, min, inputClassName }) => (
    <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            min={min}
            className={`w-full bg-[#2a2f3e] border border-gray-700 rounded-md px-3 py-2 outline-none focus:border-amber-500 transition-colors disabled:opacity-50 ${inputClassName || 'text-gray-200'}`}
        />
    </div>
);

// --- MAIN MODAL ---
interface GalloBulkFormData {
    ringId: string;
    color: string;
    cuerdaId: string;
    weight: number;
    ageMonths: string;
    markingId: string;
    breederPlateId: string;
    tipoGallo: TipoGallo;
    marca: string;
}

const GalloFormModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSaveSingle: (gallo: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => void; 
    onAddSingleGallo: (gallo: Omit<Gallo, 'id' | 'tipoEdad'>) => void;
    gallo: Gallo | null;
    cuerdas: Cuerda[];
    gallos: Gallo[];
    torneo: Torneo;
    onDeleteGallo: (galloId: string) => void;
    onEditGallo?: (gallo) => void;
}> = ({ isOpen, onClose, onSaveSingle, onAddSingleGallo, gallo, cuerdas, gallos, torneo }) => {
    
    const [selectedCuerdaId, setSelectedCuerdaId] = useState('');
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(0); // 0-based index of rooster slot
    const [editingGallo, setEditingGallo] = useState<Gallo | null>(null);

    const initialForm: GalloBulkFormData = {
        ringId: '', color: '', cuerdaId: '', weight: 0, ageMonths: '', markingId: '', breederPlateId: '', tipoGallo: TipoGallo.LISO, marca: '',
    };
    const [form, setForm] = useState<GalloBulkFormData>(initialForm);

    // Get unique fronts for the selected team
    const activeFronts = useMemo(() => {
        if (!selectedCuerdaId) return [];
        const base = cuerdas.find(c => c.id === selectedCuerdaId);
        if (!base) return [];
        const baseId = base.baseCuerdaId || base.id;
        const namePrefix = base.name.replace(/\s\(F\d+\)$/, '');
        return cuerdas.filter(c => c.name.startsWith(namePrefix)).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
    }, [selectedCuerdaId, cuerdas]);

    // All gallos belonging to the same team/cuerda base
    const teamGallos = useMemo(() => {
        if (!selectedCuerdaId || activeFronts.length === 0) return [];
        const teamIds = new Set(activeFronts.map(f => f.id));
        return gallos.filter(g => teamIds.has(g.cuerdaId));
    }, [gallos, activeFronts, selectedCuerdaId]);

    // Map slots 1..N to existing gallos using round-robin logic
    const slots = useMemo(() => {
        const numUniqueFronts = activeFronts.length;
        if (numUniqueFronts === 0) return [];

        const result = [];
        for (let j = 0; j < torneo.roostersPerTeam; j++) {
            const frontIdx = j % numUniqueFronts;
            const targetFront = activeFronts[frontIdx];
            const k = Math.floor(j / numUniqueFronts); // k-th gallo of this front
            
            const gallosOfThisFront = teamGallos.filter(g => g.cuerdaId === targetFront.id);
            // Assuming stable order (sorted by ID or creation)
            const galloInSlot = gallosOfThisFront[k];

            result.push({
                slotIndex: j + 1,
                front: targetFront,
                gallo: galloInSlot
            });
        }
        return result;
    }, [activeFronts, teamGallos, torneo.roostersPerTeam]);

    const loadGalloIntoForm = (g: Gallo) => {
        setEditingGallo(g);
        setForm({
            ...g,
            ageMonths: String(g.ageMonths),
            marca: String(g.marca),
            breederPlateId: g.breederPlateId === 'N/A' ? '' : g.breederPlateId
        });
    };

    const resetFormForSlot = (slotIdx: number) => {
        const slot = slots[slotIdx];
        if (!slot) return;
        
        const baseCuerda = cuerdas.find(c => c.id === selectedCuerdaId);
        setForm({ 
            ...initialForm, 
            cuerdaId: slot.front.id, 
            breederPlateId: baseCuerda?.breederPlateId === 'N/A' ? '' : baseCuerda?.breederPlateId || '' 
        });
        setEditingGallo(null);
    };

    // Determine if any field in the form has been modified
    const isDirty = useMemo(() => {
        if (editingGallo) {
            const originalPlate = editingGallo.breederPlateId === 'N/A' ? '' : editingGallo.breederPlateId;
            return (
                form.ringId !== editingGallo.ringId ||
                form.color !== editingGallo.color ||
                form.weight !== editingGallo.weight ||
                form.ageMonths !== String(editingGallo.ageMonths) ||
                form.markingId !== editingGallo.markingId ||
                form.breederPlateId !== originalPlate ||
                form.tipoGallo !== editingGallo.tipoGallo ||
                form.marca !== String(editingGallo.marca)
            );
        }
        // For new gallo: dirty if basic fields are not empty
        return (
            form.ringId !== '' ||
            form.color !== '' ||
            form.weight !== 0 ||
            form.ageMonths !== '' ||
            form.markingId !== '' ||
            form.marca !== ''
        );
    }, [form, editingGallo]);

    // Initial load and handling external changes
    useEffect(() => {
        if (isOpen) {
            if (gallo) {
                const baseCId = cuerdas.find(c => c.id === gallo.cuerdaId)?.baseCuerdaId || gallo.cuerdaId;
                setSelectedCuerdaId(baseCId);
                // When editing an specific gallo from outside, we need to find its slot
                // (This is triggered when clicking "Edit" in the setup list)
            } else if (cuerdas.length > 0 && selectedCuerdaId === '') {
                const firstBase = cuerdas.find(c => !c.baseCuerdaId) || cuerdas[0];
                setSelectedCuerdaId(firstBase.id);
            }
        }
    }, [isOpen, gallo, cuerdas]);

    // Effect to handle slot selection logic
    useEffect(() => {
        if (isOpen && slots.length > 0) {
            let initialSlot = 0;
            if (gallo) {
                const foundSlot = slots.findIndex(s => s.gallo?.id === gallo.id);
                if (foundSlot !== -1) initialSlot = foundSlot;
            }
            setSelectedSlotIndex(initialSlot);
            
            const slot = slots[initialSlot];
            if (slot.gallo) {
                loadGalloIntoForm(slot.gallo);
            } else {
                resetFormForSlot(initialSlot);
            }
        }
    }, [isOpen, selectedCuerdaId, slots.length, gallo?.id]);

    const handleSlotClick = (idx: number) => {
        setSelectedSlotIndex(idx);
        const slot = slots[idx];
        if (slot.gallo) {
            loadGalloIntoForm(slot.gallo);
        } else {
            resetFormForSlot(idx);
        }
    };

    const handleCuerdaChange = (baseId: string) => {
        setSelectedCuerdaId(baseId);
        // The slot effect will handle the rest
    };

    const handleSubmit = () => {
        if (!form.ringId || !form.color || form.weight === 0 || !form.marca || !form.ageMonths) {
            alert("Por favor completa los campos obligatorios.");
            return;
        }

        const data: Omit<Gallo, 'id' | 'tipoEdad'> = {
            ...form,
            ageMonths: Number(form.ageMonths),
            marca: Number(form.marca),
            breederPlateId: form.breederPlateId.trim() || 'N/A'
        };

        if (editingGallo) {
            onSaveSingle(data, editingGallo.id);
            setEditingGallo({ ...editingGallo, ...data, id: editingGallo.id, tipoEdad: data.ageMonths >= 12 ? TipoEdad.GALLO : TipoEdad.POLLO });
        } else {
            onAddSingleGallo(data);
        }
    };

    const groupedOptions = useMemo(() => {
        const baseCuerdas = cuerdas.filter(c => !c.baseCuerdaId);
        return baseCuerdas.map(bc => {
            const fronts = cuerdas.filter(c => c.baseCuerdaId === bc.id || c.id === bc.id);
            const labels = fronts.map((_, i) => `(F${i+1})`).join(' ');
            return { id: bc.id, label: `${bc.name.replace(/\s\(F\d+\)$/, '')} ${labels}` };
        });
    }, [cuerdas]);

    if (!isOpen) return null;

    const ageOptions = form.marca ? (AGE_OPTIONS_BY_MARCA[form.marca] || []) : [];

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#1a1d29] w-full max-w-4xl rounded-xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header Section */}
                <div className="p-5 flex flex-col md:flex-row items-center justify-between border-b border-gray-800 gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-6 overflow-x-auto w-full custom-scrollbar pb-2 md:pb-0">
                        <h2 className="text-2xl font-bold text-[#facc15] whitespace-nowrap">{editingGallo ? 'Editar Gallo' : 'Añadir Gallos'}</h2>
                        <div className="flex space-x-2 overflow-x-auto pb-1">
                            {slots.map((slot, i) => {
                                const isActive = selectedSlotIndex === i;
                                const isFilled = !!slot.gallo;
                                return (
                                    <button 
                                        key={i} 
                                        onClick={() => handleSlotClick(i)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap border ${
                                            isActive 
                                            ? 'bg-amber-500 text-black border-amber-500' 
                                            : isFilled 
                                                ? 'bg-[#2a2f3e] text-amber-400 border-amber-500/50 hover:bg-[#363b4e]'
                                                : 'text-gray-500 border-gray-700 hover:text-gray-300'
                                        }`}
                                    >
                                        F{(i % activeFronts.length) + 1} ({i + 1}/{torneo.roostersPerTeam})
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 shrink-0">
                        <select 
                            value={selectedCuerdaId} 
                            onChange={(e) => handleCuerdaChange(e.target.value)}
                            className="bg-[#1a1d29] border-2 border-[#facc15] text-white rounded-md px-3 py-1.5 text-sm outline-none min-w-[180px]"
                        >
                            {groupedOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                        </select>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><XIcon className="w-6 h-6"/></button>
                    </div>
                </div>

                <div className="p-8 space-y-6 flex-grow overflow-y-auto custom-scrollbar">
                    {/* Form Layout - Grid de 3 Columnas - Sin lista intermedia ni botón nuevo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 bg-[#1f2330] p-8 rounded-xl border border-gray-800 shadow-inner">
                        <InputField label="ID del Anillo (A)" value={form.ringId} onChange={e => setForm({...form, ringId: e.target.value})} />
                        <InputField label="Número de Placa Marcaje (Pm)" value={form.markingId} onChange={e => setForm({...form, markingId: e.target.value})} />
                        <InputField label="Placa del Criadero (Pc)" value={form.breederPlateId} onChange={e => setForm({...form, breederPlateId: e.target.value})} placeholder="N/A" />
                        
                        <InputField label="Color del Gallo" value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
                        <LbsOzInput label="Peso (Lb.Oz)" value={form.weight} onChange={v => setForm({...form, weight: v})} />
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Marca</label>
                            <select value={form.marca} onChange={e => setForm({...form, marca: e.target.value, ageMonths: ''})} className="w-full bg-[#2a2f3e] border border-gray-700 text-gray-200 rounded-md px-3 py-2 outline-none focus:border-amber-500 transition-colors">
                                <option value="">Seleccionar...</option>
                                {Object.keys(AGE_OPTIONS_BY_MARCA).map(m => <option key={m} value={m}>Marca {m}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Edad</label>
                            <select value={form.ageMonths} onChange={e => setForm({...form, ageMonths: e.target.value})} className="w-full bg-[#2a2f3e] border border-gray-700 text-gray-200 rounded-md px-3 py-2 outline-none focus:border-amber-500 transition-colors">
                                <option value="">Seleccionar...</option>
                                {ageOptions.map(o => <option key={o.ageMonths} value={o.ageMonths}>{o.displayText}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Tipo (Pollo/Gallo)</label>
                            <input type="text" value={Number(form.ageMonths) >= 12 ? 'Gallo' : 'Pollo'} disabled className="w-full bg-[#2a2f3e] border border-gray-700 text-gray-400 rounded-md px-3 py-2 outline-none opacity-60 font-medium" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Fenotipo</label>
                            <select value={form.tipoGallo} onChange={e => setForm({...form, tipoGallo: e.target.value as TipoGallo})} className="w-full bg-[#2a2f3e] border border-gray-700 text-gray-200 rounded-md px-3 py-2 outline-none focus:border-amber-500 transition-colors">
                                {Object.values(TipoGallo).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="md:col-span-3 pt-6">
                            <button 
                                onClick={handleSubmit}
                                className={`w-full ${isDirty ? 'bg-green-600 hover:bg-green-700' : 'bg-[#5c637a] hover:bg-[#6c7491]'} text-white font-bold py-4 rounded-lg transition-all shadow-lg text-lg flex items-center justify-center space-x-2 active:scale-[0.99]`}
                            >
                                {editingGallo ? <><PencilIcon className="w-5 h-5"/> <span>Guardar Cambios del Gallo</span></> : <><PlusIcon className="w-5 h-5"/> <span>Añadir Gallo a este Frente</span></>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 flex justify-end bg-[#1a1d29] border-t border-gray-800">
                    <button onClick={onClose} className="bg-[#facc15] hover:bg-[#eab308] text-black font-bold py-2.5 px-10 rounded-lg transition-colors shadow-md">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default GalloFormModal;