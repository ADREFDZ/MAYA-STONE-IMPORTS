"use client";

interface ImageUploadFieldProps {
  label: string;
  previewUrl: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  aspect?: "square" | "portrait" | "landscape";
}

export default function ImageUploadField({
  label,
  previewUrl,
  onFileSelect,
  onRemove,
  aspect = "square",
}: ImageUploadFieldProps) {
  const aspectClass =
    aspect === "landscape"
      ? "w-32 h-20"
      : aspect === "portrait"
        ? "w-20 h-24"
        : "w-20 h-20";

  return (
    <div className="p-4 sm:p-5 bg-surface border border-border-light rounded-2xs space-y-3 font-sans shadow-2xs">
      <span className="block font-mono text-maya-label uppercase tracking-data text-black-neutral font-semibold">
        {label}
      </span>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className={`${aspectClass} bg-surface border border-border-light overflow-hidden flex items-center justify-center shrink-0 relative rounded-2xs shadow-2xs`}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={onRemove}
                className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-mono w-4 h-4 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                title="Quitar imagen"
              >
                ✕
              </button>
            </>
          ) : (
            <span className="font-mono text-maya-label text-black-neutral/40 uppercase">
              Sin Foto
            </span>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="font-mono text-maya-small text-black-neutral/70 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-maya-label file:font-mono file:uppercase file:bg-black-neutral file:text-gray-warm file:rounded-3xs cursor-pointer"
        />
      </div>
    </div>
  );
}
