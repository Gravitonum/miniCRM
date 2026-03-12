import { useState, useCallback, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUp, File as FileIcon, UploadCloud, X, CheckCircle2, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { clientsApi } from '../../api/clients';
import type { ClientCompany } from '../../api/clients';
import { dealsApi } from '../../api/deals';
import type { Deal } from '../../api/deals';

type EntityType = 'clients' | 'deals';
type ImportMode = 'create' | 'update';

const CLIENT_FIELDS = [
    { value: 'name', label: 'Название (обязательно)' },
    { value: 'inn', label: 'ИНН' },
    { value: 'kpp', label: 'КПП' },
    { value: 'opf', label: 'ОПФ' },
    { value: 'address', label: 'Адрес' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Телефон' }
];

const DEAL_FIELDS = [
    { value: 'title', label: 'Название сделки (обязательно)' },
    { value: 'amount', label: 'Сумма' },
    { value: 'stage', label: 'Этап воронки' },
    { value: 'description', label: 'Описание' }
];

export function ImportPage(): ReactElement {
    const { t } = useTranslation();
    
    const [entityType, setEntityType] = useState<EntityType>('clients');
    const [importMode, setImportMode] = useState<ImportMode>('create');
    
    // File state
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Parsed data state
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [mappedColumns, setMappedColumns] = useState<Record<string, string>>({});
    
    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<{ success: number; errors: any[] } | null>(null);

    const resetState = () => {
        setFile(null);
        setParsedData([]);
        setColumns([]);
        setMappedColumns({});
        setResults(null);
        setProgress(0);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFile = async (selectedFile: File) => {
        setFile(selectedFile);
        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
        
        if (fileExt === 'csv') {
            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.meta.fields) {
                        setColumns(results.meta.fields);
                        setParsedData(results.data);
                        autoMapColumns(results.meta.fields, entityType);
                    }
                },
                error: (err) => {
                    console.error("Papaparse error:", err);
                    alert("Ошибка чтения CSV файла");
                }
            });
        } else if (fileExt === 'xlsx' || fileExt === 'xls') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                    
                    if (json.length > 0) {
                        const cols = Object.keys(json[0] as object);
                        setColumns(cols);
                        setParsedData(json);
                        autoMapColumns(cols, entityType);
                    }
                } catch (err) {
                    console.error("XLSX parse error:", err);
                    alert("Ошибка чтения Excel файла");
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        } else {
            alert("Неподдерживаемый формат файла. Пожалуйста, загрузите CSV или XLSX.");
            setFile(null);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            void processFile(e.dataTransfer.files[0]);
        }
    }, [entityType]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            void processFile(e.target.files[0]);
        }
    };

    const autoMapColumns = (cols: string[], currentEntity: EntityType) => {
        const mapping: Record<string, string> = {};
        const availableFields = currentEntity === 'clients' ? CLIENT_FIELDS : DEAL_FIELDS;
        
        cols.forEach(col => {
            const lowerCol = col.toLowerCase();
            const matchedField = availableFields.find(f => 
                f.value.toLowerCase() === lowerCol || 
                f.label.toLowerCase().includes(lowerCol) ||
                lowerCol.includes(f.value.toLowerCase())
            );
            if (matchedField) {
                mapping[col] = matchedField.value;
            }
        });
        setMappedColumns(mapping);
    };

    const handleMappingChange = (fileCol: string, dbField: string) => {
        setMappedColumns(prev => {
            const newMapping = { ...prev };
            if (dbField) {
                newMapping[fileCol] = dbField;
            } else {
                delete newMapping[fileCol];
            }
            return newMapping;
        });
    };

    const startImport = async () => {
        setIsUploading(true);
        setResults(null);
        setProgress(0);
        
        const totalRows = parsedData.length;
        let successCount = 0;
        const errorList: any[] = [];
        
        try {
            let existingClients: ClientCompany[] = [];
            let existingDeals: Deal[] = [];
            
            if (importMode === 'update') {
                if (entityType === 'clients') {
                    existingClients = await clientsApi.getAll();
                } else {
                    existingDeals = await dealsApi.getDeals();
                }
            }

            for (let i = 0; i < totalRows; i++) {
                const row = parsedData[i];
                
                const entityData: any = {};
                for (const [fileCol, dbField] of Object.entries(mappedColumns)) {
                    if (row[fileCol] !== undefined && row[fileCol] !== null && row[fileCol] !== '') {
                        entityData[dbField] = row[fileCol];
                    }
                }
                
                if (entityType === 'clients') {
                    if (!entityData.name) {
                        errorList.push({ row: i + 1, error: 'Отсутствует название (name)' });
                        setProgress(Math.round(((i + 1) / totalRows) * 100));
                        continue;
                    }
                } else {
                    if (!entityData.title) {
                        errorList.push({ row: i + 1, error: 'Отсутствует название сделки (title)' });
                        setProgress(Math.round(((i + 1) / totalRows) * 100));
                        continue;
                    }
                }

                try {
                    if (entityType === 'clients') {
                        if (importMode === 'update' && entityData.inn) {
                            const existing = existingClients.find(c => c.inn && c.inn === String(entityData.inn));
                            if (existing) {
                                await clientsApi.update(existing.id, entityData);
                                successCount++;
                            } else {
                                await clientsApi.create(entityData);
                                successCount++;
                            }
                        } else {
                            await clientsApi.create(entityData);
                            successCount++;
                        }
                    } else { // deals
                        const { title, ...rest } = entityData;
                        const dealPayload: any = { name: String(title), ...rest };
                        // Convert amount to number if present
                        if (dealPayload.amount !== undefined) {
                             dealPayload.amount = Number(dealPayload.amount) || 0;
                        }

                        if (importMode === 'update' && dealPayload.name) {
                            const existing = existingDeals.find(d => d.name === dealPayload.name);
                            if (existing) {
                                await dealsApi.updateDeal(existing.id, dealPayload);
                                successCount++;
                            } else {
                                await dealsApi.createDeal(dealPayload);
                                successCount++;
                            }
                        } else {
                            await dealsApi.createDeal(dealPayload);
                            successCount++;
                        }
                    }
                } catch (err: any) {
                    errorList.push({ row: i + 1, error: err?.response?.data?.message || err.message || 'Ошибка API' });
                }
                
                setProgress(Math.round(((i + 1) / totalRows) * 100));
            }
        } catch (globalErr: any) {
            console.error("Global import error:", globalErr);
            errorList.push({ row: 'System', error: 'Системная ошибка во время импорта' });
        }
        
        setResults({ success: successCount, errors: errorList });
        setIsUploading(false);
    };

    const availableFields = entityType === 'clients' ? CLIENT_FIELDS : DEAL_FIELDS;

    return (
        <div className="flex-1 space-y-6 pt-6 pb-12">
            <div className="px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('import.title', 'Импорт / Экспорт данных')}</h1>
                    <p className="text-muted-foreground">{t('import.subtitle', 'Пакетная загрузка и выгрузка базы клиентов и сделок')}</p>
                </div>
                
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Settings Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
                            <h3 className="font-semibold text-foreground">Настройки загрузки</h3>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Сущность</label>
                                <select 
                                    value={entityType}
                                    onChange={(e) => {
                                        setEntityType(e.target.value as EntityType);
                                        if (parsedData.length > 0) autoMapColumns(columns, e.target.value as EntityType);
                                    }}
                                    disabled={isUploading}
                                    className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="clients">Клиенты</option>
                                    <option value="deals">Сделки</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Режим импорта</label>
                                <select 
                                    value={importMode}
                                    onChange={(e) => setImportMode(e.target.value as ImportMode)}
                                    disabled={isUploading}
                                    className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="create">Только создавать новые</option>
                                    <option value="update">Обновлять существующие (по совпадению)</option>
                                </select>
                            </div>
                        </div>

                        {file && !isUploading && !results && (
                            <button
                                onClick={startImport}
                                disabled={Object.keys(mappedColumns).length === 0}
                                className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                <FileUp className="w-4 h-4 mr-2" />
                                Начать импорт ({parsedData.length} строк)
                            </button>
                        )}
                        
                        {file && (results || isUploading) && (
                            <button
                                onClick={resetState}
                                disabled={isUploading}
                                className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                            >
                                Загрузить другой файл
                            </button>
                        )}
                    </div>

                    {/* Main Area */}
                    <div className="lg:col-span-3 space-y-6">
                        {!file ? (
                            <div 
                                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UploadCloud className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-1">Загрузите файл для импорта</h3>
                                <p className="text-sm text-muted-foreground mb-6">Перетащите CSV или XLSX файл сюда или нажмите кнопку ниже</p>
                                <label className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                    Выбрать файл
                                    <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
                                </label>
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <FileIcon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(file.size / 1024).toFixed(1)} KB • {parsedData.length} строк найдено
                                            </p>
                                        </div>
                                    </div>
                                    {!isUploading && !results && (
                                        <button onClick={resetState} className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {isUploading ? (
                                    <div className="p-12 text-center">
                                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-foreground mb-2">Импорт данных...</h3>
                                        <p className="text-muted-foreground mb-6">Пожалуйста, не закрывайте страницу</p>
                                        <div className="w-full max-w-md mx-auto h-2 bg-accent rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                                        </div>
                                        <p className="text-sm font-medium text-foreground mt-2">{progress}%</p>
                                    </div>
                                ) : results ? (
                                    <div className="p-6">
                                        <div className="flex items-start gap-4 mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-medium text-emerald-700 dark:text-emerald-400">Импорт завершен</h4>
                                                <p className="text-sm text-emerald-600 dark:text-emerald-500/80 mt-1">
                                                    Успешно загружено записей: <span className="font-bold">{results.success}</span> из {parsedData.length}
                                                </p>
                                            </div>
                                        </div>

                                        {results.errors.length > 0 && (
                                            <div className="mt-6">
                                                <h4 className="font-medium text-foreground flex items-center gap-2 mb-3">
                                                    <AlertTriangle className="w-4 h-4 text-destructive" />
                                                    Ошибки импорта ({results.errors.length})
                                                </h4>
                                                <div className="border border-border rounded-lg overflow-hidden">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-muted text-muted-foreground">
                                                            <tr>
                                                                <th className="px-4 py-2 font-medium">Строка</th>
                                                                <th className="px-4 py-2 font-medium w-full">Ошибка</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border">
                                                            {results.errors.map((err, idx) => (
                                                                <tr key={idx} className="bg-card">
                                                                    <td className="px-4 py-2 text-muted-foreground">{err.row}</td>
                                                                    <td className="px-4 py-2 text-destructive">{err.error}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-0 overflow-x-auto">
                                        <div className="p-4 border-b border-border bg-card">
                                            <h4 className="font-medium text-foreground flex items-center gap-2">
                                                Предпросмотр и настройка полей
                                            </h4>
                                            <p className="text-sm text-muted-foreground mt-1">Отображаются первые 5 строк. Укажите соответствие колонок из файла системным полям.</p>
                                        </div>
                                        <table className="w-full min-w-[800px] text-sm text-left">
                                            <thead className="text-muted-foreground bg-muted/50 border-b border-border">
                                                <tr>
                                                    {columns.map((col, idx) => (
                                                        <th key={idx} className="px-4 py-3 font-medium min-w-[150px] border-r border-border last:border-0">
                                                            <div className="mb-2 truncate" title={col}>{col}</div>
                                                            <select 
                                                                value={mappedColumns[col] || ''}
                                                                onChange={(e) => handleMappingChange(col, e.target.value)}
                                                                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                                                            >
                                                                <option value="">-- Пропустить --</option>
                                                                {availableFields.map(f => (
                                                                    <option key={f.value} value={f.value}>{f.label}</option>
                                                                ))}
                                                            </select>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {parsedData.slice(0, 5).map((row, rowIdx) => (
                                                    <tr key={rowIdx} className="bg-card hover:bg-muted/50 transition-colors">
                                                        {columns.map((col, colIdx) => (
                                                            <td key={colIdx} className="px-4 py-2 truncate max-w-[150px] border-r border-border last:border-0" title={String(row[col] || '')}>
                                                                {String(row[col] || '')}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {!Object.values(mappedColumns).some(v => v === 'name' || v === 'title') && (
                                            <div className="p-4 bg-amber-500/10 border-t border-amber-500/20 flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                                <p className="text-sm text-amber-600 dark:text-amber-400">Внимание: для успешного импорта необходимо сопоставить хотя бы поле Названия (обязательно).</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
