import React, { useState, useRef, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { X, Image as ImageIcon, Video, Cloud, AlertCircle } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

interface FileUploadProps {
    value: string;
    onChange?: (url: string) => void;
    onUpload?: (url: string) => void;
    accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ value, onChange, onUpload, accept = 'image/*,video/*' }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState<string>(value);
    const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
    const [error, setError] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync preview with value prop
    useEffect(() => {
        if (value) {
            setPreview(value);
            // Simple check to set file type based on extension if possible, default to image
            if (value.match(/\.(mp4|webm|ogg|mov)$/i)) {
                setFileType('video');
            } else {
                setFileType('image');
            }
        } else {
            setPreview('');
            setFileType(null);
        }
    }, [value]);

    const handleFileSelect = async (file: File) => {
        if (!file) return;
        setError('');

        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            setError('Solo se permiten imágenes y videos');
            return;
        }

        setFileType(isImage ? 'image' : 'video');

        // Show local preview immediately
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);

        // Start Upload
        try {
            setUploading(true);
            setProgress(0);

            // Create a reference to 'products/fileName_timestamp'
            const fileName = `product_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const storageRef = ref(storage, `products/${fileName}`);

            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progressValue = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(progressValue);
                },
                (error) => {
                    console.error("Upload error:", error);
                    setError('Error al subir el archivo');
                    setUploading(false);
                },
                async () => {
                    // Upload completed successfully, now we can get the download URL
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log('File available at', downloadURL);
                    if (onChange) onChange(downloadURL);
                    else if (onUpload) onUpload(downloadURL);
                    setUploading(false);
                    setProgress(100);
                }
            );

        } catch (err: any) {
            console.error("Error starting upload:", err);
            setError('Error al iniciar la subida');
            setUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setPreview('');
        setFileType(null);
        setError('');
        if (onChange) onChange('');
        else if (onUpload) onUpload('');
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-3">
            {error && (
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {!preview ? (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploading && inputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragActive
                        ? 'border-gold bg-gold/10'
                        : 'border-white/20 hover:border-white/40 bg-black/20'
                        } ${uploading ? 'pointer-events-none' : ''}`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        onChange={handleChange}
                        className="hidden"
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="space-y-3">
                            <div className="animate-pulse">
                                <Cloud className="mx-auto text-gold" size={48} />
                            </div>
                            <p className="text-white font-medium">Subiendo a Firebase Storage... {Math.round(progress)}%</p>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="bg-gold h-full transition-all"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Cloud className="mx-auto text-white/50" size={48} />
                            <div>
                                <p className="text-white font-medium mb-1">
                                    Selecciona una imagen o video
                                </p>
                                <p className="text-white/50 text-sm">
                                    Arrastra o haz clic aquí
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="relative group">
                        <div className="relative rounded-xl overflow-hidden bg-black/20 border border-white/10">
                            {fileType === 'image' || !preview.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-48 object-cover"
                                    onError={() => {
                                        // Fallback if image fails to load, might be a video without extension in URL
                                        // setFileType('video'); 
                                        // Prevent infinite loop if real error
                                    }}
                                />
                            ) : (
                                <video
                                    src={preview}
                                    controls
                                    className="w-full h-48 object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                            {fileType === 'image' ? <ImageIcon size={14} /> : <Video size={14} />}
                            <span className="truncate max-w-[200px]">
                                {value ? 'Archivo subido' : 'Vista previa local'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual URL input */}
            <div className="text-center">
                <p className="text-white/30 text-xs mb-2">o pega una URL directa</p>
                <input
                    type="url"
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (onChange) onChange(val);
                        else if (onUpload) onUpload(val);
                        setPreview(val);
                        if (val) {
                            if (val.match(/\.(mp4|webm|ogg|mov)$/i)) {
                                setFileType('video');
                            } else {
                                setFileType('image');
                            }
                        }
                    }}
                    placeholder="https://..."
                    className="w-full bg-black/20 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-gold outline-none"
                />
            </div>
        </div>
    );
};

export default FileUpload;
